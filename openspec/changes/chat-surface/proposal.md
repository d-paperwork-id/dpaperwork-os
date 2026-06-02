## Why

Users have no way to converse with their AI agents today — the Chat nav item exists in the sidebar but leads nowhere. Without the chat surface, the core value of the platform (AI-first operations through agents) is completely inaccessible.

## What Changes

- Install AI Elements (`@ai-elements/react`) for streaming chat UI components
- Add `app/api/chat/route.ts` — POST streams agent responses, GET fetches thread history from Mastra memory
- Add `app/api/threads/route.ts` and `app/api/threads/[id]/route.ts` — thread CRUD
- Add `app/(app)/chat/page.tsx` — two-column layout: thread list sidebar + thread view
- Thread list: shadcn `Item` rows, "New Thread" button, empty state
- Agent selector: `Combobox` scoped to the user's assigned agents, shown on new thread creation
- `ThreadView` built with AI Elements: `Conversation`, `Message`, `MessageResponse`, `Tool`, `PromptInput`
- Thread title: auto-set from first message content, editable inline
- Thread management: rename inline, delete with `AlertDialog` confirmation
- Streaming: `useChat` with `DefaultChatTransport` — no raw SSE
- Command palette (⌘K): "Chat" group with "New thread" item + thread search by title, navigating directly to the thread

## Capabilities

### New Capabilities
- `chat-surface`: Full chat UI and API — thread list, thread view, streaming agent responses, thread CRUD, agent selector, command palette thread search

### Modified Capabilities
- (none — `chat-tables` schema is already defined and unchanged)

## Impact

- **New route**: `app/(app)/chat/page.tsx`
- **New API routes**: `app/api/chat/route.ts`, `app/api/threads/route.ts`, `app/api/threads/[id]/route.ts`
- **New dependency**: `ai-elements` (installed via `npx ai-elements@latest` into `@/components/ai-elements/`)
- **Reads from**: `threads` table (already exists via `chat-tables` spec), Mastra memory API for message history
- **Writes to**: `threads` table, Mastra memory (via Mastra's thread API)
- **Touches**: `app-sidebar.tsx` if Chat nav item needs an href fix
