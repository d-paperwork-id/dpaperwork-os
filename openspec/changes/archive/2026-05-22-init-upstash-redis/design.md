## Context

The project uses Next.js API routes with Drizzle/Neon for persistence. There is no shared in-memory or cache layer yet. The `@upstash/redis` package is already installed and the env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are set. Upstash Redis uses a REST transport, making it safe in serverless and edge environments.

## Goals / Non-Goals

**Goals:**
- Expose a single, importable `redis` client instance at `lib/redis.ts`
- Fail fast with a clear error if required env vars are missing
- Follow the existing singleton pattern used by the Drizzle client (`lib/db/`)

**Non-Goals:**
- Implementing caching, rate limiting, or session logic (consumers handle that)
- Adding a Redis abstraction layer or mock
- Multi-region or multi-database Redis setup

## Decisions

**Single module, no class wrapper**
Export a `redis` const directly from `lib/redis.ts`. A class wrapper adds indirection with no benefit here — the `@upstash/redis` `Redis` instance is already stateless and re-usable.

**Env validation at module load time**
Check for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` when the module is first imported. Throw an explicit `Error` rather than letting Upstash surface a cryptic auth failure later. This mirrors the pattern used in `db/drizzle.ts`.

**No connection pooling logic**
Upstash REST-based Redis is stateless per request — there is no persistent TCP connection to pool. The `Redis` instance is lightweight to create and safe to share as a module-level singleton.

## Risks / Trade-offs

- [Cold-start cost] → Negligible; REST transport has no TCP handshake overhead
- [Env var typo silent failure] → Mitigated by explicit startup validation
- [No local dev Redis] → Upstash free tier works locally; no extra infra needed
