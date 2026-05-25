## 1. API Routes

- [x] 1.1 Create `app/api/settings/context/route.ts` — `GET` returns `{ content, updatedAt, currentVersionId }` for the authenticated user's workspace
- [x] 1.2 Implement `PUT` on the same route — accepts `{ content, updatedAt }`, runs the transaction (insert version row, update `context_md`), returns 409 on `updated_at` mismatch, 200 with new `updatedAt` on success
- [x] 1.3 Create `app/api/settings/context/versions/route.ts` — `GET` returns ordered list of `{ id, createdAt, createdByUserId, createdByName }` for the workspace
- [x] 1.4 Create `app/api/settings/context/versions/[id]/restore/route.ts` — `POST` reads version content by ID, inserts new version row, updates `context_md`, returns 200

## 2. Novel Editor Setup

- [x] 2.1 Install Novel: `bun add novel`
- [x] 2.2 Create `components/context-md-editor/editor.tsx` — client component wrapping Novel's `Editor` with `onUpdate` callback that receives the markdown string and calls a prop `onChange: (markdown: string) => void`
- [x] 2.3 Configure Novel placeholder text via the `placeholder` prop: `"Type '/' for commands, or start writing about your business..."`
- [x] 2.4 Style the Novel wrapper to match the app: `min-h-[400px] rounded-md border border-input bg-background px-3 py-2`
- [x] 2.5 Seed initial content via Novel's `defaultValue` prop using the fetched markdown string; use a `key={currentVersionId}` on the `Editor` so it remounts when a restore changes the content

## 3. Editor Page

- [x] 3.1 Replace the placeholder in `app/(app)/settings/workspace/context/page.tsx` with a `"use client"` component
- [x] 3.2 Fetch current content on mount via TanStack Query (`useQuery`) calling `GET /api/settings/context`
- [x] 3.3 Render the Novel `Editor` component; wire `onChange` to local `draft` state
- [x] 3.4 Track `isDirty = draft !== fetchedContent` — disable Save button when false
- [x] 3.5 Implement Save via `useMutation` calling `PUT /api/settings/context` with `{ content: draft, updatedAt }`; show success toast on 200, error toast on 409 with "Reload to see latest version" message
- [x] 3.6 Add a `Separator` and "Version history" heading below the editor

## 4. Version History List

- [x] 4.1 Fetch versions via TanStack Query (`useQuery`) calling `GET /api/settings/context/versions`
- [x] 4.2 Render each version as a row showing relative timestamp (e.g., "2 days ago") and saver display name
- [x] 4.3 Show empty state text ("No saved versions yet") when list is empty
- [x] 4.4 Add a Restore button on each version row; on click, call `POST /api/settings/context/versions/[id]/restore` via `useMutation`
- [x] 4.5 On successful restore, invalidate both `GET /api/settings/context` and `GET /api/settings/context/versions` queries so the editor and history list refresh
