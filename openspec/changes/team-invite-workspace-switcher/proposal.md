## Why

The current team settings page adds members directly without any invitation or email flow, and the workspace switcher in the sidebar is a non-functional placeholder. To allow admins to onboard real teammates — including people who don't yet have a dpaperwork account — and to let multi-workspace users navigate between workspaces, both flows need to be fully wired up.

## What Changes

- **New `workspace_invitations` table** stores pending invites (token, email, role, status, expiry). Replaces the current direct-add-member approach.
- **Invite API** (`POST /api/settings/invitations`) creates the invitation record and sends a transactional email with an accept link via Resend.
- **React Email template** (`emails/workspace-invite.tsx`) — a branded HTML email template built with `react-email` and `@react-email/components`, rendered server-side and passed to Resend. Shows workspace name, inviter name, and a prominent accept button.
- **Accept-invite page** (`/invite/[token]`) handles three entry states: new user (sign up first, then auto-accept), returning user logged out (sign in, then auto-accept), and returning user already logged in (immediate accept screen).
- **Workspace switcher** (`WorkspaceSwitcher` component in sidebar) fetches all workspaces the authenticated user belongs to and lets them navigate to a different workspace context.
- **Members page upgrade** — replaces "Add member" (direct write) with "Invite member" (email-based invite flow); shows pending invites inline with a resend/revoke option.
- **`/api/workspace/me` upgrade** — returns all workspaces the user belongs to, not just one, so the switcher can populate.

## Capabilities

### New Capabilities
- `workspace-invitations`: Invite table schema, invite creation/accept/revoke API, email dispatch, and React Email template
- `accept-invite-page`: `/invite/[token]` page handling all three auth entry states
- `workspace-switcher`: Sidebar switcher component backed by multi-workspace API

### Modified Capabilities
- `workspace-tables`: Add `workspace_invitations` table to schema

## Impact

- **DB**: New `workspace_invitations` table; `workspace_members` gains no new columns (status stays derived from invitation lifecycle)
- **API**: New routes `/api/settings/invitations`, `/api/settings/invitations/[id]`, `/api/invite/[token]`; `GET /api/workspace/me` extended to return array
- **Email**: Requires Resend transactional email provider — env var `RESEND_API_KEY`. New packages: `resend`, `react-email`, `@react-email/components`.
- **Email template**: `emails/workspace-invite.tsx` — React Email component rendered to HTML at send time
- **Sidebar**: `app-sidebar.tsx` WorkspaceSwitcher wired up with real data
- **Settings members page**: UI overhaul — invite modal replaces direct-add, pending invites shown
- **Auth middleware**: `/invite/[token]` route is public (no workspace guard); accept action requires session
