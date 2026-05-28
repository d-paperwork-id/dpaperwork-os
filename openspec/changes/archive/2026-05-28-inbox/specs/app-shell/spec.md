## MODIFIED Requirements

### Requirement: Sidebar nav renders unread badge on Inbox item
The sidebar navigation SHALL render a `Badge` on the Inbox `NavItem` showing the unread inbox count. The badge SHALL be driven by `useInboxUnreadCount` hook and SHALL not render when count is 0.

#### Scenario: Inbox NavItem with badge
- **WHEN** unread count is greater than 0
- **THEN** Inbox NavItem renders with a numeric Badge component showing the count

#### Scenario: Inbox NavItem without badge
- **WHEN** unread count is 0 or loading
- **THEN** Inbox NavItem renders without any badge
