## ADDED Requirements

### Requirement: View current CONTEXT.md content
The system SHALL display the current CONTEXT.md content in a monospace textarea when the user navigates to Settings → Workspace → Context. If no content has been saved yet, the textarea SHALL show a multi-section placeholder that guides the user through the expected sections (What we do, Why this matters, ICP, How we sell, Team, Tools).

#### Scenario: Page loads with existing content
- **WHEN** a workspace admin navigates to `/settings/workspace/context`
- **THEN** the textarea is populated with the current `context_md.content` for their workspace

#### Scenario: Page loads with empty content
- **WHEN** a workspace admin navigates to `/settings/workspace/context` and no content has been saved
- **THEN** the textarea displays a structured placeholder with section headings (What we do, Why this matters, ICP, How we sell, Team, Tools)

### Requirement: Save CONTEXT.md content
The system SHALL allow workspace admins to save the textarea content. Each save MUST create a new row in `context_md_versions` and update `context_md.current_version_id` and `context_md.content` in a single atomic transaction. A success toast SHALL be shown after a successful save.

#### Scenario: Successful save
- **WHEN** the user edits the textarea and clicks Save
- **THEN** a new version row is created in `context_md_versions`, `context_md.current_version_id` is updated, a success toast appears, and the editor reflects the saved content

#### Scenario: Save button disabled when content unchanged
- **WHEN** the user has not modified the textarea content since the last load or save
- **THEN** the Save button is disabled

### Requirement: Optimistic concurrency protection
The system SHALL reject a save with HTTP 409 if the `context_md.updated_at` on the server does not match the `updated_at` value the client read when loading the content (indicating another editor has saved since the user opened the page).

#### Scenario: Concurrent save conflict
- **WHEN** two admins open the editor simultaneously and both click Save
- **THEN** the second save receives a 409 response, and the client shows an error toast instructing the user to reload and re-apply their changes

#### Scenario: Clean save — no conflict
- **WHEN** the user saves and no other admin has modified the content since the page was loaded
- **THEN** the save succeeds with HTTP 200

### Requirement: Version history list
The system SHALL display a list of all saved versions below the editor. Each entry SHALL show the timestamp of the save and the display name of the user who saved it, ordered newest-first.

#### Scenario: Versions are listed
- **WHEN** the user scrolls below the editor
- **THEN** a list of past versions is visible, each showing a human-readable relative timestamp and the saver's name

#### Scenario: No versions yet
- **WHEN** the workspace has never had content saved (only the seed empty version exists)
- **THEN** the version history section shows an empty state message

### Requirement: Restore a prior version
The system SHALL allow workspace admins to restore any prior version. Restoring MUST create a new version row in `context_md_versions` whose content equals the restored version's content. No version row SHALL be deleted or mutated during a restore.

#### Scenario: Successful restore
- **WHEN** the user clicks Restore on a version entry and confirms
- **THEN** a new version row is created with the selected version's content, `context_md` is updated to point to the new version, and the editor textarea reflects the restored content

#### Scenario: Restore creates new version, not in-place update
- **WHEN** a restore is performed on version V
- **THEN** version V remains unchanged in the history, and a new version appears at the top of the history list with the same content as V
