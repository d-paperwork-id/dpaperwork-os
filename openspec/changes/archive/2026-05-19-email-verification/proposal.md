## Why

Users can currently register with any email address and immediately access the platform with no proof of ownership. Adding email verification at registration ensures accounts are tied to real, accessible inboxes before granting access.

## What Changes

- Enable better-auth's `emailVerification` plugin with `sendVerificationEmail` wired to Resend
- Create a React Email template for the verification email
- Add a `/verify-email` pending page users land on after registration
- Update the proxy to allow unverified users through to `/verify-email` only (block all other routes until verified)
- Update post-registration redirect from `/` to `/verify-email`

## Capabilities

### New Capabilities

- `email-verification`: Sending the verification email via Resend + React Email, the `/verify-email` holding page, and proxy enforcement that blocks unverified sessions from accessing protected routes

### Modified Capabilities

- `user-registration`: Post-registration redirect changes from `/` to `/verify-email` pending page (verified behaviour: once link is clicked, user is redirected to `/`)

## Impact

- **better-auth**: Add `emailVerification({ sendVerificationEmail })` to the `plugins` array in `lib/auth.ts`; hook provides `user`, `url`, and `token` — pass `url` directly to Resend
- **New file**: `emails/verification.tsx` — React Email component for the verification email
- **New file**: `app/(auth)/verify-email/page.tsx` — static holding page telling the user to check their inbox
- **Modified**: `lib/auth.ts` — add `emailVerification` plugin
- **Modified**: `app/(auth)/register/page.tsx` — change `router.push("/")` to `router.push("/verify-email")`
- **Modified**: `proxy.ts` — add `/verify-email` to the unauthenticated-allowed list; add verified-session check to block unverified users from `/` and other protected routes
- **Dependencies already installed**: `resend@^6.12.3`, `@react-email/render`, `@react-email/ui`, `react-email`; `RESEND_API_KEY` and `RESEND_FROM_EMAIL` already in `.env`
