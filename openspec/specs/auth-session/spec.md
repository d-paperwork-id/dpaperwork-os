## Requirements

### Requirement: Unauthenticated users are redirected to login
The system SHALL protect all application routes except `/login`, `/register`, `/verify-email`, and `/api/auth/*` from unauthenticated access. Any request without a valid session SHALL be redirected to `/login`.

#### Scenario: Unauthenticated access to protected route
- **WHEN** a user without an active session requests any route outside of `/login`, `/register`, `/verify-email`, or `/api/auth/*`
- **THEN** the system SHALL redirect to `/login` with a 302 response

#### Scenario: Authenticated access to protected route
- **WHEN** a user with a valid, verified session requests a protected route
- **THEN** the system SHALL allow the request to proceed normally

#### Scenario: API auth routes are always accessible
- **WHEN** any client (authenticated or not) makes a request to `/api/auth/*`
- **THEN** the system SHALL NOT redirect; the request SHALL reach the better-auth handler

### Requirement: Unverified sessions are restricted to the verification pending page
The system SHALL redirect users with a valid session but `emailVerified: false` to `/verify-email` when they attempt to access any route other than `/verify-email` or `/api/auth/*`.

#### Scenario: Unverified session on protected route
- **WHEN** a user with a valid session and `emailVerified: false` requests a route that is not `/verify-email` or `/api/auth/*`
- **THEN** the proxy SHALL redirect the request to `/verify-email`

#### Scenario: Verified session on verify-email page
- **WHEN** a user with a valid session and `emailVerified: true` navigates to `/verify-email`
- **THEN** the proxy SHALL redirect the request to `/`

### Requirement: Session is established via better-auth and persisted in the database
The system SHALL use better-auth with the Drizzle adapter to persist session records in the platform's Neon Postgres database. Sessions SHALL be validated on every protected request via the Next.js `proxy.ts` file (the Next.js 16 replacement for the deprecated `middleware.ts`).

#### Scenario: Valid session cookie on protected request
- **WHEN** a request arrives at a protected route with a valid better-auth session cookie
- **THEN** the proxy verifies the session against the database and allows the request to proceed

#### Scenario: Expired or tampered session cookie
- **WHEN** a request arrives with a session cookie that is expired or does not match a database record
- **THEN** the proxy SHALL redirect the request to `/login`

### Requirement: Auth client is available to client components
The system SHALL expose a `lib/auth-client.ts` singleton that wraps the better-auth client. Client components SHALL use this singleton to call sign-in, sign-up, and sign-out methods without importing the server-side auth config.

#### Scenario: Client component calls sign-out
- **WHEN** a client component calls `authClient.signOut()`
- **THEN** the session cookie is cleared and the user is redirected to `/login`
