## Context

Current state:
- `db/drizzle.ts` uses `drizzle-orm/postgres-js` with the `postgres` package — generic, Supabase-compatible as-is
- `proxy.ts` (Next.js middleware) uses `@neondatabase/serverless`'s `neon()` to run a raw `SELECT id FROM workspace` query — this is the only Neon-specific usage outside of `node_modules`
- `.env.example` points `DATABASE_URL` at a Neon connection string
- `@neondatabase/serverless` is in `package.json` but only used in `proxy.ts`

Supabase connection format (transaction pooler, port 6543):
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
The `postgres` package with `{ prepare: false }` works identically with Supabase's pgBouncer pooler.

## Goals / Non-Goals

**Goals:**
- Eliminate the `@neondatabase/serverless` dependency entirely
- Replace the raw `neon()` workspace check in `proxy.ts` with the existing Drizzle `db` client
- Update `.env.example` to reference Supabase connection string format

**Non-Goals:**
- Introducing `@supabase/supabase-js` — the project uses Drizzle directly over Postgres; no Supabase client SDK needed
- Changing the schema, migrations, or auth setup
- Adding Supabase Storage, Auth, or other Supabase services

## Decisions

**Reuse `db` from `db/drizzle.ts` in `proxy.ts` instead of a new client**
The middleware already imports from `@/lib/auth` which itself imports `db`. Importing `db` directly in `proxy.ts` avoids a second connection and is consistent with how auth works.

**Keep `{ prepare: false }` in `db/drizzle.ts`**
This flag disables prepared statements, required for pgBouncer transaction pooling mode — which Supabase's pooler uses. No change needed.

**Session pooler vs transaction pooler**
Supabase offers both. Transaction pooler (port 6543) is recommended for serverless. The `DATABASE_URL` in `.env.example` should note this.

## Risks / Trade-offs

- [Middleware DB import] → Importing `db` in middleware adds a cold-start cost; mitigated by the fact that `@/lib/auth` already does this and Next.js middleware already pays that cost
- [Supabase connection limit] → Free tier has limited connections; `{ prepare: false }` + pooler URL keeps this safe
