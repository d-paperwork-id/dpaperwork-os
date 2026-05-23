## Requirements

### Requirement: Authenticated app layout renders a persistent sidebar
The system SHALL render a persistent left sidebar for all routes under `app/(app)/` that contains the primary navigation items: Chat, Inbox, Domains, Routines, Projects, Integrations, and Settings.

#### Scenario: Sidebar is present on all app routes
- **WHEN** an authenticated user with a workspace navigates to any app route (e.g. `/inbox`, `/chat`, `/settings/profile`)
- **THEN** the sidebar SHALL be visible and contain all seven primary navigation items

#### Scenario: Active route is highlighted in the sidebar
- **WHEN** the user is on `/inbox`
- **THEN** the Inbox nav item SHALL be visually highlighted and all other items SHALL NOT be highlighted

#### Scenario: Sidebar navigation item click routes to correct path
- **WHEN** the user clicks "Domains" in the sidebar
- **THEN** the browser SHALL navigate to `/domains` without a full page reload

### Requirement: App shell fetches and displays the workspace name
The system SHALL display the current workspace name in the sidebar header by fetching it from `GET /api/workspace/me`.

#### Scenario: Workspace name appears in sidebar after load
- **WHEN** the app shell mounts and `GET /api/workspace/me` returns a workspace
- **THEN** the workspace name SHALL appear in the sidebar header area

#### Scenario: Sidebar renders a loading skeleton while workspace is fetching
- **WHEN** `GET /api/workspace/me` is in-flight
- **THEN** the sidebar header SHALL show a skeleton placeholder instead of the workspace name

### Requirement: GET /api/workspace/me returns the current user's active workspace
The system SHALL expose a `GET /api/workspace/me` route that returns the active workspace for the authenticated user.

#### Scenario: Authenticated user with workspace calls the endpoint
- **WHEN** an authenticated user with an active workspace calls `GET /api/workspace/me`
- **THEN** the system SHALL return HTTP 200 with `{ id, name, slug }` of their workspace

#### Scenario: Authenticated user with no workspace calls the endpoint
- **WHEN** an authenticated user with no active workspace calls `GET /api/workspace/me`
- **THEN** the system SHALL return HTTP 404

#### Scenario: Unauthenticated request to the endpoint
- **WHEN** an unauthenticated request reaches `GET /api/workspace/me`
- **THEN** the system SHALL return HTTP 401

### Requirement: Inbox page exists as the post-onboarding landing point
The system SHALL render a page at `/inbox` that serves as the landing destination after workspace creation. At this stage it MAY be a placeholder with a welcome message.

#### Scenario: Authenticated user with workspace visits /inbox
- **WHEN** a user with an active workspace visits `/inbox`
- **THEN** the page SHALL render within the authenticated app shell (sidebar visible) and display at minimum a heading or welcome state
