## ADDED Requirements

### Requirement: routines table stores scheduled agent tasks
The system SHALL have a `routines` table with `id` (PK, `rtn_` prefix), `workspace_id` (FK), `creator_user_id` (FK), `name`, `description` (nullable), `agent_id` (enum), `instruction` (text), `schedule_cron_local` (display cron string), `schedule_cron_utc` (cron registered with Trigger.dev), `schedule_timezone` (captured at creation), `output_destination` (jsonb, typed as `RoutineOutputDestination`), `is_paused` (boolean, default false), `pause_reason` (nullable), `trigger_dev_task_id` (nullable), `created_at`, `updated_at`, `deleted_at`. Indexes on `(workspace_id, creator_user_id)` and partial index on `(workspace_id, is_paused)` WHERE `deleted_at IS NULL` exist.

#### Scenario: Both local and UTC cron strings are stored
- **WHEN** a routine is created with schedule "Monday 9am IST"
- **THEN** `schedule_cron_local = '0 9 * * MON'` and `schedule_cron_utc = '0 3:30 * * MON'` (or equivalent UTC) are both stored

#### Scenario: Paused routines are filterable without scanning deleted rows
- **WHEN** listing active (non-paused, non-deleted) routines for a workspace
- **THEN** the partial index on `(workspace_id, is_paused)` WHERE `deleted_at IS NULL` is used

#### Scenario: output_destination supports inbox kind
- **WHEN** a routine is inserted with `output_destination = { kind: 'inbox' }`
- **THEN** the jsonb is stored and retrievable without error

### Requirement: routine_runs table records each execution
The system SHALL have a `routine_runs` table with `id` (PK, `rrn_` prefix), `routine_id` (FK → routines.id), `workspace_id` (FK), `run_id` (text, references runs.id), `status` (enum: `running`, `succeeded`, `failed`, `paused`, `skipped`), `started_at`, `completed_at` (nullable), `error_summary` (nullable), `output_summary` (nullable), `tokens_used` (nullable integer), `created_at`. Composite indexes on `(routine_id, started_at DESC)` and `(workspace_id, started_at DESC)` exist. Rows are append-only; never updated after reaching a terminal status.

#### Scenario: Run history is queryable newest-first per routine
- **WHEN** listing runs for a specific routine
- **THEN** results are returned using the `(routine_id, started_at DESC)` index

#### Scenario: A completed run row is never updated
- **WHEN** a routine_run reaches `succeeded` or `failed` status
- **THEN** no further updates are made to that row
