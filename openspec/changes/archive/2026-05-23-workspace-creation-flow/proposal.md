## Why

The workspace creation backend (form, API, seed) is fully implemented, but the app has no routing layer to guide users through the sign-up → verify → onboarding → app journey. Authenticated users land on `/` with no direction, and the app shell (sidebar, navigation) doesn't exist, so there's nothing to land in after workspace creation.

## What Changes

- Add a Next.js 16 `proxy.ts` (the renamed `middleware.ts`) that gates routes by auth/workspace state using optimistic cookie checks only (no DB queries): unauthenticated → `/login`, no workspace cookie → `/onboarding`, has workspace → app
- Add an authenticated app layout (`app/(app)/layout.tsx`) with a persistent left sidebar showing the primary navigation (Chat, Inbox, Domains, Routines, Projects, Integrations, Settings)
- Add a root redirect at `app/page.tsx` that sends users to `/inbox` (or `/login` if unauthenticated)
- Add a minimal `/inbox` page as the authenticated landing point post-onboarding
- Wire up workspace context to the app shell so the current workspace is available client-side

## Capabilities

### New Capabilities

- `workspace-route-guard`: Next.js middleware that checks session + workspace membership and redirects users to the correct route (login, onboarding, or app) based on their state
- `app-shell`: Authenticated app layout with persistent sidebar navigation and workspace context provider

### Modified Capabilities

- `workspace-onboarding`: Post-submit redirect changes from `/dashboard` (non-existent) to `/inbox`

## Impact

- `proxy.ts` — new file at repo root (Next.js 16 convention replacing `middleware.ts`)
- `app/(app)/layout.tsx` — new authenticated layout wrapping all app routes
- `app/(app)/inbox/page.tsx` — new placeholder page as post-onboarding landing
- `app/page.tsx` — updated to redirect based on session state
- `app/(auth)/onboarding/page.tsx` — redirect target updated from `/dashboard` to `/inbox`
- `app/api/workspace/me/route.ts` — new GET route returning current user's workspace (used by app shell to resolve workspace client-side)
- `app/api/workspace/route.ts` — sets a `has_workspace=1` cookie on successful workspace creation (read by proxy for optimistic routing)
- No schema changes
