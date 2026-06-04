## ADDED Requirements

### Requirement: Thread list shows all non-deleted threads for the current user
The system SHALL render a thread list sidebar showing all threads where `owner_user_id` matches the current user and `deleted_at IS NULL`, ordered by `last_message_at DESC`. Each row SHALL display the thread title and agent name. If no threads exist, the sidebar SHALL show an empty state with a "Start a conversation with your AI team" message and a "New Thread" CTA button.

#### Scenario: Thread list renders existing threads
- **WHEN** a user navigates to `/chat` and they have existing threads
- **THEN** the sidebar lists each thread as a row with its title and agent name, ordered newest-activity first

#### Scenario: Thread list empty state
- **WHEN** a user navigates to `/chat` and they have no threads (or all are soft-deleted)
- **THEN** the sidebar shows an empty state with a "New Thread" CTA

#### Scenario: Deleted threads are excluded
- **WHEN** a thread's `deleted_at` is set
- **THEN** it does not appear in the thread list sidebar

### Requirement: New Thread creates a thread record and opens thread view
The system SHALL provide a "New Thread" button that, when clicked, opens an agent selector showing only agents assigned to the current user's workspace. Selecting an agent SHALL create a new row in the `threads` table (via `POST /api/threads`) and navigate to the new thread view. The thread title SHALL default to `'New thread'`.

#### Scenario: New Thread button triggers agent selector
- **WHEN** the user clicks "New Thread"
- **THEN** an agent selector (`Combobox`) appears showing only the user's assigned agents

#### Scenario: Agent selection creates thread and navigates
- **WHEN** the user selects an agent from the selector
- **THEN** `POST /api/threads` is called with `{ agentId }`, a thread record is created, and the user is navigated to the new thread view

#### Scenario: Agent selector shows only assigned agents
- **WHEN** the agent selector is open
- **THEN** only agents from `workspace_agent_config` for the current user's workspace are listed; platform agents not assigned to this workspace are excluded

### Requirement: Thread view streams agent responses using AI Elements
The system SHALL render the thread view using AI Elements components (`Conversation`, `Message`, `MessageResponse`, `Tool`, `PromptInput`). User messages SHALL be right-aligned; agent messages SHALL be left-aligned with the agent avatar and name. Tool call traces SHALL be rendered in a collapsible `Tool` component. The input area SHALL use `PromptInput` with an auto-growing textarea. Streaming SHALL use `useChat` with `DefaultChatTransport` pointed at `POST /api/chat` — raw SSE is not permitted.

#### Scenario: User sends a message and sees streaming response
- **WHEN** the user types a message and submits via Enter or Send button
- **THEN** the message appears in the thread and the agent response streams in progressively using AI Elements streaming components

#### Scenario: Tool calls are rendered collapsibly
- **WHEN** the agent invokes a tool during a response
- **THEN** a `Tool` component renders the tool name and result in a collapsible section within the message

#### Scenario: Thread history is hydrated on load
- **WHEN** the user opens an existing thread
- **THEN** `GET /api/chat?threadId=` is called and prior messages are loaded into `useChat` before the input is enabled

### Requirement: Thread title auto-sets from first user message
The system SHALL automatically update a thread's title to the first 60 characters of the first user message (trimmed, with `'...'` appended if truncated) after the first message is sent. The title SHALL be editable inline in the thread header — clicking the title activates an input field; pressing Enter or blurring saves via `PATCH /api/threads/[id]`.

#### Scenario: Title set after first message
- **WHEN** the user sends the first message in a thread titled `'New thread'`
- **THEN** the client calls `PATCH /api/threads/[id]` with the truncated first message as the title

#### Scenario: Inline title edit saved on Enter
- **WHEN** the user clicks the thread title in the header, edits it, and presses Enter
- **THEN** `PATCH /api/threads/[id]` is called with the new title and the header displays it

#### Scenario: Inline title edit cancelled on Escape
- **WHEN** the user clicks the thread title, edits it, and presses Escape
- **THEN** the title reverts to its previous value and no API call is made

### Requirement: Thread can be renamed and deleted from thread management controls
The system SHALL provide a `⋯` menu in the thread header with "Rename" and "Delete" actions. "Rename" SHALL activate the inline title edit. "Delete" SHALL open an `AlertDialog` asking for confirmation; on confirm, `DELETE /api/threads/[id]` SHALL set `deleted_at` (soft delete) and navigate the user back to the thread list.

#### Scenario: Delete requires confirmation
- **WHEN** the user clicks Delete from the ⋯ menu
- **THEN** an `AlertDialog` appears with "Delete thread?" and Cancel / Delete buttons

#### Scenario: Confirmed delete soft-deletes and navigates away
- **WHEN** the user confirms deletion in the AlertDialog
- **THEN** `DELETE /api/threads/[id]` is called, the thread no longer appears in the sidebar, and the user is navigated to `/chat`

### Requirement: Chat API route streams agent responses and returns thread history
The system SHALL expose `POST /api/chat` that accepts `{ messages, threadId, agentId }`, routes to the correct Mastra agent, and returns a streaming response via `handleChatStream` + `createUIMessageStreamResponse`. The system SHALL expose `GET /api/chat?threadId=<id>` that fetches message history from Mastra memory and returns it as an array of UI messages compatible with `useChat`.

#### Scenario: POST streams agent response
- **WHEN** `POST /api/chat` is called with a valid `threadId`, `agentId`, and `messages`
- **THEN** the response is a streaming text/event-stream that progressively delivers the agent's response

#### Scenario: GET returns prior messages for hydration
- **WHEN** `GET /api/chat?threadId=<id>` is called
- **THEN** the response is a JSON array of UI messages in `useChat`-compatible format representing the thread's history

### Requirement: Thread CRUD API manages thread records
The system SHALL expose: `POST /api/threads` (create thread, returns `{ id, mastraThreadId, ... }`), `GET /api/threads` (list non-deleted threads for current user, ordered by `last_message_at DESC`), `GET /api/threads/[id]` (single thread by id), `PATCH /api/threads/[id]` (update title or `last_message_at`), `DELETE /api/threads/[id]` (soft-delete by setting `deleted_at`). All routes SHALL enforce workspace isolation and require an authenticated session.

#### Scenario: Create thread returns new thread record
- **WHEN** `POST /api/threads` is called with `{ agentId }`
- **THEN** a thread row is inserted with `owner_user_id`, `workspace_id`, `agent_id`, `title = 'New thread'`, and a generated `mastra_thread_id`; the full thread object is returned

#### Scenario: List threads returns only user's non-deleted threads
- **WHEN** `GET /api/threads` is called by an authenticated user
- **THEN** only threads where `owner_user_id` matches the current user and `deleted_at IS NULL` are returned, ordered by `last_message_at DESC`

#### Scenario: Unauthorized access is rejected
- **WHEN** a request is made to any `/api/threads` route without a valid session
- **THEN** the response is 401 Unauthorized

### Requirement: Command palette exposes thread search and new thread shortcut
The system SHALL include a command palette triggered by ⌘K (or Ctrl+K) rendered as a shadcn `CommandDialog`. The palette SHALL include a "Chat" `CommandGroup` with: (1) a "New thread" item that navigates to `/chat` and triggers the new thread flow, and (2) a dynamically filtered list of the user's threads matching the current `CommandInput` query by title. Selecting a thread item SHALL navigate to `/chat/[threadId]`. Thread results SHALL be filtered client-side from the TanStack Query cache — no dedicated search API endpoint is required. When no threads match the query the palette SHALL display "No results found."

#### Scenario: Command palette opens on ⌘K
- **WHEN** the user presses ⌘K (or Ctrl+K) anywhere in the app
- **THEN** the `CommandDialog` opens with an empty input and the "Chat" group visible

#### Scenario: Thread list filters by title as user types
- **WHEN** the user types in the `CommandInput`
- **THEN** only threads whose titles contain the query string (case-insensitive) are shown under the "Chat" group

#### Scenario: Selecting a thread navigates to it
- **WHEN** the user selects a thread item in the command palette
- **THEN** the palette closes and the user is navigated to `/chat/[threadId]`

#### Scenario: New thread item triggers thread creation flow
- **WHEN** the user selects the "New thread" item
- **THEN** the palette closes and the agent selector opens to begin the new thread flow

#### Scenario: No matching threads shows empty state
- **WHEN** the user types a query that matches no thread titles
- **THEN** the `CommandEmpty` renders "No results found."
