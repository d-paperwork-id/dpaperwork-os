# dpaperwork — App Flow Document

**Status:** Draft v0.1
**Owner:** [Founder]
**Last updated:** May 21, 2026
**Audience:** Designers and Engineers
**Scope:** Web app only. Happy path throughout; edge cases and empty states noted at the end of each flow.

---

## How to Read This Document

- **Flow diagrams** use rectangles for screens/pages, rounded rectangles for user actions, diamonds for decisions, and arrows for transitions.
- **State diagrams** show how an object moves between states and what triggers each transition.
- **Edge cases and empty states** appear in a callout block at the end of each section — not in the flow itself.
- **Every section maps to a real screen** — labels in diagrams match the route names in the implementation.

---

## 1. Navigation Map

The global navigation structure. This is the skeleton every flow lives inside.

```mermaid
flowchart LR
    Root([Authenticated App]) --> Chat
    Root --> Inbox
    Root --> Domains
    Root --> Routines
    Root --> Projects
    Root --> Integrations
    Root --> Settings

    Chat --> ThreadList[Thread List]
    Chat --> ThreadView[Thread View]

    Inbox --> InboxList[Inbox List]
    Inbox --> InboxItem[Inbox Item Detail]

    Domains --> DomainList[Domain List]
    Domains --> DomainView[Domain View]
    Domains --> DomainRecord[Record Detail]

    Routines --> RoutineList[Routine List]
    Routines --> RoutineDetail[Routine Detail]
    Routines --> RoutineRunHistory[Run History]

    Projects --> ProjectList[Project List]
    Projects --> ProjectBoard[Project Board]
    Projects --> TaskDetail[Task Detail]

    Integrations --> IntegrationList[Integration List]

    Settings --> Profile
    Settings --> Workspace
    Settings --> Agents
    Settings --> Team

    Workspace --> ContextTab[Context Tab]
    Workspace --> MemoryTab[Memory Tab]
    Workspace --> GeneralTab[General Tab]

    Agents --> AgentList[Agent Cards]
    Agents --> AgentDetail[Agent Detail]

    Team --> MembersTab[Members Tab]
    Team --> RolesTab[Roles Tab]
```

**Primary navigation** (left sidebar, always visible when authenticated):
Chat, Inbox, Domains, Routines, Projects, Integrations, Settings

**Secondary navigation** (within a section): tabs, back buttons, breadcrumbs — no full reloads.

---

## 2. Authentication Flow

### 2.1 Sign Up

```mermaid
flowchart TD
    A([User visits app]) --> B{Has invite link?}
    B -->|Yes| C[/Pre-fill email from invite/]
    B -->|No| D[Sign up page]
    C --> D
    D --> E([Enter name + email + password])
    E --> F[/Submit form/]
    F --> G[Verification email sent]
    G --> H([User clicks link in email])
    H --> I{Token valid?}
    I -->|Yes| J[Account created]
    I -->|No| K[Invalid link page]
    K --> L([Resend verification])
    L --> G
    J --> M{Has workspace?}
    M -->|Yes - via invite| N[Join workspace]
    M -->|No| O[Empty state: waiting for onboarding]
    N --> P[App home: Inbox]
    O --> P
```

### 2.2 Sign In

```mermaid
flowchart TD
    A([User visits sign-in page]) --> B([Enter email + password])
    B --> C{Credentials valid?}
    C -->|Yes| D[Session created]
    C -->|No| E[Error message on form]
    E --> B
    D --> F{Has active workspace?}
    F -->|Yes| G[Redirect to Inbox]
    F -->|No| H[Redirect to empty state]
```

> **Edge cases:** Password reset flow (forgot password → email link → reset form → sign in). OAuth via Google: click Google button → redirect → authorize → return to app. Invalid/expired session: any authenticated route redirects to sign-in, returns to original route after.

---

## 3. Onboarding Flow

White-glove onboarding. The dpaperwork team prepares the workspace before the customer's first login. The customer's flow begins at "First login."

```mermaid
flowchart TD
    A([dpaperwork team creates workspace]) --> B[Seed default domains]
    B --> C[Seed default agent configs]
    C --> D[Seed empty CONTEXT.md + default role.md per agent]
    D --> E[Draft initial CONTEXT.md with customer info]
    E --> F[Send invite email to workspace owner]

    F --> G([Customer receives invite email])
    G --> H([Clicks invite link])
    H --> I[Sign up or sign in]
    I --> J[Welcome screen: brief product overview]
    J --> K([Click: Go to my workspace])
    K --> L[Inbox — empty but with welcome message from Chief of Staff]

    L --> M{Onboarding checklist visible}
    M --> N([Step 1: Review CONTEXT.md])
    N --> O[Settings → Workspace → Context]
    O --> P([Edit and save CONTEXT.md])
    P --> Q([Step 2: Connect first integration])
    Q --> R[Settings → Integrations]
    R --> S([Connect Gmail or Calendar])
    S --> T([Step 3: Review default domains])
    T --> U[Domains → Domain List]
    U --> V([Browse, edit, or accept defaults])
    V --> W([Step 4: Start first chat])
    W --> X[Chat → New Thread → Chief of Staff]
    X --> Y([Send first message])
    Y --> Z[Onboarding checklist complete]
    Z --> AA[Normal daily use]
```

> **Edge cases:** Customer skips steps (checklist dismissible after step 2). Customer completes steps out of order (checklist tracks completion, not sequence). Multiple admins from customer side — each needs to connect their own integrations (per-user OAuth). Workspace already partially set up by dpaperwork team before customer logs in (CONTEXT.md may already have content).
>
> **Empty states:** Welcome inbox item from Chief of Staff. Onboarding checklist in a dismissible banner until all steps complete.

---

## 4. Chat Flow

### 4.1 Create and send a message

```mermaid
flowchart TD
    A([User navigates to Chat]) --> B[Thread list sidebar]
    B --> C([Click: New Thread])
    C --> D[Agent selector modal]
    D --> E([Select agent from assigned agents])
    E --> F[Thread view: empty with agent name in header]
    F --> G([Type message in input])
    G --> H([Press Enter or click Send])
    H --> I[Message appears in thread]
    I --> J[Orchestrator plan streams in collapsible section]
    J --> K[Agent response streams into thread]
    K --> L{User wants to continue?}
    L -->|Yes| G
    L -->|No| M[Thread saved automatically]
    M --> N[Thread title auto-set from first message]
```

### 4.2 Manage a thread

```mermaid
flowchart TD
    A([User in Thread view]) --> B{Action}
    B -->|Rename thread| C([Click title → edit inline → Enter])
    B -->|Change agent| D([Agent picker in header → select new agent])
    B -->|Share thread| E([Click Share → toggle read-only or collaborative])
    B -->|Delete thread| F([Click ⋯ menu → Delete → Confirm])
    C --> G[Thread renamed]
    D --> H[Agent changed, prior messages preserved]
    E --> I[Shareable link generated]
    F --> J[Thread soft-deleted, removed from sidebar]
```

> **Edge cases:** Agent responds with a `cannot_complete` message (missing agent access or missing integration — message explains the gap). Long-running multi-step plans (streaming stays open until synthesis completes, progress visible per step). Network drop during streaming (show error, offer retry). User navigates away mid-stream (stream stops, partial response shown with warning banner).
>
> **Empty states:** No threads yet — full-bleed prompt: "Start a conversation with your AI team" with New Thread CTA. Thread list when only deleted threads exist — empty state.

---

## 5. Inbox Flow

### 5.1 Browse and act on inbox

```mermaid
flowchart TD
    A([User navigates to Inbox]) --> B[Inbox list: unresolved items, newest first]
    B --> C([Click inbox item])
    C --> D[Item detail panel or expanded row]
    D --> E[Item marked as read automatically]
    E --> F{User chooses action}
    F -->|Reply| G([Click Reply → opens thread with context])
    F -->|Resolve| H([Click Resolve])
    F -->|Snooze| I([Click Snooze → pick time])
    F -->|No action| J([Navigate back to list])
    G --> K[New thread pre-loaded with item context]
    H --> L[Item moves to Resolved view]
    I --> M[Item hidden until snooze time]
```

### 5.2 Filter inbox

```mermaid
flowchart TD
    A([User in Inbox list]) --> B([Click filter bar])
    B --> C{Filter type}
    C -->|By agent| D([Select agent])
    C -->|By routine| E([Select routine name])
    C -->|By priority| F([Select priority])
    C -->|Show resolved| G([Toggle resolved view])
    D --> H[List filtered]
    E --> H
    F --> H
    G --> I[Resolved items shown]
```

> **Edge cases:** Agent-initiated observations (not from routines) have no `source_routine_id` — shown with agent name only. Routine that produces an error surfaces as a special inbox item with error details and a link to the run log.
>
> **Empty states:** No inbox items — "Your AI team has nothing to report yet. Set up a routine to get weekly updates." Resolved-only view empty — "No resolved items."

---

## 6. Domains Flow

### 6.1 Create a new domain

```mermaid
flowchart TD
    A([User navigates to Domains]) --> B[Domain list: default + custom domains]
    B --> C([Click: New Domain])
    C --> D[New domain modal: name + slug + icon + description]
    D --> E([Fill in details → Click Create])
    E --> F[Domain created, navigate to Domain View]
    F --> G[Empty domain view with field setup prompt]
    G --> H([Click: Add Field])
    H --> I[Field editor: name, type, options]
    I --> J([Configure field → Click Save])
    J --> K[Field appears as column in grid]
    K --> L{Add more fields?}
    L -->|Yes| H
    L -->|No| M[Domain ready to use]
```

### 6.2 Add and edit records

```mermaid
flowchart TD
    A([User in Domain View]) --> B([Click: New Record])
    B --> C[New row appears inline in grid]
    C --> D([Fill in fields])
    D --> E([Press Tab or click away])
    E --> F[Record saved]
    F --> G{User wants to see full record?}
    G -->|Yes| H([Click record → Record Detail panel])
    G -->|No| I[Stay in grid]
    H --> J[Full record detail with all fields]
    J --> K([Edit any field inline])
    K --> L[Auto-saved on blur]
```

### 6.3 Change domain view

```mermaid
flowchart TD
    A([User in Domain View]) --> B([Click view switcher])
    B --> C{View type}
    C -->|Grid| D[Default table view]
    C -->|Kanban| E([Select status field to group by])
    C -->|Calendar| F([Select date field to display by])
    C -->|Gallery| G([Select image/name field])
    E --> H[Kanban board with drag-and-drop cards]
    F --> I[Calendar with records on dates]
    G --> J[Card grid]
```

### 6.4 Edit domain schema

```mermaid
flowchart TD
    A([User in Domain View]) --> B([Click: Manage Fields])
    B --> C[Field manager panel]
    C --> D{Action}
    D -->|Add field| E([Configure new field])
    D -->|Rename field| F([Edit field name inline])
    D -->|Reorder fields| G([Drag to reorder])
    D -->|Delete field| H([Click delete → Confirm dialog])
    E --> I[New column appears in grid]
    F --> J[Column renamed]
    G --> K[Column order updated]
    H --> L[Column and data removed]
```

> **Edge cases:** Changing a field type (e.g., text → number) — UI warns that existing data in that column may not convert cleanly, requires explicit confirmation. Domain referenced by agents — deleting a domain shows warning: "Agents reference this domain in active routines." Concurrent edits to domain schema — last write wins, page auto-refreshes schema on conflict.
>
> **Empty states:** Domain list — default domains shown, plus "Create new domain" CTA. Empty domain view — "No records yet. Click New Record or wait for an agent to add data." Kanban view with no records in a column — empty column placeholder.

---

## 7. Routines Flow

### 7.1 Create a routine

```mermaid
flowchart TD
    A([User navigates to Routines]) --> B[Routine list]
    B --> C([Click: New Routine])
    C --> D[New routine form]
    D --> E([Enter name])
    E --> F([Select agent])
    F --> G([Write instruction])
    G --> H([Set schedule: day + time in workspace timezone])
    H --> I([Choose output destination])
    I --> J{Output type}
    J -->|Inbox| K[Destination: inbox item to creator]
    J -->|Domain write| L([Select target domain])
    J -->|Integration action| M([Select provider + action])
    K --> N([Click Save])
    L --> N
    M --> N
    N --> O[Routine created and active]
    O --> P[Routine appears in list with next run time]
```

### 7.2 View routine detail and run history

```mermaid
flowchart TD
    A([User clicks routine in list]) --> B[Routine detail view]
    B --> C[Shows: name, agent, instruction, schedule, status, last run]
    C --> D([Click: View Run History])
    D --> E[Run history list: timestamp, duration, status]
    E --> F([Click a run])
    F --> G[Run detail: plan, step outputs, tool calls, tokens used, errors if any]
```

### 7.3 Edit and manage a routine

```mermaid
flowchart TD
    A([User in Routine detail]) --> B{Action}
    B -->|Edit| C([Click Edit → modify fields → Save])
    B -->|Pause| D([Click Pause → Confirm])
    B -->|Resume| E([Click Resume])
    B -->|Run now| F([Click Run Now → Confirm])
    B -->|Delete| G([Click Delete → Confirm])
    C --> H[Routine updated, Trigger.dev schedule updated]
    D --> I[Routine paused, next run skipped]
    E --> J[Routine active, next run scheduled]
    F --> K[Run triggered immediately, output to configured destination]
    G --> L[Routine deleted, removed from Trigger.dev]
```

> **Edge cases:** Routine paused by system (OAuth revoked, budget exceeded) — shows `pause_reason` in detail view with actionable fix link. Run fails — inbox item created with error summary + link to run detail. "Run Now" while routine is already running — disabled, shows "Running..." state. Timezone changes to workspace — all routine schedules must be recomputed (app shows a banner after timezone change: "Your routine schedules have been updated to reflect the new timezone").
>
> **Empty states:** Routine list — "No routines yet. Set up a routine to get automated updates from your AI team." Run history — "This routine hasn't run yet."

---

## 8. Integrations Flow

### 8.1 Connect an integration

```mermaid
flowchart TD
    A([User navigates to Settings → Integrations]) --> B[Integration list: all available providers]
    B --> C[Each card shows: name, icon, connected/not connected]
    C --> D([Click: Connect on a provider])
    D --> E[OAuth redirect to provider login]
    E --> F([User authorizes in provider UI])
    F --> G[Redirect back to dpaperwork]
    G --> H{Auth successful?}
    H -->|Yes| I[Connection stored, card shows Connected + last sync]
    H -->|No| J[Error banner: "Connection failed — try again"]
    I --> K[Agents can now use this integration]
```

### 8.2 Manage an existing connection

```mermaid
flowchart TD
    A([User on connected integration card]) --> B([Click: Manage])
    B --> C[Connection detail: status, last used, which agents used it]
    C --> D{Action}
    D -->|Disconnect| E([Click Disconnect → Confirm])
    D -->|Reconnect| F([Click Reconnect → OAuth flow])
    E --> G[Connection removed, agents lose access]
    F --> H[OAuth flow, connection refreshed]
```

> **Edge cases:** Provider OAuth returns error (user denies, network failure) — return to integrations list with error toast. Token expiry — integration card shows "Expired" badge; user must reconnect. Disconnecting an integration used by active routines — warning modal: "2 routines use this integration and will pause if you disconnect."
>
> **Empty states:** No integrations connected — each card shows Connect CTA. Integration list — all cards visible whether connected or not.

---

## 9. Settings Flows

### 9.1 Edit CONTEXT.md

```mermaid
flowchart TD
    A([User navigates to Settings → Workspace → Context]) --> B[CONTEXT.md editor: guided markdown]
    B --> C[Editor shows section headings as guidance]
    C --> D([User edits content])
    D --> E([Click Save])
    E --> F[Version created, current_version_id updated]
    F --> G[Success toast: Context saved]
    G --> H{User wants version history?}
    H -->|Yes| I([Click Version History])
    I --> J[List of previous versions with timestamps and editor]
    J --> K([Click a version → preview])
    K --> L{Restore?}
    L -->|Yes| M([Click Restore → Confirm])
    L -->|No| N([Close preview])
    M --> O[Restored version becomes current, new version created]
```

### 9.2 Edit workspace memory

```mermaid
flowchart TD
    A([User navigates to Settings → Workspace → Memory]) --> B[Memory view with agent selector]
    B --> C([Select agent to view])
    C --> D[Memory entries for that agent: dated, formatted markdown]
    D --> E{Action}
    E -->|Edit entry| F([Click entry → edit inline → Save])
    E -->|Delete entry| G([Click delete on entry → Confirm])
    E -->|Prune review| H([Click Prune → review entries older than 90 days])
    F --> I[Entry updated]
    G --> J[Entry deleted]
    H --> K[Outdated entries highlighted → user selects entries to remove → Confirm]
```

### 9.3 Configure an agent

```mermaid
flowchart TD
    A([User navigates to Settings → Agents]) --> B[Agent card list]
    B --> C([Click agent card])
    C --> D[Agent detail view]
    D --> E{Action}
    E -->|Edit role.md| F([Click Edit on role.md panel → edit markdown → Save])
    E -->|Reset role.md| G([Click Reset to Default → Confirm])
    E -->|Toggle skill| H([Click skill toggle on/off])
    E -->|Edit tool permissions| I([Click Edit Permissions → toggle tools/integrations → Save])
    F --> J[role.md saved, version created]
    G --> K[role.md reset to platform default, version created]
    H --> L[Skill enabled or disabled for this workspace]
    I --> M[Tool and integration permissions updated]
```

### 9.4 Manage team members

```mermaid
flowchart TD
    A([User navigates to Settings → Team → Members]) --> B[Members list: name, email, role, assigned agents, joined date]
    B --> C([Click: Invite Member])
    C --> D[Invite modal: email + role + agent assignments]
    D --> E([Fill in email])
    E --> F([Select role from workspace roles])
    F --> G([Select agents to assign])
    G --> H([Click Send Invite])
    H --> I[Invite email sent]
    I --> J[Member appears in list with Pending status]
    J --> K([Invitee accepts → Joins workspace])
    K --> L[Member status changes to Active]
```

### 9.5 Manage a member

```mermaid
flowchart TD
    A([User on member row in Members list]) --> B([Click: Manage])
    B --> C{Action}
    C -->|Change role| D([Role dropdown → select role → Save])
    C -->|Edit agent assignments| E([Agent checkboxes → toggle → Save])
    C -->|Remove member| F([Click Remove → Confirm])
    D --> G[Role updated]
    E --> H[Agent assignments updated]
    F --> I[Member soft-deleted, loses workspace access]
```

### 9.6 Manage roles

```mermaid
flowchart TD
    A([User navigates to Settings → Team → Roles]) --> B[Roles list: system roles + custom roles]
    B --> C([Click: New Role])
    C --> D[New role form: name + description]
    D --> E([Fill in name and description])
    E --> F([Set permissions: toggle per category])
    F --> G([Click Create])
    G --> H[Role created, appears in list]
    H --> I([Role can now be assigned to members via Members tab])
```

### 9.7 Edit or delete a role

```mermaid
flowchart TD
    A([User in Roles list]) --> B([Click role to open detail])
    B --> C[Role detail: name, description, permissions, members with this role]
    C --> D{Action}
    D -->|Edit| E([Edit name or permissions → Save])
    D -->|Delete| F{Any members assigned?}
    E --> G[Role updated, all members with this role inherit new permissions immediately]
    F -->|Yes| H[Block: Cannot delete, shows list of assigned members]
    F -->|No| I([Click Delete → Confirm])
    H --> J([User reassigns members to another role first])
    J --> F
    I --> K[Role deleted]
```

### 9.8 Edit profile

```mermaid
flowchart TD
    A([User navigates to Settings → Profile]) --> B[Profile form: name, email, avatar, timezone, language, notification prefs]
    B --> C([Edit fields])
    C --> D([Click Save])
    D --> E[Profile updated]
    E --> F{Email changed?}
    F -->|Yes| G[Verification email sent to new address]
    F -->|No| H[Success toast]
```

### 9.9 Edit workspace general settings

```mermaid
flowchart TD
    A([User navigates to Settings → Workspace → General]) --> B[General form: name, slug, timezone, language, working hours, branding]
    B --> C([Edit fields])
    C --> D([Click Save])
    D --> E{Timezone changed?}
    E -->|Yes| F[Routine schedules recomputed to new timezone]
    F --> G[Banner: Routine schedules updated]
    E -->|No| H[Settings saved]
    G --> H
```

> **Edge cases (Settings, all flows):** Editing role.md breaks agent behavior — user can always reset to default. System roles cannot be deleted or renamed (locked UI). Removing the last admin from a workspace is prevented — error: "Workspace must have at least one admin." Inviting an email that already has a workspace account — they join without needing to sign up. Role deletion when users are assigned — blocked with reassignment prompt. Timezone change mid-day — routines scheduled later that day are re-evaluated.
>
> **Empty states:** Memory tab — "No learnings recorded yet. Agents will update this as they work." Agent list — never empty (all three agents always visible). Members list — just the inviting admin initially.

---

## 10. Projects Flow

### 10.1 Browse and manage projects

```mermaid
flowchart TD
    A([User navigates to Projects]) --> B[Project list]
    B --> C([Click: New Project])
    C --> D[New project modal: name + description + default view]
    D --> E([Fill in → Click Create])
    E --> F[Project created, navigate to Project Board]
    F --> G[Default kanban view with starter columns]
```

### 10.2 Manage tasks on a project board

```mermaid
flowchart TD
    A([User in Project Board]) --> B{Action}
    B -->|Add task| C([Click + in column → enter title → Enter])
    B -->|Open task| D([Click task card])
    B -->|Move task| E([Drag card to new column])
    B -->|Assign task| F([Open task → assignee picker → select user or agent])
    C --> G[Task created in that column]
    D --> H[Task detail panel: title, description, assignee, due date, linked records]
    E --> I[Task status updated to new column]
    F --> J[Task assigned, assignee sees it in their view]
```

> **Edge cases:** Agent-owned task (e.g., "Chief of Staff: Draft board update") — task shows agent avatar, status updates when agent completes it. Agent task fails — task moves to a special "Needs review" state with error detail. Deleting a project with open tasks — confirm dialog warns about active tasks.
>
> **Empty states:** Project list — "No projects yet. Create a project or ask an agent to set one up." Project board with no tasks — empty columns with "+" CTA.

---

## 11. State Flows

### 11.1 Inbox item states

```mermaid
stateDiagram-v2
    [*] --> Unread: Agent creates item
    Unread --> Read: User opens item
    Read --> Resolved: User clicks Resolve
    Read --> Snoozed: User clicks Snooze
    Snoozed --> Unread: Snooze time expires
    Resolved --> [*]: Hard delete after retention period
    Unread --> [*]: User deletes manually
    Read --> [*]: User deletes manually
```

### 11.2 Routine states

```mermaid
stateDiagram-v2
    [*] --> Active: Routine created
    Active --> Paused: User pauses OR system pauses\n(OAuth revoked / budget exceeded)
    Paused --> Active: User resumes\n(and re-connects OAuth if needed)
    Active --> Deleted: User deletes
    Paused --> Deleted: User deletes
    Deleted --> [*]
```

### 11.3 Integration connection states

```mermaid
stateDiagram-v2
    [*] --> Connecting: User initiates OAuth
    Connecting --> Active: OAuth succeeds
    Connecting --> Error: OAuth fails
    Active --> Expired: Token expires
    Active --> Revoked: User disconnects
    Expired --> Active: User re-authenticates
    Error --> Active: User retries and succeeds
    Revoked --> [*]
```

### 11.4 Thread states

```mermaid
stateDiagram-v2
    [*] --> Active: Thread created
    Active --> Archived: User archives
    Archived --> Active: User unarchives
    Active --> Deleted: User deletes
    Archived --> Deleted: User deletes
    Deleted --> [*]
```

### 11.5 Domain record states

```mermaid
stateDiagram-v2
    [*] --> Active: Record created (by user or agent)
    Active --> Active: Updated (by user or agent)\nwrite logged in agent_writes_log
    Active --> Deleted: User soft-deletes\nOR agent deletes with attribution
    Deleted --> Active: User restores (within retention window)
    Deleted --> [*]: Hard delete after retention period
```

### 11.6 Workspace member states

```mermaid
stateDiagram-v2
    [*] --> Pending: Invite sent
    Pending --> Active: Invitee accepts
    Pending --> Expired: Invite link expires (7 days)
    Expired --> Pending: Admin resends invite
    Active --> Removed: Admin removes member
    Removed --> [*]
```

---

## 12. Full User Journey: First Week

End-to-end narrative of a founder using dpaperwork for the first time, tying all flows together.

```mermaid
flowchart TD
    A([Day 0: Receives invite email]) --> B[Signs up and logs in]
    B --> C[Sees welcome inbox item from Chief of Staff]
    C --> D([Reviews and edits CONTEXT.md — Onboarding Step 1])
    D --> E([Connects Gmail + Google Calendar — Onboarding Step 2])
    E --> F([Reviews default domains, renames Deals — Onboarding Step 3])
    F --> G([Starts first chat with Chief of Staff — Onboarding Step 4])
    G --> H[Onboarding complete]

    H --> I([Day 1: Creates weekly update routine])
    I --> J[Routine fires Monday 9am, summary in inbox]

    J --> K([Day 2: Invites ops lead via Settings → Team])
    K --> L[Ops lead assigned PM agent]

    L --> M([Day 3: Ops lead chats with PM to draft a spec])
    M --> N[PM uses draft_spec skill, produces PRFAQ]

    N --> O([Day 4: Founder reviews inbox, resolves weekly update])
    O --> P([Creates new domain: Experiments])

    P --> Q([Day 5: Chief of Staff routine fires, flags 2 stale deals])
    Q --> R([Founder updates deals in domain view])
    R --> S[End of first week: product in daily use]
```

---

## Appendix: Global Edge Cases and Empty States

Items that apply across multiple flows and don't belong to a single section.

**Global empty states**

- **First login (no workspace):** Full-screen "Your workspace is being set up" with contact info for the dpaperwork team.
- **No agents assigned to user:** Sidebar hides Chat, Inbox, Routines. Settings → Team shows a banner: "You have no agents assigned. Ask your admin."
- **No integrations connected:** Features that require integrations (email actions in skills) show inline prompts: "Connect Gmail in Settings → Integrations to enable this."

**Global error states**

- **Agent unreachable (LLM or Mastra error):** Chat shows "Something went wrong — try again" with a retry button. Routine run creates an inbox item with error detail.
- **Budget exceeded:** Chat shows "Daily limit reached — resets at midnight [workspace timezone]." Routines auto-pause.
- **Session expired:** Any page silently redirects to sign-in, returns to the original route after authentication.
- **No internet connection:** App shows offline banner, disables send/save actions, queues actions where safe.

**Global navigation edge cases**

- **Deep link to a thread the user doesn't own:** 404 if deleted, 403 if not shared.
- **Deep link to an agent the user isn't assigned:** Redirect to Chat with an explanatory toast.
- **Browser back/forward:** Sidebar selection and panel state respect browser history.
- **Mobile browser (not mobile app):** Responsive layout degrades gracefully — navigation collapses to hamburger, panels stack vertically. Mobile companion app is the full experience.
