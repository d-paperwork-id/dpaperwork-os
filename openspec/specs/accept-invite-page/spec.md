## ADDED Requirements

### Requirement: Accept invite page is publicly accessible
The system SHALL serve `/invite/[token]` without requiring an active workspace session. The route SHALL be excluded from the workspace auth middleware guard so any visitor can access it.

#### Scenario: Unauthenticated user visits invite link
- **WHEN** a user who is not signed in visits `/invite/[token]`
- **THEN** the page SHALL display the workspace name and inviter name (fetched from `GET /api/invite/[token]`) and SHALL show two buttons: "Create account" and "Sign in"

#### Scenario: Invalid or expired token
- **WHEN** `GET /api/invite/[token]` returns 404
- **THEN** the page SHALL display "This invite link is invalid or has expired" and offer no accept action

#### Scenario: Revoked token
- **WHEN** the invite status is `revoked`
- **THEN** the page SHALL display "This invite has been revoked by the workspace admin"

### Requirement: New user is redirected to sign up then back to the accept page
When an unauthenticated user clicks "Create account", the system SHALL redirect them to `/sign-up` with a `callbackURL=/invite/[token]` query parameter so that after successful account creation they land back on the accept page.

#### Scenario: User clicks "Create account"
- **WHEN** an unauthenticated user on `/invite/[token]` clicks "Create account"
- **THEN** the browser SHALL navigate to `/sign-up?callbackURL=/invite/[token]`

#### Scenario: After sign-up, user is returned to invite page
- **WHEN** the user completes sign-up and Better Auth redirects using the callbackURL
- **THEN** the user SHALL arrive at `/invite/[token]` with an active session

### Requirement: Existing user logged out is redirected to sign in then back to the accept page
When an unauthenticated user clicks "Sign in", the system SHALL redirect them to `/sign-in` with `callbackURL=/invite/[token]`.

#### Scenario: User clicks "Sign in"
- **WHEN** an unauthenticated user on `/invite/[token]` clicks "Sign in"
- **THEN** the browser SHALL navigate to `/sign-in?callbackURL=/invite/[token]`

#### Scenario: After sign-in, user is returned to invite page
- **WHEN** the user signs in and Better Auth redirects using the callbackURL
- **THEN** the user SHALL arrive at `/invite/[token]` with an active session

### Requirement: Authenticated user sees the accept screen
When an authenticated user visits `/invite/[token]`, the page SHALL display the workspace name, inviter name, and an "Accept invite" button. No re-authentication is required.

#### Scenario: Logged-in user visits invite link
- **WHEN** an authenticated user visits `/invite/[token]` and the invite is valid and pending
- **THEN** the page SHALL display "You have been invited to join [Workspace Name] by [Inviter Name]" with an "Accept invite" primary button and a "Decline" secondary button

#### Scenario: Logged-in user clicks Accept
- **WHEN** the user clicks "Accept invite"
- **THEN** the page SHALL call `POST /api/invite/[token]/accept`; on success SHALL redirect the user to `/inbox` with a toast "Welcome to [Workspace Name]!"

#### Scenario: Logged-in user who is already a member visits the link
- **WHEN** `POST /api/invite/[token]/accept` returns `alreadyMember: true`
- **THEN** the page SHALL redirect the user to `/inbox` without showing an error

#### Scenario: Authenticated user clicks Decline
- **WHEN** the user clicks "Decline"
- **THEN** the invite SHALL NOT be accepted and the user SHALL be redirected to `/inbox` (their existing workspace)

### Requirement: Accept page shows loading and error states
The accept page SHALL handle loading (while fetching invite metadata) and error states gracefully.

#### Scenario: Invite metadata fetch is in progress
- **WHEN** the page is loading invite details from `GET /api/invite/[token]`
- **THEN** the page SHALL show a skeleton or spinner and SHALL NOT render accept/decline buttons

#### Scenario: Accept API call fails
- **WHEN** `POST /api/invite/[token]/accept` returns a non-2xx response
- **THEN** the page SHALL display the error message from the API response and allow the user to retry
