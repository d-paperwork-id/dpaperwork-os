## 1. Database Schema

- [x] 1.1 Add `workspace_invitations` table to `db/schema/workspace.ts` with columns: `id` (inv_…), `workspaceId`, `email`, `roleId` (nullable FK → workspace_roles.id), `token` (unique), `invitedByUserId` (nullable), `status` (enum: pending | accepted | revoked | expired, default pending), `expiresAt`, `createdAt`, `updatedAt`. Add composite index on `(workspaceId, status)` and index on `email`.
- [x] 1.2 Run `npm run db:generate` and `npm run db:push` to apply the new table.
- [x] 1.3 Add `RESEND_API_KEY` to `.env` and install packages: `npm install resend react-email @react-email/components`.

## 2. React Email Template

- [x] 2.1 Create `emails/workspace-invite.tsx` — React Email component with typed props `{ workspaceName: string, inviterName: string, acceptUrl: string }`. Use `Html`, `Body`, `Container`, `Heading`, `Text`, `Button`, `Hr`, `Link` from `@react-email/components`. Structure: dpaperwork heading, "You've been invited to join [workspaceName] by [inviterName]" text, prominent `Button` linking to `acceptUrl`, plain-text fallback link below button.
- [x] 2.2 Verify the template renders without errors by running `bunx email dev` and previewing in the browser.

## 3. Invitation API Routes

- [x] 3.1 Create `app/api/settings/invitations/route.ts` — `GET` returns pending invites for the workspace (joined with roles + inviter user); `POST` validates email + roleId, checks for existing member/pending invite (409), inserts invite row, calls `render(<WorkspaceInviteEmail ... />)` to produce HTML, sends via Resend, returns 201.
- [x] 3.2 Create `app/api/settings/invitations/[id]/route.ts` — `DELETE` revokes the invite (sets status = revoked); `POST /resend` sub-route resets expiresAt and re-sends the email using the same React Email template.
- [x] 3.3 Create `app/api/invite/[token]/route.ts` — `GET` is public (no auth check), returns `{ workspaceName, inviterName, email, status }` for the token; returns 404 for missing/expired/revoked tokens.
- [x] 3.4 Create `app/api/invite/[token]/accept/route.ts` — `POST` requires session; validates token status and expiry; inserts `workspace_members` row; sets invite status to accepted; returns 201 with workspace details. Returns 410 for expired, 409 for already member (graceful), 401 for no session.

## 4. Workspace Memberships API

- [x] 4.1 Create `app/api/workspace/memberships/route.ts` — `GET` returns all active workspaces for the authenticated user, ordered by `joined_at asc`.
- [x] 4.2 Update `lib/workspace.ts` `getWorkspaceForUser` to read `active-workspace-id` cookie first (validate it belongs to the user), fall back to first active membership if absent or invalid.

## 5. Accept Invite Page

- [x] 5.1 Create `app/invite/[token]/page.tsx` — public page (outside `(app)` layout, no workspace guard). Fetches `GET /api/invite/[token]` client-side. Branches on session state: no session → show workspace/inviter info + "Create account" and "Sign in" buttons with `callbackURL=/invite/[token]`; session present → show accept screen.
- [x] 5.2 Wire "Create account" button to `/sign-up?callbackURL=/invite/[token]` and "Sign in" button to `/sign-in?callbackURL=/invite/[token]`.
- [x] 5.3 Wire "Accept invite" button to call `POST /api/invite/[token]/accept`; on success redirect to `/inbox` with a toast "Welcome to [Workspace Name]!"; handle `alreadyMember: true` by redirecting to `/inbox` silently.
- [x] 5.4 Handle error states: invalid/expired token → show error message; revoked token → show "This invite has been revoked"; accept API failure → show error with retry.
- [x] 5.5 Add skeleton loading state while invite metadata is loading.
- [x] 5.6 Exclude `/invite/[token]` from auth middleware workspace guard (ensure it's not under `(app)` layout and middleware does not redirect it).

## 6. WorkspaceSwitcher Component

- [x] 6.1 Create `components/workspace-switcher.tsx` — client component that fetches `GET /api/workspace/memberships`. Renders a `DropdownMenu` triggered by the existing workspace button in the sidebar. Each workspace shown as a `DropdownMenuItem`; active workspace has a check icon.
- [x] 6.2 Implement workspace switching: clicking a workspace sets `document.cookie = 'active-workspace-id=<id>; path=/'` then navigates to `/inbox` using `router.push`.
- [x] 6.3 Replace the inline workspace button in `components/app-sidebar.tsx` with `<WorkspaceSwitcher />`.

## 7. Members Page Upgrade

- [x] 7.1 Update `app/(app)/settings/team/members/page.tsx` to call `POST /api/settings/invitations` (instead of `POST /api/settings/members`) from the invite modal. Change button label from "Add member" to "Invite member" and "Adding…" to "Sending invite…".
- [x] 7.2 Add a `usePendingInvitations` query hook that fetches `GET /api/settings/invitations`.
- [x] 7.3 Add a "Pending invites" section below the active members list. Only shown when there is at least one pending invite. Each row shows: email, role name, invite date, "Resend" and "Revoke" buttons.
- [x] 7.4 Wire "Revoke" button to `DELETE /api/settings/invitations/[id]`; on success invalidate the invitations query and show a toast "Invite revoked".
- [x] 7.5 Wire "Resend" button to `POST /api/settings/invitations/[id]/resend`; on success show a toast "Invite resent".
