## 1. API Routes

- [x] 1.1 Create `app/api/domains/route.ts` — `GET` returns all non-deleted workspace domains; `POST` creates a domain (Zod validate name + slug, check slug uniqueness, insert row)
- [x] 1.2 Create `app/api/domains/[id]/records/route.ts` — `GET` accepts `page`, `pageSize`, `filters` query params; returns `{ fields, records, total, page, pageSize }`; applies JSONB filter clauses per condition type; validates `pageSize ≤ 200` and `filters` JSON shape; `POST` inserts a record, validates fields, writes `agent_writes_log` row
- [x] 1.3 Create `app/api/domains/[id]/records/[recordId]/route.ts` — `PUT` updates record fields (partial merge), writes `agent_writes_log` with before/after; `DELETE` soft-deletes, writes `agent_writes_log`
- [x] 1.4 Add Zod validation schema for field values keyed by `domain_fields.slug`+`type` (support `text`, `long_text`, `number`, `date`, `single_select`); add `422` response for required-field violations
- [x] 1.5 Add workspace isolation guard (scope all queries by `workspaceId` from session; return `404` for cross-workspace access)

## 2. Domain List Page

- [x] 2.1 Create `app/(app)/domains/page.tsx` — fetch domains via TanStack Query (`GET /api/domains`); render `Spinner` during load, `Alert` on error
- [x] 2.2 Render each domain as a shadcn `Item` row showing icon, name, and description; clicking navigates to `/domains/[slug]`
- [x] 2.3 Render shadcn `Empty` component when workspace has no domains (message: "No domains yet — create your first domain to get started")
- [x] 2.4 Add page header (`h-12 border-b border-border`) with title "Domains" as `text-sm font-medium text-foreground`; include "New Domain" `Button variant="outline" size="sm"` in the actions slot
- [x] 2.5 Build `NewDomainDialog` component — `Dialog` with fields: name (`Input`, required), slug (`Input`, auto-derived via `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`, editable, required), description (`Input`, optional), icon (`Input`, optional lucide icon name); wire with `react-hook-form` + Zod
- [x] 2.6 `NewDomainDialog` submit: call `POST /api/domains`; on success navigate to `/domains/[slug]` and show success toast; on `409` show `FieldError` on slug field; disable submit button while loading

## 3. Domain Grid Page

- [x] 3.1 Create `app/(app)/domains/[slug]/page.tsx` — resolve domain by slug via `GET /api/domains` list; fetch fields + records via TanStack Query (`GET /api/domains/[id]/records?page=...&pageSize=...&filters=...`) using `page`, `pageSize`, and `filters` state as query key parts
- [x] 3.2 Build `DomainGrid` client component using TanStack Table (`useReactTable`) + shadcn Data Table pattern; set `manualPagination: true` and `manualFiltering: true`; pass `pageCount` derived from `Math.ceil(total / pageSize)`; columns derived from `domain_fields` ordered by `position`; rows `h-9`, `border-b border-border`
- [x] 3.3 Implement `CellRenderer` component that switches on `field.type` and renders the correct read-mode display (empty value shows `—` in `text-muted-foreground`)
- [x] 3.4 Implement inline cell edit mode: clicking a cell enters edit mode (`editing` state), renders the correct `<input>` / `Select` per type; blur or Enter calls `PUT` record API and invalidates query; Escape discards
- [x] 3.5 Add sticky "New Record" row at grid bottom (`text-sm text-muted-foreground`); clicking opens `RecordSheet` in add mode
- [x] 3.6 Add row hover action button (e.g., `PenLine` icon) that opens `RecordSheet` in edit mode for that record
- [x] 3.7 Apply `bg-accent border-l-2 border-l-primary` to the row whose record is currently open in the Sheet
- [x] 3.8 Sticky column headers (`sticky top-0 z-10 bg-muted`); grid wrapped in `ScrollArea`
- [x] 3.9 Build `FilterPanel` component — a `Popover` trigger button ("Filter" / "Filter · N") in the grid header; Popover content has a list of condition rows and an "Add filter" button; conditions stored in local `filters` state (`{ field: string, value: string }[]`)
- [x] 3.10 Each condition row: field `Select` (populated from `domain_fields`), value input switching on `field.type` (`Input` for `text`/`long_text`/`number`/`date`, `Select` populated from `options.choices` for `single_select`), × remove button; on any change update `filters` state (parent re-fetches via TanStack Query key change)
- [x] 3.11 "Clear all" link in Popover footer resets `filters` state to `[]`, resets `page` to 1, and closes the Popover; changing any filter condition also resets `page` to 1
- [x] 3.12 Add pagination controls below the grid: left — `"X–Y of Z records"` (`text-sm text-muted-foreground`); right — page-size `Select` (25 / 50 / 100, default 50) + "Prev" / "Next" `Button variant="outline" size="sm"`; Prev disabled on page 1; Next disabled when `page * pageSize >= total`

## 4. Record Sheet

- [x] 4.1 Create `RecordSheet` component accepting `mode: 'add' | 'edit'`, `domainId`, `fields: DomainField[]`, and optional `record: DomainRecord`; renders `Sheet` with `w-[380px] sm:max-w-[380px] p-0`
- [x] 4.2 Build `FieldInput` component that switches on `field.type` and renders: `text` → `Input`; `long_text` → `Textarea resize-none min-h-[80px]`; `number` → `Input type="number"`; `date` → shadcn Date Picker; `single_select` → `Select` populated from `field.options.choices`
- [x] 4.3 Wire `react-hook-form` + Zod schema (derived dynamically from `domain_fields`); required fields use `.min(1)` for text types; show `FieldError` below each field on violation
- [x] 4.4 Add mode, wrap each `FieldInput` in `Field` with `FieldLabel`; Sheet footer has "Create" button + Cancel; on submit POST record, invalidate query, close Sheet, show success toast
- [x] 4.5 Edit mode, pre-populate form from `record.fields`; Sheet footer has "Save" + "Delete" buttons + Cancel; "Save" sends PUT, "Delete" opens `AlertDialog` confirmation then sends DELETE
- [x] 4.6 Show `FieldError` messages and disable submit button while form is submitting (use `Spinner` inside button)

## 5. Audit Logging Utility

- [x] 5.1 Create `lib/audit.ts` helper `logDomainWrite({ workspaceId, userId, action, targetId, before, after })` that inserts a row into `agent_writes_log` with `agent_id = 'user'`, `run_id = 'user:{userId}'`, `target_type = 'domain_record'`; import this in the three record API routes

## 6. Integration & Polish

- [x] 6.1 Verify all shadcn components used (`Item`, `Empty`, `Sheet`, `Select`, `Dialog`, `AlertDialog`, `Spinner`, `Popover`) are installed; add any missing with `bunx shadcn@latest add <component>`
- [x] 6.2 Test: navigate domains list → create domain via Dialog → see grid → add record via New Record row → edit cell inline → open sheet → edit record → delete record
- [x] 6.3 Test filter panel: add a text filter → API refetches with `filters` param → grid narrows → add a second condition → both AND-applied → clear all → unfiltered page 1 shown
- [x] 6.4 Test pagination: seed > 50 records → page 1 shows 50 → click Next → page 2 loads → change pageSize to 25 → resets to page 1 with 25 records
- [x] 6.5 Test empty state: workspace with no domain records shows header row + "New Record" row only; domain list with no domains shows `Empty`
- [x] 6.6 Verify dark mode: grid headers, cell edit inputs, Sheet, filter Popover, and pagination controls all render correctly with token classes
