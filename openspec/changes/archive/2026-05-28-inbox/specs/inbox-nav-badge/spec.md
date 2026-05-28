## ADDED Requirements

### Requirement: Sidebar Inbox nav item shows unread count badge
The system SHALL display a numeric badge on the "Inbox" sidebar nav item reflecting the count of unread items for the current user. The count SHALL be fetched via `GET /api/inbox/unread-count` and refreshed every 30 seconds and on window focus.

#### Scenario: Badge shows unread count
- **WHEN** user has unread inbox items
- **THEN** sidebar Inbox nav item shows a numeric badge with the unread count

#### Scenario: Badge hidden when count is zero
- **WHEN** unread count is 0
- **THEN** no badge is rendered on the Inbox nav item

#### Scenario: Badge updates after resolving an item
- **WHEN** user resolves or reads an item
- **THEN** badge count decrements (via query invalidation)

#### Scenario: Badge polls every 30 seconds
- **WHEN** user is on any page in the app
- **THEN** unread count query refetches automatically every 30 seconds

#### Scenario: Badge refreshes on window focus
- **WHEN** user returns focus to the browser window/tab
- **THEN** unread count query refetches immediately
