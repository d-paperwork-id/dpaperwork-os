## ADDED Requirements

### Requirement: System roles seeded on workspace creation
The system SHALL seed three system roles — Admin, Member, and Viewer — into `workspace_roles` as part of the workspace creation transaction. System roles SHALL have `is_system = true` and cannot be renamed, edited, or deleted.

#### Scenario: Workspace creation seeds roles
- **WHEN** a new workspace is created
- **THEN** three rows are inserted into `workspace_roles` with names Admin, Member, Viewer and `is_system = true`

#### Scenario: System role cannot be deleted
- **WHEN** an admin calls `DELETE /api/settings/roles/[id]` for a system role
- **THEN** the API returns 403 with message "System roles cannot be deleted"

#### Scenario: Workspace creator assigned Admin role
- **WHEN** a new workspace is created
- **THEN** the creator's `workspace_members` row has `role_id` pointing to the seeded Admin role

### Requirement: Role permission flags
Each role SHALL carry three boolean access flags: `can_manage_settings`, `can_write_data`, `can_view_data`. System role defaults are: Admin (all true), Member (can_write_data + can_view_data), Viewer (can_view_data only).

#### Scenario: Admin flag values
- **WHEN** the Admin role is read from `workspace_roles`
- **THEN** `can_manage_settings = true`, `can_write_data = true`, `can_view_data = true`

#### Scenario: Member flag values
- **WHEN** the Member role is read from `workspace_roles`
- **THEN** `can_manage_settings = false`, `can_write_data = true`, `can_view_data = true`

#### Scenario: Viewer flag values
- **WHEN** the Viewer role is read from `workspace_roles`
- **THEN** `can_manage_settings = false`, `can_write_data = false`, `can_view_data = true`

### Requirement: Settings mutation routes require Admin role
All settings mutation API routes SHALL verify the requesting user's role has `can_manage_settings = true`. If not, the API SHALL return 403.

#### Scenario: Non-admin blocked from settings mutation
- **WHEN** a Member or Viewer calls a settings mutation route (e.g., `PATCH /api/settings/workspace/general`)
- **THEN** the API returns 403 with message "Insufficient permissions"

#### Scenario: Admin succeeds on settings mutation
- **WHEN** an Admin calls a settings mutation route
- **THEN** the route proceeds normally

### Requirement: Roles list API
The system SHALL expose `GET /api/settings/roles` returning all `workspace_roles` for the current workspace, ordered by `position` ascending. Each role item SHALL include: id, name, description, `is_system`, permission flags, and member count.

#### Scenario: List roles
- **WHEN** any authenticated workspace member calls `GET /api/settings/roles`
- **THEN** the response includes all three system roles with correct permission flags and the count of members assigned to each

### Requirement: Member role assignment
The system SHALL allow admins to change a member's role by calling `PATCH /api/settings/members/[memberId]` with a `roleId` field. The last admin in a workspace cannot be demoted.

#### Scenario: Admin changes member role
- **WHEN** an admin submits a role change for a member to Viewer
- **THEN** `workspace_members.role_id` is updated and the member immediately has Viewer permissions on next request

#### Scenario: Last admin cannot be demoted
- **WHEN** an admin attempts to change the last remaining admin's role to Member or Viewer
- **THEN** the API returns 409 with message "Workspace must have at least one admin"

### Requirement: Role selector in member management
The member management sheet (invite and edit flows) SHALL include a Role selector (`Select` component) listing all workspace roles. Defaults to Member for new invites.

#### Scenario: Invite with role selection
- **WHEN** an admin opens the invite modal and selects Viewer before sending the invite
- **THEN** the invited user joins with the Viewer role

#### Scenario: Role selector defaults to Member
- **WHEN** an admin opens the invite modal without changing the role
- **THEN** the role defaults to Member
