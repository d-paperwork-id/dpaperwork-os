## Why

The project references Neon DB in its dependency (`@neondatabase/serverless`) and env example (`NEON_DATABASE_CONNECTION_STRING`), but the team is moving to Supabase as the Postgres host. Aligning now eliminates the orphaned Neon dependency, fixes the raw `neon()` call in the middleware, and ensures the connection setup matches Supabase's pooler requirements.

## What Changes

- Remove `@neondatabase/serverless` package dependency
- Replace the raw `neon()` SQL call in `proxy.ts` with a Drizzle query using the existing `db` client
- Update `db/drizzle.ts` to remove the Neon-specific `{ prepare: false }` comment note and confirm it works with Supabase's transaction pooler (the `prepare: false` flag is actually correct for Supabase's pgBouncer pooler too — no change needed)
- Update `.env.example` `DATABASE_URL` hint to reflect Supabase connection string format

## Capabilities

### New Capabilities

<!-- None — this is a dependency and wiring swap, no new surface area -->

### Modified Capabilities

<!-- No spec-level behavior changes. The workspace check in proxy.ts produces identical results; only the underlying driver changes. -->

## Impact

- `proxy.ts`: remove `@neondatabase/serverless` import, replace `neon()` query with Drizzle
- `package.json` / `bun.lock`: remove `@neondatabase/serverless`
- `.env.example`: update `DATABASE_URL` hint
- No API surface changes, no schema changes, no migration required
