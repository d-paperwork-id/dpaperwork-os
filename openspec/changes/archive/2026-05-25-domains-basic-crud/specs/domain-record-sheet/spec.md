## ADDED Requirements

### Requirement: Sheet opens in add and edit modes
The system SHALL render a `Sheet` with `w-[380px]` for adding a new record (all fields empty) or editing an existing record (fields pre-populated).

#### Scenario: Add mode
- **WHEN** the user clicks "New Record"
- **THEN** the Sheet opens with title "New Record", all fields empty, and a "Create" button in the footer

#### Scenario: Edit mode
- **WHEN** the user triggers the edit action on an existing row
- **THEN** the Sheet opens with title equal to the record's primary field value (first field), all fields pre-populated

### Requirement: Field rendering per type
The system SHALL render the appropriate input component for each Phase 1 field type.

#### Scenario: text field
- **WHEN** the Sheet renders a `text` field
- **THEN** an `Input` component is shown wrapped in `Field` with the field name as label

#### Scenario: long_text field
- **WHEN** the Sheet renders a `long_text` field
- **THEN** a `Textarea` with `resize-none min-h-[80px]` is shown wrapped in `Field`

#### Scenario: number field
- **WHEN** the Sheet renders a `number` field
- **THEN** an `<Input type="number">` is shown wrapped in `Field`

#### Scenario: date field
- **WHEN** the Sheet renders a `date` field
- **THEN** a shadcn `Calendar` + `Date Picker` pattern is shown wrapped in `Field`

#### Scenario: single_select field
- **WHEN** the Sheet renders a `single_select` field
- **THEN** a `Select` populated from `domain_fields.options.choices` is shown wrapped in `Field`

### Requirement: Save creates or updates record
The system SHALL submit the form on "Create" / "Save" button click. Add mode calls `POST /api/domains/[id]/records`; edit mode calls `PUT /api/domains/[id]/records/[recordId]`.

#### Scenario: Create record
- **WHEN** the user fills fields and clicks "Create"
- **THEN** a POST is sent; on success the Sheet closes, the grid row is added, and a success toast is shown

#### Scenario: Update record
- **WHEN** the user edits fields and clicks "Save"
- **THEN** a PUT is sent; on success the Sheet closes, the grid row is updated, and a success toast is shown

#### Scenario: API error
- **WHEN** the save API returns an error
- **THEN** an error toast is shown and the Sheet stays open

### Requirement: Delete record
The system SHALL show a "Delete" button in the Sheet footer (edit mode only). Clicking it triggers an `AlertDialog` confirmation before calling `DELETE /api/domains/[id]/records/[recordId]`.

#### Scenario: Delete confirmed
- **WHEN** the user clicks Delete and confirms in the AlertDialog
- **THEN** a DELETE is sent; on success the Sheet closes and the row is removed from the grid

#### Scenario: Delete cancelled
- **WHEN** the user clicks Delete then dismisses the AlertDialog
- **THEN** no API call is made and the Sheet remains open

### Requirement: Sheet form uses react-hook-form + Zod
The system SHALL validate field inputs using `react-hook-form` with a Zod schema derived from `domain_fields` types. Required fields (where `is_required = true`) use `.min(1)` validation.

#### Scenario: Required field empty
- **WHEN** the user submits the form with a required field empty
- **THEN** a `FieldError` is shown below that input and the API is not called
