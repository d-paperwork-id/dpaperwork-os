## Why

The app currently has a single `db/schema.ts` with basic Better Auth tables and a placeholder `workspace` table that doesn't match the designed schema. Phase 0.2 requires all core tables to exist before any feature work (agents, domains, routines, inbox, chat, audit) can begin — every surface in Phase 1 and beyond reads from or writes to these tables.

## What Changes

- **Restructure** `db/schema.ts` → `db/schema/` directory with one file per domain
- **Extend** the `user` table with dpaperwork-specific fields (timezone, language, notification preferences) via Better Auth's `additionalFields` approach
- **Replace** the placeholder `workspace` table with the full `workspaces` + `workspace_members` tables (slug, plan tier, budget, working hours, branding)
- **Add** `db/schema/content.ts` — `context_md`, `context_md_versions`, `role_md`, `role_md_versions`
- **Add** `db/schema/agents.ts` — `workspace_agent_config`, `user_agent_assignments`
- **Add** `db/schema/domains.ts` — `domains`, `domain_fields`, `domain_records`
- **Add** `db/schema/routines.ts` — `routines`, `routine_runs`
- **Add** `db/schema/chat.ts` — `threads`, `inbox_items`
- **Add** `db/schema/integrations.ts` — `integration_connections`
- **Add** `db/schema/runs.ts` — `runs`
- **Add** `db/schema/audit.ts` — `tool_call_log`, `agent_writes_log`, `integration_action_log`
- **Add** `db/schema/usage.ts` — `usage_daily`
- **Add** `db/schema/index.ts` — re-exports all tables
- **Add** `db/seed.ts` — workspace creation seed: default domains, agent configs, empty context_md, role_md per agent

**BREAKING**: the existing `workspace` table is dropped and replaced. The onboarding flow that creates a workspace must be updated to use the new `workspaces` table after this change lands.

## Capabilities

### New Capabilities

- `workspace-tables`: Full `workspaces` + `workspace_members` tables with slug, plan tier, daily budget, working hours, branding fields, and soft delete
- `content-tables`: `context_md` + `role_md` with version history tables for optimistic-concurrency-safe saves
- `agents-tables`: `workspace_agent_config` (per-workspace tool/integration allow-lists) + `user_agent_assignments` (which users can use which agents)
- `domains-tables`: `domains` + `domain_fields` + `domain_records` with GIN index on the `fields` JSONB column
- `routines-tables`: `routines` + `routine_runs` with local/UTC cron storage and Trigger.dev task handle
- `chat-tables`: `threads` (linked to Mastra via `mastra_thread_id`) + `inbox_items` (per-recipient, with snooze, priority, action chips)
- `integrations-tables`: `integration_connections` with per-user and per-workspace scope, Composio MCP URL storage
- `runs-table`: Execution state persistence for orchestrator ReWOO plans
- `audit-tables`: `tool_call_log`, `agent_writes_log`, `integration_action_log` — append-only, retention-aware
- `usage-table`: `usage_daily` — daily token/cost aggregates per workspace
- `workspace-seed`: Seed function that creates default domains (Customers, Deals, Vendors, Team, Tasks), default agent configs for all three agents, empty `context_md`, and default `role_md` per agent in a single transaction

### Modified Capabilities

- `workspace-onboarding`: The workspace creation step writes to `workspaces` + `workspace_members` instead of the old `workspace` table, and must call the seed function after creation.

## Impact

- **`db/schema.ts`** — deleted; replaced by `db/schema/` directory
- **`db/drizzle.ts`** (or `db/client.ts`) — schema import path updated to `./schema/index`
- **`lib/auth.ts`** (Better Auth config) — `additionalFields` added for `timezone`, `language`, `notificationsEmailEnabled`; `user` table declaration updated
- **`app/api/`** workspace-related routes — must reference `workspaces`/`workspace_members` after this change
- **Drizzle migrations** — new migration generated and pushed; existing `workspace` table dropped
- **Seed function** — called from workspace creation API route after this lands
