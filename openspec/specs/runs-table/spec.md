## ADDED Requirements

### Requirement: runs table persists agent execution state
The system SHALL have a `runs` table with `id` (PK, `run_` prefix), `workspace_id` (FK), `user_id` (FK), `thread_id` (nullable text — set for chat runs), `routine_id` (nullable text — set for routine runs), `request` (text), `plan` (jsonb, default `[]`), `step_results` (jsonb, default `{}`), `variables` (jsonb, default `{}`), `errors` (jsonb, default `[]`), `status` (enum: `planning`, `executing`, `synthesizing`, `complete`, `failed`), `tokens_used` (integer, default 0), `llm_calls` (integer, default 0), `tool_calls` (integer, default 0), `started_at`, `completed_at` (nullable). Indexes: `(workspace_id, started_at DESC)`, partial on `thread_id` WHERE NOT NULL, partial on `routine_id` WHERE NOT NULL, partial on `status` WHERE status NOT IN ('complete', 'failed').

#### Scenario: Run row is linked to either a thread or a routine, not both
- **WHEN** a run is created for a chat interaction
- **THEN** `thread_id` is set and `routine_id` is null

#### Scenario: Active runs are queryable via partial status index
- **WHEN** querying for runs in `planning`, `executing`, or `synthesizing` status
- **THEN** the partial index WHERE `status NOT IN ('complete', 'failed')` is used

#### Scenario: Run row stores execution plan as jsonb
- **WHEN** an orchestrator writes a plan with multiple steps
- **THEN** `plan` stores the full structured plan and `step_results` stores per-step outputs

#### Scenario: Hard delete after 90 days
- **WHEN** a retention sweep runs
- **THEN** runs older than 90 days are hard-deleted (not soft-deleted)
