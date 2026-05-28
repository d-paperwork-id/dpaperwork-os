## 1. Schedule helper + dependencies

- [x] 1.1 Verify `date-fns-tz` is available (`grep date-fns-tz package.json`); add it if missing (`bun add date-fns-tz`)
- [x] 1.2 Verify Trigger.dev v4 `schedules` API methods by checking `node_modules/@trigger.dev/sdk/v3/dist/index.d.ts` for `schedules.create`, `schedules.deactivate`, `schedules.activate`, `schedules.delete`
- [x] 1.3 Create `lib/routines/schedule.ts` — exports `buildCronStrings({ dayOfWeek, timeLocal, timezone })` returning `{ scheduleCronLocal, scheduleCronUtc }` using `date-fns-tz` for UTC conversion
- [x] 1.4 Create `lib/routines/trigger.ts` — exports `registerSchedule(routineId, scheduleCronUtc)`, `deactivateSchedule(triggerDevTaskId)`, `activateSchedule(triggerDevTaskId)`, `deleteSchedule(triggerDevTaskId)`, `triggerRunNow(routineId)` wrapping Trigger.dev SDK calls

## 2. Trigger.dev task

- [x] 2.1 Create `trigger/run-routine.ts` — task `id: "run-routine"` with `retry: { maxAttempts: 1 }` (no retries per design)
- [x] 2.2 In task: fetch `routines` + `workspaces` rows by `routineId`; return early if not found or `isPaused`
- [x] 2.3 In task: insert `runs` row (`run_{nanoid(16)}`, status `'executing'`) and `routine_runs` row (`rrn_{nanoid(16)}`, status `'running'`)
- [x] 2.4 In task: build `RuntimeContext` with `workspace_id`, `user_id`, `agent_id`, `run_id`, `routine_id` and call `chiefOfStaffAgent.generate(routine.instruction, { runtimeContext })`
- [x] 2.5 In task: on success, update `routine_runs` to `succeeded` + set `completedAt`, `outputSummary` (first 500 chars of response text), `tokensUsed`; update `runs` to `complete`
- [x] 2.6 In task: catch errors, update both rows to `failed` + `errorSummary`, do NOT rethrow

## 3. API routes

- [x] 3.1 Create `app/api/routines/route.ts` — `GET` returns workspace routines; `POST` validates body (Zod), calls `buildCronStrings`, inserts routine, calls `registerSchedule`, returns 201
- [x] 3.2 Create `app/api/routines/[id]/route.ts` — `GET` returns single routine (404 if not found/wrong workspace); `DELETE` soft-deletes + calls `deleteSchedule`
- [x] 3.3 Create `app/api/routines/[id]/runs/route.ts` — `GET` returns `routine_runs` for the routine, limit 50, ordered `started_at desc`
- [x] 3.4 Create `app/api/routines/[id]/pause/route.ts` — `POST` sets `isPaused=true`, `pauseReason="Paused by user"`, calls `deactivateSchedule`
- [x] 3.5 Create `app/api/routines/[id]/resume/route.ts` — `POST` sets `isPaused=false`, clears `pauseReason`, calls `activateSchedule`
- [x] 3.6 Create `app/api/routines/[id]/run-now/route.ts` — `POST` calls `triggerRunNow(routineId)`, returns `{ triggered: true }`

## 4. Routine list page

- [x] 4.1 Create `app/(app)/routines/page.tsx` — client component, `useQuery` for `GET /api/routines`
- [x] 4.2 Render `PageHeader` with title "Routines" and "New Routine" `Button variant="outline" size="sm"` linking to `/routines/new`
- [x] 4.3 Render each routine as an `Item` with: name (`ItemTitle`), schedule summary + agent badge (`ItemDescription`), status badge and relative time (right side); clicking navigates to `/routines/[id]`
- [x] 4.4 Render `Empty` component when `routines.length === 0` — title "No routines yet", description, "New Routine" CTA
- [x] 4.5 Show `Spinner` while loading, inline `Alert` on error

## 5. New routine form

- [x] 5.1 Create `app/(app)/routines/new/page.tsx` — client component with `react-hook-form` + Zod validation
- [x] 5.2 Add fields: Name (`Label`+`Input`), Agent (`Label`+`Select` showing "Chief of Staff" only), Instruction (`Label`+`Textarea` with `font-mono text-sm`, min-height 160px)
- [x] 5.3 Add schedule section: Day of week (`Label`+`Select`, Mon–Sun values 1–7), Time (`Label`+`Input type="time"`), read-only timezone label (`text-xs text-muted-foreground "Schedules run in {workspace.timezone}"`)
- [x] 5.4 Add Output section: read-only label "Inbox" (non-interactive in Phase 1)
- [x] 5.5 On submit: `POST /api/routines`, show `Spinner` on button during mutation, navigate to `/routines/[id]` on success with success toast
- [x] 5.6 Fetch workspace timezone from `GET /api/workspace` to show in timezone label and send in POST body

## 6. Routine detail + run history page

- [x] 6.1 Create `app/(app)/routines/[id]/page.tsx` — client component, `useQuery` for routine + runs
- [x] 6.2 Render `PageHeader` with routine name; action buttons: "Run Now" (`Button variant="outline" size="sm"`), pause/resume toggle, delete (icon button + `AlertDialog`)
- [x] 6.3 Render detail card: agent badge, schedule string (e.g., "Every Monday at 9:00 AM IST"), instruction text in `font-mono text-sm bg-muted rounded p-3`
- [x] 6.4 If `routine.isPaused` and `routine.pauseReason`, render inline `Alert` with pause reason
- [x] 6.5 Render run history section: heading "Run History", map `routine_runs` as `Item` rows (timestamp, status badge, summary); show "This routine hasn't run yet." when empty
- [x] 6.6 Wire pause/resume: call respective API routes via `useMutation`, invalidate routine query on success
- [x] 6.7 Wire "Run Now": call `POST /api/routines/[id]/run-now`, show toast "Run triggered", invalidate runs query after 3s
- [x] 6.8 Wire delete: `AlertDialog` with "Delete routine '[name]'?", call `DELETE /api/routines/[id]`, navigate to `/routines` on success

## 7. Verification

- [x] 7.1 Run `npm run build` — no TypeScript errors
- [x] 7.2 Manual test: create a routine via the form, confirm DB row + Trigger.dev schedule appear
- [x] 7.3 Manual test: trigger "Run Now", confirm `routine_runs` row created and inbox item appears
- [x] 7.4 Manual test: pause, resume, delete — verify Trigger.dev schedule state matches
