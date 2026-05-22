# dpaperwork — Agent Runtime Document

**Status:** Draft v0.2
**Owner:** [Founder]
**Last updated:** May 21, 2026

---

## 1. Overview & Scope

This document describes how the dpaperwork agent runtime works — the layer that turns a user request or scheduled trigger into one or more LLM-driven actions that read context, call tools, and produce outputs.

**In scope**
- Mental model: orchestrator, specialized agents, tools, skills
- Multi-tenant configuration of Mastra
- Tools (code) and Skills (Mastra native, via the Agent Skills specification)
- Memory layers and their lifecycles
- Context assembly per request
- Orchestrator design (ReWOO-style plan / execute / solve)
- Specialized agents and routines
- Prompt caching, cost controls, observability
- Evals and quality testing
- Skill discipline rules
- Code samples for the key patterns

**Out of scope**
- Web application architecture (separate `Architecture` document)
- Backend data model and SQL schema (separate `Backend Schema` document)
- Detailed product behavior (separate `PRD`)
- Mobile architecture
- Roadmap and sequencing

The runtime sits behind the API routes. Requests arrive as either user chat messages or scheduled routine triggers, and the runtime owns everything from "received request" to "wrote outputs and returned a response."

This document is calibrated against Mastra docs as of May 2026 and uses the documented APIs (`@mastra/core@1.x`).

## 2. Mental Model

The runtime has three layers. Keeping these distinct matters because each evolves at a different pace and has different ownership.

**Orchestrator** — a single agent that receives every request. It plans the work (one-level plan, no recursive replanning), executes each step by delegating to specialized agents or calling tools directly, and synthesizes a final response. The orchestrator owns memory write decisions for cross-cutting workspace learnings.

**Specialized agents** — Product Manager, Chief of Staff, Executive Assistant. Each is configured with its own role.md (tenant-editable), a memory configuration, and access to the platform's tool palette and skill library. Specialized agents do not plan multi-step work — they execute steps the orchestrator hands them.

**Tools and skills** — two distinct concepts:

- **Tools** are code. Two flavors: Mastra tools defined in TypeScript (`domain.read`, `domain.write`, internal operations) and Composio MCP tools (every third-party integration, exposed via Composio's MCP server). The agent calls tools to do things.

- **Skills** are markdown-format SKILL.md files following the [Agent Skills specification](https://agentskills.io) — an open standard. Mastra has native support for this format via its Workspace skills feature. Each skill describes how to compose tools to achieve an outcome. Skills are read on demand via Mastra's built-in `skill` tool.

The split matters: tools are versioned, tested, deployed code. Skills are editable instructions that compose tools. Adding a new capability usually means writing a new SKILL.md, not new code. New code only when a new primitive is needed.

A typical request flow:

1. Request arrives. Application code builds a `RuntimeContext` and assembles ambient context (CONTEXT.md, role.md, relevant domain data).
2. Orchestrator is invoked with the context and request. It produces a plan: a sequence of steps where each step specifies an agent, a skill name, and inputs.
3. For each step, the runtime invokes the named agent. The agent calls Mastra's `skill` tool to load the skill instructions, then follows them — calling Mastra tools and Composio MCP tools as instructed.
4. The orchestrator synthesizes the final response from step outputs.
5. Outputs are persisted (audit log, inbox item, domain writes, working memory updates).

## 3. Multi-Tenant Configuration

There is **one Mastra instance** for the entire platform, not one per tenant. Multi-tenancy is achieved through Mastra's `RuntimeContext` and dynamic resolvers on agent configuration and workspace skill paths.

`RuntimeContext` is Mastra's dependency-injection mechanism for passing per-request data through to agent configuration, tools, workflows, and workspace resolvers. We construct it at the API boundary and propagate it everywhere.

```typescript
import { RuntimeContext } from '@mastra/core/runtime-context';

export type DpwRuntimeContext = {
  workspace_id: string;
  user_id: string;
  agent_id?: 'pm' | 'chief-of-staff' | 'executive-assistant' | 'orchestrator';
  thread_id?: string;
  routine_id?: string;
  run_id: string;
  workspace_timezone: string;       // IANA timezone, e.g., "Asia/Kolkata"
  current_skill_id?: string;
};

const runtimeContext = new RuntimeContext<DpwRuntimeContext>();
runtimeContext.set('workspace_id', 'ws_abc123');
runtimeContext.set('user_id', 'usr_xyz789');
runtimeContext.set('run_id', 'run_a1b2c3');
runtimeContext.set('workspace_timezone', 'Asia/Kolkata');

const result = await agent.generate(message, {
  runtimeContext,
  memory: {
    thread: 'thr_def456',
    resource: 'ws_abc123',          // workspace-scoped working memory
  },
});
```

The runtime uses this context to:

- Scope working memory reads and writes per workspace (via the `resource` field in `memory` options)
- Resolve the right skill paths per tenant (via dynamic `skills` resolver)
- Filter Composio MCP tool calls to use the right user's OAuth (via dynamic toolsets)
- Tag every audit log entry and tool call

A note on naming: Mastra's docs use `runtimeContext` as the parameter name in most APIs (agent instructions, tool execution, model selection) and `requestContext` in workspace filesystem/skills resolvers. Both reference the same underlying `RuntimeContext` instance passed via `agent.generate({ runtimeContext })`. We adopt Mastra's naming in code samples to match the docs.

### Workspace timezone

Each workspace has a configurable timezone (IANA format, e.g., `"Asia/Kolkata"`) set in Settings → Workspace → General. The application reads it from the workspace record and sets it on `RuntimeContext` for every request. Tools that involve time (`time.now()`, cron schedule registration for routines, time-formatted inbox titles) read the timezone from runtime context.

For routines specifically: tenants schedule routines in workspace-local time. The application converts to UTC before registering the cron with Trigger.dev, then back to local time when the routine runs.

## 4. Tools

Tools are the runtime's verbs. Agents do not perform actions directly — they call tools. Two kinds, both exposed to agents through Mastra's tool interface.

### 4.1 Platform tools (Mastra tools, our code)

Defined in TypeScript using Mastra's `createTool`. These are operations on our own data and primitives:

- `domain.read({ domain, filter, limit })` — read records from a domain table
- `domain.write({ domain, record_id?, fields, mode })` — insert or update a domain record (logged with attribution)
- `inbox.create({ title, body, source_agent, action_chips? })` — create an inbox item
- `routine.invoke({ routine_id })` — chain into another routine
- `context.lookup({ section })` — read a section of CONTEXT.md
- `time.now()` — workspace-local current time (uses workspace timezone from runtime context)

Working memory updates use Mastra's built-in `updateWorkingMemory` tool, automatically exposed when working memory is enabled on the Memory class (see Section 6). We do not define a separate tool for this.

Example tool definition:

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const domainReadTool = createTool({
  id: 'domain.read',
  description: 'Read records from a domain table in the current workspace',
  inputSchema: z.object({
    domain: z.string().describe('Domain name, e.g., "deals"'),
    filter: z.record(z.unknown()).optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }),
  execute: async ({ context, runtimeContext }) => {
    const workspaceId = runtimeContext.get('workspace_id');
    const runId = runtimeContext.get('run_id');
    const { domain, filter, limit } = context;

    const records = await db.domains.read({
      workspaceId,
      domain,
      filter,
      limit,
    });

    // Audit: persisted before returning to the agent
    await db.toolCalls.log({
      runId,
      tool: 'domain.read',
      args: { domain, filter, limit },
      result: { count: records.length },
      timestamp: new Date(),
    });

    return { records };
  },
});
```

The audit log write happens *before* the result returns to the agent. If the agent's next action fails, the read is still recorded.

### 4.2 Composio MCP tools (external integrations)

All third-party integrations (Gmail, Calendar, Slack, CRM, etc.) are exposed via Composio's MCP server. We do not write per-integration TypeScript wrappers.

Mastra's docs explicitly note that Composio MCP URLs are tied to a single user account and are best suited for personal automation. This matches our per-user OAuth model from the PRD. The corresponding Mastra pattern is **dynamic toolsets via `MCPClient.listToolsets()`** rather than static tools via `.listTools()`.

The runtime creates a per-request MCPClient with the right user's Composio URL, fetches toolsets, passes them to `agent.generate()`, then disconnects:

```typescript
import { MCPClient } from '@mastra/mcp';

async function buildComposioClient(userId: string): Promise<MCPClient | null> {
  const connection = await db.composioConnections.findActive({ userId });
  if (!connection) return null;

  return new MCPClient({
    id: `composio-${userId}`,
    servers: {
      composio: {
        url: new URL(connection.mcpUrl),
      },
    },
  });
}

// Inside the runtime's agent invocation:
async function invokeAgent(
  agentId: AgentId,
  prompt: string,
  runtimeContext: RuntimeContext<DpwRuntimeContext>,
): Promise<AgentResponse> {
  const userId = runtimeContext.get('user_id');
  const userMcp = await buildComposioClient(userId);
  const composioToolsets = userMcp ? await userMcp.listToolsets() : {};

  try {
    const agent = mastra.getAgent(agentId);
    const result = await agent.generate(prompt, {
      runtimeContext,
      memory: {
        thread: runtimeContext.get('thread_id'),
        resource: runtimeContext.get('workspace_id'),
      },
      toolsets: composioToolsets,
    });
    return result;
  } finally {
    await userMcp?.disconnect();
  }
}
```

If the user has no Composio connection, the agent runs with platform tools only. If a step needs an integration that requires Composio access, the orchestrator surfaces this gap (see Section 8).

### 4.3 Agent tool palette

Each agent is configured with:

1. **Static tools** — platform Mastra tools relevant to the agent (declared in the agent's definition)
2. **Dynamic toolsets** — Composio MCP tools fetched per request based on user (passed at `generate()` time)
3. **Skill tools** — `skill`, `skill_read`, `skill_search` (added automatically when the workspace has skills configured)

Effective Composio tools for a `(user, agent)` pair are the intersection of:
- Tools the user has connected via Composio (controlled by user)
- Tools the agent is permitted to use (configured per tenant in Settings → Agents)

The permission filter is applied inside the runtime after fetching toolsets, before passing them to `generate()`.

## 5. Skills (Mastra native, Agent Skills specification)

Mastra's Workspace has first-class support for the [Agent Skills specification](https://agentskills.io). Skills are folders containing a `SKILL.md` with YAML frontmatter plus optional `references/`, `scripts/`, and `assets/` subdirectories. Mastra handles discovery, listing, loading, and search natively.

### 5.1 SKILL.md format

YAML frontmatter required fields: `name`, `description`. The `description` is load-bearing — Mastra surfaces it in the agent's system message at every invocation so the agent knows when to load the skill. Write descriptions for *discovery*, not for documentation.

Optional frontmatter fields: `version`, `tags`, and others per the specification.

Example skill file (`_platform/chief_of_staff/weekly_company_update/SKILL.md`):

```markdown
---
name: weekly_company_update
description: Use this skill when the user (or a scheduled routine) needs a weekly summary of company progress — across active projects, deals, and notable domain changes. Triggers include phrases like "weekly update", "what happened last week", "Monday summary", or routines named "weekly company update". Produces a structured markdown report for a specified audience.
version: 1.0.0
tags:
  - reporting
  - chief-of-staff
---

# weekly_company_update

## Inputs
- `week_ending` (date, optional): last day of the week to summarize. Default: today.
- `audience` (string, optional): who this is for. Default: "founder".

## Steps
1. Use `domain.read` on the Projects domain, filtered to projects updated within
   the 7 days ending on `week_ending`.
2. Use `domain.read` on the Deals domain (if it exists in this workspace),
   filtered to deals updated within the same window.
3. Use `context.lookup("How we sell")` to inform framing and tone.
4. For each project: identify progress, blockers, and decisions made.
   For each deal: identify stage change and key activity.
5. Synthesize a markdown report grouped by section: Projects, Sales, Notable
   Decisions, Risks. Match the tone implied by CONTEXT.md and the audience.

## Output format
Markdown, 200-500 words. Lead with a one-sentence headline. Group content under
H2 headings. Use bullet points for items. End with a "What's next" section.

## Quality rules
- Do not invent progress that is not reflected in domain data.
- If a project has no activity in the window, omit it (do not pad).
- If the workspace has fewer than 3 projects or deals, acknowledge that honestly.

## Memory hook
If you observe a durable, cross-cutting fact about how this company operates
that is not already in working memory, append it via `updateWorkingMemory` —
add a line under "Cross-cutting learnings".
```

### 5.2 S3 layout

Skills are stored in S3 (Mumbai) with this layout:

```
s3://dpaperwork-skills/
  _platform/
    _orchestrator/
      planning/
        SKILL.md
        agent_rule.md
    chief_of_staff/
      agent_rule.md
      weekly_company_update/
        SKILL.md
      prep_meeting/
        SKILL.md
        references/
          meeting-prep-checklist.md
      draft_followup/
        SKILL.md
      ...
    product_manager/
      agent_rule.md
      draft_spec/
        SKILL.md
      ...
  workspaces/
    {workspace_id}/
      chief_of_staff/
        # empty in v1; reserved for tenant overrides in v2
      ...
```

**S3 bucket versioning is enabled at the bucket level.** Every overwrite preserves the prior version. Free, mandatory, day-one.

### 5.3 Workspace configuration

The Mastra Workspace is configured globally on the Mastra instance. The `skills` option takes a function that returns paths per request based on `RuntimeContext`:

```typescript
import { Workspace } from '@mastra/core/workspace';
import { S3Filesystem } from '@mastra/core/workspace';

const skillsWorkspace = new Workspace({
  filesystem: new S3Filesystem({
    bucket: 'dpaperwork-skills',
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }),
  skills: ({ requestContext }) => {
    const workspaceId = requestContext.get('workspace_id');
    const agentId = requestContext.get('agent_id');

    // Layering: tenant overrides shadow platform skills (Mastra's "same-named
    // skill" tie-breaking returns the local/first-listed match).
    const paths: string[] = [];

    if (agentId) {
      // Tenant overrides for the active agent (empty in v1)
      paths.push(`workspaces/${workspaceId}/${agentId}`);
      // Platform skills for the active agent
      paths.push(`_platform/${agentId}`);
    }

    // Orchestrator skills (planning, gap-surfacing guidelines)
    paths.push('_platform/_orchestrator');

    return paths;
  },
});

export const mastra = new Mastra({
  workspace: skillsWorkspace,
  // ... agents, storage, etc.
});
```

When skills are configured on a workspace, Mastra automatically:
- Surfaces a list of available skills (with their descriptions) in the agent's system message at every invocation
- Adds three skill tools to the agent: `skill`, `skill_read`, `skill_search`
- Indexes skill content for search (if BM25 or vector search is configured on the workspace)
- Handles tie-breaking when multiple skill paths contain a skill with the same name (local paths shadow later paths)

### 5.4 How agents use skills at runtime

Per Mastra's design, skills are **stateless** — the agent loads them on demand via the `skill` tool, and reloads if the skill content has fallen out of context. The orchestrator does not need to manually parse frontmatter or manage skill state.

Flow inside a step execution:

1. Orchestrator's plan specifies `skill_id: "weekly_company_update"` for the step.
2. Runtime invokes the specialized agent with the step inputs as the user message.
3. The agent sees the skill's `name` and `description` in its system message (Mastra injected this automatically). The agent calls the `skill` tool with `weekly_company_update` to load the full instructions.
4. The agent follows the instructions, calling other tools as directed.
5. The agent produces the step output.

We do not write code to scan SKILL.md frontmatter or load skill content — Mastra does this. We do write the SKILL.md files themselves, and we ensure the `skills:` resolver returns the right paths per tenant.

### 5.5 Future: versioned skill source

For production stability, Mastra supports `VersionedSkillSource`, which serves skills from a content-addressable blob store keyed by version. This means production agents use a specific published skill version without being affected by live filesystem changes.

```typescript
import { VersionedSkillSource } from '@mastra/core/workspace';

const skillsWorkspace = new Workspace({
  filesystem: skillFs,
  skills: ['skills'],
  skillSource: new VersionedSkillSource(versionTree, blobStore, versionCreatedAt),
});
```

This is **deferred to post-validation**. In v1, S3 bucket versioning provides "undo" capability, and skill changes are deployed as code changes (PR review, manual S3 sync). When we need stricter publish discipline (e.g., a customer pins to a specific skill version), `VersionedSkillSource` is the path.

### 5.6 Skill discipline rules

What enters the platform skill library is governed by `agent_rule.md`, a platform-level document per agent (`_platform/{agent_id}/agent_rule.md`). It specifies:

- The agent's scope of work (what kinds of tasks it owns)
- Skills that must exist (baseline coverage)
- Quality bar for new skills, including frontmatter discipline
- Anti-patterns

Frontmatter-specific rules:

- **Descriptions name trigger conditions.** "Generates a follow-up email" fails the bar. "Use when the user wants to send a follow-up after a sales call, a customer meeting, or a no-show — drafts a contextual email matching CONTEXT.md tone" passes.
- **Names are `snake_case`, verb-led where possible** (`draft_spec`, `prep_meeting`). Stable across versions.
- **Two skills cannot have overlapping descriptions.** If two skills could plausibly trigger on the same request, sharpen one or merge.

A new skill enters the library only if it:

- Can be expressed as a generic capability parameterized by CONTEXT.md, domains, and working memory
- Has a description sharp enough that the agent picks it correctly on representative test prompts (verified via an eval — see Section 13)
- Does not contain customer-specific logic
- Passes scorer-based smoke tests against a designated test workspace before going live

## 6. Memory Layers

The runtime has three memory layers — fewer than the earlier draft, because Mastra's working memory naturally collapses what I had originally split into "tenant memory" and "agent memory."

| Layer | Scope | Lifecycle | Who writes | Backed by |
|---|---|---|---|---|
| Execution state | Single run | Lives for one request, persisted on completion | Runtime | In-memory + Postgres audit |
| Conversation history | Single thread | Persisted, recall over time | Mastra (auto) | Mastra Memory |
| Working memory | `(workspace_id, agent_id)` | Persistent, append-merge semantics | Each agent (orchestrator updates its own; specialized agents update their own) | Mastra working memory |

**Why one working memory layer is enough.** Each Mastra Agent has its own `Memory` instance with its own storage backing. When we pass `resource: workspace_id` at `generate()` time, the working memory is automatically scoped by `(workspace_id, agent_id)` — because the *which Memory instance* is determined by the agent, and the *which resource within that instance* is determined by workspace. No double-layering required.

### 6.1 Execution state (ReWOO scratchpad)

Per-run state for plan/execute/solve. Shape:

```typescript
type ExecutionState = {
  runId: string;
  workspaceId: string;
  userId: string;
  threadId?: string;
  routineId?: string;

  request: string;
  plan: PlanStep[];
  stepResults: Record<string, StepResult>;
  variables: Record<string, unknown>;

  contextSnapshot: {
    contextMd: string;
    roleMd: Record<AgentId, string>;
    relevantDomainData: Record<string, unknown>;
  };

  status: 'planning' | 'executing' | 'synthesizing' | 'complete' | 'failed';
  currentStep?: number;
  errors: ExecutionError[];
  toolCalls: ToolCallLogEntry[];
};

type PlanStep = {
  stepId: string;
  agentId: AgentId;
  skillId: string;
  inputs: Record<string, unknown>;
  dependsOn?: string[];
};
```

**Where it lives**

- Chat: in-memory during the request. On completion, the full state is written to Postgres for audit. On failure mid-execution, partial state is persisted with `status = 'failed'`.
- Routine: persisted incrementally to Postgres throughout execution via the Trigger.dev task. If a Trigger.dev task crashes, partial state is intact and inspectable.

Execution state is not exposed to users. It is an internal scratchpad and audit artifact.

### 6.2 Conversation history

Mastra's default message history per thread. Configured at the Memory level with a `lastMessages` window. Older messages can be retrieved via semantic recall if needed (deferred for v1).

```typescript
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

const sharedMemory = new Memory({
  storage: new PostgresStore({ connectionString: process.env.DATABASE_URL }),
  options: {
    lastMessages: 30,
    workingMemory: {
      enabled: true,
      scope: 'resource',
      template: WORKING_MEMORY_TEMPLATE,
    },
  },
});
```

Conversation history is thread-scoped by Mastra defaults. It does not leak across threads, users, or workspaces.

### 6.3 Working memory

Working memory is **resource-scoped** (persists across all threads for the same resource). We use `workspace_id` as the resource. Each agent has its own Memory instance, so the effective scope is `(workspace_id, agent_id)`.

**Template.** A markdown template that the agent updates over time. We use a template that fits both purposes — cross-cutting workspace facts and agent-specific knowledge:

```typescript
const WORKING_MEMORY_TEMPLATE = `
# Workspace Knowledge

## Cross-cutting learnings about this company
- (e.g., "Sales motion is product-led growth with annual contracts")
- (e.g., "Engineering uses RFC docs in Notion for design decisions")

## How this agent does its job here
- (e.g., "PRDs at this company use the PRFAQ format with customer quotes upfront")
- (e.g., "Weekly updates go to founder in <300 words, no fluff")

## Preferences I've noticed
- (e.g., "Founder prefers brevity over context-setting")

## Things to avoid
- (e.g., "Do not draft specs without checking the latest CONTEXT.md for OKRs")
`;
```

**Writing.** Mastra automatically exposes an `updateWorkingMemory` tool when working memory is enabled. The agent calls this tool to update its own working memory. We don't need to define a separate tool.

The discipline rule — "only update working memory when you've learned something durable" — is baked into each agent's role.md instructions and reinforced by the SKILL.md memory hook section. The orchestrator writes to its own working memory for cross-workspace insights; each specialized agent writes to its own for agent-specific learnings.

**Reading.** Mastra automatically injects the current working memory blob into the agent's system message at invocation time. No explicit read tool needed.

**Per-call invocation.**

```typescript
await agent.generate(prompt, {
  runtimeContext,
  memory: {
    thread: threadId,
    resource: workspaceId,        // scopes working memory to this workspace
  },
});
```

**User-facing controls.** Users can view, edit, and delete working memory entries for each agent in Settings → Workspace → Memory (with an agent selector). Each agent's working memory is a distinct markdown blob.

**Read-only mode for the orchestrator (when reading other agents' memory).** When the orchestrator needs to read another agent's working memory during planning, we use Mastra's read-only mode:

```typescript
await orchestrator.generate(prompt, {
  runtimeContext,
  memory: {
    thread: threadId,
    resource: workspaceId,
    options: { readOnly: true },
  },
});
```

Read-only ensures the orchestrator does not overwrite a specialized agent's memory while planning.

## 7. Context Assembly

Three sources feed into every agent invocation:

1. **Static system content** — assembled by the application before calling the agent
2. **Mastra-managed content** — working memory and skill descriptions, injected by Mastra automatically
3. **Per-call dynamic content** — user message, relevant domain data slices

The agent's dynamic instructions function pulls together (1):

```typescript
import { Agent } from '@mastra/core/agent';

export const chiefOfStaffAgent = new Agent({
  id: 'chief-of-staff',
  name: 'Chief of Staff',
  model: 'anthropic/claude-sonnet-4',
  memory: sharedMemory,             // see Section 6.2
  tools: { /* see 4.3 */ },
  instructions: async ({ runtimeContext }) => {
    const workspaceId = runtimeContext.get('workspace_id');

    const [contextMd, roleMd] = await Promise.all([
      db.contextMd.read({ workspaceId }),
      db.roleMd.read({ workspaceId, agentId: 'chief-of-staff' }),
    ]);

    return [
      PLATFORM_SYSTEM_PROMPT,
      `# Company context\n${contextMd}`,
      `# Your role here\n${roleMd}`,
    ].join('\n\n');
  },
});
```

Working memory and the list of available skills are injected by Mastra automatically — we don't include them in the `instructions` return value. Domain data slices are loaded via tool calls (`domain.read`) during execution, not pre-loaded.

Order of the final assembled prompt (matters for prompt caching, see Section 11):

1. Mastra system content (skills list, working memory) — Mastra-controlled
2. Platform system prompt — application-controlled, shared across all tenants
3. CONTEXT.md — application-controlled, per tenant
4. role.md — application-controlled, per (tenant, agent)
5. Conversation history (last 30 messages) — Mastra-controlled
6. User message — per request

## 8. Orchestrator

The orchestrator is the entry point for every request. It implements a **plan / execute / solve** pattern with one-level planning (no recursive replanning in v1).

### 8.1 Lifecycle

1. Receive request. Application code builds `RuntimeContext`, calls the orchestrator.
2. Assemble context.
3. Plan. The orchestrator's first LLM call produces a structured plan: a list of steps, each with `(agent_id, skill_id, inputs, depends_on)`.
4. Execute. Steps run in dependency order. Independent steps run in parallel. Each step invokes the named specialized agent.
5. Solve. Once all steps complete (or a step fails), the orchestrator synthesizes a final response.
6. Persist. Audit log, inbox writes, working memory updates as applicable.

### 8.2 Planning

The planner sees skill descriptions automatically (Mastra injects them) for the agents the user has access to. The plan output is structured:

```typescript
const planSchema = z.object({
  reasoning: z.string().describe('Brief explanation of the approach'),
  steps: z.array(
    z.object({
      step_id: z.string(),
      agent_id: z.enum(['pm', 'chief-of-staff', 'executive-assistant']),
      skill_id: z.string(),
      inputs: z.record(z.unknown()),
      depends_on: z.array(z.string()).optional(),
    }),
  ),
  cannot_complete: z.string().optional(),
});
```

The orchestrator filters available agents to those the requesting user has access to (Section 7.3 of the PRD). If a request plausibly requires an agent the user doesn't have, the orchestrator sets `cannot_complete` with a clear explanation. The runtime returns that explanation to the user without executing steps.

Same applies if a step needs a Composio integration the user hasn't connected: the orchestrator surfaces the gap.

### 8.3 Execution

Each step runs via the named agent with the right runtime context and Composio toolsets:

```typescript
async function executeStep(
  step: PlanStep,
  state: ExecutionState,
  baseRuntimeContext: RuntimeContext<DpwRuntimeContext>,
): Promise<StepResult> {
  const inputs = resolveVariables(step.inputs, state.stepResults);

  const stepRuntimeContext = baseRuntimeContext.clone();
  stepRuntimeContext.set('agent_id', step.agentId);
  stepRuntimeContext.set('current_skill_id', step.skillId);

  const userMcp = await buildComposioClient(stepRuntimeContext.get('user_id'));
  const composioToolsets = userMcp ? await userMcp.listToolsets() : {};

  try {
    return await retry({ attempts: 3, backoff: 'exponential' }, async () => {
      const agent = mastra.getAgent(step.agentId);

      const result = await agent.generate(
        formatStepPrompt(step.skillId, inputs),
        {
          runtimeContext: stepRuntimeContext,
          memory: {
            thread: stepRuntimeContext.get('thread_id'),
            resource: stepRuntimeContext.get('workspace_id'),
          },
          toolsets: composioToolsets,
        },
      );

      return {
        stepId: step.stepId,
        output: result.text,
        toolCalls: result.toolCalls,
        tokensUsed: result.usage,
      };
    });
  } finally {
    await userMcp?.disconnect();
  }
}
```

`formatStepPrompt` prefixes the step inputs with a directive like "Use the skill `weekly_company_update` to handle this request" — the agent then calls Mastra's `skill` tool to load the instructions.

### 8.4 Streaming

Mastra integrates with **AI SDK v5** for Next.js streaming. The canonical pattern is `handleChatStream` from `@mastra/ai-sdk` on the server and `useChat` from `@ai-sdk/react` on the client. This handles progressive streaming of text and tool call events without manually managing SSE.

**Server (API route):**

```typescript
import { handleChatStream } from '@mastra/ai-sdk'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/mastra'

export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: params.agentId,
    params: {
      ...params,
      runtimeContext: buildRuntimeContext(params),
      memory: {
        thread: params.threadId,
        resource: params.workspaceId,
      },
    },
  })
  return createUIMessageStreamResponse({ stream })
}
```

**Client:**

```typescript
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
})
```

`agent.stream()` is the underlying method — it is AI SDK v5 compatible. `streamVNext()` was the experimental predecessor and is now superseded by the standard `stream()`. Do not use `streamVNext()` in new code.

The orchestrator plan is streamed as a structured tool event before text synthesis begins. The AI Elements components (`Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput`) render tool call events natively from the `useChat` message stream.

### 8.5 Failure handling

A step fails if:
- The agent returns an explicit error
- A tool call fails after retries (3 attempts)
- The agent's output cannot be parsed against the expected schema (where structured output is required)

On step failure, execution stops. The orchestrator does **not** replan in v1. The failure is reported to the user with the step ID, the error, and (for routines) an inbox item is created.

The failed `ExecutionState` is persisted with `status = 'failed'` and all partial step results intact, for inspection.

## 9. Specialized Agents

Each specialized agent is a Mastra Agent with:

- A stable identity (`agent_id` like `'pm'`, `'chief-of-staff'`)
- Dynamic instructions (role.md loaded per tenant)
- A Memory instance with working memory enabled, `scope: 'resource'`
- A static tool palette (platform tools)
- Implicit access to skill tools (`skill`, `skill_read`, `skill_search`) via the workspace
- Composio toolsets injected per-call via `toolsets: composioToolsets`

The launch roster:

- **Product Manager** (`'pm'`)
- **Chief of Staff** (`'chief-of-staff'`)
- **Executive Assistant** (`'executive-assistant'`)

All three share the same Mastra instance and the same workspace (which exposes all platform skills via the dynamic `skills` resolver). They differ in their default role.md and their permitted tool list.

Adding a new agent (e.g., Sales Ops): write a default role.md, create a skill directory `_platform/sales_ops/` with one subdirectory per skill, write the agent's `agent_rule.md`, register the agent in the Mastra instance, define its tool palette. No new runtime code.

## 10. Routines

A routine is a scheduled invocation of the orchestrator with a pre-defined instruction. Implementation:

- Routine definitions live in Postgres: `(routine_id, workspace_id, creator_user_id, schedule_cron_utc, schedule_cron_workspace_local, workspace_timezone, instruction, output_destination, paused)`
- On creation/edit, the runtime registers (or updates) a Trigger.dev scheduled task with the routine's cron (converted to UTC from the workspace's local time)
- When the schedule fires, Trigger.dev invokes a runtime task that builds the `RuntimeContext` and calls the orchestrator

```typescript
import { schedules } from '@trigger.dev/sdk/v3';
import { RuntimeContext } from '@mastra/core/runtime-context';

export const runRoutineTask = schedules.task({
  id: 'run-routine',
  run: async ({ payload }) => {
    const { routineId, workspaceId, creatorUserId } = payload;
    const routine = await db.routines.byId({ routineId, workspaceId });
    if (routine.paused) return;

    const workspace = await db.workspaces.byId({ workspaceId });

    const runtimeContext = new RuntimeContext<DpwRuntimeContext>();
    runtimeContext.set('workspace_id', workspaceId);
    runtimeContext.set('user_id', creatorUserId);
    runtimeContext.set('routine_id', routineId);
    runtimeContext.set('run_id', generateRunId());
    runtimeContext.set('workspace_timezone', workspace.timezone);

    const result = await orchestrator.run(routine.instruction, { runtimeContext });

    await deliverOutput(routine.output_destination, result, runtimeContext);
    await db.routineRuns.log({ routineId, result, timestamp: new Date() });
  },
});
```

**OAuth handling** follows the per-user model from the PRD: integration calls use the creator's Composio entity. If the creator's connection is revoked, tool calls fail, the orchestrator surfaces the gap, the routine auto-pauses, and the workspace admin receives an inbox alert.

**Concurrency** is bounded per workspace via application-level counters in Redis, preventing one tenant from monopolizing Trigger.dev workers.

## 11. Prompt Caching

Prompt caching is load-bearing for the cost target (~₹4K/tenant/month). Without it, the per-call cost of CONTEXT.md, role.md, and skill descriptions makes the price point unviable.

Strategy:

| Position | Content | Cache scope |
|---|---|---|
| Earliest | Platform system prompt | Platform-wide |
| Early | Skill descriptions (Mastra-injected, stable per deploy) | Platform-wide |
| Middle | CONTEXT.md | Per tenant |
| Middle | role.md | Per (tenant, agent) |
| Late | Working memory blob | Per (tenant, agent) — changes |
| Late | Conversation history | Per thread |
| Dynamic | User message | Not cached |

Vercel AI Gateway and Anthropic prompt caching both support prefix caching. We mark cache breakpoints so the largest static prefix (positions 1-4) is cached per `(tenant, agent)`.

**Working memory and caching.** Working memory changes more often than role.md but less often than the user message. We treat it as dynamic for caching purposes — including it in the cached prefix would require re-caching on every memory update.

**TTL realism.** Anthropic's prompt cache TTL is 5 minutes by default (extended on premium tiers). Low-traffic tenants will hit cold cache routinely. Mitigations: bucket routines within a tenant; accept cold-cache cost as part of the budget for infrequent routines.

## 12. Cost Controls

**Model selection.** One model end-to-end for v1: `claude-sonnet-4` (or equivalent via Vercel AI Gateway) for planning, step execution, and synthesis. The Mastra docs confirm that the model field on Agent accepts dynamic functions of `runtimeContext`, so we can introduce per-step model selection later without restructuring.

**Per-day budget.** Each workspace has a daily inference budget enforced before every LLM call:

```typescript
async function checkBudget(workspaceId: string): Promise<void> {
  const today = formatDate(new Date());
  const key = `budget:${workspaceId}:${today}`;
  const usedTokens = (await redis.get(key)) ?? 0;
  const limit = await db.workspaces.dailyBudget({ workspaceId });
  if (usedTokens > limit) {
    throw new BudgetExceededError(workspaceId, usedTokens, limit);
  }
}

async function recordUsage(workspaceId: string, tokensUsed: number): Promise<void> {
  const today = formatDate(new Date());
  const key = `budget:${workspaceId}:${today}`;
  await redis.incrby(key, tokensUsed);
  await redis.expire(key, 60 * 60 * 36);
}
```

When the budget is exceeded:
- Chat requests get a clear error message
- Routines auto-pause for the day and resume tomorrow
- Workspace admin gets an inbox alert at 80% utilization

The "day" is workspace-local (uses workspace timezone), so customers don't see budgets reset at unexpected times.

## 13. Evals (Mastra Scorers)

Mastra has a built-in evaluation framework called **Scorers**, which quantify agent output quality with numerical scores. We use it for three purposes:

1. **Smoke tests** for skills before they ship
2. **Live sampling** of production agent outputs for quality monitoring
3. **Trace evaluation** when investigating customer issues

### 13.1 Scorer types we use

- **Built-in scorers** from `@mastra/evals/scorers/prebuilt` — answer relevancy, toxicity (mostly for safety)
- **Custom scorers** — domain-specific checks for dpaperwork. Examples:
  - `did_not_invent_data` — verifies the agent's output references only data present in domain reads or CONTEXT.md
  - `matches_audience_tone` — checks output tone against the audience specified in the request and CONTEXT.md
  - `respects_output_format` — verifies markdown structure, word count limits, required sections
  - `skill_selection_correctness` — given a test prompt, did the orchestrator pick the expected skill?

### 13.2 Live evaluations on production

Each specialized agent has a small set of scorers attached, sampling a fraction of real outputs:

```typescript
import { createAnswerRelevancyScorer } from '@mastra/evals/scorers/prebuilt';
import { didNotInventDataScorer } from '../scorers/did-not-invent-data';

export const chiefOfStaffAgent = new Agent({
  id: 'chief-of-staff',
  // ...
  scorers: {
    relevancy: {
      scorer: createAnswerRelevancyScorer({ model: 'openai/gpt-4o-mini' }),
      sampling: { type: 'ratio', rate: 0.1 },  // sample 10% of outputs
    },
    fidelity: {
      scorer: didNotInventDataScorer(),
      sampling: { type: 'ratio', rate: 0.2 },  // 20%
    },
  },
});
```

Scores are stored in Mastra's `mastra_scorers` table. Anomalies (low scores trending in a workspace) surface in our internal observability dashboard.

### 13.3 Skill smoke tests in CI

Every skill ships with a `smoke_tests/` directory containing representative prompts and expected behaviors. CI runs the orchestrator against each test prompt, scores the output, and fails the build if any test scores below threshold.

```typescript
// In CI / scripts/smoke-test-skills.ts
import { mastra } from '../src/mastra';
import { runScorer } from '@mastra/evals';

for (const test of smokeTests) {
  const result = await mastra.getAgent('chief-of-staff').generate(test.prompt, {
    runtimeContext: testRuntimeContext(test.workspaceFixture),
  });

  const scores = await Promise.all([
    runScorer(skillSelectionCorrectness, { input: test.prompt, output: result, expected: test.expectedSkill }),
    runScorer(matchesOutputFormat, { input: test.prompt, output: result }),
  ]);

  if (scores.some(s => s.score < 0.7)) {
    throw new Error(`Smoke test failed: ${test.id} (scores: ${scores.map(s => s.score).join(', ')})`);
  }
}
```

Smoke tests run against a **designated test workspace** with realistic-but-synthetic CONTEXT.md, role.md, and domain fixtures. No production data is used.

### 13.4 Custom scorer example

```typescript
import { createScorer } from '@mastra/evals';

export const didNotInventDataScorer = createScorer({
  name: 'did_not_invent_data',
  description: 'Verifies the agent did not include data not present in any tool call or context',
  judge: {
    model: 'openai/gpt-4o-mini',
    instructions: `
      You are evaluating whether an AI agent fabricated information.
      Given the agent's output and the list of tool calls it made (with their results),
      score from 0 to 1 how well the output is grounded in the tool results.

      1.0 = every factual claim in the output is supported by tool call results
      0.0 = significant fabrication; output references entities or values not in tool calls
    `,
  },
  extractInputs: ({ input, output, toolCalls }) => ({
    output,
    toolResults: toolCalls?.map(tc => ({ tool: tc.toolName, result: tc.result })) ?? [],
  }),
});
```

## 14. Observability

**Mastra observability** is the source of truth for agent runtime traces. Every agent invocation, tool call, and LLM call is captured with timing, inputs, outputs, and errors. We configure Mastra's tracing to export to our observability backend.

Layered observability:

- **Mastra traces** — per-run traces showing plan, steps, tool calls, LLM calls. Inspectable in Mastra Studio in dev, exported to our backend in prod.
- **Audit log** in Postgres — every tool call writes a row before returning (`run_id, workspace_id, user_id, agent_id, tool, args, result, timestamp`). The durable record for compliance and customer support.
- **Sentry** — captures uncaught errors at the API/task boundary.
- **PostHog** — product analytics events.
- **Mastra scorers** — per-output quality scores stored in `mastra_scorers` table.

`run_id` and a `trace_id` propagate via `RuntimeContext`, making cross-system stitching of a single run straightforward.

## 15. Trade-offs and Open Questions

**Trade-offs accepted**

- *One model end-to-end.* Simpler, more expensive. Mastra's dynamic model selection makes future migration cheap; revisit when usage data justifies it.
- *One-level planning (no replanning).* More predictable, less capable. Re-planning is a debugging nightmare and unnecessary at this product stage.
- *Synchronous orchestrator for chat.* Latency is bounded by step count × per-step LLM latency. Long chains go to inbox via the routine pattern.
- *Per-user Composio OAuth only (v1).* Already accepted in PRD and architecture.
- *Single working memory layer per (workspace, agent).* Cross-cutting workspace facts and agent-specific learnings share one blob per agent, sectioned by template. Simpler than two separate stores.
- *No vector recall for chat history.* Working memory + recent message window is enough for v1.
- *Skills as markdown via Mastra workspace, not code.* Lower predictability than code, higher iteration velocity. Mitigated by `agent_rule.md`, scorers, and smoke tests.
- *S3 versioning only (no `VersionedSkillSource` in v1).* Iteration speed wins for now; tighten when customers ask for version pinning.

**Open questions**

- Skill description quality — what's our review process for ensuring descriptions are sharp enough? Owned by which role on the team?
- Working memory growth — at what entry count does the LLM struggle to use it? Implies a pruning policy beyond manual quarterly review.
- Plan visibility in UI — show plan to user by default, or hide and reveal on request?
- Composio MCP latency — every external tool call goes through the MCP protocol. If this becomes a problem, alternatives include direct API calls for the most-used integrations.
- Mastra version pinning — `@mastra/core` is on a 1.x line that's evolving fast. What's our upgrade discipline? Pin to minor, bump quarterly with regression eval pass?
- Smoke test fixtures — how many test workspaces, how realistic, who maintains them?
- Scorer cost — running scorers via `openai/gpt-4o-mini` adds inference cost on top of the agent's own calls. Sampling rates need calibration against the daily budget.
