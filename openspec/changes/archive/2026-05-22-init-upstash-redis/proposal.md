## Why

The platform needs a shared, fast key-value store for caching, session data, rate limiting, and future agent state — Upstash Redis is the chosen provider since the package and env are already in place and it integrates seamlessly with serverless/edge deployments.

## What Changes

- Create a singleton Redis client module (`lib/redis.ts`) using `@upstash/redis`
- Export a typed `redis` instance ready for import across the codebase
- Validate required env vars at startup so misconfiguration surfaces early

## Capabilities

### New Capabilities

- `redis-client`: Singleton Upstash Redis client with env validation, usable across API routes, agents, and lib utilities

### Modified Capabilities

<!-- None -->

## Impact

- New file: `lib/redis.ts`
- Env vars required: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (already set)
- No breaking changes; purely additive
