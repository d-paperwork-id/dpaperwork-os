## ADDED Requirements

### Requirement: Inbox list displays agent messages sorted newest first
The system SHALL render a paginated list of `inbox_items` for the authenticated user in the current workspace, sorted by `created_at DESC`. The default view shows only unresolved, non-snoozed items.

#### Scenario: Default view shows unresolved items
- **WHEN** user navigates to `/inbox`
- **THEN** system shows inbox items where `resolved_at IS NULL` and (`snoozed_until IS NULL` OR `snoozed_until < now()`), sorted newest first

#### Scenario: Empty inbox shows empty state
- **WHEN** the user has no unresolved inbox items
- **THEN** system renders the `Empty` component with title "No inbox items" and description "Set up a routine to get automated updates from your AI team." and a "Create a routine" CTA button

### Requirement: Each inbox row shows agent identity, title, preview, and relative time
Each row SHALL use the `Item` shadcn component with: agent avatar (colored by `--agent-{agentId}` CSS variable), item title, truncated body preview (single line), and relative timestamp.

#### Scenario: Unread item visual treatment
- **WHEN** an inbox item has `read_at IS NULL`
- **THEN** the row title renders with `font-medium text-foreground` and a 4px left border colored with `var(--agent-{sourceAgentId})`

#### Scenario: Read item visual treatment
- **WHEN** an inbox item has `read_at` set
- **THEN** the row title renders with `text-muted-foreground` at normal weight and no colored left border

#### Scenario: Hover reveals action buttons
- **WHEN** user hovers over an inbox row
- **THEN** resolve and snooze shortcut buttons become visible (`opacity-100`) on the right side of the row

### Requirement: Filter bar narrows the inbox list
The system SHALL provide a filter bar with a `Select` for agent filter and a `Select` for status filter (`unread`, `all`, `resolved`). Filter state SHALL be stored in URL search params (`?agent=…&status=…`).

#### Scenario: Filter by agent
- **WHEN** user selects an agent from the filter Select
- **THEN** list shows only items from that `source_agent_id`

#### Scenario: Filter by status — unread
- **WHEN** user selects "Unread" from status filter
- **THEN** list shows only items where `read_at IS NULL` and `resolved_at IS NULL`

#### Scenario: Filter by status — resolved
- **WHEN** user selects "Resolved" from status filter
- **THEN** list shows items where `resolved_at IS NOT NULL`

#### Scenario: Filter by status — all
- **WHEN** user selects "All" from status filter
- **THEN** list shows all items regardless of read/resolved state (excluding snoozed)

#### Scenario: Empty filtered result
- **WHEN** active filters produce zero results
- **THEN** system renders the `Empty` component with a filter-specific message ("No resolved items." for resolved filter)
