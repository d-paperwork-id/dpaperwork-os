## 1. better-auth Plugin & Server Config

- [x] 1.1 In `lib/auth.ts`, import `emailVerification` from `"better-auth/plugins"` and add it to the `plugins` array with `sendVerificationEmail` callback and `autoSignInAfterVerification: true`
- [x] 1.2 Inside `sendVerificationEmail`, instantiate `new Resend(process.env.RESEND_API_KEY!)` (import `Resend` from `"resend"`), render the verification email template to HTML, and call `resend.emails.send()` with `from: process.env.RESEND_FROM_EMAIL!`, `to: user.email`, `subject: "Verify your email"`, and the rendered `html`

## 2. React Email Template

- [x] 2.1 Create `emails/verification.tsx` — a React Email component accepting a `url: string` prop; use `@react-email/ui` components (`Html`, `Head`, `Body`, `Section`, `Text`, `Button`, `Preview`) to build a minimal email with a "Verify your email address" heading and a "Verify email" button linking to `url`
- [x] 2.2 In `lib/auth.ts`, import the component and `render` from `"@react-email/render"`; call `await render(<VerificationEmail url={url} />)` to produce the HTML string before passing to Resend

## 3. Verification Pending Page

- [x] 3.1 Create `app/(auth)/verify-email/page.tsx` — server component (no `'use client'`); display a heading "Check your inbox" and a message telling the user a verification link was sent and to check spam if it hasn't arrived within a minute

## 4. Proxy Updates

- [x] 4.1 In `proxy.ts`, add `/verify-email` to the unauthenticated bypass list so users without a session are redirected to `/login` (not trapped in a loop) — update the `isAuthPage` check to include `/verify-email`
- [x] 4.2 After the existing session check, add a verified-session guard: if session exists and `session.user.emailVerified === false` and the path is not `/verify-email`, redirect to `/verify-email`
- [x] 4.3 Add a guard: if session exists and `session.user.emailVerified === true` and the path is `/verify-email`, redirect to `/`
- [x] 4.4 Update the `config.matcher` to continue excluding `/api/auth/:path*`, `/_next/*`, `favicon.ico`, `sitemap.xml`, and `robots.txt` (no change needed — existing pattern already handles this)

## 5. Registration Page Update

- [x] 5.1 In `app/(auth)/register/page.tsx`, change `router.push("/")` on successful sign-up to `router.push("/verify-email")`

## 6. Environment & Build Verification

- [x] 6.1 Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are present in `.env` (both already exist — no change needed)
- [x] 6.2 Run `npm run build` to verify the project compiles without errors
