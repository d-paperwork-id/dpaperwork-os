## ADDED Requirements

### Requirement: User can resolve an inbox item
The system SHALL allow a user to mark an inbox item as resolved. Resolved items SHALL be removed from the default (unresolved) view immediately via optimistic update.

#### Scenario: Resolve from Sheet action buttons
- **WHEN** user clicks "Resolve" in the Sheet ButtonGroup
- **THEN** system sends `POST /api/inbox/[id]/resolve`, item disappears from the list optimistically, and Sheet closes

#### Scenario: Resolve from row hover buttons
- **WHEN** user clicks the resolve button revealed on row hover
- **THEN** system sends `POST /api/inbox/[id]/resolve` and item disappears from the list optimistically

#### Scenario: Resolve fails — rollback
- **WHEN** the resolve API call returns an error
- **THEN** system rolls back the optimistic removal and shows a toast error

### Requirement: User can snooze an inbox item with a preset duration
The system SHALL allow a user to snooze an inbox item by selecting a preset duration from a `Popover`. Snoozed items SHALL be hidden from the default view until `snoozed_until` passes.

#### Scenario: Snooze popover shows preset options
- **WHEN** user clicks "Snooze" in the Sheet ButtonGroup or from row hover
- **THEN** a Popover opens with presets: "1 hour", "4 hours", "Tomorrow morning (9am)", "Next week"

#### Scenario: Snooze applied
- **WHEN** user selects a snooze preset
- **THEN** system sends `POST /api/inbox/[id]/snooze` with computed UTC `snoozed_until` timestamp, item disappears from the default view optimistically, and Popover closes

#### Scenario: "Tomorrow morning" preset uses workspace timezone
- **WHEN** user selects "Tomorrow morning (9am)"
- **THEN** system computes the next 9:00am in the workspace's configured timezone and uses that as `snoozed_until`

#### Scenario: Snooze fails — rollback
- **WHEN** the snooze API call returns an error
- **THEN** system rolls back the optimistic removal and shows a toast error
