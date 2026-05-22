## Why

dpaperwork agents need to execute long-running, reliable background jobs (document processing, AI pipeline runs, scheduled syncs) that can't live in Next.js API routes. Trigger.dev provides a durable, observable job queue that survives serverless cold starts and network timeouts.

## What Changes

- Add `@trigger.dev/sdk` dependency and configure the Trigger.dev client
- Add a `trigger.config.ts` project configuration file
- Register a Next.js route handler at `app/api/trigger/route.ts` to serve as the webhook endpoint
- Define an initial example trigger job to validate the integration end-to-end
- Update `.env.example` with required Trigger.dev environment variables

## Capabilities

### New Capabilities

- `trigger-client`: Trigger.dev SDK initialisation, client singleton, and Next.js webhook route handler

### Modified Capabilities

<!-- No existing capability requirements are changing -->

## Impact

- **Dependencies**: adds `@trigger.dev/sdk` (and `@trigger.dev/nextjs` adapter)
- **Environment variables**: `TRIGGER_SECRET_KEY`, `TRIGGER_API_URL` (optional self-hosted)
- **API routes**: new `POST /api/trigger` webhook endpoint consumed by Trigger.dev cloud
- **Build**: `trigger.config.ts` must be picked up at project root; no changes to existing routes
