## Why

The platform needs persistent object storage to support tenant brain files — `CONTEXT.md`, `MEMORY.md`, skills, agent definitions, and domain data — that live under `workspaces/<tenant-id>/`. Without S3, these files have no durable home and the multi-tenant brain model cannot function.

## What Changes

- Add AWS S3 (or S3-compatible) bucket configuration to the project
- Add environment variables for bucket name, region, and credentials
- Create a reusable S3 client utility for uploading, downloading, and deleting objects
- Wire the client so other parts of the app can read/write workspace brain files

## Capabilities

### New Capabilities

- `s3-client`: Typed S3 client wrapper exposing `upload`, `download`, `delete`, `list`, and `getSignedUrl` operations scoped to workspace paths (`workspaces/<tenant-id>/...`)

### Modified Capabilities

<!-- No existing specs change requirements -->

## Impact

- New dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- New env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_ENDPOINT` (optional, for S3-compatible stores)
- New file: `lib/s3.ts` — the shared S3 client used by workspace and agent layers
- `.env.example` updated with new vars
