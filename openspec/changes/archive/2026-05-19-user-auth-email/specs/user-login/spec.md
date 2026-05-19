## ADDED Requirements

### Requirement: User can sign in with email and password
The system SHALL provide a `/login` page where a registered user can authenticate using their email address and password. On successful sign-in the system SHALL establish a session and redirect the user to `/`.

#### Scenario: Successful login
- **WHEN** a user submits the login form with a valid email and matching password
- **THEN** the system creates a session, sets the session cookie, and redirects to `/`

#### Scenario: Wrong password
- **WHEN** a user submits the login form with a valid email but incorrect password
- **THEN** the system SHALL display an inline error message stating the credentials are invalid and SHALL NOT create a session

#### Scenario: Unregistered email
- **WHEN** a user submits the login form with an email that does not exist in the system
- **THEN** the system SHALL display an inline error message stating the credentials are invalid (same message as wrong password, to avoid email enumeration)

#### Scenario: Already authenticated user visits login page
- **WHEN** a user who already has an active session navigates to `/login`
- **THEN** the system SHALL redirect them to `/` without showing the login form

### Requirement: Login form displays required fields
The login page SHALL render an email input, a password input, and a submit button. It SHALL also include a link to the registration page for users who do not yet have an account.

#### Scenario: Form renders correctly
- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the system SHALL display a form with an email field, a password field, a submit button, and a "Create account" link
