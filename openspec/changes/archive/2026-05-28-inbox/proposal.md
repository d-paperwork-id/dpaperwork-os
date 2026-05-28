## Why

The platform's agents produce output — weekly updates, flagged anomalies, observations — but users have no surface to receive and act on that output. The inbox is the primary delivery point for agent-generated content: without it, routines run but nothing reaches the user, making the core "AI team" value proposition invisible.

## What Changes

- New route `/inbox` with a filterable list of agent-delivered messages sorted newest first
- Unread/resolved state management per item, with snooze capability
- Sheet detail panel with rendered markdown body and action buttons
- Unread badge on sidebar nav item, polled every 30 seconds or on window focus
- Three new API routes: list, resolve, snooze
- Sidebar nav badge for unread count

## Capabilities

### New Capabilities

- `inbox-list`: Browse, filter, and read inbox items delivered by agents/routines — the list view with unread indicators, filter bar (by agent, by status), and relative timestamps
- `inbox-item-detail`: View full markdown body of an inbox item in a Sheet, with source agent/routine context and action buttons (resolve, snooze)
- `inbox-actions`: Mark an item resolved or snooze it (with a time picker); items disappear from default view accordingly
- `inbox-api`: Server-side API routes (`GET /api/inbox`, `POST /api/inbox/[id]/resolve`, `POST /api/inbox/[id]/snooze`) scoped by workspace and recipient user
- `inbox-nav-badge`: Sidebar badge showing unread count, polled every 30 seconds or on window focus

### Modified Capabilities

- `app-shell`: Sidebar nav gains an unread badge on the Inbox nav item

## Impact

- **New files:** `app/(app)/inbox/page.tsx`, `app/api/inbox/route.ts`, `app/api/inbox/[id]/resolve/route.ts`, `app/api/inbox/[id]/snooze/route.ts`
- **Modified files:** Sidebar nav component (add unread badge to Inbox item)
- **Schema:** Uses existing `inbox_items` table — no migrations needed
- **Dependencies:** `react-markdown` or equivalent for body rendering; existing `shadcn/ui` components (`Item`, `Sheet`, `Select`, `Popover`, `ButtonGroup`, `Empty`)
- **Auth:** All routes require authenticated session scoped to `workspace_id` + `recipient_user_id`
