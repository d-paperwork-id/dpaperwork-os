# Spec: Supabase DB Client

## Requirements

### Requirement: Drizzle client is Supabase-compatible
The system SHALL connect to Postgres via the `postgres` package with `{ prepare: false }`, using a `DATABASE_URL` that points to a Supabase transaction pooler endpoint, with no dependency on `@neondatabase/serverless`.

#### Scenario: No Neon import in application code
- **WHEN** the application is built
- **THEN** no file outside `node_modules` imports from `@neondatabase/serverless`

#### Scenario: DB client works against Supabase pooler
- **WHEN** `DATABASE_URL` is set to a Supabase transaction pooler URL
- **THEN** Drizzle queries execute successfully and the build passes without errors

### Requirement: Middleware workspace check uses Drizzle
The middleware (`proxy.ts`) SHALL check for an existing workspace using the shared Drizzle `db` client rather than a raw `neon()` SQL call.

#### Scenario: Workspace check returns correct result
- **WHEN** the middleware checks whether a user has a workspace
- **THEN** it queries via Drizzle and returns the same boolean result as the previous raw SQL implementation

### Requirement: Environment variable documents Supabase format
The `.env.example` file SHALL document `DATABASE_URL` with a comment or placeholder that references the Supabase transaction pooler connection string format.

#### Scenario: Developer onboarding
- **WHEN** a developer reads `.env.example`
- **THEN** they see a clear placeholder indicating the expected Supabase pooler URL format
