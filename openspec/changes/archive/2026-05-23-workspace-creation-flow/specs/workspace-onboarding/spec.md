## MODIFIED Requirements

### Requirement: Onboarding form collects business details
The system SHALL present a form at `/onboarding` that collects the following fields: business name (required), industry (required), website (optional), and a short description of the business (required). The form SHALL validate all required fields before allowing submission.

#### Scenario: User submits valid form
- **WHEN** a verified user submits the onboarding form with all required fields filled in
- **THEN** the system SHALL create a workspace record via `POST /api/workspace` and redirect the user to `/inbox`

#### Scenario: User omits a required field
- **WHEN** a verified user submits the form with one or more required fields empty
- **THEN** the system SHALL display inline validation errors and SHALL NOT submit the form

#### Scenario: Website field is left blank
- **WHEN** a verified user submits the form without a website URL
- **THEN** the system SHALL accept the submission and store `null` for the website field

#### Scenario: Duplicate workspace creation attempt
- **WHEN** a user who already has a workspace navigates to `/onboarding` and submits the form again
- **THEN** the API SHALL return a 409 conflict response and the page SHALL redirect the user to `/inbox`; no duplicate workspace SHALL be created
