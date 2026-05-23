## Context

The auth layer (register, verify-email, login) is complete. The workspace creation API and onboarding form are implemented. What's missing is the routing layer that connects these pieces and the authenticated app shell that users land in after setup. Without a proxy and a layout, authenticated users have no guided path through the product.

Current state:
- `app/(auth)/*` — all auth pages work
- `POST /api/workspace` — workspace creation with seed works
- `app/(app)/*` — only two stub settings pages exist; no layout, no sidebar
- `app/page.tsx` — static page, no session-aware redirect
- No `proxy.ts`

## Goals / Non-Goals

**Goals:**
- Route users to the correct destination based on session state and workspace membership
- Render a persistent sidebar with primary navigation for all authenticated app routes
- Expose a `GET /api/workspace/me` endpoint so the client shell can resolve the active workspace
- Give users a landing page (`/inbox`) after workspace creation
- Fix the post-onboarding redirect from `/dashboard` (non-existent) to `/inbox`

**Non-Goals:**
- Full inbox feature — `/inbox` is a placeholder shell only
- Multi-workspace switching — users have exactly one workspace at this stage
- Invite-based workspace join flow — that's a separate change
- Mobile or responsive sidebar — desktop layout only for now

## Decisions

### Decision: `proxy.ts` with optimistic cookie checks — no DB queries

Next.js 16 renamed `middleware.ts` → `proxy.ts` and the exported function from `middleware` to `proxy`. The Next.js auth guide explicitly states: "avoid database checks [in proxy] to prevent performance issues." Proxy should do optimistic checks only.

**Chosen:** Read session state from the better-auth session cookie in `proxy.ts`. For workspace state, set a `has_workspace=1` cookie in `POST /api/workspace` on successful creation; clear it on session end. Proxy reads this cookie — no DB hit on any request.

**Alternative considered:** DB query for workspace membership in proxy. Rejected — the Next.js 16 docs explicitly recommend against it for performance; proxy runs on every prefetched route.

**Alternative considered:** Redirect unauthenticated users only, and leave workspace gating to the page level. Rejected because it leaks unprotected routes and requires per-page duplication.

**Trade-off:** The `has_workspace` cookie is an optimistic signal, not a source of truth. It can become stale (e.g. workspace deleted). The `/api/workspace/me` route (called by the app shell) is the authoritative check and can redirect server-side if the workspace is gone. This is acceptable for the current stage.

### Decision: `GET /api/workspace/me` as the client-side workspace resolver

**Chosen:** App shell fetches `/api/workspace/me` via TanStack Query on mount to get the current workspace id, name, and slug. This is used for the sidebar header and any workspace-scoped queries.

**Alternative considered:** Pass workspace data via a server component and `use()`. Rejected — CLAUDE.md explicitly prohibits SSR data fetching; all data must come from `app/api/` routes.

**Alternative considered:** Store workspace id in `localStorage` on successful onboarding. Rejected — doesn't survive sessions or tab changes reliably.

### Decision: Sidebar as a client component with `usePathname` for active state

**Chosen:** Sidebar is a `"use client"` component that reads `usePathname()` to highlight the active nav item. No server state needed for nav rendering.

**Alternative considered:** CSS-only active state using `data-` attributes. Rejected — pathname isn't accessible server-side in an RSC without extra plumbing.

## Risks / Trade-offs

- **Stale `has_workspace` cookie** → Cookie is set/cleared by the API, not the client. The risk window is narrow (cookie set at workspace creation, only cleared on session expiry or explicit logout). The app shell's authoritative check catches the stale state on first load.
- **`/inbox` is a placeholder** → Risk of landing somewhere visually empty after onboarding. Mitigation: render a welcome card or skeleton that communicates the state clearly.
- **better-auth session cookie name** → Need to verify the exact cookie name better-auth uses so proxy reads the right one. Check `lib/auth.ts` configuration before implementing.

## Migration Plan

1. Update `POST /api/workspace` to set `has_workspace=1` cookie on success.
2. Deploy `proxy.ts` — additive; existing auth pages are excluded from its matcher.
3. Deploy app shell layout — new routes with no existing traffic.
4. Update onboarding redirect from `/dashboard` to `/inbox` — safe one-line change.
5. No rollback needed; no schema changes.
