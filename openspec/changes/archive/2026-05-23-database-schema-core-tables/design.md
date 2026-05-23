## Context

The current `db/schema.ts` is a single flat file created by the initial Better Auth scaffold. It has auth tables (user, session, account, verification) and a stub `workspace` table (`id`, `userId`, `name`, `industry`, `website`, `about`) that is too narrow to support any Phase 1 feature.

All Phase 1 surfaces — CONTEXT.md editor, domain grid, Chief of Staff agent, routines, inbox — read from and write to tables defined in the Backend Schema doc (Sections 4–14). Those tables do not exist yet. This change creates them all.

The existing Drizzle client (`db/drizzle.ts`) points at the flat `schema.ts`; it must be updated to point at the new `db/schema/index.ts`.

Better Auth manages `user`, `session`, `account`, `verification` schema migrations internally. We declare them in `db/schema/auth.ts` for Drizzle typing purposes only — Better Auth remains the migration owner for those four tables.

## Goals / Non-Goals

**Goals:**
- Create `db/schema/` directory with one file per domain: `auth.ts`, `workspace.ts`, `content.ts`, `agents.ts`, `domains.ts`, `routines.ts`, `chat.ts`, `integrations.ts`, `runs.ts`, `audit.ts`, `usage.ts`, `index.ts`
- Match the Drizzle table definitions in Backend Schema doc Sections 4–14 exactly (column names, types, indexes, partial indexes, soft-delete policy)
- Extend the `user` table with `timezone`, `language`, `notificationsEmailEnabled` via Better Auth `additionalFields`
- Drop the stub `workspace` table and replace with the full `workspaces` + `workspace_members` tables
- Produce a single Drizzle migration covering all new tables
- Add `db/seed.ts` with a `seedWorkspace(workspaceId, userId)` function that seeds defaults in a single transaction

**Non-Goals:**
- Mastra tables — managed by `@mastra/pg`, not Drizzle
- Mobile-specific tables — deferred
- Composio webhook tables beyond `integration_connections`
- Row-Level Security — v1 uses application-layer `workspace_id` scoping
- Per-workspace Postgres schemas — deferred to Phase 4

## Decisions

### 1. One file per domain, not one monolithic file

The backend schema doc already defines the split: `auth.ts`, `workspace.ts`, `content.ts`, etc. Following this keeps each file under ~150 lines, makes circular-import tracking easy (auth ← workspace ← content ← agents ← domains ← routines ← chat etc.), and aligns with what the rest of the implementation plan references by filename.

Alternative: keep everything in one file. Rejected — that file would be ~900 lines, harder to review, and every PR that touches one table would conflict with every other.

### 2. Prefixed nanoid IDs generated application-side

All IDs follow `{prefix}_{16-char-nanoid}` (e.g., `ws_`, `mem_`, `dom_`, `rec_`). Generated in application code before insert, not by Postgres sequences.

Alternative: UUID v4 or Postgres `gen_random_uuid()`. Rejected — prefixed IDs make grepping logs and debugging traces dramatically easier. Nanoid is URL-safe and compact.

User IDs are the one exception: Better Auth generates them as bare nanoids without a prefix; we don't override this.

### 3. `db/schema/auth.ts` is a Drizzle declaration, not a Drizzle migration target

Better Auth owns the `user`, `session`, `account`, `verification` tables and runs its own migrations. We declare those tables in `auth.ts` so Drizzle can generate typed queries and foreign key references compile. We configure `drizzle-kit` to exclude these four tables from migration generation (via `tablesFilter`).

Alternative: let Drizzle manage auth tables too. Rejected — conflicts with Better Auth's schema management; double-migration is a maintenance burden.

### 4. `workspace` table dropped with a single migration

The stub `workspace` table is only written by the onboarding flow (created in the same PR series as this schema). Because Better Auth's session table references `user.id` (not `workspace.id`), dropping `workspace` has no FK cascades to worry about outside our own code. The onboarding API route and any workspace lookup will be updated in the same task that lands this schema.

### 5. `db/seed.ts` is a pure function, called from the API route

`seedWorkspace(db, workspaceId, userId)` takes the Drizzle client, workspace ID, and user ID, and inserts: 5 default domains with their fields, 3 agent config rows, 1 `context_md` row, 3 `role_md` rows. All in one transaction (`db.transaction`).

Alternative: database triggers / a migration-time seed. Rejected — seeds depend on runtime-known values (`workspaceId`, `userId`) and differ per environment. A function called from the API is testable and auditable.

## Risks / Trade-offs

- **Breaking `workspace` table** → Any code that references the old `workspace` table (onboarding routes, workspace lookup middleware) must be updated atomically with this migration. The `workspace-onboarding` spec (modified capability) tracks this. Risk: staging deploy with old app code against new schema causes 500s. Mitigation: migrate and deploy atomically in dev; on production, migrate only when app deploy is ready.

- **Better Auth `additionalFields` sync** → The three extra user columns (`timezone`, `language`, `notificationsEmailEnabled`) must be declared in both the Drizzle schema and the Better Auth `additionalFields` config in `lib/auth.ts`, or they'll be missing from type inference. Risk: silent type mismatch. Mitigation: verify types compile with `tsc --noEmit` after change.

- **Large migration on first push** → This migration creates ~14 tables at once. If it fails partway through (network drop, Supabase timeout), the DB is in a partial state. Mitigation: Drizzle migrations run in a transaction by default (`BEGIN` / `COMMIT`); partial failure rolls back.

- **`drizzle-kit` managing Better Auth tables** → Must configure `tablesFilter` to exclude `user`, `session`, `account`, `verification` from Drizzle's migration diffing, or `drizzle-kit generate` will try to create them. Risk: duplicate table creation error. Mitigation: add `tablesFilter` in `drizzle.config.ts` before running generate.

## Migration Plan

1. Add `tablesFilter` to `drizzle.config.ts` to exclude Better Auth tables
2. Create `db/schema/` files in import-dependency order: `auth.ts` → `workspace.ts` → `content.ts` → `agents.ts` → `domains.ts` → `routines.ts` → `chat.ts` → `integrations.ts` → `runs.ts` → `audit.ts` → `usage.ts` → `index.ts`
3. Update `db/drizzle.ts` import to `./schema`
4. Update `lib/auth.ts` to add `additionalFields`
5. Run `bunx drizzle-kit generate` — review the SQL diff
6. Run `bunx drizzle-kit push` against local dev DB
7. Update workspace creation API route to use `workspaces` + `workspace_members`
8. Write and test `db/seed.ts`

Rollback: revert schema files and re-run `drizzle-kit generate` + push. The stub `workspace` table can be re-created with a small migration if needed; no data is in it in dev.

## Open Questions

- **`drizzle.config.ts` current state** — confirm the config file location and whether `tablesFilter` is already set.
- **Better Auth `additionalFields` interaction with existing sessions** — do existing user rows need a migration to backfill `timezone` and `language` defaults? (Yes, but `DEFAULT 'Asia/Kolkata'` and `DEFAULT 'en'` handle this at the DB level automatically.)
- **`db/drizzle.ts` vs `db/client.ts`** — the implementation plan uses `db/client.ts` but the existing file is `db/drizzle.ts`. Decide on the canonical name before creating `index.ts`.
