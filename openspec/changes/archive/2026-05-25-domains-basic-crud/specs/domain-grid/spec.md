## ADDED Requirements

### Requirement: Grid renders domain records
The system SHALL render all non-deleted records for the domain as a TanStack Table grid via the shadcn Data Table pattern. One column per `domain_field`, ordered by `position` ascending. Rows are `h-9`.

#### Scenario: Records exist
- **WHEN** the user navigates to `/domains/[slug]`
- **THEN** each record is a row; each field is a column with header showing the field name in `text-xs text-muted-foreground font-medium bg-muted`

#### Scenario: No records yet
- **WHEN** the domain has no records
- **THEN** the grid shows the header row and a single "New Record" sticky row at the bottom

### Requirement: Column headers sticky
The system SHALL fix column headers to the top of the scroll container so they remain visible when scrolling a long list of records.

#### Scenario: Scroll down
- **WHEN** the user scrolls the domain grid downward
- **THEN** column headers remain visible at the top of the grid

### Requirement: Inline cell editing
The system SHALL allow clicking any cell to enter edit mode. The correct input is rendered per field type. On blur or Enter the record is saved via `PUT /api/domains/[id]/records/[recordId]`.

#### Scenario: Edit text cell
- **WHEN** the user clicks a `text` or `long_text` field cell
- **THEN** an `<input>` (or `<textarea>` for `long_text`) renders in place with the current value; on blur or Enter the value is saved

#### Scenario: Edit number cell
- **WHEN** the user clicks a `number` field cell
- **THEN** an `<input type="number">` renders in place; on blur or Enter the numeric value is saved

#### Scenario: Edit date cell
- **WHEN** the user clicks a `date` field cell
- **THEN** an `<input type="date">` renders in place; on blur or Enter the ISO date string is saved

#### Scenario: Edit single_select cell
- **WHEN** the user clicks a `single_select` field cell
- **THEN** a `Select` dropdown opens with the field's choices; selecting an option saves immediately

#### Scenario: Escape cancels edit
- **WHEN** the user presses Escape while a cell is in edit mode
- **THEN** the edit is discarded and the cell returns to read mode

### Requirement: New Record sticky row
The system SHALL show a "New Record" row permanently at the bottom of the grid. Clicking it opens the Record Sheet in add mode.

#### Scenario: Click New Record row
- **WHEN** the user clicks the "New Record" row at the bottom of the grid
- **THEN** the `RecordSheet` opens in add mode with all fields empty

### Requirement: Row hover reveals sheet trigger
The system SHALL show a row-level action button (open full record in Sheet) on row hover.

#### Scenario: Hover row
- **WHEN** the user hovers a record row
- **THEN** an icon button appears on the right that opens the `RecordSheet` in edit mode for that record

### Requirement: Data fetched via TanStack Query
The system SHALL fetch `domain_fields` and `domain_records` from `GET /api/domains/[id]/records` using TanStack Query. No SSR data fetching.

#### Scenario: Loading
- **WHEN** the grid data is loading
- **THEN** a `Spinner` is shown in the content area

### Requirement: Filter panel trigger
The system SHALL render a "Filter" button (`variant="outline"` `size="sm"`) in the domain grid header area. When one or more filters are active, the button SHALL show a count badge (e.g., "Filter · 2"). Clicking the button opens the filter `Popover`.

#### Scenario: No active filters
- **WHEN** no filters are active
- **THEN** the button reads "Filter" with no badge

#### Scenario: Active filters
- **WHEN** one or more filters are active
- **THEN** the button reads "Filter · N" where N is the count of active filter conditions

### Requirement: Filter panel content
The system SHALL render a `Popover` containing the filter UI. The user can add one condition per click of "Add filter". Each condition row has: a `Select` to pick the field, a condition input matched to the field type, and a remove (×) button. All conditions are combined with AND. A "Clear all" link removes all conditions and closes the popover.

#### Scenario: Add a text filter condition
- **WHEN** the user selects a `text` or `long_text` field and types a value
- **THEN** rows where that field does not contain the typed string (case-insensitive) are hidden from the grid

#### Scenario: Add a number filter condition
- **WHEN** the user selects a `number` field and types a number
- **THEN** rows where that field's value does not equal the number are hidden

#### Scenario: Add a date filter condition
- **WHEN** the user selects a `date` field and picks a date
- **THEN** rows where that field's value does not equal the date are hidden

#### Scenario: Add a single_select filter condition
- **WHEN** the user selects a `single_select` field and picks a choice from a `Select`
- **THEN** rows where that field's value does not match the chosen option are hidden

#### Scenario: Remove a condition
- **WHEN** the user clicks × on a condition row
- **THEN** that condition is removed and the grid re-filters

#### Scenario: Clear all filters
- **WHEN** the user clicks "Clear all"
- **THEN** all conditions are removed, all records are shown, and the Popover closes

### Requirement: Server-side filtering via API query params
The filter panel MUST serialize active conditions to a `filters` JSON array and pass it as a query param on the TanStack Query fetch key. TanStack Table MUST run with `manualFiltering: true`. Changing a condition triggers a refetch — the API applies the filters, not the client.

#### Scenario: Filter condition added
- **WHEN** the user adds a condition (field + value) in the filter Popover
- **THEN** a new `GET /api/domains/[id]/records?filters=[...]` request is made; the grid renders only the matching records returned by the API

#### Scenario: Filter condition removed
- **WHEN** the user removes a condition or clicks "Clear all"
- **THEN** the fetch key updates without the removed condition; the grid shows the unfiltered (paginated) result

### Requirement: Server-side pagination
The grid MUST display one page of records at a time. TanStack Table MUST run with `manualPagination: true`. Pagination state (`page`, `pageSize`) is included in the TanStack Query fetch key so that changing page or page size triggers a refetch.

#### Scenario: Navigate to next page
- **WHEN** the user clicks the "Next" button in the pagination controls
- **THEN** `page` increments by 1, a new `GET /api/domains/[id]/records?page=N&pageSize=M` request is made, and the grid shows the next page of records

#### Scenario: Navigate to previous page
- **WHEN** the user clicks the "Prev" button
- **THEN** `page` decrements by 1 (minimum 1), a refetch occurs, and the grid shows the previous page

#### Scenario: Previous disabled on first page
- **WHEN** the user is on page 1
- **THEN** the "Prev" button is disabled

#### Scenario: Next disabled on last page
- **WHEN** `page * pageSize >= total`
- **THEN** the "Next" button is disabled

#### Scenario: Change page size
- **WHEN** the user selects a different page size (25 / 50 / 100) from the page-size selector
- **THEN** `page` resets to 1, `pageSize` updates, a refetch occurs

### Requirement: Pagination controls placement
The system SHALL render pagination controls below the grid: left side shows "X–Y of Z records" (`text-sm text-muted-foreground`); right side has a page-size `Select` (options: 25, 50, 100; default 50) and Prev / Next `Button variant="outline" size="sm"`.

#### Scenario: Controls render
- **WHEN** the grid loads with records
- **THEN** pagination controls are visible below the table with correct record range and total

### Requirement: Row selected state
The system SHALL apply a selected visual treatment to the active row when the Sheet is open for that record.

#### Scenario: Sheet open for a record
- **WHEN** the RecordSheet is open for record R
- **THEN** row R has class `bg-accent border-l-2 border-l-primary`
