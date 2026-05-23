## Requirements

### Requirement: proxy.ts gates app routes using optimistic cookie checks
The system SHALL implement a `proxy.ts` file at the repo root that reads session and workspace state from cookies only (no DB queries) and redirects users to the correct route based on their state.

#### Scenario: Unauthenticated user accesses an app route
- **WHEN** a request with no valid session cookie reaches any route matched by the proxy (e.g. `/inbox`, `/chat`)
- **THEN** the proxy SHALL redirect the user to `/login`

#### Scenario: Authenticated user with no workspace cookie accesses an app route
- **WHEN** a request has a valid session cookie but no `has_workspace` cookie set
- **THEN** the proxy SHALL redirect the user to `/onboarding`

#### Scenario: Authenticated user with workspace accesses an app route
- **WHEN** a request has both a valid session cookie and a `has_workspace` cookie
- **THEN** the proxy SHALL allow the request to proceed without redirecting

#### Scenario: Unauthenticated user accesses an auth route
- **WHEN** a request with no session reaches `/login`, `/register`, or `/verify-email`
- **THEN** the proxy SHALL allow the request to proceed

#### Scenario: Authenticated user with workspace accesses an onboarding route
- **WHEN** a request has a valid session cookie and a `has_workspace` cookie and targets `/onboarding`
- **THEN** the proxy SHALL redirect the user to `/inbox`

#### Scenario: Proxy does not run on API routes or Next.js internals
- **WHEN** a request targets `/api/*`, `/_next/static/*`, or `/_next/image/*`
- **THEN** the proxy matcher SHALL exclude it and the proxy function SHALL NOT run

### Requirement: POST /api/workspace sets a has_workspace cookie on success
The system SHALL set a `has_workspace=1` cookie (httpOnly, sameSite lax, path /) when a workspace is successfully created, so the proxy can perform optimistic workspace checks without a DB query.

#### Scenario: Workspace created — cookie is set in the response
- **WHEN** `POST /api/workspace` succeeds and returns HTTP 201
- **THEN** the response SHALL include a `Set-Cookie` header setting `has_workspace=1`

### Requirement: Root path redirects based on cookie state
The system SHALL redirect users landing on `/` based on cookie state: session + has_workspace → `/inbox`, session only → `/onboarding`, no session → `/login`.

#### Scenario: Authenticated user with workspace visits root
- **WHEN** a user with both a session cookie and `has_workspace` cookie visits `/`
- **THEN** the proxy SHALL redirect them to `/inbox`

#### Scenario: Unauthenticated user visits root
- **WHEN** a user with no session cookie visits `/`
- **THEN** the proxy SHALL redirect them to `/login`
