## ADDED Requirements

### Requirement: workspace_invitations table exists
The system SHALL have a `workspace_invitations` table with the following columns: `id` (text PK, `inv_` prefix), `workspace_id` (FK → workspaces.id, not null), `email` (text, not null), `role_id` (FK → workspace_roles.id, nullable), `token` (text, not null, unique), `invited_by_user_id` (FK → user.id, nullable), `status` (text enum: `pending`, `accepted`, `revoked`, `expired`; not null; default `pending`), `expires_at` (timestamptz, not null), `created_at` (timestamptz, not null, default now()), `updated_at` (timestamptz, not null, default now(), $onUpdate).

Indexes: `(workspace_id, status)` composite index; unique index on `token`; index on `email`.

#### Scenario: Invite row can be inserted with required fields
- **WHEN** an insert provides `id`, `workspace_id`, `email`, `token`, and `expires_at`
- **THEN** the row is written with `status = 'pending'` and `role_id = NULL`

#### Scenario: Token uniqueness is enforced
- **WHEN** two invite rows attempt to use the same token value
- **THEN** the second insert SHALL fail with a unique constraint violation

#### Scenario: workspace_id and status index exists
- **WHEN** querying invitations by `workspace_id` and `status = 'pending'`
- **THEN** the query SHALL use the composite index without a full table scan
