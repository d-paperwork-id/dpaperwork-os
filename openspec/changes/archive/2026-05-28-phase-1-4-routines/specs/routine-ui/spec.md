## ADDED Requirements

### Requirement: Routine list page
The system SHALL display all workspace routines at `/routines` using the `Item` component pattern, with an `Empty` state when none exist.

#### Scenario: Routines exist
- **WHEN** the user navigates to `/routines`
- **THEN** each routine is shown as an `Item` row with: name, agent badge, schedule summary (e.g., "Every Monday at 9:00 AM IST"), status badge (`active`/`paused`), and relative `created_at`
- **AND** clicking a row navigates to `/routines/[id]`

#### Scenario: No routines
- **WHEN** no routines exist for the workspace
- **THEN** the `Empty` component is shown with title "No routines yet" and a "New Routine" CTA button linking to `/routines/new`

#### Scenario: Page header
- **WHEN** the page renders
- **THEN** a `PageHeader` shows "Routines" with a "New Routine" button (variant="outline", size="sm") that navigates to `/routines/new`

### Requirement: New routine form
The system SHALL provide a form at `/routines/new` with fields for name, agent, instruction, schedule, and output destination.

#### Scenario: Form fields
- **WHEN** the user navigates to `/routines/new`
- **THEN** the form shows: Name (`Input`), Agent (`Select` — Chief of Staff only in Phase 1), Instruction (`Textarea`, `font-mono text-sm`), Day of week (`Select`, Monday–Sunday), Time (`Input type="time"`), timezone label (read-only, shows workspace timezone), Output ("Inbox" label — non-interactive in Phase 1)
- **AND** each field uses the `Field` / `FieldLabel` / `FieldDescription` / `FieldError` pattern

#### Scenario: Successful save
- **WHEN** the user fills all required fields and clicks "Create Routine"
- **THEN** `POST /api/routines` is called
- **AND** on success, the user is navigated to `/routines/[newId]`
- **AND** a success toast is shown: "Routine created. Next run scheduled for [day] [time] [tz]."

#### Scenario: Validation errors
- **WHEN** required fields are missing and the form is submitted
- **THEN** `FieldError` messages appear below the relevant inputs, form is not submitted

#### Scenario: Save in progress
- **WHEN** the form is submitting
- **THEN** the submit button shows a `Spinner` and is `disabled`

### Requirement: Routine detail page
The system SHALL display routine details and run history at `/routines/[id]`.

#### Scenario: Detail sections
- **WHEN** the user navigates to `/routines/[id]`
- **THEN** the page shows: routine name in `PageHeader`, status badge (active/paused), agent name + badge, instruction text, schedule string ("Every Monday at 9:00 AM IST"), and a run history list

#### Scenario: Paused by system alert
- **WHEN** `routine.isPaused = true` and `routine.pauseReason` is set
- **THEN** an inline `Alert` is shown: "This routine is paused: [pauseReason]"

#### Scenario: Run history list
- **WHEN** `routine_runs` rows exist
- **THEN** each run is shown as an `Item` with: relative timestamp, status badge (`succeeded`/`failed`/`running`/`skipped`), and `outputSummary` or `errorSummary` as description

#### Scenario: Empty run history
- **WHEN** no runs exist
- **THEN** an inline message "This routine hasn't run yet." is shown

### Requirement: Routine actions
The system SHALL provide pause, resume, run now, and delete actions on the routine detail page.

#### Scenario: Pause action
- **WHEN** the routine is active and the user clicks "Pause"
- **THEN** `POST /api/routines/[id]/pause` is called, the status badge updates to "paused", the button changes to "Resume"

#### Scenario: Resume action
- **WHEN** the routine is paused and the user clicks "Resume"
- **THEN** `POST /api/routines/[id]/resume` is called, status updates to "active"

#### Scenario: Run now action
- **WHEN** the user clicks "Run Now" and confirms
- **THEN** `POST /api/routines/[id]/run-now` is called, a toast is shown "Run triggered", the run history refreshes after a short delay

#### Scenario: Delete action
- **WHEN** the user clicks "Delete" and confirms in the `AlertDialog` ("Delete routine '[name]'?")
- **THEN** `DELETE /api/routines/[id]` is called, user is navigated to `/routines`
