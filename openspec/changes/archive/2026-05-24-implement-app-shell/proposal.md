## Why

The app currently has a hand-rolled sidebar with no dark-mode support, no auth guard middleware, and no page header component. Before any Phase 1 surface can be built, the authenticated shell needs to match the spec: shadcn Sidebar, ThemeProvider, UserMenu, page header, and middleware that redirects unauthenticated users.

## What Changes

- Replace the custom `components/sidebar.tsx` with a shadcn `Sidebar`-based `AppSidebar` that includes `SidebarHeader` (workspace name placeholder), nav items (Chat, Inbox, Domains, Routines, Projects, Integrations, Settings), and `SidebarFooter` (user avatar + name + sign-out dropdown)
- Rewrite `app/(app)/layout.tsx` to use `SidebarProvider` + `AppSidebar` + a page-level `PageHeader` component
- Add a `PageHeader` component (48px, `text-sm font-medium`, right-side actions slot) used by all `(app)` pages
- Add `ThemeProvider` (`next-themes`) wrapping the root layout with `defaultTheme="dark"` and `attribute="class"`
- Add `proxy.ts` (Next.js 16's replacement for `middleware.ts`) that does an optimistic cookie check on all `/(app)/**` routes and redirects to `/login` if the session cookie is absent
- Add dpaperwork custom CSS tokens to `globals.css` (`--header-height`, `--panel-width`, agent identity colors)

## Capabilities

### New Capabilities

- `app-shell`: Authenticated layout shell — SidebarProvider, AppSidebar, PageHeader, ThemeProvider, and auth guard middleware

### Modified Capabilities

<!-- none -->

## Impact

- `app/(app)/layout.tsx` — rewritten
- `components/sidebar.tsx` — replaced by `components/app-sidebar.tsx`
- `components/page-header.tsx` — new
- `app/layout.tsx` — ThemeProvider added
- `app/providers.tsx` — ThemeProvider wired in
- `proxy.ts` — new file at repo root (Next.js 16 convention)
- `app/globals.css` — custom tokens added
- New dependencies: `next-themes`, shadcn `sidebar` component
