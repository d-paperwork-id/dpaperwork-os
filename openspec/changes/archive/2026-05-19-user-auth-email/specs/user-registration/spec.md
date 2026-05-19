## ADDED Requirements

### Requirement: User can register with email and password
The system SHALL provide a `/register` page where a new user can create an account using an email address and password. On successful registration the system SHALL redirect the user to the home page (`/`) as an authenticated session.

#### Scenario: Successful registration
- **WHEN** a user submits the registration form with a valid email and a password of at least 8 characters
- **THEN** the system creates a new user account, establishes a session, and redirects to `/`

#### Scenario: Duplicate email rejected
- **WHEN** a user submits the registration form with an email that already exists in the system
- **THEN** the system SHALL display an inline error message indicating the email is already in use and SHALL NOT create a duplicate account

#### Scenario: Invalid email format
- **WHEN** a user submits the registration form with a malformed email address
- **THEN** the system SHALL display a validation error before submission and SHALL NOT call the auth API

#### Scenario: Password too short
- **WHEN** a user submits the registration form with a password shorter than 8 characters
- **THEN** the system SHALL display a validation error before submission and SHALL NOT call the auth API

#### Scenario: Already authenticated user visits register page
- **WHEN** a user who already has an active session navigates to `/register`
- **THEN** the system SHALL redirect them to `/` without showing the registration form

### Requirement: Registration form displays required fields
The registration page SHALL render an email input, a password input, and a submit button. It SHALL also include a link to the login page for users who already have an account.

#### Scenario: Form renders correctly
- **WHEN** an unauthenticated user navigates to `/register`
- **THEN** the system SHALL display a form with an email field, a password field, a submit button, and a "Sign in" link
