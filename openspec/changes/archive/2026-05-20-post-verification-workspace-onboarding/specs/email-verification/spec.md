## MODIFIED Requirements

### Requirement: User can verify their email address
The system SHALL allow a user to verify their email by clicking the link in the verification email. On success the session SHALL be marked as verified and the user SHALL be redirected to `/onboarding`.

#### Scenario: Valid verification link clicked
- **WHEN** a user clicks a non-expired verification link
- **THEN** the system SHALL mark the user's email as verified, auto-sign the user in, and redirect to `/onboarding`

#### Scenario: Expired or invalid verification link
- **WHEN** a user clicks a verification link that has expired or been tampered with
- **THEN** the system SHALL display an error and SHALL NOT mark the email as verified
