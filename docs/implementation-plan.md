# dpaperwork — Implementation Plan

**Status:** Draft v0.1
**Owner:** [Founder]
**Last updated:** May 21, 2026
**Team:** Founder + 1 developer
**Tooling:** Agentic coding (Claude Code)

---

## Guiding Principle

**Ship the smallest thing that proves the idea, then expand.**

The full product documented across PRD, architecture, and agent runtime is the destination. This plan is the route. Not every architectural decision needs to be implemented on day one — but it needs to be implemented correctly when its time comes.

The north star for Phase 1: a design partner opens their laptop Monday morning and sees a smart summary of their business waiting in their inbox. That moment is demonstrable, shareable on LinkedIn, and proves the core concept without requiring chat, orchestration, voice, integrations, or any of the complexity in the architecture document.

**What this means for the agentic coding workflow:**

Each task is sized for one Claude Code session. The file paths, component names, and patterns reference the design documents directly — pass the relevant section of the UI/UX doc, schema doc, or agent runtime doc as context when starting each task. Do not start on a later phase task until the current phase milestone is met.

---

## What Is Already Built

Based on the stated starting point ("base setup with user auth"):

- ✅ Next.js app (App Router, API routes)
- ✅ Tailwind CSS + shadcn/ui initialized
- ✅ Better Auth setup (sign up, sign in, session)
- ✅ Supabase project (or local Postgres)
- ✅ Drizzle initialized
- ✅ Basic routing shell

---

## Phase 0 — Foundation (Before Phase 1 Starts)

**Goal:** Everything is wired up and a developer can run the app locally, create a workspace, and land on the main layout.

**Definition of done:** Two people can sign up, create a workspace, invite a member, and see the app shell with sidebar.

### 0.1 Infrastructure setup

- [x] Supabase project created (Mumbai region), connection string in `.env`
- [x] Upstash Redis instance created, keys in `.env`
- [x] AWS S3 bucket created (`dpaperwork-skills`), S3 versioning enabled, IAM credentials in `.env`
- [x] Trigger.dev project created, API keys in `.env`
- [x] Vercel project connected to repo, env vars synced
- [x] Mastra initialized in `src/mastra/index.ts` — bare instance, no agents yet
- [x] `@mastra/ai-sdk`, `@ai-sdk/react`, `ai` packages installed

### 0.2 Database schema — core tables only

Run `drizzle-kit generate` and `drizzle-kit push` after each file.

- [ ] `db/schema/auth.ts` — Better Auth user extension (timezone, language, notification preferences)
- [ ] `db/schema/workspace.ts` — `workspaces` + `workspace_members` tables
- [ ] `db/schema/content.ts` — `context_md` + `context_md_versions` tables
- [ ] `db/schema/agents.ts` — `workspace_agent_config` + `user_agent_assignments` tables
- [ ] `db/schema/domains.ts` — `domains` + `domain_fields` + `domain_records` tables
- [ ] `db/schema/routines.ts` — `routines` + `routine_runs` tables
- [ ] `db/schema/chat.ts` — `threads` + `inbox_items` tables
- [ ] `db/schema/runs.ts` — `runs` table
- [ ] `db/schema/audit.ts` — `tool_call_log` + `agent_writes_log` tables
- [ ] `db/schema/usage.ts` — `usage_daily` table
- [ ] `db/schema/roles.ts` — `roles` table
- [ ] Seed function: creates default domains (Customers, Deals, Tasks, Vendors, Team) + default agent configs + empty CONTEXT.md + default role.md per agent

Reference: Backend Schema doc, Sections 4–14.

### 0.3 Workspace creation flow

- [ ] After sign up: if no workspace → redirect to `/onboarding/workspace` (name + timezone)
- [ ] Create workspace → seed defaults (domains, agent configs, role.md, context_md, roles)
- [ ] Redirect to `/` (app home: Inbox)
- [ ] Invite link flow: sign up with invite link → join workspace directly

### 0.4 App shell

- [ ] Install and configure shadcn `Sidebar` component (`npx shadcn@latest add sidebar`)
- [ ] `app/(app)/layout.tsx` — `SidebarProvider` wrapping full app
- [ ] `AppSidebar` component — nav items: Chat, Inbox, Domains, Routines, Projects, Integrations, Settings
- [ ] `SidebarHeader` — workspace name + switcher (placeholder for now)
- [ ] `SidebarFooter` — user avatar + name + dropdown (profile, sign out)
- [ ] Page header component (48px, `text-sm font-medium`, right-side actions slot)
- [ ] `ThemeProvider` for dark/light mode
- [ ] Middleware: auth guard on `/(app)/**`, redirect to `/sign-in` if no session

Reference: UI/UX doc, Sections 6 and 14 (Sidebar).

### 0.5 Settings shell

- [ ] `app/(app)/settings/layout.tsx` — settings sub-navigation (Profile, Workspace, Agents, Team, Billing)
- [ ] `app/(app)/settings/profile/page.tsx` — name, email, timezone, language, theme toggle
- [ ] `app/(app)/settings/workspace/general/page.tsx` — workspace name, timezone, language (empty for now, wire up later)

---

## Phase 1 — The LinkedIn Moment

**Goal:** A design partner can set up CONTEXT.md, and Monday 9am they receive a smart weekly summary of their business in their inbox.

**Definition of done:**
- User fills in CONTEXT.md
- User adds a few records to one domain (e.g., Deals)
- A Trigger.dev scheduled task fires Monday 9am workspace-local time
- Chief of Staff agent reads CONTEXT.md + domain records
- Result lands as an inbox item
- User opens inbox, reads the summary, marks it resolved

**What is deliberately NOT in Phase 1:**
- Chat (no threads, no streaming)
- Orchestrator / ReWOO
- S3 skills system (skill is hardcoded in TypeScript)
- Working memory
- Composio integrations
- Multiple agents (Chief of Staff only)
- Projects
- Voice

### 1.1 CONTEXT.md editor

- [ ] `app/(app)/settings/workspace/context/page.tsx`
- [ ] Markdown textarea using shadcn `Field` + `Textarea` with `font-mono text-sm`
- [ ] Section guidance shown as placeholder (What we do, Why this matters, ICP, How we sell, Team, Tools)
- [ ] Save button — creates version row in `context_md_versions`, updates `context_md.current_version_id`
- [ ] Optimistic concurrency check on `updated_at`
- [ ] Version history list below editor — each version shows timestamp + saved by
- [ ] "Restore" on any version creates a new version with that content

Reference: App Flow doc, Section 9.1. Schema doc, Section 6.

### 1.2 Domains — basic CRUD

- [ ] `app/(app)/domains/page.tsx` — domain list using shadcn `Item` per domain, shadcn `Empty` if none
- [ ] `app/(app)/domains/[slug]/page.tsx` — domain view: grid (TanStack Table via shadcn `Data Table`)
- [ ] Domain grid: rows `h-9`, inline cell editing, `New Record` row at bottom
- [ ] Add/edit record sheet (`Sheet` component, all fields from `domain_fields`)
- [ ] Domain field types implemented for Phase 1: `text`, `long_text`, `number`, `date`, `single_select`
- [ ] API routes: `GET/POST /api/domains`, `GET/PUT/DELETE /api/domains/[id]/records`
- [ ] All writes log to `agent_writes_log` with `created_by_user_id` (no agent attribution yet)

Reference: App Flow doc, Section 6. UI/UX doc, Section 8.3. Schema doc, Section 8.

### 1.3 Chief of Staff agent — hardcoded skill

Do not implement S3 skills yet. The skill is a TypeScript function that the agent uses as a Mastra tool.

- [ ] `src/mastra/agents/chief-of-staff.ts` — Mastra `Agent` with:
  - Dynamic instructions loading `context_md` from DB + default `role_md` content
  - `domain.read` Mastra tool (reads domain records for the workspace)
  - `context.lookup` Mastra tool (reads sections of CONTEXT.md)
  - `inbox.create` Mastra tool (writes to `inbox_items`)
- [ ] `src/mastra/skills/weekly-company-update.ts` — hardcoded skill as a Mastra tool:
  - Reads Projects domain + Deals domain if they exist
  - Reads CONTEXT.md "How we sell" section
  - Synthesises markdown report (200-500 words)
  - Calls `inbox.create` with result
- [ ] Register agent in `src/mastra/index.ts`
- [ ] No memory, no working memory, no orchestrator — single agent, single skill call

Reference: Agent Runtime doc, Sections 4 and 5 (note: skill is hardcoded in code, not S3 yet). Section 2 mental model.

### 1.4 Routines — single hardcoded routine + UI

- [ ] Trigger.dev task `src/trigger/run-routine.ts` — fetches routine from DB, builds RuntimeContext, invokes agent
- [ ] Schedule registration: on routine create/edit, call Trigger.dev schedules API to register cron (converted to UTC from workspace timezone)
- [ ] `app/(app)/routines/page.tsx` — routine list, shadcn `Item` per routine, `Empty` if none
- [ ] `app/(app)/routines/new/page.tsx` — new routine form:
  - Name, agent select (Chief of Staff only for now), instruction textarea
  - Schedule: day of week + time picker (workspace-local timezone shown)
  - Output: Inbox (only option for now)
  - Save → create DB row + register Trigger.dev schedule
- [ ] `app/(app)/routines/[id]/page.tsx` — routine detail: instruction, schedule, run history list
- [ ] Run history: `routine_runs` rows using shadcn `Item` — timestamp, status badge, output summary
- [ ] Pause/resume/delete actions

Reference: App Flow doc, Section 7. Schema doc, Section 9.

### 1.5 Inbox

- [ ] `app/(app)/inbox/page.tsx` — inbox list, sorted by `created_at desc`
- [ ] Each row: shadcn `Item` component — agent avatar, title, body preview, relative time
- [ ] Unread indicator: colored left border using agent CSS variable
- [ ] Filter bar: by agent (shadcn `Select`), by status (unread/all/resolved)
- [ ] Click item → `Sheet` opens with full body (rendered markdown), source agent, source routine, action buttons
- [ ] Action buttons in `ButtonGroup`: Mark resolved, Snooze (with `Popover` time picker)
- [ ] `Empty` component when inbox is empty
- [ ] Badge in sidebar nav showing unread count — poll every 30 seconds or on focus
- [ ] API routes: `GET /api/inbox`, `POST /api/inbox/[id]/resolve`, `POST /api/inbox/[id]/snooze`

Reference: App Flow doc, Section 5. UI/UX doc, Sections 7.4, 8.2, 14.

### 1.6 Phase 1 validation

Before moving to Phase 2:

- [ ] End-to-end test: create workspace → fill CONTEXT.md → add 3 domain records → create Monday 9am routine → trigger manually ("Run now") → see result in inbox
- [ ] Run against a realistic CONTEXT.md (fill in a real or simulated company) and evaluate output quality
- [ ] Show to at least one person outside the team and get honest feedback
- [ ] Post the Monday inbox moment on LinkedIn

---

## Phase 2 — Design Partner Ready

**Goal:** 10 design partners can use dpaperwork daily, get meaningful value, and the product is stable enough to charge ₹50K setup + ₹10K/month.

**Definition of done:**
- Chat works with Chief of Staff and Product Manager
- All settings surfaces are functional
- Team invite and role assignment works
- Domains fully functional (all field types, views)
- 3 routine templates available out of the box
- White-glove onboarding checklist is in the app

### 2.1 Chat surface

- [ ] Install AI Elements: `npx ai-elements@latest`
- [ ] `app/api/chat/route.ts` — POST: `handleChatStream` + `createUIMessageStreamResponse`. GET: fetch thread history from Mastra memory
- [ ] `app/(app)/chat/page.tsx` — thread list sidebar + `ThreadView`
- [ ] `ThreadView` using AI Elements: `Conversation`, `Message`, `MessageResponse`, `Tool`, `PromptInput`
- [ ] Thread list: shadcn `Item` per thread, `Empty` if none, "New Thread" button
- [ ] Agent selector: shadcn `Combobox` showing only the user's assigned agents
- [ ] Thread title: auto-set from first message, editable inline
- [ ] Streaming: `useChat` with `DefaultChatTransport` — do not implement raw SSE
- [ ] Thread management: rename, delete (with `AlertDialog` confirmation)
- [ ] API: `POST /api/threads`, `GET /api/threads/[id]`, `DELETE /api/threads/[id]`

Reference: App Flow doc, Section 4. UI/UX doc, Sections 8.1, 15. Architecture doc, streaming section.

### 2.2 Product Manager agent

Same pattern as Chief of Staff. Still hardcoded skills — no S3 yet.

- [ ] `src/mastra/agents/product-manager.ts` — agent with dynamic instructions
- [ ] Hardcoded PM skills as Mastra tools:
  - `draft_spec` — produces a PRFAQ-style spec from a prompt
  - `summarize_user_feedback` — synthesises feedback from domain records
  - `prioritize_backlog` — orders tasks domain by impact/effort
- [ ] Register PM agent in Mastra instance
- [ ] Add PM to workspace_agent_config seed
- [ ] Test: chat with PM, ask it to draft a spec, verify output

### 2.3 Settings — full

Complete the settings surfaces stubbed in Phase 0.

- [ ] `settings/workspace/context` — already done in Phase 1
- [ ] `settings/workspace/memory/page.tsx` — agent selector (`Tabs` per agent), Mastra working memory viewer. Per entry: timestamp, content (editable), delete. Prune banner when entries > 200. Note: working memory is read from Mastra's storage, not a custom table.
- [ ] `settings/workspace/general` — finish: name, slug, timezone, working hours, branding logo upload (S3)
- [ ] `settings/agents/page.tsx` — agent cards using the agent card pattern from UI/UX doc Section 8.4
- [ ] `settings/agents/[agentId]/page.tsx` — role.md editor, skill list (hardcoded list from code), tool permissions list, assigned users count
- [ ] role.md save/version (same pattern as CONTEXT.md)
- [ ] `settings/team/members/page.tsx` — members list, invite modal, manage member sheet
- [ ] `settings/team/roles/page.tsx` — roles list, create role, edit permissions, delete guard

Reference: App Flow doc, Sections 9.1–9.9. Schema doc, Sections 6, 7.

### 2.4 Domains — complete

- [ ] Remaining field types: `boolean`, `datetime`, `multi_select`, `person_ref`, `domain_ref`, `file`
- [ ] Field manager panel (add, reorder, delete field)
- [ ] View switcher: Grid (done), Kanban (group by single_select field), Calendar (group by date field)
- [ ] Import from CSV (`papaparse`)
- [ ] Context menu on row: edit, duplicate, delete (`ContextMenu` component)
- [ ] `Filter` panel (shadcn `Popover`): filter by any field value
- [ ] Column resize handle
- [ ] Default domains review: review seeded field set against real business needs based on Phase 1 feedback

### 2.5 Routine templates

- [ ] 3 starter templates cloneable from the "New Routine" flow:
  - Weekly company update (Chief of Staff, Monday 9am, inbox)
  - Weekly product update (Product Manager, Friday 4pm, inbox)
  - Flag stale deals (Chief of Staff, Wednesday 10am, inbox)
- [ ] Template picker step in the new routine form (shadcn `Item` cards)
- [ ] Each template pre-fills name, agent, instruction, schedule

### 2.6 Onboarding checklist

- [ ] Dismissible banner on app home (Inbox page) showing 4-step checklist:
  1. Fill in CONTEXT.md
  2. Connect first integration (placeholder — links to settings/integrations which shows "coming soon" for now)
  3. Review default domains
  4. Start first chat
- [ ] Each step links to the relevant page
- [ ] Checklist state stored in `workspace_members` (`onboarding_step` column — add to schema)
- [ ] Auto-dismiss when all 4 steps complete
- [ ] `Empty` variant for inbox with checklist steps visible when inbox is empty and onboarding incomplete

### 2.7 Command palette

- [ ] `⌘K` / `Ctrl+K` global shortcut opens `CommandDialog`
- [ ] Groups: Chat (new thread), Domains (navigate to each domain), Routines (navigate, run now), Settings
- [ ] Search filters across groups
- [ ] Keyboard shortcut hints using `Kbd` component

### 2.8 Error handling + reliability

- [ ] Sentry initialization (frontend + API routes + Trigger.dev tasks)
- [ ] Global error boundary in Next.js
- [ ] Routine failure: catches error → creates inbox item with error summary + link to run detail
- [ ] Budget check on each agent invocation (Redis daily counter, see Architecture doc Section 12)
- [ ] Budget exceeded: friendly UI message in chat, routine auto-pause + inbox alert
- [ ] PostHog initialization, basic page view events

### 2.9 Billing basics

- [ ] `settings/billing/page.tsx` — plan tier display, payment method placeholder
- [ ] Setup fee collection: Razorpay or Stripe (India-ready), manual process is fine for first 10
- [ ] Workspace `plan_tier` field used to gate future features (just store it for now)

---

## Phase 3 — Agent Runtime

**Goal:** Agents feel like actual staff. They plan, execute multi-step work, remember things, and act across integrations on the user's behalf.

This phase implements what the architecture and agent runtime documents describe fully. Do not start Phase 3 until Phase 2 is stable with paying design partners.

### 3.1 S3 skills system

- [ ] Create `s3://dpaperwork-skills` bucket with versioning enabled
- [ ] Migrate hardcoded skills from TypeScript tools to `SKILL.md` files following Agent Skills spec
- [ ] S3 directory structure: `_platform/{agent_id}/{skill_name}/SKILL.md`
- [ ] `agent_rule.md` per agent
- [ ] Mastra Workspace with dynamic `skills` resolver using `RuntimeContext`
- [ ] `CompositeFilesystem` layering: `workspaces/{workspace_id}` (tenant overrides) over `_platform`
- [ ] Tenant skill override path provisioned (empty) for each workspace
- [ ] Smoke test infrastructure: `db/fixtures/` test workspace, CI eval runner

Reference: Agent Runtime doc, Section 5.

### 3.2 ReWOO orchestrator

- [ ] `src/mastra/agents/orchestrator.ts` — orchestrator agent with plan schema
- [ ] Plan-execute-solve loop: plan (structured JSON), execute steps in dependency order, synthesize
- [ ] `ExecutionState` type and in-memory state management
- [ ] Persist `ExecutionState` to `runs` table on completion
- [ ] `cannot_complete` gap surfacing — user sees clear message when agent or integration missing
- [ ] Parallel step execution for independent steps
- [ ] Update chat API route to route through orchestrator
- [ ] Plan streaming as structured tool event (AI Elements `Tool` component renders this)

Reference: Agent Runtime doc, Section 8.

### 3.3 Working memory

- [ ] Configure Mastra `Memory` with `workingMemory: { enabled: true, scope: 'resource' }` per agent
- [ ] Pass `resource: workspaceId` in all `agent.generate()` / `handleChatStream()` calls
- [ ] Working memory template per agent (see Agent Runtime doc, Section 6.3)
- [ ] Update settings memory tab to display and edit working memory from Mastra's storage
- [ ] Orchestrator's `tenantMemory.append` boundary: only orchestrator can update cross-cutting memory

Reference: Agent Runtime doc, Section 6.

### 3.4 Composio MCP integrations

- [ ] `settings/integrations/page.tsx` — integration list (Gmail, Google Calendar, Slack, Outlook)
- [ ] OAuth connect flow via Composio
- [ ] `integration_connections` table in use (was stubbed)
- [ ] Per-request `MCPClient` with `listToolsets()` for user's connected providers
- [ ] `agent_integration_permissions` enforcement (intersection of agent allowed + user connected)
- [ ] Routine OAuth: creator binding, pause on revoke
- [ ] Integration action log writes
- [ ] Webhook handling: `/api/webhooks/composio` with Redis idempotency keys

Reference: Architecture doc, Section 11. Agent Runtime doc, Section 4.2.

### 3.5 Executive Assistant agent

- [ ] `src/mastra/agents/executive-assistant.ts`
- [ ] Skills: `prep_meeting`, `draft_followup`, `schedule_event` (Composio calendar), `triage_email` (Composio Gmail)
- [ ] Requires Phase 3.4 (Composio) to be meaningful

### 3.6 Mastra evals (scorers)

- [ ] Custom scorers: `did_not_invent_data`, `skill_selection_correctness`, `matches_output_format`
- [ ] Attach scorers to Chief of Staff and PM agents with 10% sampling
- [ ] CI smoke test runner against fixture workspaces
- [ ] Score anomaly alerting (inbox item to admin when average score drops)

Reference: Agent Runtime doc, Section 13.

---

## Phase 4 — Growth & Polish

Start only after Phase 3 is stable and standard pricing has launched.

### 4.1 Voice

- [ ] ElevenLabs STT integration in chat input (mobile browser and desktop)
- [ ] ElevenLabs TTS for agent responses (optional, on-demand)
- [ ] Multi-lingual: English + Hindi as baseline, test code-switching
- [ ] Mobile-specific voice UX (hands-free) — deferred to mobile app architecture

### 4.2 Projects surface

- [ ] `app/(app)/projects/` — kanban board, task detail, timeline view
- [ ] Agent task ownership (agent assigned to a task, status updates via routine)
- [ ] Task creation from inbox items and routine outputs

### 4.3 Additional agents

- [ ] Sales Ops agent
- [ ] Marketing Ops agent
- [ ] People Ops / HR agent
- [ ] Each follows same pattern: role.md, skills in S3, register in Mastra

### 4.4 Mobile companion app

- [ ] React Native CLI project
- [ ] Firebase Cloud Messaging push notifications
- [ ] Inbox, Chat (no voice yet), Domains (read-only view)
- [ ] Separate architecture document (already noted as out of scope for web arch doc)

### 4.5 Platform & scale

- [ ] Supabase → RDS Mumbai migration (when a customer requires India data residency commitment)
- [ ] Mastra Workspace `VersionedSkillSource` for production skill version pinning
- [ ] Per-workspace Postgres schemas (when tenant isolation needs tightening)
- [ ] Upstash → ElastiCache (when Redis costs become significant)

---

## Parallelism Guide

Two people on a small team. Maximum velocity when work is parallel. The founder (stronger on agent/backend context) and the developer (ask them before assigning):

### If developer is frontend-focused:

| Founder | Developer |
|---|---|
| P0: DB schema, Mastra init, Trigger.dev setup | P0: App shell, Sidebar, auth flow |
| P1: Chief of Staff agent, skill, Trigger.dev task | P1: CONTEXT.md editor, Inbox surface |
| P1: Routine API + scheduling | P1: Domains grid + CRUD |
| P2: PM agent, orchestrator wiring | P2: Chat surface + AI Elements |
| P2: Working memory, skills system | P2: Settings surfaces (agents, team, roles) |

### If developer is backend-focused:

| Founder | Developer |
|---|---|
| P0: Mastra init, agent setup direction | P0: DB schema + all API routes |
| P1: Agent skill quality + prompts | P1: Trigger.dev task, runtime, inbox API |
| P1: Test and evaluate routine output | P1: Domains API + domain CRUD |
| P2: Orchestrator design, memory | P2: Composio integration, audit logging |
| P2: Eval/scorer setup | P2: Billing, rate limiting, budget enforcement |

**Rule:** API routes are always finalized before UI work starts on that surface. Design documents (schema, agent runtime, UI/UX) are shared context for both people.

---

## What to Pass to Claude Code Per Session

Each agentic coding session should receive:

1. **The specific task** from this implementation plan (e.g., "1.5 Inbox — build the inbox page")
2. **The relevant doc sections:** paste in the exact sections from the design documents that apply:
   - App Flow doc for the user journey
   - Schema doc for the tables and columns involved
   - UI/UX doc for the components and patterns to use
   - Agent Runtime doc for anything touching Mastra
3. **The current file tree** (`ls -R src/ db/`) so Claude Code knows what already exists
4. **Any existing code** in files it will touch

Do not ask Claude Code to "build the full app." One task at a time. Each task should complete in under 30 minutes of generation + review.

---

## Open Questions Before Building

These need answers before the relevant phase starts — not before Phase 0.

**Before Phase 1:**
- Workspace timezone default for design partners (Mumbai/IST assumed — confirm)
- Which one domain should be pre-filled with sample data for the first routine to reference? (Deals makes most sense for demo value)

**Before Phase 2:**
- Is the developer frontend or backend focused? Determines parallelism plan above.
- Payment collection method for ₹50K setup fee — Razorpay or manual bank transfer?
- What's the Trigger.dev plan and concurrent task limit for the team?

**Before Phase 3:**
- Which Composio integrations to launch with? (Gmail + Google Calendar as minimum)
- Confirm Mastra `@mastra/pg` schema upgrade policy before Phase 3 adds working memory

**Before Phase 4:**
- Decision on Supabase → managed Postgres trigger (data residency requirement or scale)
- Mobile dev resource — same developer or separate?
