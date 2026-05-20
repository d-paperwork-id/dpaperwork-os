## Why

After email verification, newly registered users have no workspace — the platform has no context about their business, making it impossible to set up AI agents or tenant-specific configuration. Capturing this onboarding data immediately after verification ensures every user lands in a ready-to-use workspace.

## What Changes

- Add a workspace onboarding screen that appears immediately after successful email verification.
- Collect: business name, industry, website (optional), and a short description of the business.
- Create a workspace record tied to the verified user (tenant provisioning).
- Redirect to the main dashboard once the workspace is created.

## Capabilities

### New Capabilities

- `workspace-onboarding`: Multi-step form shown post-email-verification to collect business details and create the user's workspace.

### Modified Capabilities

- `email-verification`: After verification succeeds, redirect to the workspace onboarding flow instead of directly to the dashboard.

## Impact

- New API route: `POST /api/workspace` to persist workspace data.
- New page: `/onboarding` (client component with TanStack Query mutation).
- `email-verification` redirect target changes from `/dashboard` to `/onboarding`.
- New workspace table in the database schema (`lib/db/schema/workspace.ts`).
- Multi-tenant provisioning logic fires after workspace form submission.
