## ADDED Requirements

### Requirement: Clicking an inbox item opens a Sheet with full content
The system SHALL open a shadcn `Sheet` from the right side when the user clicks an inbox row. The Sheet SHALL render: the item title, source agent name and avatar, source routine name (if present), full body as rendered markdown, and an action `ButtonGroup`.

#### Scenario: Sheet opens on row click
- **WHEN** user clicks an inbox item row
- **THEN** a Sheet slides in from the right with the full item content

#### Scenario: Body renders as markdown
- **WHEN** the Sheet is open
- **THEN** item `body` field is rendered as markdown (headings, lists, bold, links) using `react-markdown` with typography prose styles

#### Scenario: Source routine shown when present
- **WHEN** `source_routine_id` is not null
- **THEN** Sheet header area shows routine name alongside agent name

#### Scenario: Source routine omitted when absent
- **WHEN** `source_routine_id` is null
- **THEN** Sheet header shows only agent name, no routine reference

### Requirement: Item is marked as read when the Sheet opens
The system SHALL set `read_at` to the current timestamp when the Sheet first opens for an item that has `read_at IS NULL`.

#### Scenario: Unread item becomes read on open
- **WHEN** user opens a Sheet for an item with `read_at IS NULL`
- **THEN** system sends a mark-read request and the unread indicator on the row is removed
