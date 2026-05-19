## MODIFIED Requirements

### Requirement: User can register with email and password
The system SHALL provide a `/register` page where a new user can create an account using an email address and password. On successful registration the system SHALL redirect the user to `/verify-email` pending page; the user will be redirected to `/` after verifying their email address.

#### Scenario: Successful registration
- **WHEN** a user submits the registration form with a valid email and a password of at least 8 characters
- **THEN** the system creates a new user account and redirects to `/verify-email`

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
