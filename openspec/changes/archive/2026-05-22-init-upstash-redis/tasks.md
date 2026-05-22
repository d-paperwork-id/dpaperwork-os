## 1. Redis Client Module

- [x] 1.1 Create `lib/redis.ts` that validates `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars, throws a descriptive `Error` if either is missing, and exports a singleton `redis` instance using `new Redis({ url, token })` from `@upstash/redis`

## 2. Verification

- [x] 2.1 Confirm the dev server starts without errors (`npm run dev`) and the Redis module loads cleanly
