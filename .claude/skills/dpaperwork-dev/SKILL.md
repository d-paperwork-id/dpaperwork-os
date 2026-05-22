---
name: dpaperwork-dev
description: Use this skill when working on any dpaperwork feature, route, schema, agent, or UI surface. It navigates the project docs and fetches the exact sections relevant to the current task — schema, flows, UI patterns, agent runtime design, and implementation plan. Triggers on any dpaperwork implementation work.
metadata:
  author: dpaperwork
  version: "1.0"
---

Navigate and fetch the dpaperwork project documentation relevant to the current development task.

**Input**: A task description, surface name, file path, or phase number. Examples: "build the inbox page", "1.5", "routine schema", "Chief of Staff agent", "domains grid", "chat streaming".

**Doc map** (all files are at `docs/` from repo root):

| File | Contains |
|---|---|
| `docs/implementation-plan.md` | Phased task list (P0–P4), definitions of done, what NOT to build per phase |
| `docs/backend-schema.md` | Every Drizzle table: columns, types, indexes, ID prefixes, migration rules |
| `docs/app-flow.md` | Mermaid flow diagrams for every user journey and state machine |
| `docs/ui-ux.md` | Design tokens, component patterns, shadcn component reference, surface-specific patterns |
| `docs/agent-runtime.md` | Mastra tools, skills, memory layers, orchestrator, prompt caching, evals |
| `docs/architecture.md` | Tech stack, hosting, auth, middleware, streaming, background jobs, security |
| `docs/PRD.md` | Product vision, personas, functional requirements |

**Steps**

1. **Identify the task**

   Determine what surface or layer the task touches. A task can touch multiple layers — list all of them:

   - **UI / page** → needs `app-flow.md` (the flow) + `ui-ux.md` (the components)
   - **API route or DB write** → needs `backend-schema.md` (the tables) + `architecture.md` (auth/middleware pattern)
   - **Agent or skill** → needs `agent-runtime.md` (tools, memory, streaming) + `backend-schema.md` (audit log tables)
   - **Routine** → needs `backend-schema.md` (routines, routine_runs) + `agent-runtime.md` (Section 10)
   - **Implementation scope / what's next** → needs `implementation-plan.md`
   - **Product behavior question** → needs `docs/PRD.md`

2. **Fetch the implementation plan section**

   Always read this first to confirm scope and what NOT to build:

   ```
   Read docs/implementation-plan.md
   ```

   Find the task by phase-task code (e.g., `1.5`) or by surface name. Extract:
   - The task's checklist items (what to build)
   - The "What is deliberately NOT in Phase X" block (what to skip)
   - The "Definition of done" for the phase

3. **Fetch relevant doc sections by layer**

   Based on step 1, read only the files needed. Do not read docs that don't apply to this task.

   **For UI/page tasks** — read both:
   ```
   Read docs/app-flow.md   (find the section matching the surface: Inbox, Chat, Domains, Routines, etc.)
   Read docs/ui-ux.md      (Section 7 for component patterns, Section 8 for surface-specific patterns, Section 14 for shadcn component reference)
   ```

   **For schema / API route tasks** — read:
   ```
   Read docs/backend-schema.md   (find the section for each table touched: Section 4=auth, 5=workspaces, 6=content, 7=agents, 8=domains, 9=routines, 10=threads+inbox, 11=integrations, 12=runs, 13=audit)
   Read docs/architecture.md     (Section 5 for API route patterns, Section 6 for data layer, Section 14 for security/auth layers)
   ```

   **For agent / Mastra tasks** — read:
   ```
   Read docs/agent-runtime.md    (Section 2=mental model, 3=multi-tenant config, 4=tools, 5=skills, 6=memory, 7=context assembly, 8=orchestrator, 9=agents, 10=routines, 11=prompt caching)
   Read docs/backend-schema.md   (Section 12=runs, Section 13=audit logs)
   ```

   **For "what to build next" or scope questions** — read:
   ```
   Read docs/implementation-plan.md
   ```
   Then check current file tree to determine what's already built.

4. **Extract and present the relevant content**

   From the files read, extract only what applies to this task. Present it structured as:

   ```
   ## Task: {task name}
   Phase {n} | Task {n.n}

   ### Implementation scope
   {checklist from implementation-plan.md — what to build and what NOT to build}

   ### Flows (from app-flow.md)
   {the exact Mermaid diagram(s) for this surface}

   ### Schema (from backend-schema.md)
   {the Drizzle table definitions for every table touched}

   ### UI patterns (from ui-ux.md)
   {the exact component patterns, class names, shadcn components for this surface}

   ### Agent / Mastra patterns (from agent-runtime.md)
   {only if the task touches Mastra — the relevant code patterns}

   ### Architecture constraints
   {auth middleware, streaming pattern, API route conventions — only what's relevant}
   ```

   Do not summarise or paraphrase doc content — reproduce the exact code samples, class names, and table definitions. These are the source of truth.

5. **Highlight always-on constraints**

   After the extracted content, always append:

   ```
   ### Always-on constraints
   - No server actions. No SSR data fetching. All data via app/api/ routes + TanStack Query.
   - Zod v4: import from "zod" (not "zod/v4").
   - Tailwind v4: no tailwind.config.js — config in app/globals.css via @theme.
   - Next.js 16.2.6: read node_modules/next/dist/docs/ before using any Next.js API.
   - Use bunx (not npx) for CLI tools.
   - shadcn/ui first. Build custom only when shadcn has no equivalent.
   - Never raw Tailwind colors (bg-gray-100). Always token classes (bg-muted, text-foreground).
   - All IDs: {prefix}_{nanoid}. Every tenant table has workspace_id. Every query scoped by workspace_id.
   - Mastra: load the mastra skill before any Mastra code.
   ```

**Output format**

Structured markdown with the five sections above. Include verbatim code blocks from the docs — do not rewrite or summarise schema definitions, class names, or code patterns.

**Guardrails**

- Read the actual doc files — do not rely on cached knowledge about schema or UI patterns
- Always read `docs/implementation-plan.md` first to confirm what is and isn't in scope
- If the task touches Mastra, load the `mastra` skill before generating any Mastra code
- If a section of a doc is clearly not relevant to the task, skip it — don't dump entire files
- When multiple doc sections cover the same thing, the most specific one wins (surface-specific over general)
- If the task is ambiguous, ask which surface or layer before reading docs
