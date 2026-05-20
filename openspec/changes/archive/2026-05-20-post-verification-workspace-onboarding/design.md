## Context

After email verification, better-auth currently redirects the user to `/`. There is no workspace or tenant record associated with the user, so the platform has no business context to configure AI agents. This change intercepts the post-verification redirect and routes the user through a lightweight onboarding form before they reach the dashboard.

The existing stack: Next.js app router, better-auth, Drizzle ORM + Neon Postgres, TanStack Query for client-side data fetching, Tailwind CSS v4.

## Goals / Non-Goals

**Goals:**
- Show an onboarding form (`/onboarding`) immediately after email verification succeeds.
- Collect business name, industry, website (optional), and a short description.
- Persist the workspace to a new `workspaces` table via `POST /api/workspace`.
- Redirect to `/dashboard` after workspace creation.
- Gate `/dashboard` so users without a workspace are sent back to `/onboarding`.

**Non-Goals:**
- Multi-step wizard UI — a single-page form is sufficient for now.
- Logo upload or branding customization at onboarding time.
- Inviting team members during onboarding.
- Multi-workspace support per user (one workspace per user at signup).

## Decisions

### 1. `/onboarding` as a dedicated Next.js page (not a modal)
A full page allows deep-linking the verification callback directly to `/onboarding` and makes the route easy to guard in middleware.  
**Alternative considered**: Show onboarding as a modal on `/dashboard`. Rejected because the better-auth callback URL must be a real route and mixing new-user and returning-user flows in one page adds complexity.

### 2. Redirect from better-auth callback via `callbackURL`
better-auth's `sendVerificationEmail` hook supports a `callbackURL` parameter. Setting it to `/onboarding` means the verification link lands the user there with no middleware logic needed for the redirect.  
**Alternative considered**: Intercept in middleware by checking workspace existence on every request. Rejected as too expensive — adds a DB round-trip to every protected request.

### 3. Workspace existence check in middleware for route gating
Middleware reads a lightweight `hasWorkspace` flag (stored in the session or checked via a dedicated cookie set after workspace creation). If the flag is absent and the route is `/dashboard`, redirect to `/onboarding`.  
**Alternative considered**: Store workspace ID in the JWT/session claim. Preferred because it avoids a DB query in middleware. After workspace creation the API route sets a `workspace_created` cookie that middleware can read cheaply.

### 4. `POST /api/workspace` — API route, no server actions
Consistent with the project's API-routes-only policy. The client form submits via a TanStack Query `useMutation`.

### 5. New `workspaces` Drizzle schema (`lib/db/schema/workspace.ts`)
Fields: `id`, `userId` (FK to better-auth users), `name`, `industry`, `website` (nullable), `about`, `createdAt`.

## Risks / Trade-offs

- **User skips onboarding by navigating directly** → Mitigation: middleware redirects any verified user without a workspace back to `/onboarding` when they try to reach `/dashboard`.
- **Verification callback URL hardcoded to `/onboarding`** → if onboarding is ever removed, the redirect must be updated in the auth config too.
- **Cookie-based workspace flag can be cleared by the user** → Mitigation: middleware falls back to a DB check if the cookie is absent (lazy guard, not primary path).

## Migration Plan

1. Add `workspaces` table migration (`npm run db:push`).
2. Deploy API route and onboarding page.
3. Update `callbackURL` in better-auth `sendVerificationEmail` config to `/onboarding`.
4. Update middleware to add the `/onboarding` guard.

Rollback: revert `callbackURL` to `/` and remove the middleware guard — existing users are unaffected since they have no workspace record to check.

## Open Questions

- Should industry be a free-text field or a dropdown of predefined values? (Recommendation: free-text for now, dropdown later.)
- Should the workspace name default to the business name, or be a separate field? (Recommendation: treat them as the same for MVP.)
