## ADDED Requirements

### Requirement: Admin can send a workspace invite by email
The system SHALL allow an authenticated admin (user with `can_manage_settings` permission) to invite a person by email address. Sending the invite SHALL create a `workspace_invitations` row and send a transactional email to the invitee via Resend containing the accept link. The accept link SHALL be `https://<app-host>/invite/<token>`.

#### Scenario: Admin invites a new email address
- **WHEN** an admin POSTs `{ email, roleId }` to `POST /api/settings/invitations`
- **THEN** the system SHALL insert a `workspace_invitations` row with `status = 'pending'`, a unique 32-char nanoid token, and `expires_at = now() + 7 days`; SHALL send an invite email to the provided address; and SHALL return HTTP 201 with `{ id, email, status, expiresAt }`

#### Scenario: Invite to an already-active member is rejected
- **WHEN** an admin attempts to invite an email address that already has an active `workspace_members` row for the same workspace
- **THEN** the system SHALL return HTTP 409 with `{ error: "This person is already a member" }` and SHALL NOT create an invite row

#### Scenario: Invite to an already-pending email is rejected
- **WHEN** an admin attempts to invite an email address that already has a `pending` invite for the same workspace
- **THEN** the system SHALL return HTTP 409 with `{ error: "An invite is already pending for this email" }` and SHALL NOT create a second invite row

#### Scenario: Unauthenticated or non-admin invite request is rejected
- **WHEN** the request has no valid session, or the session user does not have `can_manage_settings` on the workspace
- **THEN** the system SHALL return HTTP 401 or 403 respectively and SHALL NOT create an invite row

### Requirement: Admin can list pending invitations
The system SHALL expose `GET /api/settings/invitations` that returns all non-expired, non-accepted invitations for the workspace. Each item SHALL include `id`, `email`, `roleId`, `roleName`, `status`, `invitedByUserName`, `createdAt`, `expiresAt`.

#### Scenario: Active workspace with pending invites
- **WHEN** an admin GETs `/api/settings/invitations`
- **THEN** the system SHALL return an array of pending invite objects for that workspace, sorted by `created_at desc`

#### Scenario: Expired invitations are excluded
- **WHEN** an invite's `expires_at` is in the past
- **THEN** the invite SHALL NOT appear in the listing (filter: `status = 'pending' AND expires_at > now()`)

### Requirement: Admin can resend an invite
The system SHALL allow an admin to resend the invite email for a pending invite via `POST /api/settings/invitations/[id]/resend`. This SHALL re-send the email with the same token (not a new one) and reset `expires_at` to `now() + 7 days`.

#### Scenario: Resend an existing pending invite
- **WHEN** an admin POSTs to `/api/settings/invitations/[id]/resend`
- **THEN** the system SHALL update `expires_at` on the invite row, re-send the email, and return HTTP 200

#### Scenario: Resend for an accepted invite is rejected
- **WHEN** an admin attempts to resend an invite that has `status = 'accepted'`
- **THEN** the system SHALL return HTTP 409 with `{ error: "Invite already accepted" }`

### Requirement: Admin can revoke an invite
The system SHALL allow an admin to revoke a pending invite via `DELETE /api/settings/invitations/[id]`. Revoking sets `status = 'revoked'`. Visiting the invite link after revocation SHALL show an error page.

#### Scenario: Admin revokes a pending invite
- **WHEN** an admin DELETEs `/api/settings/invitations/[id]`
- **THEN** the system SHALL set `status = 'revoked'` on the invite row and return HTTP 200

#### Scenario: Revoked token cannot be accepted
- **WHEN** a user visits `/invite/[token]` where the invite has `status = 'revoked'`
- **THEN** the page SHALL display "This invite has been revoked" and SHALL NOT allow acceptance

### Requirement: Invite is accepted and workspace_members row is created
The system SHALL expose `POST /api/invite/[token]/accept`. When called with a valid session and a valid pending token, the system SHALL insert a `workspace_members` row and mark the invite as accepted. This endpoint is the single point of acceptance — the accept page calls it.

#### Scenario: Authenticated user accepts a valid invite
- **WHEN** an authenticated user POSTs to `/api/invite/[token]/accept`
- **THEN** the system SHALL verify the token is `pending` and not expired; insert a `workspace_members` row with `userId = session.user.id`, `roleId = invite.roleId`, `invitedByUserId = invite.invitedByUserId`; set invite `status = 'accepted'`; and return HTTP 201 with `{ workspaceId, workspaceName, workspaceSlug }`

#### Scenario: Accepting an expired token returns an error
- **WHEN** a user POSTs to `/api/invite/[token]/accept` and the invite's `expires_at` is in the past
- **THEN** the system SHALL return HTTP 410 with `{ error: "Invite has expired" }` and SHALL NOT insert a membership row

#### Scenario: Accepting when already a member returns a graceful response
- **WHEN** a user POSTs to accept but already has an active `workspace_members` row for that workspace
- **THEN** the system SHALL return HTTP 200 with `{ workspaceId, workspaceName, workspaceSlug, alreadyMember: true }` without creating a duplicate row

#### Scenario: Unauthenticated accept is rejected
- **WHEN** `POST /api/invite/[token]/accept` is called without a valid session
- **THEN** the system SHALL return HTTP 401

### Requirement: GET /api/invite/[token] returns invite metadata for unauthenticated users
The system SHALL expose `GET /api/invite/[token]` as a public endpoint (no auth required) that returns the invite's workspace name, inviter name, and status. This allows the accept page to display workspace context before the user authenticates.

#### Scenario: Valid pending token
- **WHEN** `GET /api/invite/[token]` is called for a pending, non-expired invite
- **THEN** the system SHALL return HTTP 200 with `{ workspaceName, inviterName, email, status: 'pending' }`

#### Scenario: Invalid or expired token
- **WHEN** `GET /api/invite/[token]` is called for a token that does not exist or is expired/revoked
- **THEN** the system SHALL return HTTP 404 with `{ error: "Invite not found or expired" }`

### Requirement: Invite email is rendered using a React Email template
The system SHALL use a React Email component at `emails/workspace-invite.tsx` to generate the HTML body of the invite email. The template SHALL receive typed props: `workspaceName` (string), `inviterName` (string), and `acceptUrl` (string). The API route SHALL call `render(<WorkspaceInviteEmail ... />)` to produce the HTML string before passing it to Resend.

#### Scenario: Invite email contains workspace name and accept link
- **WHEN** the invite email is sent
- **THEN** the rendered HTML SHALL include the workspace name, the inviter's name, and a button or link pointing to `acceptUrl`

#### Scenario: Template is renderable without throwing
- **WHEN** `render(<WorkspaceInviteEmail workspaceName="Acme" inviterName="Sam" acceptUrl="https://app.dpaperwork.com/invite/abc" />)` is called
- **THEN** it SHALL return a non-empty HTML string without throwing an error
