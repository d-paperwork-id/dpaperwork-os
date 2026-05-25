## Why

Phase 1 requires users to give the AI brain static company knowledge before any agent can produce meaningful output. Without a way to write and version CONTEXT.md, no agent in the platform can operate with real context — making this the first unblocking surface to build.

## What Changes

- New page at `app/(app)/settings/workspace/context/page.tsx` — markdown textarea editor with guided section placeholders
- Save action creates a versioned row in `context_md_versions` and updates `context_md.current_version_id` in a single transaction
- Optimistic concurrency guard (409 on `updated_at` mismatch) prevents silent overwrites by concurrent editors
- Version history list below editor — each entry shows timestamp and saved-by user
- Restore action on any version creates a new version (no destructive overwrites)
- Two API routes: `GET/PUT /api/settings/context` (read/write current content) and `GET /api/settings/context/versions` (history list with restore)

## Capabilities

### New Capabilities

- `context-md-editor`: Markdown textarea editor for workspace CONTEXT.md — guided sections, save-with-versioning, optimistic concurrency, and version history with restore

### Modified Capabilities

<!-- none -->

## Impact

- **Schema**: reads/writes `context_md` and `context_md_versions` tables (already in Drizzle schema, seeded at workspace creation)
- **Routes**: two new API route handlers under `app/api/settings/context/`
- **Settings nav**: the existing `settings/workspace/context` tab (already scaffolded in the settings shell) gets its page implementation
- **No new dependencies** — shadcn `Textarea`, `Button`, `Separator` are already installed
