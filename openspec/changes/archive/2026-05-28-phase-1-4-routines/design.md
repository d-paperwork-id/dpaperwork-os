## Context

Phase 1.3 delivered the Chief of Staff agent as a runnable Mastra `Agent`. The agent accepts a `RuntimeContext` carrying `workspace_id`, `user_id`, `agent_id`, `run_id`, and `routine_id`, which is how it scopes DB reads and writes. The `routines` and `routine_runs` schema tables are already in `db/schema/routines.ts`.

The current Trigger.dev setup (`trigger.config.ts`) uses SDK v4 (`@trigger.dev/sdk`), runtime `bun`, and watches the `./trigger/` directory. One placeholder task (`hello-world.ts`) exists.

Key constraints:
- All schedules are stored as **two cron strings**: `scheduleCronLocal` (workspace timezone, for display) and `scheduleCronUtc` (for registration with Trigger.dev). Both are set at create/edit time.
- Workspace timezone is in `workspaces.timezone` (e.g., `Asia/Kolkata`).
- Trigger.dev v4 uses `schedules.create` / `schedules.update` / `schedules.delete` from `@trigger.dev/sdk/v3` to manage CRON schedules externally (i.e., from an API route, not from within the task file itself).
- The `runs` table (from `db/schema/runs.ts`) must have a row inserted before the agent is invoked, and updated on completion — the `routine_runs` row references `runs.id`.

## Goals / Non-Goals

**Goals:**
- Create, pause, resume, delete routines with Trigger.dev schedule sync
- Trigger.dev task that runs a routine end-to-end and writes completion state to DB
- Routine list, new form, and detail + run history pages
- "Run Now" (manual trigger) from the detail page
- Show `pause_reason` inline alert when routine is paused by system or user

**Non-Goals:**
- Multiple output destinations (Phase 1 only: `{ kind: 'inbox' }`)
- Routine templates (Phase 2.5)
- OAuth-revoke-triggered auto-pause (Phase 3.4)
- Budget enforcement (Phase 2.8)
- Error inbox item on failure (Phase 2.8)
- Edit routine after creation (out of Phase 1 scope — create/delete only)

## Decisions

### D1: Cron timezone conversion — use `croner`

`croner` (`npm:croner`) parses and converts cron expressions with timezone support. Given a local cron like `"0 9 * * 1"` (Monday 9am) and timezone `"Asia/Kolkata"` (UTC+5:30), it produces the UTC-equivalent cron. This is stored in `scheduleCronUtc` at save time.

Alternative considered: `cron-converter`. Less actively maintained and has known DST edge cases. `croner` is more robust.

**How to convert**: Instantiate a `Cron` from croner with the local expression + timezone, get the next N fire times in UTC, then reverse-engineer the UTC cron pattern. In practice for weekly schedules (single day + single hour), the UTC hour = `(localHour * 60 - tzOffsetMinutes + 1440) % 1440 / 60` and the UTC day may shift if the offset crosses midnight.

Simpler approach for Phase 1 (weekly schedules only): the form captures `dayOfWeek` (0-6) + `timeHH:MM` + timezone. At save time, construct `"0 {HH} * * {DOW}"` in local timezone, convert to UTC using `date-fns-tz`'s `zonedTimeToUtc` to find the UTC time, then build the UTC cron string from the resulting UTC hour/day.

**Decision**: Use `date-fns-tz` (already likely present) for the timezone conversion math, and output two separate cron strings. No additional library needed.

### D2: Trigger.dev schedule management — call schedules API from API routes

Trigger.dev v4 exposes `schedules.create(...)`, `schedules.update(...)`, `schedules.delete(...)` on the `tasks` client. These are called from **API routes** (not from within the task itself) when a routine is created/paused/deleted.

```ts
import { schedules } from "@trigger.dev/sdk/v3";

// On routine create
const schedule = await schedules.create({
  task: "run-routine",
  cron: scheduleCronUtc,
  externalId: routineId,   // rtn_... — for deduplication
  deduplicationKey: routineId,
});
// Store schedule.id in routines.triggerDevTaskId
```

When paused: `schedules.deactivate(triggerDevTaskId)`.  
When resumed: `schedules.activate(triggerDevTaskId)`.  
When deleted: `schedules.delete(triggerDevTaskId)`.

### D3: RuntimeContext construction in the Trigger.dev task

The Trigger.dev task receives `{ routineId }` as payload. It:
1. Fetches the `routines` row + `workspaces` row to get `workspaceId`, `creatorUserId`, `agentId`, `instruction`
2. Creates a `runs` row (`run_...`) with status `'executing'`
3. Creates a `routine_runs` row (`rrn_...`) with status `'running'`, referencing the `run_id`
4. Constructs a `RuntimeContext` with `workspace_id`, `user_id` (= `creatorUserId`), `agent_id`, `run_id`, `routine_id`
5. Calls `chiefOfStaffAgent.generate(instruction, { runtimeContext })` — plain `generate`, not streaming
6. On success: updates `routine_runs` status to `'succeeded'`, `outputSummary`, `completedAt`, `tokensUsed`; updates `runs` status to `'complete'`
7. On error: updates both rows to failed state, writes `errorSummary`

### D4: API route auth pattern

Follow the existing pattern used in `app/api/domains/`: extract session via `better-auth`'s `auth.api.getSession`, resolve `workspaceId` from the session's active workspace, scope all queries by `workspaceId`.

### D5: Form schedule picker — day + time only (not full cron UI)

Phase 1 routines are weekly. The form shows:
- Day of week: `Select` with Monday–Sunday
- Time: `Input type="time"` (HH:MM, 24h)
- Timezone display: read-only label showing workspace timezone ("Schedules run in Asia/Kolkata")

The cron strings are derived from this at submit time. No raw cron input in Phase 1.

## Risks / Trade-offs

- **Trigger.dev schedule drift**: If the API call to register a schedule succeeds but the DB write fails (or vice versa), `triggerDevTaskId` can be out of sync. Mitigation: wrap in a try/catch; if schedule registration fails, roll back the DB insert and surface an error to the user. A reconciliation job (Phase 2.8) can catch orphaned schedules.
- **UTC cron day rollover**: If workspace is UTC+5:30 and a Monday 9am local becomes Sunday 3:30am UTC, the cron day shifts. The `date-fns-tz` conversion handles this correctly if implemented with actual UTC date math rather than simple hour subtraction.
- **Trigger.dev `externalId` uniqueness**: Using `routineId` as `externalId` prevents accidental duplicate schedules if create is called twice. Trigger.dev deduplicates on this key.

## Open Questions

- Does `date-fns-tz` need to be added to `package.json` or is it already a transitive dep? (Check before coding.)
- Trigger.dev v4 SDK method names — verify `schedules.create`, `schedules.deactivate`, `schedules.activate`, `schedules.delete` exist in `@trigger.dev/sdk/v3` before writing the schedule helper.
