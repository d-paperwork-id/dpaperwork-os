## Context

The app currently has no authentication. `app/page.tsx` renders an unauthenticated landing. The stack includes better-auth (already declared as the auth library), Drizzle ORM with Neon Postgres, Next.js App Router (API-routes only — no SSR data fetching), and TanStack Query for client-side data. Better-auth requires its own DB tables and a catch-all API route.

## Goals / Non-Goals

**Goals:**
- Email + password registration and login with better-auth
- Session-based auth persisted in the DB
- Protected route enforcement via Next.js middleware
- Client and server auth singletons wired up for use across the app

**Non-Goals:**
- OAuth / social providers (future work)
- Email verification flow (can be enabled later via better-auth plugin)
- Password reset flow
- Role/permission system (separate capability)
- Any tenant-specific auth customization

## Decisions

**D1: better-auth as the single auth source of truth**
better-auth handles session creation, cookie management, and token rotation. We do not implement custom JWT logic. Rationale: avoids reinventing session security; better-auth is already declared in the architecture.

**D2: Catch-all API route at `app/api/auth/[...all]/route.ts`**
better-auth's Next.js adapter exports a handler that mounts on this path. All auth HTTP traffic routes through it. Alternative (custom routes per action) was rejected — more surface area, harder to keep in sync with better-auth internals.

**D3: Drizzle adapter for better-auth**
`@better-auth/drizzle-adapter` (already installed at 1.6.11) is used with `provider: "pg"` and the platform's existing Neon connection. Auth tables are defined in `lib/db/schema/auth.ts` and applied via `db:push`, keeping a single DB connection pattern. Alternative (better-auth's built-in SQLite) rejected — platform uses Postgres exclusively.

**D4: `proxy.ts` for route protection**
Next.js 16 deprecates `middleware.ts` in favour of `proxy.ts` at the project root (same location, function renamed from `middleware` to `proxy`, type is `NextProxy` from `"next/server"`). The proxy uses better-auth's `auth.api.getSession({ headers: request.headers })` to check the session cookie. Unauthenticated requests redirect to `/login`; already-authenticated requests arriving at `/login` or `/register` redirect to `/`. The proxy runtime is Node.js (not Edge), so the DB call in `getSession` is supported. Alternative (per-page checks in layout) rejected — duplicates logic and misses API routes.

**D5: `(auth)` route group for login/register pages**
Grouping under `app/(auth)/` gives a shared layout (centered card, no sidebar) without polluting the URL. The group layout renders no nav chrome — just the auth form centered on screen.

**D6: Client-side form with better-auth client methods**
Forms call `authClient.signUp.email` / `authClient.signIn.email` directly (from `"better-auth/client"` via `createAuthClient()`). The better-auth client posts to `/api/auth/*` internally — no custom route or TanStack Query mutation needed for auth forms. No Server Actions used (project constraint). `useRouter` from `"next/navigation"` handles post-auth redirects.

## Risks / Trade-offs

- **better-auth schema drift** → Pin better-auth version; run `db:push` after any upgrade and review generated schema changes before applying.
- **Middleware cold-start latency** → better-auth `getSession` does a DB round-trip per request. Mitigation: use the Edge-compatible session cache (cookie-based session token) if latency becomes an issue.
- **No email verification at launch** → Users can register with any email address. Mitigation: enable the email verification plugin in a follow-up change before exposing to real users.
