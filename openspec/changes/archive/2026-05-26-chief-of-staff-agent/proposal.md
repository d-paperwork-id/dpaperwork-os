## Why

Phase 1's north star is a design partner opening their laptop Monday morning to a smart weekly summary waiting in their inbox. That requires the first AI agent — Chief of Staff — to exist, have access to workspace data, and be able to produce and deliver inbox output. This is the entire agent layer for Phase 1; nothing else in Phase 1 fires without it.

## What Changes

- Add `src/mastra/agents/chief-of-staff.ts` — a Mastra `Agent` with dynamic instructions (loads `context_md` and `role_md` from DB per tenant) and three platform tools: `domain.read`, `context.lookup`, `inbox.create`
- Add `src/mastra/tools/domain-read.ts` — Mastra tool that reads domain records for a workspace, scoped by `workspace_id` from `RuntimeContext`
- Add `src/mastra/tools/context-lookup.ts` — Mastra tool that reads a named section from CONTEXT.md for a workspace
- Add `src/mastra/tools/inbox-create.ts` — Mastra tool that writes a row to `inbox_items` with agent attribution
- Add `src/mastra/skills/weekly-company-update.ts` — hardcoded skill as a Mastra tool (not a SKILL.md file — S3 skills are Phase 3); reads Projects + Deals domains, reads "How we sell" from CONTEXT.md, synthesises a 200–500 word markdown report, calls `inbox.create`
- Register agent in `src/mastra/index.ts`
- No memory, no working memory, no orchestrator — single agent, single direct skill invocation

## Capabilities

### New Capabilities

- `chief-of-staff-agent`: Mastra Agent definition with dynamic per-tenant instructions, tool palette (domain.read, context.lookup, inbox.create), and Mastra instance registration
- `weekly-company-update-skill`: Hardcoded Phase 1 skill as a Mastra tool — reads Projects + Deals domains, reads CONTEXT.md section, synthesises and delivers inbox report

### Modified Capabilities

<!-- None — no existing specs have their requirements changed by this -->

## Impact

- **New files**: `src/mastra/agents/chief-of-staff.ts`, `src/mastra/tools/domain-read.ts`, `src/mastra/tools/context-lookup.ts`, `src/mastra/tools/inbox-create.ts`, `src/mastra/skills/weekly-company-update.ts`
- **Modified**: `src/mastra/index.ts` — register agent
- **DB reads**: `context_md`, `role_md`, `domains`, `domain_records` (via Drizzle, scoped by `workspace_id`)
- **DB writes**: `inbox_items`, `tool_call_log` (audit before return)
- **Dependencies**: `@mastra/core`, `zod`, Drizzle `db` client, existing schema from `lib/db/schema/`
- **Not touched**: Trigger.dev, chat/streaming, orchestrator, working memory, S3
