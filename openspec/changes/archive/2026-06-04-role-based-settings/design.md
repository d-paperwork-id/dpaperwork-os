## Context

The current `workspace_members` table has a hardcoded `role` enum (`'admin' | 'member'`). There are no viewer-level roles, no UI to manage roles, and no settings route for it. Phase 2 of the implementation plan explicitly calls for `settings/team/roles/page.tsx` and role assignment in the member management sheet. This design formalizes that work with the three predefined system roles and the minimal enforcement layer needed before design partners start adding team members.

Existing settings navigation lives in `app/(app)/settings/layout.tsx` with a sidebar grouping: Account → Profile and Workspace → General, Context, Memory, Agents, Team, Billing.

## Goals / Non-Goals

**Goals:**
- Introduce a `workspace_roles` table with system roles seeded on workspace creation
- Replace the `workspace_members.role` enum with a FK to `workspace_roles`
- Add `Settings → Team → Roles` page listing system roles with their permission summaries
- Add `Settings → Team → Members | Roles` sub-navigation tabs
- Enforce admin-only guard on all settings mutation API routes
- Role selector in the member management sheet (or invite modal)

**Non-Goals:**
- Custom role creation (roles list is read-only for predefined system roles in this change — creation UI can come later)
- Per-entity or per-domain permission granularity (the three roles cover coarse access only)
- Role-based visibility of sidebar nav items (deferred — too risky for Phase 2)
- Mastra agent permission scoping by role (agent tool permissions live in `workspace_agent_config`)

## Decisions

### D1: Keep `workspace_roles` as a DB table (not hardcoded enum)

**Alternatives:** Hardcode roles as a TypeScript enum, skip the DB table entirely.

**Rationale:** The implementation plan and schema doc both reference a `roles.ts` schema file. A DB table allows the seeded system roles to have names and descriptions editable by admins in the future without a schema change. The three system roles are seeded on workspace creation (`is_system: true`) and are locked from deletion/rename in the API.

### D2: Soft-replace `workspace_members.role` with `workspace_members.role_id` FK

**Alternatives:** Add a new column alongside the old, keep the enum.

**Rationale:** A clean FK is the correct long-term shape. Since Phase 0 schema work hasn't landed yet (the `workspace_members` table is pending), this is a non-breaking change — the migration just sets the column correctly from the start.

**Migration:** The seed function assigns the workspace creator's member row `role_id` pointing to the seeded Admin role. Invite flow defaults new members to the Member role.

### D3: API-layer enforcement only (no Postgres RLS)

The architecture doc specifies application-layer enforcement for v1. Settings mutation routes (`PATCH /api/settings/workspace/general`, etc.) add a `requireRole('admin')` guard that reads the session user's `role_id` and resolves to the role's `can_manage_settings` flag. No DB-level RLS.

### D4: Three predefined permission flags per role

Rather than a flat `permissions` JSONB blob (extensible but hard to display), three boolean columns capture what the UI needs now:

| Flag | Admin | Member | Viewer |
|---|---|---|---|
| `can_manage_settings` | ✅ | ❌ | ❌ |
| `can_write_data` | ✅ | ✅ | ❌ |
| `can_view_data` | ✅ | ✅ | ✅ |

This is sufficient for Phase 2. If finer permissions are needed later, add columns without breaking existing rows.

### D5: Sub-navigation for Team settings as in-page tabs, not sidebar items

The proposal mentions adding "Members | Roles" as a sub-nav inside the Team settings page. This keeps the sidebar clean — "Team" remains one sidebar entry; the tab strip inside `/settings/team` switches between Members and Roles views. This matches the existing pattern for Workspace sub-settings (General, Context, Memory).

## Risks / Trade-offs

- **Roles page is mostly read-only for now** → Users may expect to create custom roles immediately. Mitigate with clear "system role" badge and a "Custom roles coming soon" note.
- **FK migration on `workspace_members`** → If any existing workspace members exist with the old enum, a data migration is needed to map `'admin'` → Admin role ID, `'member'` → Member role ID. The migration script must run before the app deploys.
- **Admin guard on settings routes** → A workspace with no admin (edge case: last admin demoted) must be blocked at the UI layer. API enforces: cannot change the last admin's role away from admin.

## Migration Plan

1. Add `workspace_roles` table and three boolean flag columns.
2. Migrate `workspace_members.role` enum → `workspace_members.role_id` FK (data migration maps existing enum values to seeded role IDs).
3. Update workspace creation seed to insert roles first, then assign creator.
4. Deploy API guards on settings mutation routes.
5. Ship UI: Roles page + Team sub-nav tabs + role selector in member sheet.

Rollback: revert the `role_id` FK to the enum column (backwards-compatible if migrations are two-step per the schema migration discipline).

## Open Questions

- Should Viewer-role users be blocked from navigating to the Domains write view, or just see the table read-only? (Recommend: read-only table, no "New Record" button — implement in Phase 3 when Viewer is tested with real users.)
- Should the invite modal default to Member or require explicit role selection? (Recommend: default Member, allow override.)
