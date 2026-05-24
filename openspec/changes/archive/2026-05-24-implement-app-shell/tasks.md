## 1. Dependencies

- [x] 1.1 Install `next-themes` (`bun add next-themes`)
- [x] 1.2 Install shadcn Sidebar component (`bunx shadcn@latest add sidebar`)

## 2. CSS Tokens

- [x] 2.1 Add dpaperwork custom tokens to `app/globals.css`: `--header-height: 48px`, `--panel-width: 380px`, agent identity colors (`--agent-pm`, `--agent-chief-of-staff`, `--agent-ea`)

## 3. ThemeProvider

- [x] 3.1 Create `components/theme-provider.tsx` that re-exports `ThemeProvider` from `next-themes`
- [x] 3.2 Wrap `app/layout.tsx` body children in `ThemeProvider` with `attribute="class"` and `defaultTheme="dark"`

## 4. AppSidebar

- [x] 4.1 Create `components/app-sidebar.tsx` using `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarFooter` from `@/components/ui/sidebar`
- [x] 4.2 Add nav items array (Chat, Inbox, Domains, Routines, Projects, Integrations, Settings) with correct hrefs and lucide icons
- [x] 4.3 Add workspace name in `SidebarHeader` — fetch from `/api/workspace/me` via TanStack Query, show loading skeleton while pending
- [x] 4.4 Create `components/user-menu.tsx` — shows signed-in user's name and avatar initials, dropdown with "Profile" (`/settings/profile`) and "Sign out" (calls `authClient.signOut()` then `router.push('/login')`)
- [x] 4.5 Add `UserMenu` to `SidebarFooter`
- [x] 4.6 Delete `components/sidebar.tsx` (replaced by `components/app-sidebar.tsx`)

## 5. PageHeader

- [x] 5.1 Create `components/page-header.tsx` — accepts `title: string` and optional `children` (actions slot), renders `h-12 px-6 flex items-center justify-between border-b border-border shrink-0` with `SidebarTrigger` on the left, title (`text-sm font-medium text-foreground`) next to it, and children flush-right

## 6. App Layout

- [x] 6.1 Rewrite `app/(app)/layout.tsx` to use `SidebarProvider` wrapping `AppSidebar` and a `<main className="flex-1 min-w-0 flex flex-col overflow-hidden">` that renders `{children}`

## 7. Proxy (auth guard)

- [x] 7.1 Create `proxy.ts` at the repo root (Next.js 16 replaces `middleware.ts`) — export `proxy` function that reads the `better-auth.session_token` cookie from `req.cookies`, redirects to `/login` if the cookie is absent; no database call in proxy (optimistic check only)
- [x] 7.2 Export `config` with the correct `matcher` array that covers all `/(app)` paths (`/chat`, `/inbox`, `/domains`, `/routines`, `/projects`, `/integrations`, `/settings`) but excludes `/api`, `/_next`, `/login`, `/register`, `/verify-email`, `/onboarding`
