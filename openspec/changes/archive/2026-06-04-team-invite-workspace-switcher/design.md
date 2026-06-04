## Context

The current team invite flow (`POST /api/settings/members`) requires the invitee to already have a dpaperwork account — it looks up the user by email and inserts a `workspace_members` row directly. This means an admin cannot onboard a new colleague without asking them to sign up separately first. There is no email sent, no pending state, and no way to invite someone who doesn't exist yet.

The workspace switcher in the sidebar is a styled button that shows the current workspace name but is not wired to any data or interaction — clicking it does nothing.

**Constraints:**
- Better Auth owns the `user` table and sign-up flow; we cannot change how accounts are created.
- The invite accept page at `/invite/[token]` must be a public route (no workspace auth guard).
- `workspace_members.userId` is a NOT NULL FK — a row can only be inserted once the user exists.
- Resend is the email provider; env var `RESEND_API_KEY` must be provisioned.

## Goals / Non-Goals

**Goals:**
- Admin can invite any email address; invitee receives an email with a tokenized link
- Invitee creates an account (or signs in) and then accepts the workspace invite
- Already-logged-in invitees see an immediate accept screen without re-authenticating
- All workspaces the current user belongs to are accessible from the sidebar switcher
- Members page shows pending invites alongside active members, with resend/revoke

**Non-Goals:**
- Magic-link or passwordless sign-in (Better Auth handles sign-up; we don't change that flow)
- Per-invite agent assignments (Phase 2.3 scope, not this change)
- Invite to a specific role beyond what's in the invite record
- Email template customization per workspace

## Decisions

### Decision 1: `workspace_invitations` table (not just a `pending` flag on `workspace_members`)

A separate `workspace_invitations` table holds the invite record until it is accepted. Only on acceptance do we insert a `workspace_members` row. 

**Why not a `status` column on `workspace_members`?** `workspace_members.user_id` is NOT NULL, and an invitation by definition has no user yet (the invitee may not have an account). Forcing a nullable `user_id` would violate the data model. A separate table cleanly separates "invite pending" from "membership active."

**Columns:** `id` (inv_…), `workspace_id`, `email`, `role_id`, `token` (unique, URL-safe random string), `invited_by_user_id`, `status` (pending | accepted | revoked | expired), `expires_at` (7 days from creation), `created_at`, `updated_at`.

### Decision 2: Token in URL, not time-based OTP

The invite link is `https://app.dpaperwork.com/invite/[token]`. The token is a 32-character nanoid stored in the DB. This is simpler than a signed JWT (no secret rotation concern) and allows revocation (delete/revoke the row). Tokens expire after 7 days (aligned with the app-flow spec for invite expiry).

### Decision 3: Three-branch accept flow on one page

`/invite/[token]` is a single public Next.js page that reads session state on the client and branches:
1. **No session** → show two CTAs: "Create account" (link to `/sign-up?invite=[token]`) and "Sign in" (link to `/sign-in?invite=[token]`). After auth completes Better Auth redirects back to `/invite/[token]` (callbackURL).
2. **Session present, workspace mismatch** → show "Accept invite from [Workspace Name]" with an Accept button that calls `POST /api/invite/[token]/accept`.
3. **Session present, already a member** → redirect immediately to `/inbox`.

The sign-up and sign-in pages already exist; we add `?invite=[token]` query parameter pass-through so the redirect URL after auth returns to `/invite/[token]`.

### Decision 4: Workspace switcher uses a new `GET /api/workspace/memberships` endpoint

The existing `GET /api/workspace/me` returns a single workspace object. Rather than change its shape (which would break existing callers), we add a new endpoint `GET /api/workspace/memberships` that returns an array of `{ id, name, slug }` for all active workspaces the user belongs to. The sidebar fetches this and renders a `DropdownMenu` over the existing workspace button.

Switching workspaces sets a `active-workspace-id` cookie (httpOnly, SameSite=Lax). The `getWorkspaceForUser` helper (used by all API routes) reads this cookie first, falling back to the first membership. This keeps multi-workspace routing transparent to every existing API route.

### Decision 5: React Email for the invite email template

The invite email is built with `react-email` + `@react-email/components` rather than a raw HTML string. The template lives at `emails/workspace-invite.tsx` and is rendered to HTML via `render()` from `@react-email/components` at send time inside the API route.

**Why react-email over a plain HTML string?** The template is a real React component — typed props (`workspaceName`, `inviterName`, `acceptUrl`), composable layout primitives (`Html`, `Body`, `Section`, `Button`, `Text`), and inline-style handling that works across email clients. It can be previewed locally with `bunx email dev`. A raw string would be fragile, hard to read, and impossible to preview without sending a real email.

**Template content:** dpaperwork logo text, "You've been invited to join [Workspace Name]" heading, one sentence from the inviter, a prominent "Accept invite" button (links to `acceptUrl`), and a plain-text fallback link below the button. No workspace branding or custom colors in v1 — uses dpaperwork's own palette.

### Decision 6: Members page shows invites separately from active members

`GET /api/settings/invitations` returns pending invites for the workspace (email, role, invited_by, created_at, status). The Members page renders two sections: "Active members" (existing list) and "Pending invites" (new section). Each pending invite row has Resend and Revoke actions.

## Risks / Trade-offs

- **Cookie-based workspace selection** introduces statefulness per browser session. If a user is a member of only one workspace (the common case), the cookie is never set and the fallback covers it. Risk is low for v1; future enhancement is to support URL-based workspace routing (`/[slug]/inbox`).
- **Invite token exposure in URL** — tokens are single-use (status changes to `accepted` on first use) and expire in 7 days. Risk is low for a B2B product where invite emails go to trusted colleagues.
- **Email delivery failures** — Resend is reliable, but if the email fails to send, the invite row is still created. The admin will see the pending invite in the Members page and can Resend. This is acceptable.
- **Sign-up redirect loop** — if Better Auth's callbackURL isn't passed through correctly, new users land on `/inbox` instead of `/invite/[token]` after sign-up. Mitigation: test this flow explicitly; Better Auth supports `callbackURL` as a query parameter on the sign-up redirect.

## Migration Plan

1. Add `workspace_invitations` table via `db:generate` + `db:push`
2. Add `RESEND_API_KEY` to `.env` and Vercel env vars
3. Deploy new API routes and pages
4. No data migration needed — existing `workspace_members` rows are unaffected; the old direct-add behavior is replaced by the invite flow in the UI only

## Open Questions

- Should invited admins get the `Admin` system role by default, or should the inviting admin explicitly choose? (Proposed: inviting admin chooses role at invite time, same as current modal.)
- What should the invite email look like? (Proposed: plain text with workspace name, inviter name, and accept link — no branded template for v1.)
