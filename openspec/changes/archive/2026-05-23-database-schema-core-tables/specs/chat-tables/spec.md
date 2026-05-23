## ADDED Requirements

### Requirement: threads table links our records to Mastra message storage
The system SHALL have a `threads` table with `id` (PK, `thr_` prefix), `workspace_id` (FK), `owner_user_id` (FK), `agent_id` (enum), `title` (text, default `'New thread'`), `is_shared` (boolean, default false), `mastra_thread_id` (text, unique — links to Mastra's message store), `last_message_at` (nullable timestamptz), `created_at`, `updated_at`, `deleted_at`. Index on `(workspace_id, owner_user_id)` and partial index on `(workspace_id, last_message_at DESC)` WHERE `deleted_at IS NULL` exist.

#### Scenario: mastra_thread_id is globally unique
- **WHEN** two thread rows attempt the same mastra_thread_id
- **THEN** the unique constraint rejects the second insert

#### Scenario: Thread list for a user is sorted by last message recency
- **WHEN** querying threads for a user in a workspace ordered by last_message_at DESC
- **THEN** the partial index WHERE `deleted_at IS NULL` is used

### Requirement: inbox_items table stores agent-generated notifications per user
The system SHALL have an `inbox_items` table with `id` (PK, `inb_` prefix), `workspace_id` (FK), `recipient_user_id` (FK), `source_agent_id` (enum), `source_routine_id` (nullable FK → routines.id), `source_run_id` (nullable text), `title`, `body`, `priority` (enum: `low`, `normal`, `high`; default `normal`), `action_chips` (jsonb, default `[]`), `read_at` (nullable), `resolved_at` (nullable), `snoozed_until` (nullable), `created_at`, `updated_at`, `deleted_at`. A partial index on `(workspace_id, recipient_user_id, created_at DESC)` WHERE `deleted_at IS NULL AND resolved_at IS NULL` exists for the default inbox view. An index on `source_routine_id` WHERE `source_routine_id IS NOT NULL` exists.

#### Scenario: Default inbox view uses the partial index
- **WHEN** listing unresolved, non-deleted inbox items for a recipient sorted by created_at DESC
- **THEN** the partial index `WHERE deleted_at IS NULL AND resolved_at IS NULL` is used

#### Scenario: Snoozed items are hidden until snoozedUntil passes
- **WHEN** an item has `snoozed_until` set to a future timestamp
- **THEN** the inbox query filters it from the default view (application-layer filter on snoozed_until)

#### Scenario: action_chips stores typed action metadata
- **WHEN** an inbox item is inserted with `action_chips = [{ label: 'Resolve', action: 'resolve' }]`
- **THEN** the jsonb is stored and retrievable without transformation
