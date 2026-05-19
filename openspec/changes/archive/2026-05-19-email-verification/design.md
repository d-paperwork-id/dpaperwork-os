## Context

Registration is live but users land directly on `/` after sign-up with no proof they own the provided email. better-auth ships an `emailVerification` plugin that handles token generation, the verification callback, and optional `requireEmailVerification` enforcement. Resend (`resend@^6.12.3`) and `@react-email/render` are already in the project. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are already in `.env`.

## Goals / Non-Goals

**Goals:**
- Send a verification email on sign-up via Resend using a React Email template
- Block unverified sessions from protected routes until the link is clicked
- Add a `/verify-email` pending page users land on after registration

**Non-Goals:**
- Resend verification email flow (can be added later via better-auth's `sendVerificationEmail` on demand)
- Email change verification
- Third-party email providers other than Resend

## Decisions

**D1: better-auth `emailVerification` plugin**
Add `emailVerification({ sendVerificationEmail, autoSignInAfterVerification: true })` to the `plugins` array in `lib/auth.ts`. better-auth generates the token, builds the URL, and calls `sendVerificationEmail({ user, url, token })`. We only need to hand `url` to Resend. Alternative (custom token table + cron) rejected — more surface area, no benefit given better-auth already solves this.

**D2: `sendVerificationEmail` calls Resend server-side**
Inside the `sendVerificationEmail` hook, instantiate `new Resend(process.env.RESEND_API_KEY)`, render the React Email component to HTML with `render(<VerificationEmail url={url} />)`, and call `resend.emails.send()`. This runs entirely server-side inside `lib/auth.ts`. Alternative (API route that calls Resend) rejected — unnecessary hop; better-auth's hook is already server-side.

**D3: React Email template at `emails/verification.tsx`**
The template receives `url` as a prop and renders a minimal branded email with a "Verify email" button. Use `@react-email/ui` components (`Html`, `Button`, `Text`, `Section`). Rendered via `render()` from `@react-email/render` before passing to Resend. Alternative (plain text only) rejected — poor UX.

**D4: Proxy enforcement for unverified sessions**
The proxy already checks for a session. Extend it: if a session exists but `session.user.emailVerified` is false, redirect to `/verify-email` (not `/login`), except when the request is already targeting `/verify-email` or `/api/auth/*`. Authenticated-and-verified users hitting `/verify-email` are bounced to `/`. This keeps all enforcement in one place. Alternative (per-page server-side guard) rejected — misses API routes, duplicates logic.

**D5: Post-registration redirect to `/verify-email`**
Change `router.push("/")` → `router.push("/verify-email")` in `app/(auth)/register/page.tsx`. The `/verify-email` page is a static holding page (no server calls needed) that tells the user to check their inbox.

## Risks / Trade-offs

- **Resend delivery delay** → User lands on `/verify-email` and may not see the email for several seconds. Mitigation: copy in the page ("Check your spam if it doesn't arrive within a minute").
- **`requireEmailVerification` vs proxy-level enforcement** → better-auth's `requireEmailVerification: true` returns a 403 from API routes for unverified users. We enforce at the proxy level instead for full-page redirect UX. Both layers active gives defence-in-depth but the proxy is the primary UX gate.
- **Token expiry** → better-auth's default token expiry applies (24 h). Expired tokens show an error from the better-auth callback. Mitigation: accepted for now; resend flow is a follow-up.
- **`autoSignInAfterVerification: true`** → better-auth signs the user in immediately after clicking the link and redirects to `/`. This means verified users are auto-redirected without a separate login step — desirable UX.
