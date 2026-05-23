## 1. Drizzle Config & Client

- [x] 1.1 Add `tablesFilter` to `drizzle.config.ts` to exclude `user`, `session`, `account`, `verification` from Drizzle migration generation
- [x] 1.2 Update `db/drizzle.ts` schema import from `./schema` (flat file) to `./schema/index` (directory)

## 2. Auth Schema

- [x] 2.1 Create `db/schema/auth.ts` — re-declare `user` table with dpaperwork extension fields: `timezone` (text, default `Asia/Kolkata`), `language` (text, default `en`), `notifications_email_enabled` (boolean, default true); keep existing Better Auth columns unchanged
- [x] 2.2 Update `lib/auth.ts` Better Auth config to add matching `additionalFields` entries for `timezone`, `language`, `notificationsEmailEnabled`

## 3. Core Schema Files

- [x] 3.1 Create `db/schema/workspace.ts` — `workspaces` table (id `ws_`, name, slug, timezone, plan_tier, daily_budget_tokens, working hours, language, branding fields, default_agent_id, soft delete) + `workspace_members` table (id `mem_`, workspace_id FK, user_id FK, role enum, invited_by, joined_at, soft delete) with all indexes per spec
- [x] 3.2 Create `db/schema/content.ts` — `context_md` (workspace_id PK), `context_md_versions` (id `ver_`), `role_md` (composite PK: workspace_id + agent_id), `role_md_versions` with all indexes
- [x] 3.3 Create `db/schema/agents.ts` — `workspace_agent_config` (composite PK), `user_agent_assignments` (id, partial unique on workspace+user+agent) with all indexes
- [x] 3.4 Create `db/schema/domains.ts` — `domains` (id `dom_`, partial unique slug per workspace), `domain_fields` (unique slug per domain), `domain_records` (id `rec_`, GIN index on fields jsonb) with all indexes
- [x] 3.5 Create `db/schema/routines.ts` — `routines` (id `rtn_`, both cron columns, output_destination jsonb, trigger_dev_task_id, soft delete) + `routine_runs` (id `rrn_`, run_id ref, status enum) with all indexes
- [x] 3.6 Create `db/schema/chat.ts` — `threads` (id `thr_`, mastra_thread_id unique, soft delete) + `inbox_items` (id `inb_`, recipient_user_id, action_chips jsonb, snoozed_until, soft delete) with all indexes including the critical partial index on inbox
- [x] 3.7 Create `db/schema/integrations.ts` — `integration_connections` (id `icn_`, scope enum, composio fields, two partial unique indexes, soft delete)
- [x] 3.8 Create `db/schema/runs.ts` — `runs` (id `run_`, plan/step_results/variables/errors as jsonb, status enum, four indexes including partial on active status)
- [x] 3.9 Create `db/schema/audit.ts` — `tool_call_log` (id `tcl_`), `agent_writes_log` (id `awl_`, target_type enum, before/after jsonb), `integration_action_log` (all append-only, no soft delete)
- [x] 3.10 Create `db/schema/usage.ts` — `usage_daily` (unique index on workspace_id + day, cost stored in paise as integer)
- [x] 3.11 Create `db/schema/index.ts` — re-export all tables from the above files

## 4. Migration

- [x] 4.1 Run `bunx drizzle-kit generate` — review the generated SQL for correctness (verify stub `workspace` table is dropped, all 14+ tables are created, GIN index on domain_records.fields is present)
- [x] 4.2 Run `bunx drizzle-kit push` against local dev database
- [x] 4.3 Verify `tsc --noEmit` passes with zero type errors after schema + auth changes

## 5. Seed Function

- [x] 5.1 Create `db/seed.ts` — export `seedWorkspace(db, workspaceId, userId)` that runs in a single Drizzle transaction: inserts 5 domains (Customers, Deals, Vendors, Team, Tasks) with their fields per Backend Schema Section 8.3; inserts 3 `workspace_agent_config` rows; inserts 3 `user_agent_assignments` for the creator; inserts 1 `context_md` row (empty content); inserts 3 `role_md` rows with default content per agent
- [x] 5.2 Deals domain: wire the `customer` field as `domain_ref` pointing to the seeded Customers domain id

## 6. Workspace Onboarding Update

- [x] 6.1 Update `POST /api/workspace` route handler to write to `workspaces` + `workspace_members` (with `role = 'admin'`) in a single transaction, then call `seedWorkspace` within the same transaction; return the new workspace id in the response
- [x] 6.2 Update workspace existence check in middleware (and any other lookup) to query `workspace_members` for the user instead of the old `workspace` table
- [ ] 6.3 Verify end-to-end: sign up → verify email → submit onboarding form → confirm `workspaces`, `workspace_members`, `domains`, `workspace_agent_config`, `user_agent_assignments`, `context_md`, `role_md` rows all exist in Drizzle Studio
