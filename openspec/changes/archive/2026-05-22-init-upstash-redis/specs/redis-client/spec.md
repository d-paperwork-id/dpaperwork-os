## ADDED Requirements

### Requirement: Redis client singleton
The system SHALL export a single `redis` instance of `@upstash/redis` `Redis` from `lib/redis.ts`, initialized with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables.

#### Scenario: Successful import
- **WHEN** any module imports `redis` from `lib/redis`
- **THEN** the import resolves to a live `Redis` instance connected to the Upstash endpoint

### Requirement: Env var validation at startup
The module SHALL throw an `Error` with a descriptive message if `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing or empty when the module is first loaded.

#### Scenario: Missing URL
- **WHEN** `UPSTASH_REDIS_REST_URL` is not set in the environment
- **THEN** importing `lib/redis` throws `Error: UPSTASH_REDIS_REST_URL is not set`

#### Scenario: Missing token
- **WHEN** `UPSTASH_REDIS_REST_TOKEN` is not set in the environment
- **THEN** importing `lib/redis` throws `Error: UPSTASH_REDIS_REST_TOKEN is not set`

#### Scenario: Both vars present
- **WHEN** both env vars are set to non-empty strings
- **THEN** the module loads without throwing and exports a valid `Redis` instance
