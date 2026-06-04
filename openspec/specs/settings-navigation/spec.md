## ADDED Requirements

### Requirement: Team settings sub-navigation tabs
The Settings → Team page SHALL render a tab strip with two tabs: **Members** and **Roles**. The Members tab displays the existing members list. The Roles tab displays the roles list page. The active tab SHALL be highlighted and navigable via keyboard.

#### Scenario: Members tab is default
- **WHEN** a user navigates to `/settings/team`
- **THEN** the Members tab is active and the members list is visible

#### Scenario: Roles tab loads roles list
- **WHEN** a user clicks the Roles tab
- **THEN** the URL updates to `/settings/team/roles` and the roles list is rendered

#### Scenario: Direct navigation to Roles page
- **WHEN** a user navigates directly to `/settings/team/roles`
- **THEN** the Roles tab is shown as active

### Requirement: Roles list page
The Roles page at `app/(app)/settings/team/roles/page.tsx` SHALL display all workspace roles as a list. Each role item SHALL show: role name, description, permission summary (three pill badges for can_manage_settings / can_write_data / can_view_data), and member count. System roles SHALL display a "System" badge and have no edit or delete actions.

#### Scenario: Roles list renders three system roles
- **WHEN** a user opens the Roles page on a freshly created workspace
- **THEN** three role items are shown: Admin, Member, Viewer — each with a "System" badge

#### Scenario: Permission pills reflect flags
- **WHEN** the Viewer role is shown in the roles list
- **THEN** only the "Can View" pill is active; "Can Manage Settings" and "Can Write" pills are inactive/dimmed

#### Scenario: Member count displayed
- **WHEN** the Admin role has 2 members assigned
- **THEN** the Admin role item shows "2 members"

#### Scenario: Empty custom roles section
- **WHEN** no custom roles have been created
- **THEN** a note reads "Custom roles coming soon" below the system roles list
