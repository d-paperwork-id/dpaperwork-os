## ADDED Requirements

### Requirement: Workspaces table exists with full column set
The system SHALL have a `workspaces` table with columns: `id` (text PK, `ws_` prefix), `name`, `slug` (unique among non-deleted, partial unique index), `timezone` (default `Asia/Kolkata`), `plan_tier` (enum: `design_partner`, `standard`; default `design_partner`), `daily_budget_tokens` (integer, default 200000), `working_hours_start`, `working_hours_end`, `language`, `branding_logo_s3_key`, `branding_primary_color`, `default_agent_id` (nullable enum), `created_at`, `updated_at`, `deleted_at`.

#### Scenario: Workspace row can be inserted with only required fields
- **WHEN** an insert provides `id`, `name`, and `slug`
- **THEN** the row is written with `timezone = 'Asia/Kolkata'`, `plan_tier = 'design_partner'`, `daily_budget_tokens = 200000`, and `deleted_at = NULL`

#### Scenario: Slug uniqueness is enforced among non-deleted workspaces
- **WHEN** two active workspaces attempt the same slug
- **THEN** the second insert violates the partial unique index and fails

#### Scenario: Soft-deleted workspace slug can be reused
- **WHEN** a workspace with slug `foo` has `deleted_at` set
- **THEN** a new workspace with slug `foo` can be inserted successfully

### Requirement: Workspace members table exists
The system SHALL have a `workspace_members` table with columns: `id` (text PK, `mem_` prefix), `workspace_id` (FK → workspaces.id), `user_id` (FK → user.id), `role` (enum: `admin`, `member`; default `member`), `invited_by_user_id` (nullable FK → user.id), `joined_at`, `created_at`, `updated_at`, `deleted_at`. A partial unique index on `(workspace_id, user_id)` WHERE `deleted_at IS NULL` prevents duplicate active memberships.

#### Scenario: Member row can be inserted for a workspace
- **WHEN** a valid `workspace_id` and `user_id` are provided
- **THEN** the row is inserted with `role = 'member'` and `deleted_at = NULL`

#### Scenario: Duplicate active membership is rejected
- **WHEN** the same `(workspace_id, user_id)` pair already has an active membership row
- **THEN** a second insert violates the partial unique index and fails

#### Scenario: Indexes on workspace_id and user_id exist
- **WHEN** querying members by `workspace_id` or `user_id`
- **THEN** the query uses the respective index without a full table scan
