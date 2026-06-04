## Context

The platform's core value — AI-first operations through agents — requires a chat interface. The sidebar nav item exists but the route is unimplemented. The `threads` table is already defined (via `chat-tables` spec) and Mastra manages message storage. AI Elements is a Vercel/AI SDK component library that pairs directly with `useChat` and provides purpose-built streaming components.

The streaming architecture is already settled by the project stack: Mastra on the backend, `useChat` + `DefaultChatTransport` on the client. The main design decisions are around thread state management, the two-column layout, and agent scoping.

## Goals / Non-Goals

**Goals:**
- Full working chat surface: thread list, thread view, streaming responses, thread CRUD
- Agent selector scoped to the user's assigned agents (from `workspace_agent_config`)
- Thread title auto-set from first message, editable inline
- Thread management: rename, delete with confirmation
- Soft-delete threads (existing schema has `deleted_at`)
- Empty states for both thread list and new thread view
- Command palette (⌘K) with "Chat" group: "New thread" item + thread search by title

**Non-Goals:**
- Thread sharing / shareable links (schema has `is_shared` but this is Phase 2)
- Agent switching mid-thread (schema supports it but deferred)
- Real-time inbox → thread pre-loading (follow-on from inbox feature)

## Decisions

### 1. AI Elements for all streaming UI — no custom message components

**Decision**: Use AI Elements (`Conversation`, `Message`, `MessageResponse`, `Tool`, `PromptInput`) exclusively for the chat surface.

**Rationale**: AI Elements connects directly to `useChat` and handles streaming cursor, tool call rendering, and scroll-to-bottom behavior. Building custom components for this would duplicate solved problems and diverge from the project's `ui-ux.md` spec (Section 15).

**Alternative**: Custom components with raw SSE — explicitly prohibited by the implementation plan.

### 2. Thread state lives in TanStack Query, not local component state

**Decision**: Thread list is fetched via `useQuery` against `GET /api/threads`. Thread mutations (create, rename, delete) use `useMutation` with optimistic updates and query invalidation.

**Rationale**: Consistent with the project's "all data through `app/api/`" rule. TanStack Query provides cache invalidation across the thread list and sidebar badge without prop drilling.

### 3. Agent selector shown as a modal/popover on "New Thread" — not persistent in thread view

**Decision**: Agent is selected once when creating a new thread. After creation, the agent name shows in the thread header but cannot be changed in this phase.

**Rationale**: Simplifies the thread creation flow. Agent changing mid-thread is deferred. The agent selector uses shadcn `Combobox` filtered to `workspace_agent_config` for the current user.

### 4. Chat API: POST streams, GET returns history — single route

**Decision**: `app/api/chat/route.ts` handles both directions. POST accepts `{ messages, threadId, agentId }` and streams via `handleChatStream` + `createUIMessageStreamResponse`. GET accepts `?threadId=` and returns the Mastra message history for hydration.

**Rationale**: Mirrors the Mastra streaming pattern. Separating into two files adds no clarity — the route is naturally co-located with chat transport.

### 5. Thread title auto-set server-side after first message completes

**Decision**: After the first message streams successfully, the client calls `PATCH /api/threads/[id]` with `{ title: firstUserMessageContent.slice(0, 60) }` — derived client-side from the input value.

**Rationale**: Avoids an extra AI call for title generation. Simple truncation of the first message keeps it understandable. Title is editable inline anyway.

### 6. Command palette thread search uses client-side filtering over the TanStack Query cache

**Decision**: The `CommandInput` in the `CommandDialog` filters threads client-side from the same `GET /api/threads` result already in the TanStack Query cache. No dedicated search API endpoint is added.

**Rationale**: Thread lists are small (user's own threads only) and already fetched for the sidebar. Client-side filter over a cached array is instant and requires no extra network round-trip. A server-side search endpoint would add latency and complexity for negligible benefit at current scale.

**Alternative**: Full-text search endpoint on the backend — deferred until thread counts are large enough to warrant it.

## Risks / Trade-offs

- **AI Elements install path**: `npx ai-elements@latest` installs into `@/components/ai-elements/`. If the package changes its install behavior, the import paths break. → Run install into the project during implementation and verify import paths before proceeding.
- **Mastra message hydration on GET**: Mastra's memory API returns messages in its own format; client needs mapping to `useChat`'s `Message[]` shape. → Add a `toUIMessages` mapper in the API route.
- **Thread title truncation**: Truncating to 60 chars may cut mid-word. → Use `slice` to 57 + `'...'` if over 60.
- **`useChat` transport requires threadId**: `DefaultChatTransport` needs `threadId` in the POST body so Mastra persists to the right thread. → Pass via `body` option in `useChat`.

## Open Questions

- Does `workspace_agent_config` expose a query endpoint already, or does the thread creation flow need a new `GET /api/agents` route scoped to the current user? (Check existing agent API routes before implementing the agent selector.)
