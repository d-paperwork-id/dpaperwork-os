## ADDED Requirements

### Requirement: GET /api/workspace/memberships returns all workspaces for the current user
The system SHALL expose `GET /api/workspace/memberships` that returns all active workspaces the authenticated user is a member of, ordered by membership join date ascending. Each item SHALL include `id`, `name`, and `slug`.

#### Scenario: User belongs to one workspace
- **WHEN** an authenticated user GETs `/api/workspace/memberships`
- **THEN** the system SHALL return `{ workspaces: [{ id, name, slug }] }` with a single entry

#### Scenario: User belongs to multiple workspaces
- **WHEN** an authenticated user is a member of two or more workspaces
- **THEN** the system SHALL return all workspaces ordered by `joined_at asc`

#### Scenario: Unauthenticated request is rejected
- **WHEN** `GET /api/workspace/memberships` is called without a valid session
- **THEN** the system SHALL return HTTP 401

### Requirement: WorkspaceSwitcher component shows all workspaces in a dropdown
The `WorkspaceSwitcher` component in the sidebar SHALL fetch workspaces from `GET /api/workspace/memberships` and render them in a `DropdownMenu`. The currently active workspace SHALL be marked with a check icon. Clicking a different workspace SHALL switch to it.

#### Scenario: User with one workspace sees no switch options
- **WHEN** the memberships list contains only one workspace
- **THEN** the dropdown SHALL still open but SHALL show only the current workspace (no other options to switch to)

#### Scenario: User with multiple workspaces can switch
- **WHEN** the dropdown is open and the user clicks a different workspace
- **THEN** the active workspace SHALL switch to that workspace and the sidebar workspace name SHALL update

#### Scenario: Switcher shows loading state while memberships load
- **WHEN** the memberships query is in flight
- **THEN** the workspace button SHALL render a skeleton in place of the workspace name

### Requirement: Active workspace selection is persisted via a cookie
The system SHALL store the active workspace ID in a client-readable cookie named `active-workspace-id` (SameSite=Lax, path=/). All API routes that call `getWorkspaceForUser` SHALL read this cookie first and fall back to the first membership if the cookie is absent or invalid.

#### Scenario: User switches workspace
- **WHEN** the user selects a different workspace in the switcher
- **THEN** `active-workspace-id` cookie SHALL be set to the selected workspace's id, the page SHALL reload (or navigate to `/inbox`), and subsequent API calls SHALL scope to the new workspace

#### Scenario: Cookie references a workspace the user no longer belongs to
- **WHEN** `getWorkspaceForUser` reads the cookie and the user has no active membership for that workspace id
- **THEN** the function SHALL ignore the cookie and fall back to the first active membership

#### Scenario: Cookie is absent (first login)
- **WHEN** no `active-workspace-id` cookie exists
- **THEN** `getWorkspaceForUser` SHALL return the workspace with the earliest `joined_at` for the user

### Requirement: Members page shows pending invitations alongside active members
The Settings → Team → Members page SHALL display a "Pending invites" section below the active members list. Each pending invite row SHALL show the invited email, role name, and invite date. Each row SHALL have "Resend" and "Revoke" action buttons.

#### Scenario: No pending invites
- **WHEN** there are no pending invitations for the workspace
- **THEN** the "Pending invites" section SHALL be hidden (not shown as an empty state)

#### Scenario: Admin revokes a pending invite from the members page
- **WHEN** an admin clicks "Revoke" on a pending invite row
- **THEN** the page SHALL call `DELETE /api/settings/invitations/[id]`, remove the row from the list on success, and show a toast "Invite revoked"

#### Scenario: Admin resends a pending invite from the members page
- **WHEN** an admin clicks "Resend" on a pending invite row
- **THEN** the page SHALL call `POST /api/settings/invitations/[id]/resend` and show a toast "Invite resent"

#### Scenario: Invite modal sends an invite instead of directly adding a member
- **WHEN** an admin fills in email + role and clicks "Send invite"
- **THEN** the page SHALL call `POST /api/settings/invitations` (not `POST /api/settings/members`) and the invitee SHALL appear in the "Pending invites" section
