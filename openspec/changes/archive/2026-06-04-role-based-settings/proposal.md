## Why

When a workspace is created, all members currently share a flat `admin | member` role model with no fine-grained access control. As more team members join a workspace, admins need a way to restrict who can change settings, who can only read, and who has full access — without building a fully custom permission system from scratch. Shipping predefined roles now unblocks team onboarding and gives design partners a credible multi-user story.

## What Changes

- Add a **Roles** navigation item under **Settings → Team** (sibling to Members)
- Seed three system roles on workspace creation: **Admin**, **Member**, **Viewer**
- Persist workspace roles in a new `workspace_roles` table; link members to roles via `workspace_members.role_id`
- Enforce role-based access in API routes (settings mutation guarded by `admin` role; viewer routes return read-only responses)
- Roles list page shows system roles + any custom roles created later
- Each role card displays: name, description, permission summary, member count
- System roles (Admin, Member, Viewer) are locked — cannot be renamed or deleted
- Role assignment: member management sheet gains a Role selector

## Capabilities

### New Capabilities
- `workspace-roles`: Predefined workspace roles (Admin, Member, Viewer) with a Roles management page under Settings → Team, role seeding on workspace creation, and role enforcement on settings API routes.

### Modified Capabilities
- `settings-navigation`: Roles tab added to Settings → Team sub-navigation (Members | Roles).

## Impact

- **DB schema**: New `workspace_roles` table; `workspace_members.role` enum column replaced by `workspace_members.role_id` FK
- **API routes**: `GET/POST /api/settings/roles`, `PATCH /api/settings/roles/[id]`; settings mutation routes guard on `admin` role
- **UI**: `app/(app)/settings/team/roles/page.tsx` (new); settings layout team nav gains Roles link; member management sheet role selector
- **Seed**: Workspace creation seeds three `workspace_roles` rows and assigns the creator `admin`
