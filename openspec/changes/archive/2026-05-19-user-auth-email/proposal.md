## Why

The platform has no authentication layer, so users cannot register, log in, or be identified — blocking all tenant-specific functionality. Implementing better-auth email authentication is the first gate before any multi-tenant or AI features can be used.

## What Changes

- Add `/register` page with email + password sign-up form
- Add `/login` page with email + password sign-in form
- Protect routes via better-auth session middleware
- Add better-auth server setup with email/password provider
- Add auth client singleton for use in client components
- Redirect unauthenticated users to `/login`; redirect authenticated users away from auth pages

## Capabilities

### New Capabilities

- `user-registration`: Email + password sign-up flow — form, validation, API call, redirect on success
- `user-login`: Email + password sign-in flow — form, validation, session creation, redirect on success
- `auth-session`: Session checking middleware and protected-route enforcement via better-auth

### Modified Capabilities

<!-- None — no existing specs -->

## Impact

- **Existing dependencies used**: `better-auth@1.6.11` and `@better-auth/drizzle-adapter@1.6.11` are already installed — no new packages needed
- **New files**: `app/(auth)/register/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/layout.tsx`, `lib/auth.ts` (server), `lib/auth-client.ts` (client), `app/api/auth/[...all]/route.ts`, `middleware.ts`
- **Modified**: `app/page.tsx` — confirm middleware handles redirect (no per-page guard needed)
- **Database**: better-auth requires `user`, `session`, `account`, `verification` tables in Neon Postgres — added to `lib/db/schema/auth.ts` and applied via `db:push`
- **Next.js version**: 16.2.6 App Router — route handler at `app/api/auth/[...all]/route.ts` exports named HTTP methods via `toNextJsHandler`; auth forms are `'use client'` components calling `authClient` methods directly (no Server Actions)
