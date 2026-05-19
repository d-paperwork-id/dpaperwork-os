## ADDED Requirements

### Requirement: Verification email is sent on registration
The system SHALL send a verification email to the user's address immediately after account creation. The email SHALL contain a single-use verification link that expires after 24 hours.

#### Scenario: Email sent after successful sign-up
- **WHEN** a new user successfully submits the registration form
- **THEN** the system SHALL dispatch a verification email to the registered address via Resend before the registration response completes

#### Scenario: Verification email contains a valid link
- **WHEN** the user receives the verification email
- **THEN** the email SHALL contain a button or link that navigates to the better-auth verification callback URL

#### Scenario: Resend delivery failure
- **WHEN** the Resend API call throws an error during `sendVerificationEmail`
- **THEN** the error SHALL be logged server-side and registration SHALL still succeed (user account is created); the user MAY request a new verification email in a follow-up flow

### Requirement: User can verify their email address
The system SHALL allow a user to verify their email by clicking the link in the verification email. On success the session SHALL be marked as verified and the user SHALL be redirected to `/`.

#### Scenario: Valid verification link clicked
- **WHEN** a user clicks a non-expired verification link
- **THEN** the system SHALL mark the user's email as verified, auto-sign the user in, and redirect to `/`

#### Scenario: Expired or invalid verification link
- **WHEN** a user clicks a verification link that has expired or been tampered with
- **THEN** the system SHALL display an error and SHALL NOT mark the email as verified

### Requirement: Unverified users are held at the verification pending page
The system SHALL redirect users with a valid session but an unverified email to `/verify-email` when they attempt to access any protected route.

#### Scenario: Unverified session accesses protected route
- **WHEN** a user with a valid session and `emailVerified: false` requests a route that is not `/verify-email` or `/api/auth/*`
- **THEN** the proxy SHALL redirect the request to `/verify-email`

#### Scenario: Verified session accesses verify-email page
- **WHEN** a user with a valid session and `emailVerified: true` navigates to `/verify-email`
- **THEN** the proxy SHALL redirect the request to `/`

#### Scenario: Unauthenticated user accesses verify-email page
- **WHEN** a user with no session navigates to `/verify-email`
- **THEN** the system SHALL redirect to `/login`

### Requirement: Verification pending page informs the user
The `/verify-email` page SHALL display a clear message instructing the user to check their inbox, including a note to check the spam folder.

#### Scenario: Pending page renders for unverified user
- **WHEN** a user with an unverified session is redirected to `/verify-email`
- **THEN** the page SHALL display a message confirming the email was sent and instructing the user to click the link in their inbox
