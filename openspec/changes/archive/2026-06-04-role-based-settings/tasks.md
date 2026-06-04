## 1. Database Schema

- [x] 1.1 Create `db/schema/roles.ts` — `workspace_roles` table with columns: `id` (`rol_` prefix), `workspace_id`, `name`, `description`, `is_system` (boolean), `can_manage_settings` (boolean), `can_write_data` (boolean), `can_view_data` (boolean), `position` (integer), `created_at`, `updated_at`; add workspace FK index
- [x] 1.2 Update `db/schema/workspace.ts` — replace `workspace_members.role` enum column with `role_id text references workspace_roles(id)`; drop the old enum column
- [x] 1.3 Export `workspace_roles` from `db/schema/index.ts`
- [x] 1.4 Run `bunx drizzle-kit generate` and commit the migration SQL

## 2. Workspace Seed

- [x] 2.1 Update workspace creation seed function — insert three `workspace_roles` rows (Admin, Member, Viewer) with correct boolean flags and `is_system = true` before inserting workspace members
- [x] 2.2 Update workspace creation seed — set `role_id` on the creator's `workspace_members` row to the seeded Admin role ID
- [x] 2.3 Update the invite flow default — new member invites default `role_id` to the seeded Member role ID

## 3. API Routes

- [x] 3.1 Create `app/api/settings/roles/route.ts` — `GET` handler: query `workspace_roles` for current workspace, join member count per role, return ordered by `position`
- [x] 3.2 Create `app/api/settings/roles/[id]/route.ts` — `DELETE` handler: block if `is_system = true` (403); block if any members assigned (409); soft-delete otherwise
- [x] 3.3 Add `requireRole('can_manage_settings')` guard helper in `lib/auth/require-role.ts` — reads session → looks up `workspace_members.role_id` → resolves `workspace_roles.can_manage_settings`; returns 403 if false
- [x] 3.4 Apply `requireRole` guard to all settings mutation routes: `PATCH /api/settings/workspace/general`, `PATCH /api/settings/workspace/context`, `POST /api/settings/agents/[id]`, `PATCH /api/settings/team/members/[id]`
- [x] 3.5 Update `PATCH /api/settings/team/members/[id]` — accept `roleId` field; validate role exists in workspace; prevent demoting last admin (409)

## 4. Settings Navigation — Team Tabs

- [x] 4.1 Create `app/(app)/settings/team/layout.tsx` — renders Members | Roles tab strip using shadcn `Tabs` with `TabsList` and `TabsTrigger`; active tab derived from pathname
- [x] 4.2 Move existing members page to `app/(app)/settings/team/members/page.tsx` (if not already there); ensure `/settings/team` redirects to `/settings/team/members`

## 5. Roles Page UI

- [x] 5.1 Create `app/(app)/settings/team/roles/page.tsx` — client component; calls `GET /api/settings/roles` via TanStack Query
- [x] 5.2 Render roles list: each role as a row with name, description, "System" badge (if `is_system`), three permission pill badges (active/dimmed), and member count
- [x] 5.3 Add "Custom roles coming soon" note below system roles list using `text-muted-foreground text-sm`
- [x] 5.4 Handle loading state (use shadcn `Skeleton`) and empty state

## 6. Role Selector in Member Management

- [x] 6.1 Update the invite member modal — add a Role `Select` component populated from `GET /api/settings/roles`; default to Member role
- [x] 6.2 Update the member edit sheet — add Role `Select` component; on change call `PATCH /api/settings/team/members/[id]` with `roleId`; show toast on success/error
