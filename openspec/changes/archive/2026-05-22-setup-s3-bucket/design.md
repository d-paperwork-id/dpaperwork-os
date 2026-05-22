## Context

The platform's multi-tenant brain model stores per-tenant files under `workspaces/<tenant-id>/`. Today these files have no persistent home — the architecture calls for S3 as the backing store. This design introduces a thin, typed S3 client in `lib/s3.ts` that the rest of the app (workspace provisioning, agent runtime, domain data) will import.

The project already uses AWS services indirectly (Neon for DB). Adding the AWS SDK is a natural extension.

## Goals / Non-Goals

**Goals:**
- Provide a typed `s3Client` wrapper with `upload`, `download`, `delete`, `list`, and `getSignedUrl` operations
- Scope all operations under `workspaces/<tenant-id>/` by convention enforced in the client
- Support S3-compatible stores (Cloudflare R2, MinIO) via optional `S3_ENDPOINT` env var
- Add all required env vars to `.env.example`

**Non-Goals:**
- Multi-part upload (files in scope are small markdown/YAML files)
- Bucket creation / lifecycle management (done once manually or via IaC, not app code)
- Streaming uploads (not needed for brain file sizes)

## Decisions

### AWS SDK v3 (`@aws-sdk/client-s3`) over v2 or `aws4` fetch wrappers

AWS SDK v3 is modular — only the S3 package is installed, keeping bundle size small. V2 is maintenance mode. Raw `aws4` wrappers would require reimplementing retries and error parsing.

### Single shared client instance in `lib/s3.ts`

A module-level singleton avoids re-initializing the SDK on every request. Next.js module caching ensures one instance per worker. Alternatives (factory per request, class instance) add complexity with no benefit for this use case.

### Path-scoped helper functions rather than generic key exposure

All exported functions take `(tenantId, relativePath)` rather than a raw S3 key. This enforces the `workspaces/<tenant-id>/` prefix in one place and prevents callers from accidentally accessing other tenants' data.

### Signed URLs via `@aws-sdk/s3-request-presigner`

`getSignedUrl` uses the presigner package (part of SDK v3) rather than building URLs manually. The function accepts an expiry in seconds (default 3600) and returns a time-limited GET URL scoped to the caller-supplied tenant path. This is the safe option: the URL encodes IAM credentials, not the bucket's public access policy, so the bucket can remain private.

### S3_ENDPOINT optional for S3-compatible stores

R2 and MinIO are valid hosting options for cost or compliance reasons. Making the endpoint optional (defaults to AWS) costs nothing and preserves flexibility.

## Risks / Trade-offs

[Credential leakage] → Store credentials in `.env` (never committed); document in `.env.example` with placeholder values. Add `.env` to `.gitignore` (already present).

[Cold-start latency] → SDK client initialization is synchronous and fast (<5ms). Not a meaningful risk for serverless Next.js handlers.

[Bucket misconfiguration] → App code cannot verify bucket existence at startup in serverless environments. Mitigation: document bucket setup steps; surface clear SDK errors when bucket is missing rather than swallowing them.

[Tenant path collision] → Enforced by the path-scoped helpers — callers never construct raw keys. Risk is low.
