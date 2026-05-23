## 1. Workspace Cookie

- [x] 1.1 In `app/api/workspace/route.ts`, after the successful transaction, set a `has_workspace=1` cookie on the `NextResponse` (httpOnly, sameSite: lax, path: /)

## 2. Workspace ME API

- [x] 2.1 Create `app/api/workspace/me/route.ts` — `GET` handler that returns `{ id, name, slug }` for the authenticated user's active workspace (401 if no session, 404 if no workspace)

## 3. Proxy (Route Guard)

- [x] 3.1 Check `lib/auth.ts` to identify the exact cookie name better-auth uses for the session token
- [x] 3.2 Create `proxy.ts` at repo root — export `proxy` function (Next.js 16 convention, not `middleware`)
- [x] 3.3 Add `config.matcher` excluding `/api/*`, `/_next/static/*`, `/_next/image/*`, and static file extensions
- [x] 3.4 Implement session check — read session cookie from `req.cookies`; redirect to `/login` if absent
- [x] 3.5 Implement workspace check — read `has_workspace` cookie; redirect to `/onboarding` if missing and route is under app paths
- [x] 3.6 Add onboarding guard — redirect to `/inbox` if user has both session and `has_workspace` cookie but targets `/onboarding`
- [x] 3.7 Add root redirect logic — `/` with session + workspace → `/inbox`, session only → `/onboarding`, none → `/login`

## 4. App Shell Layout

- [x] 4.1 Create `app/(app)/layout.tsx` as a client component that wraps all app routes with the sidebar
- [x] 4.2 Build `components/sidebar.tsx` — nav items: Chat (`/chat`), Inbox (`/inbox`), Domains (`/domains`), Routines (`/routines`), Projects (`/projects`), Integrations (`/integrations`), Settings (`/settings/profile`)
- [x] 4.3 Use `usePathname()` in sidebar to apply active highlighting to the current route's nav item
- [x] 4.4 Fetch workspace with `GET /api/workspace/me` via TanStack Query; display workspace name in sidebar header with a skeleton while loading
- [x] 4.5 Use shadcn/ui `Button` (variant ghost) or plain `Link` with class styling for nav items; keep sidebar visually consistent with dark mode default

## 5. Inbox Page

- [x] 5.1 Create `app/(app)/inbox/page.tsx` — render a heading ("Inbox") and a welcome card or empty state within the app shell

## 6. Onboarding Redirect Fix

- [x] 6.1 Update `app/(auth)/onboarding/page.tsx` — change `onSuccess` redirect from `/dashboard` to `/inbox`
- [x] 6.2 Update the 409 error handler in the same file to redirect to `/inbox`
