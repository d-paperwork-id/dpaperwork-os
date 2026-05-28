## ADDED Requirements

### Requirement: List routines for workspace
The system SHALL return all non-deleted routines for the authenticated user's workspace, ordered by `created_at` descending.

#### Scenario: Fetch routines list
- **WHEN** `GET /api/routines` is called with a valid session
- **THEN** returns `{ routines: Routine[] }` scoped to the session's workspace, sorted newest first

#### Scenario: Empty workspace
- **WHEN** no routines exist for the workspace
- **THEN** returns `{ routines: [] }`

### Requirement: Create a routine
The system SHALL create a routine row in the DB, register a Trigger.dev cron schedule, and store the Trigger.dev schedule ID on the routine.

#### Scenario: Successful create
- **WHEN** `POST /api/routines` is called with `{ name, agentId, instruction, dayOfWeek, timeLocal, outputDestination }`
- **THEN** a `routines` row is inserted with `id = rtn_{nanoid(16)}`, `scheduleCronLocal`, `scheduleCronUtc` derived from `dayOfWeek + timeLocal + workspace.timezone`, `triggerDevTaskId` set from Trigger.dev response, `isPaused = false`
- **AND** returns `{ routine }` with HTTP 201

#### Scenario: Schedule registration fails
- **WHEN** Trigger.dev `schedules.create` throws
- **THEN** the DB insert is not committed, returns HTTP 500 with `{ error: "Failed to register schedule" }`

#### Scenario: Missing required fields
- **WHEN** `name`, `agentId`, `instruction`, `dayOfWeek`, or `timeLocal` is absent
- **THEN** returns HTTP 400 with `{ error: "..." }`

### Requirement: Get a single routine
The system SHALL return a routine row with its next run time.

#### Scenario: Fetch existing routine
- **WHEN** `GET /api/routines/[id]` is called and the routine belongs to the session's workspace
- **THEN** returns `{ routine }` with HTTP 200

#### Scenario: Routine not found or wrong workspace
- **WHEN** the routine ID does not exist or belongs to another workspace
- **THEN** returns HTTP 404

### Requirement: Pause a routine
The system SHALL set `isPaused = true` and deactivate the Trigger.dev schedule.

#### Scenario: Pause active routine
- **WHEN** `POST /api/routines/[id]/pause` is called
- **THEN** `routines.isPaused` is set to `true`, `pauseReason` to `"Paused by user"`, Trigger.dev schedule is deactivated, returns HTTP 200

### Requirement: Resume a routine
The system SHALL set `isPaused = false` and reactivate the Trigger.dev schedule.

#### Scenario: Resume paused routine
- **WHEN** `POST /api/routines/[id]/resume` is called
- **THEN** `routines.isPaused` is set to `false`, `pauseReason` is cleared, Trigger.dev schedule is activated, returns HTTP 200

### Requirement: Delete a routine
The system SHALL soft-delete the routine and delete the Trigger.dev schedule.

#### Scenario: Delete routine
- **WHEN** `DELETE /api/routines/[id]` is called
- **THEN** `routines.deletedAt` is set to now, Trigger.dev schedule is deleted, returns HTTP 200

### Requirement: Trigger manual run
The system SHALL trigger an immediate Trigger.dev task invocation for a routine.

#### Scenario: Run now
- **WHEN** `POST /api/routines/[id]/run-now` is called
- **THEN** `tasks.trigger("run-routine", { routineId: id })` is called, returns HTTP 200 with `{ triggered: true }`

### Requirement: List run history for a routine
The system SHALL return `routine_runs` rows for a routine, ordered by `started_at` descending.

#### Scenario: Fetch run history
- **WHEN** `GET /api/routines/[id]/runs` is called
- **THEN** returns `{ runs: RoutineRun[] }` for the routine, newest first, limit 50
