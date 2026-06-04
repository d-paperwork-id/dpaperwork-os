## 1. Install AI Elements

- [x] 1.1 Run `npx ai-elements@latest` in the project root and verify components install to `@/components/ai-elements/`
- [x] 1.2 Confirm import paths (`conversation`, `message`, `tool`, `prompt-input`) exist in `components/ai-elements/`

## 2. Thread CRUD API

- [x] 2.1 Create `app/api/threads/route.ts` — `GET` returns non-deleted threads for the current user ordered by `last_message_at DESC`; `POST` creates a thread with `agentId`, generates a `mastra_thread_id`, and returns the new thread object
- [x] 2.2 Create `app/api/threads/[id]/route.ts` — `GET` returns a single thread; `PATCH` updates `title` or `last_message_at`; `DELETE` soft-deletes by setting `deleted_at`
- [x] 2.3 Add workspace isolation and session auth guard to all thread routes (401 if unauthenticated or wrong workspace)

## 3. Chat Streaming API

- [x] 3.1 Create `app/api/chat/route.ts` — `POST` accepts `{ messages, threadId, agentId }`, routes to the correct Mastra agent, and returns a streaming response via `handleChatStream` + `createUIMessageStreamResponse`
- [x] 3.2 Implement `GET /api/chat?threadId=` — fetch message history from Mastra memory and map to `useChat`-compatible `Message[]` shape using a `toUIMessages` mapper
- [x] 3.3 Ensure `threadId` is forwarded in the Mastra agent call so messages are persisted to the correct Mastra thread

## 4. Thread List Sidebar

- [x] 4.1 Create `app/(app)/chat/page.tsx` with a two-column layout: fixed-width thread list sidebar (left) + thread view area (right); wrap both in the existing app shell
- [x] 4.2 Build the thread list using `useQuery` → `GET /api/threads`; render each thread as a shadcn `Item` row showing title and agent name
- [x] 4.3 Add empty state: when no threads exist, render a full-bleed prompt "Start a conversation with your AI team" with a "New Thread" CTA button
- [x] 4.4 Highlight the currently active thread in the sidebar list

## 5. New Thread Flow (Agent Selector)

- [x] 5.1 Check if a `GET /api/agents` route exists scoped to the current user's workspace; if not, create one that returns agents from `workspace_agent_config`
- [x] 5.2 Build the agent selector as a shadcn `Combobox` that fetches and filters to the user's assigned agents
- [x] 5.3 Wire "New Thread" button: open the agent selector, on agent selection call `POST /api/threads`, then navigate to `/chat/[threadId]`

## 6. Thread View

- [x] 6.1 Create `app/(app)/chat/[threadId]/page.tsx` (or a `ThreadView` component rendered in the chat page) — fetch thread record, hydrate messages from `GET /api/chat?threadId=`, then enable input
- [x] 6.2 Build the message list using AI Elements: `Conversation` > `ConversationContent` > per-message `Message` + `MessageContent` + `MessageResponse`; render user messages right-aligned, agent messages left-aligned with avatar and name
- [x] 6.3 Render tool call parts using AI Elements `Tool` + `ToolHeader` + `ToolContent` + `ToolInput` + `ToolOutput` inside a collapsible section per tool call
- [x] 6.4 Wire `useChat` with `DefaultChatTransport({ api: '/api/chat' })` and pass `{ threadId, agentId }` via the `body` option
- [x] 6.5 Add `ConversationScrollButton` for auto-scroll-to-bottom behavior
- [x] 6.6 Build the input area using `PromptInput` + `PromptInputBody` + `PromptInputTextarea`; submit on Enter, disabled while streaming

## 7. Thread Header and Management

- [x] 7.1 Build the thread header (48px fixed): displays agent name on left; `⋯` dropdown menu on right with "Rename" and "Delete" actions
- [x] 7.2 Implement inline title edit: clicking the title or selecting "Rename" turns it into an `<input>`; Enter/blur saves via `PATCH /api/threads/[id]`; Escape cancels
- [x] 7.3 Implement auto-title after first message: after first send succeeds, call `PATCH /api/threads/[id]` with `firstMessage.slice(0, 57) + (len > 57 ? '...' : '')`
- [x] 7.4 Implement delete: "Delete" opens `AlertDialog`; on confirm call `DELETE /api/threads/[id]`, invalidate thread list query, navigate to `/chat`

## 8. Command Palette Thread Search

- [x] 8.1 Add a `CommandDialog` component to the app shell (or a dedicated `CommandPalette` component mounted in the root layout) triggered by ⌘K / Ctrl+K via a `useEffect` keydown listener
- [x] 8.2 Add a "Chat" `CommandGroup` with a "New thread" `CommandItem` that closes the palette and opens the agent selector
- [x] 8.3 Populate the "Chat" group with the user's threads from the TanStack Query cache (`useQuery` for `GET /api/threads`), filtered client-side by the `CommandInput` value (case-insensitive title match)
- [x] 8.4 Wire thread item `onSelect` to navigate to `/chat/[threadId]` and close the palette

## 9. Polish and Edge Cases

- [x] 9.1 Handle network error during streaming — show error banner in thread view with a retry option
- [x] 9.2 Handle empty agent response or `cannot_complete` — display the agent's message explaining the gap (no special UI treatment needed beyond normal message rendering)
- [x] 9.3 Verify the Chat sidebar nav item href points to `/chat` (fix `app-sidebar.tsx` if needed)
- [x] 9.4 Test: create thread → send message → verify streaming → verify thread title auto-sets → rename thread → delete thread → search thread via ⌘K
