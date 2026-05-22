## Context

dpaperwork runs on Next.js (serverless). Agent jobs — document parsing, AI pipeline runs, scheduled syncs — are too long-lived for API route handlers and need durable execution with retries, observability, and fan-out. Trigger.dev v3 provides this via a pull-based job runtime: the SDK polls Trigger.dev cloud rather than relying on inbound webhooks, so no public endpoint is strictly required in v3.

Current state: no background job infrastructure. All async work either blocks the API response or is fire-and-forgotten via `Promise` (unreliable).

## Goals / Non-Goals

**Goals:**
- Install and configure the Trigger.dev v3 SDK (`@trigger.dev/sdk/v3`)
- Create a `trigger.config.ts` at the project root with project ID, retry defaults, and directory pointing to job definitions
- Define one "hello world" job (`jobs/hello-world.ts`) to confirm the integration works end-to-end
- Document required env vars in `.env.example`

**Non-Goals:**
- Defining production agent jobs (those come in follow-on changes)
- Self-hosted Trigger.dev infrastructure
- Auth-gated job triggering (out of scope for init)

## Decisions

### Decision: Trigger.dev v3 (pull-based) over v2 (webhook-based)
v3 uses a long-polling worker model — no inbound `/api/trigger` webhook route is needed in Next.js, which simplifies deployment and removes a public endpoint. v2 required a dedicated route handler. We adopt v3 from the start.

### Decision: Jobs co-located in `src/trigger/` directory
Trigger.dev resolves job files via `trigger.config.ts → dirs`. Placing all jobs under `src/trigger/` keeps them separate from Next.js routes and Mastra agents while remaining importable. Alternative (`src/mastra/jobs/`) was rejected because Trigger.dev and Mastra are independent runtimes.

### Decision: Single `trigger.config.ts` at project root
The Trigger.dev CLI (`trigger dev`, `trigger deploy`) expects the config at the project root. No aliasing or custom config path is used.

## Risks / Trade-offs

- **Cold worker startup** → Mitigation: Trigger.dev cloud manages worker keep-alive; local dev uses `trigger dev` CLI to run a persistent worker process alongside Next.js.
- **Env var leakage** → Mitigation: `TRIGGER_SECRET_KEY` is server-only; never import trigger client in client components.
- **Version lock** → Trigger.dev v3 API is stable but relatively new. Mitigation: pin the SDK version in `package.json`.
