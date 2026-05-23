## ADDED Requirements

### Requirement: tool_call_log table records every agent tool invocation
The system SHALL have a `tool_call_log` table with `id` (PK, `tcl_` prefix), `workspace_id`, `user_id`, `agent_id`, `run_id`, `step_id` (nullable), `tool` (text — e.g. `domain.read`, `gmail.send`), `args` (jsonb, default `{}`), `result` (jsonb, nullable), `is_error` (boolean, default false), `error_message` (nullable), `duration_ms` (nullable integer), `started_at`, `created_at`. Indexes on `(workspace_id, started_at DESC)`, `run_id`, and `(workspace_id, tool)` exist. Table is append-only.

#### Scenario: Tool call is logged with duration
- **WHEN** an agent tool call completes (success or error)
- **THEN** a row is inserted in `tool_call_log` with `is_error` set appropriately and `duration_ms` recorded

#### Scenario: Audit log is queryable by run
- **WHEN** viewing all tool calls for a specific run
- **THEN** the `run_id` index returns all rows for that run efficiently

### Requirement: agent_writes_log table records all data mutations made by agents
The system SHALL have an `agent_writes_log` table with `id` (PK, `awl_` prefix), `workspace_id`, `agent_id`, `run_id`, `target_type` (enum: `domain_record`, `inbox_item`, `context_md`, `role_md`, `memory`), `target_id`, `action` (enum: `insert`, `update`, `delete`), `before` (jsonb, nullable), `after` (jsonb, nullable), `created_at`. Indexes on `(workspace_id, created_at DESC)`, `(target_type, target_id)`, and `run_id` exist.

#### Scenario: Agent write is logged with before/after state
- **WHEN** an agent updates a domain record
- **THEN** a row is inserted in `agent_writes_log` with `target_type = 'domain_record'`, the record ID as `target_id`, and the previous and new field values in `before`/`after`

#### Scenario: Writes are traceable back to the run that caused them
- **WHEN** querying writes from a specific run
- **THEN** the `run_id` index returns all write events for that run

### Requirement: integration_action_log records external actions via Composio
The system SHALL have an `integration_action_log` table with `id` (PK), `workspace_id`, `user_id`, `agent_id`, `run_id`, `provider`, `action`, `args` (jsonb, nullable), `result_summary` (nullable text), `is_error` (boolean), `error_message` (nullable), `started_at`, `duration_ms` (nullable), `created_at`. Indexes on `(workspace_id, started_at DESC)` and `(workspace_id, provider)` exist.

#### Scenario: Integration action is logged per provider
- **WHEN** an agent sends an email via Gmail through Composio
- **THEN** a row with `provider = 'gmail'` and `action = 'send_email'` is inserted in `integration_action_log`

#### Scenario: All three audit tables are append-only
- **WHEN** any audit log row is written
- **THEN** it is never updated or soft-deleted; hard deletion only occurs on retention schedule (1 year minimum)
