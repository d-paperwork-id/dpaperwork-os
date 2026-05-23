## ADDED Requirements

### Requirement: workspace_agent_config table stores per-workspace agent settings
The system SHALL have a `workspace_agent_config` table with composite PK `(workspace_id, agent_id)`, `agent_id` as enum (`pm`, `chief-of-staff`, `executive-assistant`), `is_enabled` (boolean, default true), `allowed_tools` (jsonb, default `[]`), `allowed_integrations` (jsonb, default `[]`), `created_at`, `updated_at`.

#### Scenario: Workspace seed creates three agent config rows
- **WHEN** a workspace is seeded
- **THEN** three rows exist in `workspace_agent_config` — one per agent — with `is_enabled = true` and empty allowed lists

#### Scenario: Agent config is unique per (workspace, agent)
- **WHEN** a second insert for the same (workspace_id, agent_id) is attempted
- **THEN** it violates the composite PK and fails

### Requirement: user_agent_assignments table controls which agents a user can access
The system SHALL have a `user_agent_assignments` table with `id` (text PK), `workspace_id` (FK), `user_id` (FK), `agent_id` (enum), `assigned_by_user_id` (nullable FK), `created_at`. A partial unique index on `(workspace_id, user_id, agent_id)` prevents duplicate assignments. Indexes on `(workspace_id, user_id)` exist.

#### Scenario: Workspace seed assigns all three agents to the workspace creator
- **WHEN** a workspace is created
- **THEN** three `user_agent_assignments` rows exist for the creator, one per agent

#### Scenario: Duplicate assignment is rejected
- **WHEN** the same `(workspace_id, user_id, agent_id)` triple is inserted twice
- **THEN** the second insert violates the unique index and fails

#### Scenario: User's assigned agents are queryable efficiently
- **WHEN** listing agents for a user in a workspace
- **THEN** the query uses the `(workspace_id, user_id)` composite index
