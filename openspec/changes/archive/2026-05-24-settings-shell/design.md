## Context

The settings section was scaffolded in Phase 0.4/0.5 with a layout, sub-nav, and three functional pages (profile, workspace general, agents stub). Phase 1 adds `/settings/workspace/context` and Phase 2 adds `/settings/workspace/memory`. Without a workspace sub-tab navigation layer, each new workspace page would need its own navigation logic and the UX would be inconsistent. This design establishes that layer now, before Phase 1 work starts.

Current bugs:
- `/settings/agents/page.tsx` renders its own `<PageHeader>` which conflicts with the settings layout (the layout already owns the page chrome).
- Team and Billing stubs use raw `<div>` + `<h2>` markup rather than the section pattern defined in the UI/UX doc.

## Goals / Non-Goals

**Goals:**
- Workspace sub-tab nav: a `layout.tsx` at `app/(app)/settings/workspace/` renders General | Context | Memory tabs using shadcn `Tabs`, with active tab driven by the current pathname.
- Context and Memory placeholder pages slot in as empty placeholders that clearly communicate "coming in next phase."
- Agents, Team, Billing pages render consistently with the settings section style (no duplicate headers, proper section heading + description layout).
- `/settings` root redirects to `/settings/profile`.

**Non-Goals:**
- No API wiring — save buttons in profile and workspace/general remain unconnected (that's Phase 1+ work).
- No Content or Memory functionality — just placeholder scaffolding.
- No agent detail pages — that's Phase 2.3.

## Decisions

**Decision: `layout.tsx` for workspace tab nav, not inline `Tabs` per page**
Each workspace sub-page sharing the same tab bar means the tab component belongs in `app/(app)/settings/workspace/layout.tsx`. If it were inline, each page would duplicate the tab markup and active-state logic. The layout wraps all children under `settings/workspace/**`.

Alternative considered: shadcn `Tabs` with `asChild` links inside each page. Rejected: duplicates tab markup across 3 pages; the layout approach is DRY and matches Next.js conventions.

**Decision: `usePathname`-driven active tab, not Tabs `value` state**
Tabs map to routes (`/settings/workspace/general`, `/settings/workspace/context`, `/settings/workspace/memory`). Active state is derived from `pathname.startsWith(tabHref)`, not from local state. This means the browser back/forward button correctly reflects the active tab without any synchronization logic.

**Decision: Placeholder pages render the settings section pattern, not empty divs**
Context and Memory placeholders use the same `<h2 className="text-sm font-semibold">` + `<p className="text-sm text-muted-foreground">` pattern as the other settings sections. This is more honest than a blank page and sets the visual expectation for when content arrives.

## Risks / Trade-offs

- [Risk: Tabs component not installed] → Check `components/ui/tabs.tsx` exists before using; add with `bunx shadcn@latest add tabs` if absent.
- [Risk: Active state mismatch] → The `startsWith` check used in the workspace layout tab nav might false-positive if a future path like `/settings/workspace-other/` is added. This is acceptable for now — the settings section is small and controlled.

## Migration Plan

No data migration. All changes are UI-only:
1. Create `settings/workspace/layout.tsx` with tab nav
2. Add `settings/workspace/context/page.tsx` and `settings/workspace/memory/page.tsx` as placeholders
3. Fix `settings/agents/page.tsx`
4. Fix `settings/team/page.tsx` and `settings/billing/page.tsx`
5. Add `settings/page.tsx` redirect

Rollback: revert the files — no persistent state affected.

## Open Questions

- Should the Workspace tab in the left settings sidebar change its label to reflect the active workspace sub-page (e.g., "Workspace › General")? Decision deferred — breadcrumb is a Phase 2 polish item per the UI/UX doc.
