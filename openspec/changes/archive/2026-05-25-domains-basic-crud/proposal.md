## Why

Phase 1's north star moment (Chief of Staff sending a weekly inbox summary) depends on domain records being populated. Without the Domains CRUD surface, users have no way to add Deals, Tasks, or any other records for agents to read — making the Phase 1 demo impossible.

## What Changes

- New **domain list page** (`/domains`) — shows all workspace domains as `Item` rows, `Empty` state when none exist; "New Domain" button in the header opens a `Dialog` (name, slug auto-derived from name, optional description + icon); on submit calls `POST /api/domains` and navigates to the new domain
- New **domain view page** (`/domains/[slug]`) — spreadsheet-style grid built on TanStack Table via shadcn Data Table; rows `h-9`, inline cell editing, sticky "New Record" row at bottom
- **Filter panel** — `Popover`-based filter UI in the domain grid header; add one or more field-value conditions; filters sent as query params to `GET /api/domains/[id]/records`; TanStack Table runs in `manualFiltering` mode — changing a condition triggers a TanStack Query refetch; active filter count shown on the trigger button; "Clear all" to reset
- **Add/edit record sheet** — `Sheet` component rendering all fields from `domain_fields` for the selected domain; supports Phase 1 field types: `text`, `long_text`, `number`, `date`, `single_select`
- **Domain API routes** — `GET /api/domains` (list), `POST /api/domains` (create domain), `GET /api/domains/[id]/records`, `POST /api/domains/[id]/records`, `PUT /api/domains/[id]/records/[recordId]`, `DELETE /api/domains/[id]/records/[recordId]`
- **Audit logging** — every record write logs to `agent_writes_log` with `created_by_user_id`; `run_id` is a synthetic constant `"user"` for Phase 1 (no run context yet)

## Capabilities

### New Capabilities

- `domain-list`: Browse workspace domains; create a new domain via modal; `Empty` state when no domains exist
- `domain-grid`: View and interact with domain records in a TanStack Table grid with inline cell editing and a bottom "New Record" row
- `domain-record-sheet`: Add or edit a full record in a side Sheet, rendering all `domain_fields` with correct input per field type (`text`, `long_text`, `number`, `date`, `single_select`)
- `domain-api`: REST routes for domain listing/creation and record CRUD, scoped by `workspace_id`; all writes logged to `agent_writes_log`

### Modified Capabilities

## Impact

- **New pages**: `app/(app)/domains/page.tsx`, `app/(app)/domains/[slug]/page.tsx`
- **New API routes**: `app/api/domains/route.ts`, `app/api/domains/[id]/records/route.ts`, `app/api/domains/[id]/records/[recordId]/route.ts`
- **New components**: `DomainGrid`, `RecordSheet`, field-type cell renderers
- **DB tables read/written**: `domains`, `domain_fields`, `domain_records`, `agent_writes_log`
- **Dependencies**: `@tanstack/react-table` (already in project via shadcn Data Table), shadcn `Sheet`, `Dialog`, `Select`, `Item`, `Empty`, `Data Table`
- **No schema changes** — all tables are already defined in `db/schema/domains.ts` and `db/schema/audit.ts`
