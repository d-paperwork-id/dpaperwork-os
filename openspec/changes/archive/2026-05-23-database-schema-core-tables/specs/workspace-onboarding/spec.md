## MODIFIED Requirements

### Requirement: Onboarding form collects business details
The system SHALL present a form at `/onboarding` that collects the following fields: business name (required), industry (required), website (optional), and a short description of the business (required). The form SHALL validate all required fields before allowing submission.

#### Scenario: User submits valid form
- **WHEN** a verified user submits the onboarding form with all required fields filled in
- **THEN** the system SHALL create a workspace record via `POST /api/workspace` and redirect the user to `/dashboard`

#### Scenario: User omits a required field
- **WHEN** a verified user submits the form with one or more required fields empty
- **THEN** the system SHALL display inline validation errors and SHALL NOT submit the form

#### Scenario: Website field is left blank
- **WHEN** a verified user submits the form without a website URL
- **THEN** the system SHALL accept the submission and store `null` for the website field

#### Scenario: Duplicate workspace creation attempt
- **WHEN** a user who already has a workspace navigates to `/onboarding` and submits the form again
- **THEN** the API SHALL return a 409 conflict response and the page SHALL display an error message; no duplicate workspace SHALL be created

### Requirement: Workspace record is persisted using the new workspaces + workspace_members tables
The system SHALL store workspace data in the `workspaces` table and a corresponding `workspace_members` row in the same transaction. The previous single-table `workspace` model (with `userId` on the workspace row) is replaced by this normalized structure. Each user SHALL have at most one workspace as admin (enforced via the workspace_members partial unique index).

#### Scenario: Workspace and member rows are created atomically
- **WHEN** `POST /api/workspace` receives valid data from an authenticated user with no existing workspace
- **THEN** the system SHALL insert a row into `workspaces` (with `id = ws_...`, `name`, `slug` derived from name, `timezone` from form or default `Asia/Kolkata`) AND a row into `workspace_members` (with `user_id`, `workspace_id`, `role = 'admin'`) in a single transaction, and SHALL return HTTP 201

#### Scenario: Workspace creation calls seedWorkspace in the same transaction
- **WHEN** workspace and member rows are successfully created
- **THEN** `seedWorkspace(db, workspaceId, userId)` is called within the same transaction, creating default domains, agent configs, context_md, and role_md rows

#### Scenario: Unauthenticated request to workspace API
- **WHEN** `POST /api/workspace` is called without a valid session
- **THEN** the system SHALL return HTTP 401

### Requirement: Verified users without a workspace are gated to onboarding
The system SHALL redirect a verified, authenticated user who has no workspace to `/onboarding` when they attempt to access `/dashboard`.

#### Scenario: Verified user with no workspace accesses dashboard
- **WHEN** a verified user with no `workspace_members` row navigates to `/dashboard`
- **THEN** middleware SHALL redirect them to `/onboarding`

#### Scenario: Verified user with workspace accesses onboarding
- **WHEN** a verified user who already has an active `workspace_members` row navigates to `/onboarding`
- **THEN** middleware SHALL redirect them to `/dashboard`
