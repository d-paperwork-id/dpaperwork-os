## 1. Database & better-auth Server Setup

- [x] 1.1 Confirm `better-auth` and `@better-auth/drizzle-adapter` are present in `package.json` (both are already installed at 1.6.11 — no install needed)
- [x] 1.2 Create `lib/db/schema/auth.ts` — define `user`, `session`, `account`, and `verification` tables using Drizzle schema that matches better-auth's expected column names
- [x] 1.3 Run `npm run db:push` to apply the auth schema to Neon Postgres
- [x] 1.4 Create `lib/auth.ts` — call `betterAuth()` (from `"better-auth"`) with `emailAndPassword: { enabled: true }`, `database: drizzleAdapter(db, { provider: "pg", schema })` (from `"@better-auth/drizzle-adapter"`), and the `nextCookies()` plugin (from `"better-auth/next-js"`) for App Router cookie handling
- [x] 1.5 Create `app/api/auth/[...all]/route.ts` — call `toNextJsHandler(auth.handler)` (from `"better-auth/next-js"`) and export the returned object spread as named exports: `export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(auth.handler)`

## 2. Auth Client Singleton

- [x] 2.1 Create `lib/auth-client.ts` — call `createAuthClient()` (from `"better-auth/client"`) and export as `authClient`; no baseURL config needed for same-origin requests in Next.js

## 3. Route Protection Proxy

- [x] 3.1 Create `proxy.ts` at the project root (Next.js 16 — `middleware.ts` is deprecated; function name is `proxy`, type is `NextProxy` from `"next/server"`) — import `auth` from `"@/lib/auth"` and check session with `auth.api.getSession({ headers: request.headers })`
- [x] 3.2 Export a `config` object with a `matcher` that excludes `/api/auth/:path*`, `/_next/static/:path*`, `/_next/image/:path*`, `favicon.ico`, `sitemap.xml`, and `robots.txt`
- [x] 3.3 Redirect unauthenticated requests (no session) to `/login` using `NextResponse.redirect`
- [x] 3.4 Redirect authenticated requests arriving at `/login` or `/register` to `/` using `NextResponse.redirect`

## 4. Auth Route Group Layout

- [x] 4.1 Create `app/(auth)/layout.tsx` — server component, centered card layout with no nav chrome; use Tailwind flex/grid to vertically and horizontally center the slot

## 5. Registration Page

- [x] 5.1 Create `app/(auth)/register/page.tsx` — add `'use client'` directive; render email + password inputs and a submit button
- [x] 5.2 Manage form state with `useState`; call `authClient.signUp.email({ email, password, name: email })` on submit
- [x] 5.3 On success (`data` truthy, no `error`) push to `/` with `useRouter` from `"next/navigation"`
- [x] 5.4 On failure display `error.message` as inline error below the form
- [x] 5.5 Add client-side validation before calling the API: reject empty email, invalid email format, and password shorter than 8 characters
- [x] 5.6 Add a "Sign in" link pointing to `/login` for users who already have an account

## 6. Login Page

- [x] 6.1 Create `app/(auth)/login/page.tsx` — add `'use client'` directive; render email + password inputs and a submit button
- [x] 6.2 Manage form state with `useState`; call `authClient.signIn.email({ email, password })` on submit
- [x] 6.3 On success push to `/` with `useRouter` from `"next/navigation"`
- [x] 6.4 On failure display a generic "Invalid email or password" message (do not echo the server error — avoids email enumeration)
- [x] 6.5 Add a "Create account" link pointing to `/register` for new users

## 7. Home Page Guard

- [x] 7.1 Review `app/page.tsx` — middleware handles all redirects; no per-page session check needed; replace placeholder content with a minimal authenticated landing (e.g. "Welcome" heading)

## 8. Environment Variables

- [x] 8.1 Add `BETTER_AUTH_SECRET` (random 32-char string) and `BETTER_AUTH_URL` (e.g. `http://localhost:3000`) to `.env.example`
- [x] 8.2 Ensure both vars exist in the local `.env` file before running `npm run dev`
