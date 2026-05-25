## Context

The `context_md` and `context_md_versions` tables are already in the Drizzle schema and seeded on workspace creation (empty row with a placeholder version). The settings shell has a `settings/workspace/context` tab that routes to this page but currently renders nothing. This change wires up that tab with a real editor.

## Goals / Non-Goals

**Goals:**
- Provide a guided markdown editor where workspace admins can write and save CONTEXT.md
- Store every save as a version row so the agent layer always has audit-safe snapshots to read
- Let any admin restore a prior version (creating a new version — no destructive overwrites)
- Prevent concurrent overwrites via optimistic concurrency

**Non-Goals:**
- Role.md editing (separate settings tab, Phase 2)
- Diff view between versions
- Collaborative real-time editing

## Decisions

### 1. Versioning in a single DB transaction

**Decision:** `PUT /api/settings/context` runs an atomic transaction: insert into `context_md_versions`, then update `context_md.current_version_id` and `content` in the same transaction.

**Rationale:** If either write fails, the state stays consistent — no version row without a corresponding pointer update, and no pointer update without a version row. The denormalized `content` on `context_md` gives the agent layer a single-row fast read without joining `_versions`.

**Alternative considered:** Two separate writes from the client. Rejected — split-brain state if network drops between writes.

### 2. Optimistic concurrency via `updated_at`

**Decision:** The client reads `updated_at` from the GET response and sends it back as `If-Match` in the PUT body. The route handler does `WHERE workspace_id = ? AND updated_at = ?`. Row count 0 → 409.

**Rationale:** Multi-admin workspaces exist. Without this, two admins saving simultaneously produce a last-write-wins silent overwrite. A 409 prompts the user to reload and merge manually — acceptable for Phase 1.

**Alternative considered:** Optimistic locking via a version counter integer. More explicit, but `updated_at` is already on the table and sufficient.

### 3. Restore creates a new version (no in-place revert)

**Decision:** Restoring version V creates a new `context_md_versions` row whose `content` equals V's `content`. The version history grows; it never shrinks.

**Rationale:** Matches how Git's `git revert` works — history is append-only. Users can see the full audit trail including "who restored what when." No destructive DB writes.

### 4. Novel as the rich editor

**Decision:** Use the `novel` package for the CONTEXT.md editor — a Notion-style rich text editor built on Tiptap + ProseMirror with slash commands, floating toolbar, and native markdown serialization.

**Rationale:** Novel produces and consumes markdown, so `context_md.content` stays a plain `text` column — no schema changes. It ships with the Notion interaction model (slash-command `/` menu, bubble formatting toolbar) out of the box, requiring no custom extension wiring. The alternative, raw Tiptap, offers more control but adds significant setup for each extension (headings, lists, code blocks, etc.) with no benefit for Phase 1.

**Key integration points:**
- `Editor` component from `novel` is the controlled input; `onUpdate` fires on each keystroke with the current markdown string
- Initial content is seeded via Novel's `defaultValue` prop (accepts markdown)
- `isDirty` is tracked by comparing the Novel output string against the last fetched `content`
- The placeholder is rendered via Novel's built-in `placeholder` extension rather than HTML placeholder text

**Alternative considered:** Plain `Textarea` with `font-mono`. Rejected by user — Notion-style editing experience is a requirement.

### 5. API route placement under `/api/settings/context`

**Decision:** Routes are `GET/PUT /api/settings/context` (current content) and `GET /api/settings/context/versions` (history list) with `POST /api/settings/context/versions/[id]/restore`.

**Rationale:** Grouped under `settings` to match the settings nav hierarchy. Keeps the route surface minimal for Phase 1 — no pagination needed (version history will be short early on).

## Risks / Trade-offs

- **Version history growth**: No pruning in Phase 1. For very active workspaces with rapid iteration, the `context_md_versions` table grows unbounded. Mitigation: add a scheduled cleanup or keep-last-N policy in Phase 3 when operational tooling exists.
- **409 UX without diff**: When two admins collide, the losing editor gets a 409 toast and must reload. They lose their unsaved changes. Mitigation: in Phase 2, preserve draft content in `localStorage` and offer a merge preview.
- **No autosave**: User must click Save explicitly. Long editing sessions risk browser crash data loss. Acceptable for Phase 1 — autosave adds complexity around version spam.
