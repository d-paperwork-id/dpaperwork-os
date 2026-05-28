## ADDED Requirements

### Requirement: Authenticated layout uses shadcn SidebarProvider
The `app/(app)/layout.tsx` SHALL wrap its content in `SidebarProvider` from `@/components/ui/sidebar`, rendering `AppSidebar` and a main content area with `SidebarTrigger` in the page header row.

#### Scenario: App layout renders sidebar provider
- **WHEN** an authenticated user visits any `/(app)/**` route
- **THEN** the page renders with a collapsible sidebar on the left and main content on the right

### Requirement: AppSidebar contains workspace header, nav items, and user footer
The `AppSidebar` component SHALL render:
- `SidebarHeader` with the workspace name (fetched from `/api/workspace/me`, loading skeleton while pending)
- `SidebarContent` with a single `SidebarGroup` containing nav items: Chat (`/chat`), Inbox (`/inbox`), Domains (`/domains`), Routines (`/routines`), Projects (`/projects`), Integrations (`/integrations`), Settings (`/settings/profile`)
- `SidebarFooter` with `UserMenu` showing the signed-in user's name and a dropdown with "Profile" and "Sign out"

#### Scenario: Active nav item is highlighted
- **WHEN** the current pathname matches a nav item's href (or starts with it for non-root paths)
- **THEN** that `SidebarMenuButton` renders with `isActive={true}`

#### Scenario: Workspace name appears in sidebar header
- **WHEN** the workspace data has loaded
- **THEN** the workspace name is shown as `text-sm font-medium` text in the `SidebarHeader`

#### Scenario: Sign out from UserMenu
- **WHEN** the user clicks "Sign out" in the `UserMenu` dropdown
- **THEN** `authClient.signOut()` is called and the user is redirected to `/login`

### Requirement: PageHeader component renders page title and optional actions
The `PageHeader` component SHALL accept `title: string` and optional `children` (actions slot), render at `h-12` height with `px-6` padding, `text-sm font-medium text-foreground` for the title, and display children flush-right.

#### Scenario: Page header shows title
- **WHEN** a page renders `<PageHeader title="Inbox" />`
- **THEN** the header shows "Inbox" in a 48px bar with a bottom border

#### Scenario: Page header shows actions
- **WHEN** a page renders `<PageHeader title="Routines"><Button>New Routine</Button></PageHeader>`
- **THEN** the button appears in the right side of the header

### Requirement: Sidebar nav renders unread badge on Inbox item
The sidebar navigation SHALL render a `Badge` on the Inbox `NavItem` showing the unread inbox count. The badge SHALL be driven by `useInboxUnreadCount` hook and SHALL not render when count is 0.

#### Scenario: Inbox NavItem with badge
- **WHEN** unread count is greater than 0
- **THEN** Inbox NavItem renders with a numeric Badge component showing the count

#### Scenario: Inbox NavItem without badge
- **WHEN** unread count is 0 or loading
- **THEN** Inbox NavItem renders without any badge

### Requirement: ThemeProvider wraps root layout with dark default
The `app/layout.tsx` SHALL include `ThemeProvider` (from `next-themes`) with `attribute="class"` and `defaultTheme="dark"` wrapping all children, so the `dark` class is applied to `<html>` by default.

#### Scenario: Dark mode applied on first load
- **WHEN** a user visits the app without a stored theme preference
- **THEN** the `dark` class is present on `<html>` and dark token values are used

#### Scenario: Theme persists across navigation
- **WHEN** a user changes theme in settings and navigates to another page
- **THEN** the selected theme is still active (stored in a cookie by next-themes)

### Requirement: Proxy redirects unauthenticated users away from app routes
`proxy.ts` (Next.js 16 replaces `middleware.ts`) SHALL run on paths covering the app group (`/chat`, `/inbox`, `/domains`, `/routines`, `/projects`, `/integrations`, `/settings`). It SHALL perform an optimistic cookie check — if the `better-auth.session_token` cookie is absent, redirect to `/login`. No database call SHALL be made inside the proxy.

#### Scenario: Unauthenticated access redirected
- **WHEN** a request arrives at `/inbox` without a `better-auth.session_token` cookie
- **THEN** the proxy redirects the response to `/login`

#### Scenario: Authenticated request passes through
- **WHEN** a request arrives at `/inbox` with a `better-auth.session_token` cookie present
- **THEN** the proxy allows the request to proceed to the page handler

#### Scenario: Auth routes are not protected
- **WHEN** a request arrives at `/login` or `/register`
- **THEN** the proxy matcher excludes those paths and the auth page renders normally
