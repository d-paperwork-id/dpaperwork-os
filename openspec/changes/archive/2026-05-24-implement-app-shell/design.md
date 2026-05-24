## Context

The `(app)` route group has a basic custom sidebar (`components/sidebar.tsx`) and a minimal layout. There is no:
- shadcn `Sidebar` component (not yet installed)
- `ThemeProvider` / dark-mode wiring
- `PageHeader` shared component
- `UserMenu` (sign-out, profile link)
- Auth guard middleware

The existing sidebar uses raw CSS variable names (`var(--sidebar)`) and doesn't follow the shadcn Sidebar API. Replacing it with the shadcn Sidebar component ensures collapse, keyboard shortcuts, ARIA attributes, and mobile responsiveness are handled natively.

`next-themes` is not yet installed. The root `app/layout.tsx` uses `Providers` client wrapper for TanStack Query but has no theme support.

The Better Auth session is available via `auth.api.getSession` from the server, suitable for use in `middleware.ts`.

## Goals / Non-Goals

**Goals:**
- Install shadcn Sidebar and `next-themes`
- Build `AppSidebar` with workspace name in header, all 7 nav items, and `UserMenu` in footer
- Add `PageHeader` component for use across all `(app)` pages
- Wire `ThemeProvider` into root layout with `defaultTheme="dark"`
- Add `middleware.ts` that protects `/(app)/**` routes and redirects to `/login`
- Add missing custom CSS tokens to `globals.css`

**Non-Goals:**
- Workspace switcher (placeholder workspace name only)
- Inbox unread badge (requires inbox API — Phase 1)
- Command palette (Phase 2)
- Mobile responsive drawer variant (deferred)
- Settings shell sub-navigation (separate task 0.5)

## Decisions

**Use shadcn Sidebar component, not custom layout**
Rationale: The doc explicitly mandates this. The shadcn Sidebar handles collapse state, `SidebarTrigger`, keyboard shortcut (`⌘B`), and ARIA natively. A custom layout would need to replicate all of this.

**`next-themes` for dark mode, `defaultTheme="dark"`**
Rationale: shadcn's CSS variable token system requires a `dark` class on `<html>` to switch themes. `next-themes` does this without flash via `attribute="class"`. Dark is the default per project memory.

**`proxy.ts` with optimistic cookie check (not `middleware.ts`)**
Rationale: Next.js 16 deprecated `middleware.ts` and renamed the convention to `proxy.ts` (with `export function proxy`). The API is otherwise identical. The Next.js auth guide also recommends that proxy should do **optimistic checks only** — reading the session cookie (`better-auth.session_token`) to decide whether to redirect, without calling the database. Full session validation still happens in API routes. This avoids a DB round-trip on every prefetched route.

**`PageHeader` as a simple presentational component**
Rationale: Every `(app)` page needs a consistent 48px header with title + right-side actions slot. A single shared component enforces the `text-sm font-medium` title style without per-page repetition. It accepts `title` and optional `actions` children.

**Keep font tokens as-is (Montserrat/Source Code Pro)**
Rationale: The `globals.css` already has these fonts and the theme tokens are wired. The UI/UX doc specifies Geist but the project started with Montserrat. Font migration is a separate cosmetic change; this task focuses on structure.

## Risks / Trade-offs

- **Middleware session check latency** → Better Auth session is validated from a Postgres-backed cookie; Upstash Redis caches sessions. Cold-start latency is acceptable (middleware runs on every `(app)` request).
- **Sidebar collapse state not persisted** → shadcn Sidebar stores collapse in a cookie by default. This is the correct behavior — no extra work needed.
- **`UserMenu` sign-out uses `authClient.signOut()`** → client-side sign-out then redirect to `/login`. Server-side session invalidation handled by Better Auth automatically.
