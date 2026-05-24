## 1. Verify Prerequisites

- [x] 1.1 Confirm `components/ui/tabs.tsx` exists; if not, add with `bunx shadcn@latest add tabs`

## 2. Workspace Sub-Tab Navigation

- [x] 2.1 Create `app/(app)/settings/workspace/layout.tsx` — renders shadcn `Tabs` with three tab triggers (General, Context, Memory), active tab derived from `usePathname` via `startsWith`, wraps `{children}` below the tab bar
- [x] 2.2 Create `app/(app)/settings/workspace/context/page.tsx` — placeholder page using the settings section heading pattern (`text-sm font-semibold` title, `text-sm text-muted-foreground` description communicating this is coming in Phase 1)
- [x] 2.3 Create `app/(app)/settings/workspace/memory/page.tsx` — placeholder page using the same pattern, communicating this is coming in Phase 2

## 3. Fix Existing Pages

- [x] 3.1 Edit `app/(app)/settings/agents/page.tsx` — remove the `<PageHeader>` component call; keep only the settings section content (heading + description + content area)
- [x] 3.2 Edit `app/(app)/settings/team/page.tsx` — rewrite stub to use `space-y-8` wrapper with `text-sm font-semibold` heading and `text-sm text-muted-foreground` description matching the settings section style
- [x] 3.3 Edit `app/(app)/settings/billing/page.tsx` — same as team: rewrite to match settings section style

## 4. Settings Root Redirect

- [x] 4.1 Edit `app/(app)/settings/page.tsx` — ensure it calls `redirect("/settings/profile")` from `next/navigation` (create the file if it doesn't exist)

## 5. Verify

- [x] 5.1 Run `npm run dev` and navigate to `/settings` — confirm redirect to `/settings/profile` works
- [x] 5.2 Navigate to `/settings/workspace/general` — confirm workspace tab bar renders with General active
- [x] 5.3 Click the Context and Memory tabs — confirm navigation and placeholder pages render without errors
- [x] 5.4 Navigate to `/settings/agents` — confirm only one page header is visible
- [x] 5.5 Navigate to `/settings/team` and `/settings/billing` — confirm styled placeholder sections render
- [x] 5.6 Run `npm run build` — confirm no TypeScript or build errors
