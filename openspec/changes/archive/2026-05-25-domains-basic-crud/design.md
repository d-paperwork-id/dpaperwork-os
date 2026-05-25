## Context

Domains are the structured data tables that agents read when generating inbox summaries and routine outputs. The Phase 1 demo requires at least one domain (Deals or Tasks) to be pre-populated. The DB schema is already in place (`domains`, `domain_fields`, `domain_records`, `agent_writes_log`). What is missing is the UI and API layer to let users view and edit records.

The domain model is flexible: field definitions live in `domain_fields` and record data is a single `jsonb` blob in `domain_records.fields`. The UI must render the correct input for each field type.

## Goals / Non-Goals

**Goals:**
- Domain list: browse all workspace domains, see name/icon/description, navigate to a domain
- Domain grid: spreadsheet-style view of records using TanStack Table + shadcn Data Table
- Inline cell editing for all Phase 1 field types
- Add/edit record in a Sheet with all domain fields
- API routes for domain listing, creation, and record CRUD (scoped by workspace)
- Write all mutations to `agent_writes_log` for audit trail
- Phase 1 field types only: `text`, `long_text`, `number`, `date`, `single_select`
- Create new domain via Dialog in the domain list header
- Filter panel (Popover) in the domain grid header — server-side filtering via API query params; TanStack Table `manualFiltering: true`
- Server-side pagination — `GET /api/domains/[id]/records` accepts `page` + `pageSize`; TanStack Table `manualPagination: true`; API returns `{ records, total, page, pageSize }`

**Non-Goals:**
- Field manager (add/edit/delete fields) — Phase 2
- Kanban, calendar, gallery views — Phase 2
- Import from CSV — Phase 2
- Column resize — Phase 2
- Context menu on row — Phase 2
- `boolean`, `datetime`, `multi_select`, `person_ref`, `domain_ref`, `file` field types — Phase 2

## Decisions

### 1. TanStack Table with shadcn Data Table pattern

**Decision:** Use `@tanstack/react-table` via the shadcn Data Table pattern for the domain grid.

**Why:** The UI/UX doc is prescriptive — "Use shadcn `Data Table` for domain grid." TanStack Table handles sorting, virtualization hooks, and column management that we'll need in Phase 2. Building on it now avoids a costly rewrite.

**Alternative considered:** Raw `<table>` with manual state — rejected because it doesn't scale to Phase 2 features (sort, filter, column resize) and violates the "shadcn Data Table" doc requirement.

### 2. Inline cell editing via local component state

**Decision:** Each cell component maintains its own `editing` boolean. On click, it renders an `<input>` in place. On blur or Enter, it fires a PATCH to the record API and updates the TanStack row.

**Why:** Matches the exact pattern in UI/UX doc Section 8.3. Avoids global form state for a spreadsheet context where only one cell is typically edited at a time.

**Alternative considered:** React Hook Form over the whole table — rejected as overkill; it adds complexity without benefit for cell-level saves.

### 3. JSON blob field model

**Decision:** Records store all field values as `domain_records.fields` JSONB, keyed by `domain_fields.slug`.

**Why:** Already defined in the schema. Field slugs are the keys — `fields->>'stage'` reads the Stage field. Type coercion happens at the API layer (validate with Zod, coerce strings to numbers/dates before writing).

**Risk:** No DB-level type enforcement for field values. Mitigation: strict Zod schema at the API boundary, validated against `domain_fields` at write time.

### 4. `agent_writes_log` with synthetic run_id for user writes

**Decision:** All user-initiated record mutations log a row to `agent_writes_log` with `agent_id = 'user'` and `run_id = 'user:{userId}'` as a synthetic constant.

**Why:** The schema requires `agent_id` and `run_id` to be non-null. Phase 1 has no real run context for user actions. Using a synthetic value preserves the audit trail without blocking on the full run/orchestrator infrastructure.

**Alternative considered:** Leave `run_id` empty / skip logging for user actions — rejected because the spec says "All writes log to `agent_writes_log` with `created_by_user_id`."

### 5. Workspace-scoped API via session + workspace middleware

**Decision:** All `/api/domains` routes read `workspaceId` from the session (stored at sign-in, same pattern as other routes). Every query includes `.where(eq(domains.workspaceId, workspaceId))`.

**Why:** Consistent with the app's multi-tenant architecture. No workspace ID in the URL to avoid leaking.

## Risks / Trade-offs

- **JSONB field type mismatch** — A user editing a number field via the inline input sends a string. Mitigation: API route coerces to the correct type using `domain_fields.type` before writing.
- **Stale `domain_fields` in client** — If fields are added/reordered by another session, the grid columns won't match. Mitigation: fields are fetched on domain load; a browser refresh fixes any mismatch. Phase 2 will add real-time schema sync.
- **Large domain with many records** — The grid fetches all records at once in Phase 1. Mitigation: default domains are small (< 100 rows for design partners). Phase 2 adds pagination.

### 6. Server-side filtering and pagination via query params

**Decision:** `GET /api/domains/[id]/records` accepts `page` (1-based, default `1`), `pageSize` (default `50`, max `200`), and `filters` (URL-encoded JSON array of `{ field: string, value: string }` conditions). The API applies `WHERE` clauses per condition and returns `{ fields, records, total, page, pageSize }`. TanStack Table runs with `manualFiltering: true` and `manualPagination: true` — filter or page state changes call `setFilters` / `setPagination`, which update TanStack Query params and trigger a refetch.

**Why:** With pagination, the client never has the full record set, so client-side filtering is impossible by definition. Doing both server-side is the only consistent approach. It also scales without rework: a domain with 10,000 rows works the same as one with 10.

**Alternative considered:** Client-side filtering with full fetch + client-side pagination — rejected because this defeats pagination (still fetches all rows), and any domain that warrants pagination also warrants server-side filtering.

**Filter wire format:**
```
GET /api/domains/[id]/records?page=1&pageSize=50&filters=[{"field":"stage","value":"negotiation"}]
```
Multiple conditions are AND-combined. Each condition uses the `domain_fields.slug` as `field`. Type-appropriate operators: `text`/`long_text` → `ILIKE '%value%'`; `number` → `= value`; `date` → `= value`; `single_select` → `= value`. Applied as Drizzle `.where()` clauses on `domain_records.fields` using the `->>` JSONB operator.

### 7. Domain creation Dialog with auto-slug

**Decision:** The domain creation Dialog derives the `slug` from the `name` input using `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`. The slug field is shown as editable so the user can override it.

**Why:** Manual slug entry is error-prone (spaces, uppercase). Auto-derive is the Notion/Linear convention. Showing it editable lets advanced users set a clean identifier for agent reference.

## Open Questions

- Should the domain list show record counts? The schema supports it via `COUNT(*)` on `domain_records`. Nice-to-have, not blocking.
- Should the filter panel support multi-condition AND logic in Phase 1, or just single-condition? Decision: support multiple conditions (each added independently), all combined with AND via multiple Drizzle `.where()` clauses.
- Default `pageSize`: 50. Should the user be able to change it? Decision: include a page-size selector (25 / 50 / 100) in the pagination controls — one extra `<Select>` component, high utility for wide tables.
