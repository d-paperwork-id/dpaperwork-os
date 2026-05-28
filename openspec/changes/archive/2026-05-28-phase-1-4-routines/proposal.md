## Why

Phase 1's north star is a founder opening their laptop Monday morning to find a smart business summary in their inbox. Routines are the delivery mechanism: they schedule the Chief of Staff agent to run on a cron, produce output, and deposit it in the inbox. Without routines, the agent exists but never fires automatically.

## What Changes

- New `trigger/run-routine.ts` Trigger.dev task that fetches a routine from the DB, builds a Mastra `RuntimeContext` with workspace/user/routine context, and invokes the Chief of Staff agent
- New schedule registration helper that converts a local cron + timezone to UTC and registers/updates/deletes the Trigger.dev scheduled task
- New API routes: `GET/POST /api/routines`, `GET/PUT/DELETE /api/routines/[id]`, `GET /api/routines/[id]/runs`, `POST /api/routines/[id]/pause`, `POST /api/routines/[id]/resume`, `POST /api/routines/[id]/run-now`
- New pages: routine list (`/routines`), new routine form (`/routines/new`), routine detail + run history (`/routines/[id]`)
- Pause, resume, delete, and "Run Now" actions on the routine detail page

## Capabilities

### New Capabilities

- `routine-crud`: Create, list, read, update, and delete routines — DB writes, Trigger.dev schedule registration, API routes
- `routine-runner`: Trigger.dev task that executes a routine — fetches DB state, builds RuntimeContext, invokes the Mastra agent, writes `routine_runs` row on completion
- `routine-ui`: Routine list, new routine form, and routine detail pages with run history

### Modified Capabilities

## Impact

- New files: `trigger/run-routine.ts`, `app/api/routines/route.ts`, `app/api/routines/[id]/route.ts`, `app/api/routines/[id]/runs/route.ts`, `app/api/routines/[id]/pause/route.ts`, `app/api/routines/[id]/resume/route.ts`, `app/api/routines/[id]/run-now/route.ts`, `lib/routines/schedule.ts`, `app/(app)/routines/page.tsx`, `app/(app)/routines/new/page.tsx`, `app/(app)/routines/[id]/page.tsx`
- Depends on: `db/schema/routines.ts` (already exists), `mastra/agents/chief-of-staff.ts` (already built in 1.3), Trigger.dev SDK v4, `croner` or `cron-parser` for cron timezone conversion
- `db/schema/runs.ts` table will be written to by the runner (creates a `runs` row per execution)
