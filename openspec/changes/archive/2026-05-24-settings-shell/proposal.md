## Why

The settings section has a structural skeleton (layout, sub-nav, three pages) but is missing the workspace tab navigation required by the app flow doc, has a duplicate `PageHeader` bug in the agents page, and leaves Team/Billing as raw stubs with no visual consistency. Before Phase 1 adds the CONTEXT.md editor at `/settings/workspace/context`, the workspace sub-tab navigation needs to exist so that new pages slot in cleanly.

## What Changes

- Add `Tabs` sub-navigation inside the workspace settings section — General | Context | Memory — so Phase 1 and Phase 2 pages have a consistent entry point.
- Fix `/settings/agents/page.tsx`: remove the duplicate `<PageHeader>` that conflicts with the settings layout wrapper.
- Replace the Team stub with a proper placeholder that matches the settings section style (uses the layout's section heading + description pattern instead of raw markup).
- Replace the Billing stub with a proper placeholder using the same pattern.
- Add `/settings/page.tsx` redirect to `/settings/profile` so direct navigation to `/settings` lands somewhere meaningful.
- Wire workspace sub-tab active state: the left-sidebar "Workspace" nav item stays active for all `/settings/workspace/*` sub-paths (already true via `startsWith`, but verify with new tab routes).

## Capabilities

### New Capabilities
- `settings-workspace-tabs`: Tab navigation within workspace settings (General | Context | Memory), where Context and Memory render placeholder states until Phase 1/2 fill them in.

### Modified Capabilities
- none

## Impact

- Files modified: `app/(app)/settings/agents/page.tsx`, `app/(app)/settings/team/page.tsx`, `app/(app)/settings/billing/page.tsx`, `app/(app)/settings/page.tsx`
- Files added: `app/(app)/settings/workspace/context/page.tsx`, `app/(app)/settings/workspace/memory/page.tsx`, `app/(app)/settings/workspace/layout.tsx` (workspace tab nav)
- No new API routes, no schema changes, no new dependencies (uses existing shadcn `Tabs` component).
