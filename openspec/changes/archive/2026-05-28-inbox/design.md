## Context

The `inbox_items` table is fully defined in schema with indexes optimized for the default view (`workspace_id + recipient_user_id + created_at DESC` where `deleted_at IS NULL AND resolved_at IS NULL`). No migrations are needed. The inbox surface is per-user — each session scopes to the authenticated user's `id` as `recipient_user_id`. This is Phase 1.5, the final piece before the Phase 1 end-to-end validation loop.

## Goals / Non-Goals

**Goals:**
- Deliver a functional inbox list with filter, unread state, and resolve/snooze actions
- Sheet detail panel rendering full markdown body
- API routes scoped by workspace + recipient user
- Sidebar unread badge polled every 30s / on window focus

**Non-Goals:**
- Push/WebSocket real-time updates (polling is sufficient for Phase 1)
- Reply/thread integration (flow shown in app-flow but not in Phase 1 scope)
- Priority-based sorting (schema supports it; UI deferred)
- Filter by routine (Phase 2+)
- Mark all read action (wireframe shows it; not in Phase 1 checklist)

## Decisions

### 1. Filter state in URL search params (not local state)

Keeps filter state shareable and survives page refresh. Use `useSearchParams` to read/write `agent` and `status` query params. TanStack Query key includes filter values so cache is per-filter-combination.

**Alternative:** Local `useState` — simpler but filter lost on refresh and not linkable. Rejected.

### 2. Unread badge polling via a dedicated TanStack Query with `refetchInterval`

`useQuery` with `refetchInterval: 30_000` and `refetchOnWindowFocus: true` for the unread count. This is separate from the inbox list query so the sidebar badge updates without remounting the full page.

**Alternative:** Shared query with selector — adds coupling between sidebar and inbox page. Rejected.

### 3. Snooze time picker via shadcn `Popover` + preset durations, not a full calendar

Presets: 1 hour, 4 hours, tomorrow morning (next 9am in workspace timezone), next week. No custom date input in Phase 1.

**Alternative:** Full `DatePicker` dialog — overkill for snooze; presets cover 95% of use cases. Deferred.

### 4. Resolve and snooze as optimistic mutations

Both actions use TanStack Query `useMutation` with optimistic updates — item disappears from list immediately on action, rolled back on error. This keeps the UI snappy without waiting for the server round-trip.

### 5. Markdown rendering with `react-markdown`

Body field is agent-generated markdown. Use `react-markdown` with `prose` Tailwind typography classes in the Sheet detail view. No custom renderers needed for Phase 1.

**Alternative:** Dangerously set inner HTML — XSS risk, rejected entirely.

## Risks / Trade-offs

- **Polling at 30s adds minor server load** → Mitigation: count query is a lightweight `COUNT(*)` on the partial index; negligible at Phase 1 scale.
- **Optimistic updates can diverge if server fails** → Mitigation: TanStack Query rolls back on error + shows toast; acceptable UX tradeoff.
- **`react-markdown` bundle size (~30KB gzipped)** → Mitigation: dynamic import with `next/dynamic` so it only loads when Sheet is opened.
- **Snooze timezone correctness** → Snooze stores UTC timestamp; "tomorrow morning" preset must compute next 9am in workspace timezone. Workspace timezone is stored in `workspaces.timezone`. Fetch it once at app shell level and pass via context.
