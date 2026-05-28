## ADDED Requirements

### Requirement: GET /api/inbox returns paginated inbox items for the authenticated user
The route SHALL return inbox items scoped to `workspace_id` (from session) and `recipient_user_id` (authenticated user). It SHALL accept query params: `agent` (filter by `source_agent_id`), `status` (`unread` | `all` | `resolved`), `cursor` (for pagination). Default is unresolved + non-snoozed, newest first.

#### Scenario: Default fetch returns unresolved items
- **WHEN** `GET /api/inbox` is called with no query params
- **THEN** response is `{ items: InboxItem[], nextCursor: string | null }` containing items where `resolved_at IS NULL` and `(snoozed_until IS NULL OR snoozed_until < now())`

#### Scenario: Agent filter applied
- **WHEN** `?agent=chief-of-staff` is passed
- **THEN** response contains only items with `source_agent_id = 'chief-of-staff'`

#### Scenario: Status=resolved filter
- **WHEN** `?status=resolved` is passed
- **THEN** response contains items where `resolved_at IS NOT NULL`

#### Scenario: Unauthorized request rejected
- **WHEN** request has no valid session
- **THEN** route returns `401 Unauthorized`

### Requirement: GET /api/inbox/unread-count returns current unread count
The route SHALL return `{ count: number }` — count of items where `read_at IS NULL AND resolved_at IS NULL AND (snoozed_until IS NULL OR snoozed_until < now())` for the authenticated user in their workspace.

#### Scenario: Count reflects unread items
- **WHEN** `GET /api/inbox/unread-count` is called
- **THEN** response is `{ count: N }` matching unread items for this user

### Requirement: POST /api/inbox/[id]/resolve marks an item as resolved
The route SHALL set `resolved_at = now()` on the specified inbox item. It SHALL verify the item belongs to the requesting user's workspace and is the recipient.

#### Scenario: Successful resolve
- **WHEN** `POST /api/inbox/[id]/resolve` is called for a valid item
- **THEN** `resolved_at` is set to current timestamp and response is `200 { success: true }`

#### Scenario: Item not found or unauthorized
- **WHEN** item does not belong to the requesting user
- **THEN** route returns `404 Not Found`

### Requirement: POST /api/inbox/[id]/snooze sets snoozed_until on an item
The route SHALL accept `{ snoozedUntil: string }` (ISO 8601 UTC timestamp) and set `snoozed_until` on the item. It SHALL verify ownership.

#### Scenario: Successful snooze
- **WHEN** `POST /api/inbox/[id]/snooze` is called with a valid `snoozedUntil`
- **THEN** `snoozed_until` is set and response is `200 { success: true }`

#### Scenario: Invalid timestamp rejected
- **WHEN** `snoozedUntil` is missing or not a valid ISO timestamp
- **THEN** route returns `400 Bad Request`
