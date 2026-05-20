## 1. Database Schema

- [x] 1.1 Create `lib/db/schema/workspace.ts` with `workspaces` table (id, userId, name, industry, website, about, createdAt)
- [x] 1.2 Export `workspaces` from the main schema index
- [x] 1.3 Run `npm run db:push` to apply the schema to the database

## 2. API Route

- [x] 2.1 Create `app/api/workspace/route.ts` with a `POST` handler
- [x] 2.2 Validate request body with Zod (name, industry, website optional, about required)
- [x] 2.3 Authenticate the request via better-auth session; return 401 if unauthenticated
- [x] 2.4 Check for an existing workspace for the user; return 409 if one exists
- [x] 2.5 Insert the workspace row and return HTTP 201 with the created record

## 3. Onboarding Page

- [x] 3.1 Create `app/(auth)/onboarding/page.tsx` as a client component
- [x] 3.2 Build the form with fields: business name, industry, website (optional), about
- [x] 3.3 Add client-side validation (required fields, URL format for website)
- [x] 3.4 Wire up a TanStack Query `useMutation` to `POST /api/workspace`
- [x] 3.5 On success, redirect to `/dashboard` using `useRouter`
- [x] 3.6 Display API error messages inline on failure (409 duplicate, network errors)

## 4. Email Verification Redirect

- [x] 4.1 Update the better-auth `sendVerificationEmail` config to set `callbackURL` to `/onboarding`

## 5. Middleware Route Gating

- [x] 5.1 Add logic to middleware to redirect verified users without a workspace from `/dashboard` to `/onboarding`
- [x] 5.2 Add logic to middleware to redirect verified users with a workspace away from `/onboarding` to `/dashboard`
- [x] 5.3 Set a `workspace_created` cookie in the `POST /api/workspace` response to allow cheap middleware checks
