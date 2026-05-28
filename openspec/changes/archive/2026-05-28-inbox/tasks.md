## 1. API Routes

- [x] 1.1 Create `app/api/inbox/route.ts` — `GET` handler returning paginated inbox items scoped by `workspace_id` + `recipient_user_id`, supporting `?agent` and `?status` query params; validate with Zod
- [x] 1.2 Create `app/api/inbox/unread-count/route.ts` — `GET` handler returning `{ count: number }` of unread items for the current user
- [x] 1.3 Create `app/api/inbox/[id]/resolve/route.ts` — `POST` handler setting `resolved_at = now()` with ownership check
- [x] 1.4 Create `app/api/inbox/[id]/snooze/route.ts` — `POST` handler accepting `{ snoozedUntil: string }` (ISO 8601), setting `snoozed_until` with ownership check
- [x] 1.5 Create `app/api/inbox/[id]/read/route.ts` — `POST` handler setting `read_at = now()` (called when Sheet opens)

## 2. TanStack Query Hooks

- [x] 2.1 Create `lib/hooks/use-inbox.ts` — `useInbox(filters)` hook wrapping `GET /api/inbox` with filter params in query key
- [x] 2.2 Create `lib/hooks/use-inbox-unread-count.ts` — `useInboxUnreadCount()` hook with `refetchInterval: 30_000` and `refetchOnWindowFocus: true`
- [x] 2.3 Add `useResolveInboxItem` mutation with optimistic update (remove item from list, rollback on error)
- [x] 2.4 Add `useSnoozeInboxItem` mutation with optimistic update (remove item from list, rollback on error)
- [x] 2.5 Add `useMarkInboxItemRead` mutation (fire-and-forget, no optimistic update needed)

## 3. Inbox Page

- [x] 3.1 Create `app/(app)/inbox/page.tsx` — page shell with `ScrollArea`, filter bar, and list
- [x] 3.2 Build `InboxFilterBar` component — two shadcn `Select` components: agent filter (options from distinct `source_agent_id` values in results) and status filter (`unread` | `all` | `resolved`); sync with URL search params
- [x] 3.3 Build `InboxItemRow` component — uses shadcn `Item`/`ItemContent`/`ItemTitle`/`ItemDescription`/`ItemMedia`; colored 4px left border when unread; hover reveals resolve + snooze buttons; relative timestamp
- [x] 3.4 Build `AgentAvatar` component — circular avatar colored with `var(--agent-{agentId})` CSS variable, shows agent initial
- [x] 3.5 Add empty state — `Empty`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`/`EmptyContent` with "Create a routine" CTA; separate message for resolved-filter empty state

## 4. Inbox Item Detail Sheet

- [x] 4.1 Build `InboxItemSheet` component — shadcn `Sheet` sliding from right; shows agent avatar + name, routine name (if present), item title, markdown body, and action `ButtonGroup`
- [x] 4.2 Wire markdown rendering — dynamic import `react-markdown` with Tailwind prose classes
- [x] 4.3 Add `ButtonGroup` with Resolve button and Snooze `Popover` trigger
- [x] 4.4 Build `SnoozePopover` — shadcn `Popover` with four preset buttons (1 hour, 4 hours, Tomorrow 9am, Next week); "Tomorrow 9am" computes next 9:00am in workspace timezone
- [x] 4.5 Wire Sheet open to mark-read mutation (fires `POST /api/inbox/[id]/read` when Sheet opens for unread item)

## 5. Sidebar Nav Badge

- [x] 5.1 Import `useInboxUnreadCount` in sidebar nav component and pass `count` to Inbox `NavItem` as `badge` prop
- [x] 5.2 Verify `NavItem` badge prop renders numeric `Badge` when count > 0 and nothing when count is 0

## 6. Integration & Polish

- [x] 6.1 Invalidate `inbox` and `unread-count` queries after resolve and snooze mutations complete
- [x] 6.2 Add toast notifications for resolve/snooze errors (rollback feedback)
- [x] 6.3 Verify filter state persists in URL and survives page refresh
- [x] 6.4 Smoke test end-to-end: routine delivers inbox item → item appears in list → open Sheet → resolve → item disappears → unread badge decrements
