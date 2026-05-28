## ADDED Requirements

### Requirement: Trigger.dev task executes a routine
The system SHALL have a Trigger.dev task `"run-routine"` that accepts `{ routineId: string }`, fetches the routine from DB, invokes the Chief of Staff agent, and writes completion state.

#### Scenario: Successful run
- **WHEN** the task fires with a valid `routineId`
- **THEN** a `runs` row is inserted with status `'executing'`
- **AND** a `routine_runs` row is inserted with status `'running'` referencing that `run_id`
- **AND** `chiefOfStaffAgent.generate(instruction, { runtimeContext })` is called with `workspace_id`, `user_id`, `agent_id`, `run_id`, `routine_id` set in `runtimeContext`
- **AND** on completion, `routine_runs.status` is set to `'succeeded'`, `completedAt` and `outputSummary` are written
- **AND** `runs.status` is set to `'complete'`

#### Scenario: Agent throws an error
- **WHEN** `agent.generate` throws
- **THEN** `routine_runs.status` is set to `'failed'`, `errorSummary` contains the error message
- **AND** `runs.status` is set to `'failed'`
- **AND** the Trigger.dev task does NOT rethrow (so it does not retry and spam; retries are disabled for this task)

#### Scenario: Routine not found
- **WHEN** the `routineId` does not exist in DB
- **THEN** the task logs a warning and exits cleanly without inserting any rows

#### Scenario: Routine is paused
- **WHEN** the routine's `isPaused = true` at task execution time
- **THEN** the task inserts a `routine_runs` row with status `'skipped'` and exits without invoking the agent

### Requirement: RuntimeContext carries all required keys
The Trigger.dev task SHALL populate the Mastra `RuntimeContext` with the keys expected by the agent and its tools.

#### Scenario: Context keys present
- **WHEN** the agent is invoked
- **THEN** `runtimeContext.get("workspace_id")` returns the routine's `workspaceId`
- **AND** `runtimeContext.get("user_id")` returns the routine's `creatorUserId`
- **AND** `runtimeContext.get("agent_id")` returns `"chief-of-staff"`
- **AND** `runtimeContext.get("run_id")` returns the newly created `run_id`
- **AND** `runtimeContext.get("routine_id")` returns the `routineId`
