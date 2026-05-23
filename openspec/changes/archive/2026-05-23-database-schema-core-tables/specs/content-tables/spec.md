## ADDED Requirements

### Requirement: context_md table stores current workspace context
The system SHALL have a `context_md` table with `workspace_id` as primary key (FK → workspaces.id), `content` (text, default empty string), `current_version_id` (text, `ver_` prefix), `updated_by_user_id` (nullable FK), `created_at`, `updated_at`. One row per workspace.

#### Scenario: Workspace seed creates an empty context_md row
- **WHEN** a new workspace is created and seeded
- **THEN** a `context_md` row exists for that workspace with `content = ''`

#### Scenario: Updating context_md overwrites the current row
- **WHEN** a new save occurs
- **THEN** `content` and `current_version_id` are updated in place on the single row for that workspace

### Requirement: context_md_versions table stores full version history
The system SHALL have a `context_md_versions` table with `id` (PK, `ver_` prefix), `workspace_id` (FK), `content`, `created_by_user_id`, `created_at`. A composite index on `(workspace_id, created_at DESC)` supports version list queries.

#### Scenario: Each save appends a new version row
- **WHEN** context is saved
- **THEN** a new row is inserted in `context_md_versions` with the saved content

#### Scenario: Version history is queryable by workspace in reverse chronological order
- **WHEN** listing versions for a workspace
- **THEN** results are returned newest-first using the composite index

### Requirement: role_md table stores per-agent role content
The system SHALL have a `role_md` table with composite PK `(workspace_id, agent_id)`, `agent_id` as enum (`pm`, `chief-of-staff`, `executive-assistant`), `content`, `current_version_id`, `updated_by_user_id`, `created_at`, `updated_at`. One row per (workspace, agent).

#### Scenario: Workspace seed creates three role_md rows
- **WHEN** a workspace is seeded
- **THEN** three `role_md` rows exist — one for each agent — with default role content

### Requirement: role_md_versions table stores role history
The system SHALL have a `role_md_versions` table with `id` (PK), `workspace_id`, `agent_id`, `content`, `created_by_user_id`, `created_at`. A composite index on `(workspace_id, agent_id, created_at DESC)` exists.

#### Scenario: Role save appends a version row
- **WHEN** role_md is updated for a specific agent
- **THEN** a new row is inserted in `role_md_versions` with the previous content
