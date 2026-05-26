## Context

dpaperwork has a Mastra instance initialised in `src/mastra/index.ts` (bare, no agents yet). The DB schema is defined — `context_md`, `role_md`, `domain_records`, `inbox_items`, and `tool_call_log` all exist. Phase 1.3 is the first time any agent code is written.

The Architecture doc establishes that there is **one Mastra instance** for the entire platform. Multi-tenancy is handled via `RuntimeContext`, not separate instances. This design must establish the patterns that every future agent will copy.

Phase 1 constraint: no orchestrator, no working memory, no S3 skills. The skill is called directly as a Mastra tool; the agent does not plan multi-step work.

## Goals / Non-Goals

**Goals:**
- Establish the `RuntimeContext` + dynamic instructions pattern that all future agents will follow
- Implement the three core platform tools (`domain.read`, `context.lookup`, `inbox.create`) with audit logging baked in
- Ship a working Chief of Staff agent that can produce and deliver a weekly company update
- Keep the skill invocation simple: the Trigger.dev task calls the agent directly with a fixed instruction

**Non-Goals:**
- Working memory (Phase 3)
- Orchestrator / ReWOO planning (Phase 3)
- S3 SKILL.md files (Phase 3)
- Composio MCP integrations (Phase 3)
- Streaming (Phase 2 — chat only)
- Any UI surface (Routines UI is Phase 1.4, Inbox is Phase 1.5)

## Decisions

### Tools as separate files, not inline in the agent

**Decision**: Each tool lives in `src/mastra/tools/{name}.ts` and is imported into the agent definition.

**Rationale**: Tools will be shared across multiple agents (PM, Executive Assistant). Defining them inline in the agent creates duplication. Standalone files also make them independently testable.

**Alternative considered**: Single `tools.ts` barrel file — rejected because it creates coupling between unrelated tools.

---

### Dynamic instructions via async function

**Decision**: The `instructions` field on the Mastra `Agent` is an async function that reads `context_md.content` and `role_md.content` from DB using `runtimeContext.get('workspace_id')`.

**Rationale**: This is the pattern documented in Agent Runtime doc Section 7. It ensures every invocation gets the current tenant's CONTEXT.md and role.md. Prompt caching is handled at the Mastra/Anthropic layer using prefix matching on the static sections.

**Alternative considered**: Pre-loading context in the Trigger.dev task and passing it in the message — rejected because it bypasses Mastra's caching layer and couples the caller to context assembly.

---

### Weekly skill as a Mastra tool (not SKILL.md)

**Decision**: `weekly-company-update.ts` exports a `createTool(...)` definition. The agent's tool palette includes it. The Trigger.dev task invokes the agent with: `"Run the weekly_company_update skill"`.

**Rationale**: S3 SKILL.md infrastructure is Phase 3. Shipping a TypeScript tool now lets us deliver Phase 1 without building the S3 skill system. The skill reads domain data and calls `inbox.create` — the same tool calls it would make if driven by a SKILL.md. The migration path to S3 skills in Phase 3 is: write the SKILL.md equivalent, remove the TypeScript tool, the behaviour is identical.

**Alternative considered**: Hardcode the skill logic directly in the Trigger.dev task — rejected because it bypasses Mastra and loses audit logging, context assembly, and the pattern the rest of the system expects.

---

### Audit log written before returning from tool

**Decision**: Every platform tool writes a row to `tool_call_log` before returning its result to the agent.

**Rationale**: Matches Agent Runtime doc Section 4.1. If the agent's next action fails, the read is still on record. Write-before-return is a discipline we enforce from day one.

---

### RuntimeContext for workspace_id, not function arguments

**Decision**: Tools read `workspace_id` and `run_id` from `runtimeContext` (the Mastra-provided context object), not from their `inputSchema`.

**Rationale**: Prevents the agent from accidentally passing the wrong workspace (a security boundary). The workspace context is set once by the caller (Trigger.dev task) and flows transparently through all tool calls.

---

### No memory configuration on Phase 1 agent

**Decision**: The `chiefOfStaffAgent` has no `memory` field in Phase 1.

**Rationale**: Working memory requires `PostgresStore` and resource-scoped memory — Phase 3 work. The Phase 1 agent is stateless between invocations; it assembles context fresh each time from DB. Adding memory wiring now without the UI to manage it (Phase 2) would create orphaned state.

## Risks / Trade-offs

- **No working memory means no cross-run learning.** The agent may repeat itself across weekly updates. Mitigated by Phase 3 working memory.
- **Skill is TypeScript, not SKILL.md.** The agent cannot "discover" the skill via Mastra's skill tool mechanism. The Trigger.dev task must pass an explicit instruction. This is acceptable for Phase 1 — the agent does not self-plan anyway.
- **context_md + role_md loaded on every invocation.** Cold cache on Anthropic's side means the first call to a workspace each 5 minutes pays full input cost. Mitigated by batching routines and by Phase 2 prompt caching discipline.
- **inbox_items written without recipient lookup.** The `inbox.create` tool takes `recipient_user_id` as an explicit input. The Trigger.dev task must pass the routine's `creator_user_id`. If the routine runs without a creator (edge case), the write fails. Mitigation: Trigger.dev task validates creator before invoking agent.

## Open Questions

- Default role.md content for Chief of Staff: what should the seed content say? (Caller provides a reasonable default — see workspace seed task 0.2.)
- Should `inbox.create` also write to `agent_writes_log` in addition to `tool_call_log`? Agent Runtime doc says writes are logged with attribution; `agent_writes_log` captures before/after for domain writes and inbox. Answer: yes — write both.
