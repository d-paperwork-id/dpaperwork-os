## ADDED Requirements

### Requirement: Workspace settings has tab navigation
The workspace settings section SHALL render a tab bar at the top of its content area with three tabs — General, Context, and Memory — using shadcn `Tabs`. Each tab SHALL link to its corresponding route: `/settings/workspace/general`, `/settings/workspace/context`, `/settings/workspace/memory`. The active tab SHALL be derived from the current pathname, not local state.

#### Scenario: User navigates to workspace general
- **WHEN** the user is on `/settings/workspace/general`
- **THEN** the General tab SHALL appear active and the page content for workspace general settings SHALL render below the tab bar

#### Scenario: User navigates to workspace context
- **WHEN** the user is on `/settings/workspace/context`
- **THEN** the Context tab SHALL appear active and the context placeholder page SHALL render below the tab bar

#### Scenario: User navigates to workspace memory
- **WHEN** the user is on `/settings/workspace/memory`
- **THEN** the Memory tab SHALL appear active and the memory placeholder page SHALL render below the tab bar

#### Scenario: User clicks a tab
- **WHEN** the user clicks the Context tab from any workspace settings page
- **THEN** the router SHALL navigate to `/settings/workspace/context` and the Context tab SHALL become active

### Requirement: Workspace sub-pages have placeholder states for unbuilt content
Context and Memory pages SHALL render a placeholder section that matches the settings section heading style (`text-sm font-semibold` title + `text-sm text-muted-foreground` description) and communicates that content is coming in a future phase.

#### Scenario: User visits context page before Phase 1
- **WHEN** the user navigates to `/settings/workspace/context`
- **THEN** the page SHALL show a heading "Context" and a description that sets expectations, with no broken UI or error state

#### Scenario: User visits memory page before Phase 2
- **WHEN** the user navigates to `/settings/workspace/memory`
- **THEN** the page SHALL show a heading "Memory" and a description that sets expectations, with no broken UI or error state

### Requirement: Settings root redirects to profile
The route `/settings` SHALL redirect to `/settings/profile` so that direct navigation to the settings section always lands on a functional page.

#### Scenario: User navigates to /settings directly
- **WHEN** the user visits `/settings`
- **THEN** the browser SHALL redirect to `/settings/profile`

### Requirement: Agents settings page has no duplicate page header
The agents settings page SHALL NOT render its own `<PageHeader>` component. The settings layout wrapper already provides the page header. The agents page SHALL render only its content section (heading, description, and content area) consistent with other settings pages.

#### Scenario: User navigates to settings/agents
- **WHEN** the user navigates to `/settings/agents`
- **THEN** only one page header SHALL be visible (the one from the settings layout), not two stacked headers

### Requirement: Team and Billing stubs match settings section style
Team and Billing placeholder pages SHALL use the same section heading pattern as Profile and Workspace General: `text-sm font-semibold` section title, `text-sm text-muted-foreground` description, wrapped in `space-y-8`.

#### Scenario: User navigates to settings/team
- **WHEN** the user navigates to `/settings/team`
- **THEN** the page SHALL render a styled placeholder consistent with the settings section pattern

#### Scenario: User navigates to settings/billing
- **WHEN** the user navigates to `/settings/billing`
- **THEN** the page SHALL render a styled placeholder consistent with the settings section pattern
