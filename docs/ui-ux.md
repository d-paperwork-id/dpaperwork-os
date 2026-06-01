# dpaperwork — UI/UX Design Document

**Status:** Draft v0.1
**Owner:** [Founder]
**Last updated:** May 21, 2026
**Audience:** Coding agents and engineers building the UI
**Stack:** Next.js + Tailwind CSS + shadcn/ui

---

## How to Use This Document

This document is the authoritative reference for building dpaperwork's UI. Every implementation decision should trace back to a pattern here. When a case isn't covered, apply the nearest principle from Section 1 and document the decision.

**Code examples are prescriptive, not illustrative.** Use the exact patterns shown — class names, component variants, spacing values — unless there is a specific reason to deviate.

---

## 1. Design Principles

Six principles that govern every decision. When two options look similar, these resolve the tie.

**1. Information first.** Chrome exists to serve content, not decorate it. Every visual element earns its place by making information clearer or actions more accessible. If it can be removed without confusion, remove it.

**2. Color has meaning.** Color is used to communicate state (error, success, active, warning) and hierarchy (primary vs secondary action), not to decorate. If you're adding color to make something "look nicer," don't.

**3. Density without cramping.** dpaperwork surfaces are information-dense — operators need to see a lot at once. But dense doesn't mean cramped. Consistent spacing rhythm maintains legibility at high density.

**4. Reveal on demand.** Secondary actions, metadata, and options are hidden until needed — revealed on hover or interaction. First-time users see a clean surface; power users learn what's available.

**5. Predictable over clever.** Interactions follow patterns users already know from Linear, Notion, and standard web conventions. No surprising animations, unconventional layouts, or "clever" UX that requires explanation.

**6. Accessible always.** WCAG AA minimum everywhere. Focus rings, ARIA labels, keyboard navigation, and screen reader text are not optional. These are built into every component from the start.

---

## 2. Visual Language

dpaperwork sits at the intersection of **Linear** (information density, keyboard-first feel, tight typography, reveal-on-hover actions) and **ElevenLabs** (calm professionalism, generous whitespace within surfaces, restrained elegance).

The result: a product that feels like a serious operator's tool — not a consumer app, not a startup toy, not an enterprise dashboard from 2015.

**What this means concretely:**
- White background in light mode, very dark (near-black, not pure black) in dark mode
- One primary accent color used sparingly — mostly on the active navigation item, primary CTA, and focus rings
- Borders are visible but thin (`border` token, never a heavy separator)
- Shadows are minimal or absent — layers are distinguished by background color difference, not drop shadows
- Typography does the heavy lifting — weight and size convey hierarchy, not color
- Hover states are subtle — a slight background shift, not a border or color pop
- Icons are small (16px default in text contexts, 20px in buttons), same color as surrounding text unless indicating state

**What this explicitly is not:**
- Gradient backgrounds
- Colored section headers
- Emoji in navigation or headings
- Cards with heavy drop shadows
- Colorful empty state illustrations
- Animated logos or loading skeletons with shimmer

---

## 3. Typography

### Font Stack

**UI font (primary):** `Geist Sans` — clean, contemporary, works at small sizes, excellent digit alignment. Matches the Linear/Vercel aesthetic.

**Monospace font:** `Geist Mono` — for IDs, code, cron expressions, token counts, technical metadata.

```tsx
// globals.css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'Geist Sans', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;
}
```

```js
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-sans)'],
  mono: ['var(--font-mono)'],
}
```

### Type Scale

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `text-xs` | 11px | 400 | 1.5 | Labels, metadata, timestamps |
| `text-sm` | 13px | 400 | 1.5 | Body text, list items, descriptions |
| `text-sm font-medium` | 13px | 500 | 1.5 | Navigation labels, field labels |
| `text-base` | 15px | 400 | 1.6 | Chat messages, long-form content |
| `text-base font-medium` | 15px | 500 | 1.6 | Card titles, section names |
| `text-lg font-semibold` | 18px | 600 | 1.4 | Page titles |
| `text-xl font-semibold` | 20px | 600 | 1.3 | Modal titles |
| `font-mono text-xs` | 11px | 400 | 1.5 | IDs, run IDs, cron strings, counts |

**Rules:**
- Never use `font-bold` (700) in the UI — `font-semibold` (600) is the maximum weight
- Page headers are `text-lg font-semibold text-foreground`
- Descriptions and secondary text are `text-sm text-muted-foreground`
- Timestamps, metadata, counts are `text-xs text-muted-foreground font-mono`

---

## 4. Token System

dpaperwork uses shadcn's CSS variable token system. All colors in implementation code must use these tokens — never raw Tailwind color classes like `bg-gray-100` or `text-blue-500`.

### Semantic Tokens (shadcn defaults)

| Token | Light use | Dark use |
|---|---|---|
| `background` | Page background | Page background |
| `foreground` | Primary text | Primary text |
| `card` | Surface above background (panels, cards) | Surface above background |
| `card-foreground` | Text on card surfaces | Text on card surfaces |
| `popover` | Dropdown, tooltip backgrounds | Dropdown, tooltip backgrounds |
| `muted` | Subtle surface (sidebar, table headers) | Subtle surface |
| `muted-foreground` | Secondary text, icons, metadata | Secondary text, icons |
| `primary` | Primary action, active state | Primary action, active state |
| `primary-foreground` | Text on primary | Text on primary |
| `secondary` | Secondary button backgrounds | Secondary button backgrounds |
| `border` | Dividers, input borders, table grid lines | Dividers |
| `input` | Input border color | Input border color |
| `ring` | Focus ring | Focus ring |
| `destructive` | Delete actions, error states | Delete actions, error states |
| `accent` | Hover backgrounds | Hover backgrounds |

### Additional Custom Tokens

Add these to `globals.css` for dpaperwork-specific semantic values:

```css
:root {
  --sidebar-width: 240px;
  --header-height: 48px;
  --panel-width: 380px;

  /* Agent identity colors — used only for agent avatars/badges */
  --agent-pm: hsl(220 90% 56%);              /* PM: blue */
  --agent-chief-of-staff: hsl(262 80% 58%);  /* CoS: purple */
  --agent-ea: hsl(168 76% 42%);              /* EA: teal */
}
```

Agent colors are the **only** place non-semantic colors appear in the UI. They identify agents in the thread sidebar, inbox items, and agent cards. Nowhere else.

### Status Colors

Status indicators use semantic tokens, not raw colors:

```tsx
const statusStyles = {
  active:    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  paused:    'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  error:     'bg-destructive/10 text-destructive',
  pending:   'bg-muted text-muted-foreground',
  connected: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  revoked:   'bg-destructive/10 text-destructive',
}
```

Status colors use **10% opacity backgrounds** — never full saturation backgrounds on a white page. Status communicates through text color + subtle tint, not a loud chip.

---

## 5. Spacing & Layout

### Spacing Scale

Follow Tailwind's default scale. The most-used values in dpaperwork:

| Token | Value | Use |
|---|---|---|
| `gap-1` / `p-1` | 4px | Tight icon padding |
| `gap-2` / `p-2` | 8px | Between icon and label in nav items |
| `gap-3` / `p-3` | 12px | Padding in list items, small cards |
| `gap-4` / `p-4` | 16px | Section padding, form field gaps |
| `gap-6` / `p-6` | 24px | Content area internal padding |
| `gap-8` / `p-8` | 32px | Between major sections |

### App Shell

The shell uses the shadcn **inset sidebar variant**. Both the sidebar and the main content area render as rounded cards floating on the sidebar background color.

```
┌── bg-sidebar (full viewport) ───────────────┐
│  ┌─ sidebar card ─┐  ┌─ main card ────────┐ │
│  │ [Sidebar 256px]│  │ [Header 48px]      │ │
│  │                │  │ ─────────────────  │ │
│  │  Nav items     │  │ [Main content]     │ │
│  │  (fixed)       │  │                   │ │
│  │                │  │ [Optional right   │ │
│  │  [User profile]│  │  panel 380px]     │ │
│  └────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────┘
```

Implementation:

```tsx
// app/(app)/layout.tsx
<SidebarProvider>          {/* bg-sidebar wrapper (auto via has-data-[variant=inset]) */}
  <AppSidebar />           {/* variant="inset" — rounded-xl card, p-2 gap */}
  <SidebarInset            {/* m-2 ml-0 rounded-xl shadow-md bg-background */}
    className="min-w-0 overflow-hidden"
  >
    {children}
  </SidebarInset>
</SidebarProvider>
```

Key rules:
- Sidebar uses `variant="inset"` — no `border-r`, padding creates the visual gap.
- Main area is `<SidebarInset>` — auto-applies `rounded-xl shadow-md` in inset mode.
- Outer background is always `--sidebar` color (set automatically by `SidebarProvider`).
- Never revert to a flat `<main>` wrapper or add a manual `border-r` to the sidebar.

### Content Area Widths

| Surface | Max width | Padding |
|---|---|---|
| Settings (forms) | `max-w-2xl` | `p-6` |
| Domain grid | Full width | `px-0` (grid extends edge to edge) |
| Chat thread | `max-w-3xl mx-auto` | `px-6` |
| Inbox list | Full width | `px-6` |
| Routine list | Full width | `px-6` |

---

## 6. App Shell & Navigation

### Sidebar

Uses the shadcn `<Sidebar variant="inset">` component. The inner card gets `rounded-xl` automatically. No manual `border-r`.

```tsx
// components/app-sidebar.tsx
<Sidebar variant="inset">
  <SidebarHeader className="px-4 pt-5 pb-4">
    <span className="text-[18px] font-bold tracking-tight">dpaperwork</span>
  </SidebarHeader>

  <SidebarContent className="px-2 gap-1">
    {/* Workspace selector */}
    <WorkspaceSwitcher />

    {/* Primary nav */}
    <ul className="flex flex-col gap-0.5">
      <NavItem icon={MessageSquare} label="Chat" href="/chat" />
      <NavItem icon={Inbox} label="Inbox" href="/inbox" badge={unreadCount} />
      <NavItem icon={Database} label="Domains" href="/domains" />
      <NavItem icon={Repeat} label="Routines" href="/routines" />
      <NavItem icon={FolderKanban} label="Projects" href="/projects" />
    </ul>

    {/* Secondary nav — "Workspace" label */}
    <NavItem icon={Plug} label="Integrations" href="/integrations" />
    <NavItem icon={Settings} label="Settings" href="/settings/profile" />
  </SidebarContent>

  <SidebarFooter className="px-3 pb-4">
    {/* Connect integrations card + UserMenu */}
  </SidebarFooter>
</Sidebar>
```

### NavItem

```tsx
// Active state uses primary; inactive uses muted-foreground with accent hover
<Link
  href={href}
  className={cn(
    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
    isActive
      ? "bg-accent text-foreground font-medium"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  )}
>
  <Icon className="w-4 h-4 shrink-0" />
  <span>{label}</span>
  {badge ? (
    <span className="ml-auto text-xs font-mono bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
      {badge}
    </span>
  ) : null}
</Link>
```

**Rules:**
- Active item: `bg-accent text-foreground font-medium` — no colored background, just a slight tint
- Nav icons are `w-4 h-4` (16px), same color as label
- Unread badge on Inbox is the only badge in the nav
- No section labels or dividers between nav items — flat list

### Page Header

```tsx
<header className="h-12 px-6 flex items-center justify-between border-b border-border shrink-0">
  <div className="flex items-center gap-3">
    <h1 className="text-sm font-medium text-foreground">{title}</h1>
    {/* Optional breadcrumb for nested pages */}
  </div>
  <div className="flex items-center gap-2">
    {/* Page-level actions: always Button variant="ghost" size="sm" or variant="outline" size="sm" */}
  </div>
</header>
```

Page headers are **small and quiet**. The title is `text-sm font-medium`, not a large heading. The page itself carries visual weight through its content, not its header.

---

## 7. Component Patterns

### 7.1 Buttons

Use only the shadcn Button variants. Never invent new button styles.

```tsx
// Primary — one per view maximum, for the most important action
<Button>Create Routine</Button>

// Secondary (outline) — for important but not primary actions
<Button variant="outline">View Run History</Button>

// Ghost — for low-emphasis actions, especially in toolbars and tables
<Button variant="ghost" size="sm">Edit</Button>

// Destructive — only for irreversible actions
<Button variant="destructive">Delete Workspace</Button>

// Icon-only — always include sr-only text
<Button variant="ghost" size="icon">
  <Trash2 className="w-4 h-4" />
  <span className="sr-only">Delete</span>
</Button>
```

**Rules:**
- Default size for actions in content areas: `size="sm"`
- Icon buttons are `size="icon"` (h-8 w-8)
- Destructive actions require a confirmation dialog — never fire immediately
- Loading state uses shadcn's built-in `disabled` + a spinner icon, not a separate button variant
- Never use color classes on buttons directly — always go through variants

### 7.2 Inputs & Forms

```tsx
// Standard input
<div className="space-y-1.5">
  <Label htmlFor="name" className="text-sm font-medium">Routine name</Label>
  <Input id="name" placeholder="e.g., Weekly company update" />
  <p className="text-xs text-muted-foreground">Used to identify this routine in the list.</p>
</div>

// Textarea for long content (instructions, role.md)
<Textarea
  className="font-mono text-sm resize-none min-h-[200px]"
  placeholder="Write your instruction here..."
/>

// Select
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select agent" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pm">Product Manager</SelectItem>
    <SelectItem value="chief-of-staff">Chief of Staff</SelectItem>
  </SelectContent>
</Select>
```

**Rules:**
- Labels are always visible — no placeholder-as-label
- Helper text is `text-xs text-muted-foreground` below the input
- Error text is `text-xs text-destructive` below the input, replacing helper text
- Form sections are spaced with `space-y-4` between fields, `space-y-6` between groups
- Markdown editors (CONTEXT.md, role.md) use a monospace font and plain textarea — no rich text editor in v1

### 7.3 Cards

```tsx
// Standard card — for settings sections, agent cards, etc.
<div className="rounded-lg border border-border bg-card p-4">
  <div className="flex items-start justify-between">
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="w-4 h-4" />
    </Button>
  </div>
</div>

// Interactive card (clickable) — adds hover state
<div
  className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent transition-colors"
  onClick={...}
>
  ...
</div>
```

**Rules:**
- Cards use `border-border`, not a shadow — consistent with the no-shadow principle
- Card padding is `p-4` (16px) — not `p-6` unless the card is a major section container
- Card titles are `text-sm font-medium`, not `text-base` or larger
- No card hover effect unless the entire card is clickable

### 7.4 Tables & Data Grids

For the domain grid and list views:

```tsx
// List item — used in inbox, routine list, thread list
<div className="group flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-accent cursor-pointer transition-colors">
  <div className="shrink-0 w-1 h-4 rounded-full bg-primary opacity-0 group-[.unread]:opacity-100" />
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium text-foreground truncate">{title}</span>
      <span className="text-xs text-muted-foreground font-mono shrink-0">{time}</span>
    </div>
    <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
  </div>
  {/* Actions: hidden by default, shown on group-hover */}
  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <Archive className="w-3.5 h-3.5" />
    </Button>
  </div>
</div>
```

For domain grid — use TanStack Table with custom cell renderers. Grid lines are `border-border` at 1px; rows are `h-9` (36px) for density.

```tsx
// Table header cell
<th className="h-9 px-3 text-left text-xs font-medium text-muted-foreground border-b border-border bg-muted sticky top-0">
  {column.name}
</th>

// Table body cell
<td className="h-9 px-3 text-sm text-foreground border-b border-border">
  {value}
</td>

// Table row hover
<tr className="hover:bg-accent transition-colors cursor-pointer">
```

### 7.5 Modals & Sheets

```tsx
// Modal (Dialog) — for confirmations, short forms
<Dialog>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="text-base font-semibold">Create domain</DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Domains are structured tables your agents can read and write.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* form fields */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit}>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Sheet — for detail panels (record detail, routine run detail)
<Sheet>
  <SheetContent className="w-[380px] sm:max-w-[380px] p-0">
    <SheetHeader className="px-6 py-4 border-b border-border">
      <SheetTitle className="text-sm font-semibold">{title}</SheetTitle>
    </SheetHeader>
    <div className="overflow-y-auto p-6 space-y-4">
      {/* content */}
    </div>
  </SheetContent>
</Sheet>
```

**Rules:**
- Modals for confirmations and short forms: `max-w-md` (28rem)
- Sheets for detail panels that need more space: fixed 380px width
- Destructive confirmation dialogs include the name of what will be destroyed: "Delete routine 'Weekly update'?"
- Sheet headers match the page header style — `text-sm font-semibold`

### 7.6 Badges & Status Indicators

```tsx
// Status badge — agent name, routine status, connection status
<span className={cn(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  statusStyles[status]
)}>
  <span className="w-1.5 h-1.5 rounded-full bg-current" />
  {label}
</span>

// Agent badge — colored dot only, with tooltip
<span
  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-white"
  style={{ backgroundColor: `var(--agent-${agentId})` }}
  title={agentName}
>
  {agentInitial}
</span>
```

### 7.7 Toasts & Alerts

```tsx
// Success toast — triggered via sonner
toast.success("Routine saved", {
  description: "Next run scheduled for Monday 9:00 AM IST"
})

// Error toast
toast.error("Connection failed", {
  description: "Could not connect to Gmail. Try again or check your account."
})

// Info/warning — inline alert in page, not toast
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription className="text-sm">
    This routine is paused because your Gmail connection was revoked.
    <Button variant="link" size="sm" className="px-0 h-auto ml-1">
      Reconnect
    </Button>
  </AlertDescription>
</Alert>
```

**Rules:**
- Toasts for transient confirmation of actions (save, delete, send)
- Inline alerts for persistent state the user needs to act on (paused routine, expired connection)
- Never use toast for errors that require action — use inline alerts

---

## 8. Surface-Specific Patterns

### 8.1 Chat / Thread UI

```
┌───────────────────────────────────────────┐
│ Thread header: agent name + ⋯ menu  [48px]│
├───────────────────────────────────────────┤
│                                           │
│  [messages: scroll area]                  │
│                                           │
│  Agent avatar + name                      │
│  ┌─────────────────────────────────────┐  │
│  │ Agent message bubble               │  │
│  │ [Tool call trace: collapsible]     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│                          [User message]   │
│                                           │
├───────────────────────────────────────────┤
│ [Input: auto-grow textarea + Send] [80px] │
└───────────────────────────────────────────┘
```

```tsx
// Agent message
<div className="flex gap-3 max-w-[80%]">
  <AgentAvatar agentId={agentId} className="shrink-0 mt-1" />
  <div className="space-y-1">
    <span className="text-xs font-medium text-muted-foreground">{agentName}</span>
    <div className="bg-muted rounded-lg px-4 py-3 text-sm text-foreground leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
    {/* Collapsible tool trace */}
    {toolCalls.length > 0 && (
      <Collapsible>
        <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {toolCalls.length} tool {toolCalls.length === 1 ? 'call' : 'calls'}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ToolCallTrace calls={toolCalls} />
        </CollapsibleContent>
      </Collapsible>
    )}
  </div>
</div>

// User message — right-aligned
<div className="flex justify-end">
  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm max-w-[80%]">
    {content}
  </div>
</div>

// Streaming cursor
<span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5" />

// Input area
<div className="p-4 border-t border-border">
  <div className="flex items-end gap-2 bg-muted rounded-lg px-4 py-3">
    <Textarea
      className="flex-1 bg-transparent border-0 resize-none text-sm focus-visible:ring-0 min-h-[24px] max-h-[200px]"
      placeholder={`Message ${agentName}...`}
      rows={1}
    />
    <Button size="icon" className="h-8 w-8 shrink-0">
      <Send className="w-4 h-4" />
    </Button>
  </div>
</div>
```

**Orchestrator plan display:**

```tsx
// Plan shown before execution begins — collapsible, collapsed after first view
<div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1.5 border border-border">
  <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
    <Brain className="w-3.5 h-3.5" />
    <span>Plan</span>
  </div>
  {steps.map((step, i) => (
    <div key={step.id} className="flex items-start gap-2 pl-5">
      <span className="font-mono text-muted-foreground shrink-0">{i + 1}.</span>
      <span className="text-foreground">{step.agentName}: {step.skillId}</span>
      {step.status === 'complete' && <Check className="w-3 h-3 text-emerald-500 ml-auto shrink-0" />}
      {step.status === 'running' && <Loader2 className="w-3 h-3 animate-spin ml-auto shrink-0" />}
    </div>
  ))}
</div>
```

### 8.2 Inbox

```
┌────────────────────────────────────────────┐
│ Inbox    [Filter bar]        [Mark all read]│
├────────────────────────────────────────────┤
│ ● Weekly update — Chief of Staff  Mon 9:00 │
│   Projects, Deals, Notable decisions...    │
├────────────────────────────────────────────┤
│   Stale deals flagged — Chief of Staff 2d  │
│   3 deals in negotiation...                │
├────────────────────────────────────────────┤
```

- Unread items: full `text-foreground` title, `font-medium`
- Read items: `text-muted-foreground` title, normal weight
- Unread indicator: 4px colored left border using agent color
- Hover: `bg-accent` + reveal action buttons (resolve, snooze)
- Active/open item: `bg-accent` persistent

### 8.3 Domain Grid

The domain grid is the most complex surface. Treat it like a spreadsheet:

- Column headers: `bg-muted`, sticky top, `text-xs text-muted-foreground font-medium`
- Rows: `h-9` (36px), `border-b border-border`
- Cell padding: `px-3`
- Row hover: `bg-accent`
- Selected row: `bg-accent border-l-2 border-l-primary`
- Inline editing: clicking a cell enters edit mode — input replaces text in place, no modal
- Column resizing: drag handle appears on column header hover
- New record button: sticky row at the bottom of the table, `text-muted-foreground`, `text-sm`

```tsx
// Cell edit mode
<td
  className="h-9 px-0 border-b border-border"
  onClick={() => setEditing(true)}
>
  {editing ? (
    <input
      autoFocus
      className="w-full h-full px-3 bg-background border-x border-primary outline-none text-sm"
      defaultValue={value}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && save()}
    />
  ) : (
    <span className="px-3 text-sm text-foreground">{value || <span className="text-muted-foreground">—</span>}</span>
  )}
</td>
```

### 8.4 Agent Cards (Settings → Agents)

```tsx
<div className="rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors cursor-pointer">
  <div className="flex items-start gap-3">
    {/* Agent avatar with role color */}
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
      style={{ backgroundColor: `var(--agent-${agent.id})` }}
    >
      {agent.initial}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{agent.name}</h3>
        <Badge variant={agent.enabled ? 'success' : 'secondary'}>
          {agent.enabled ? 'Active' : 'Disabled'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.rolePreview}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>{agent.skillCount} skills</span>
        <span>·</span>
        <span>{agent.assignedCount} members</span>
      </div>
    </div>
  </div>
</div>
```

### 8.5 Settings Layout

```tsx
// Settings page shell
<div className="flex h-full">
  {/* Settings sub-navigation */}
  <aside className="w-48 shrink-0 border-r border-border p-4 space-y-0.5">
    <SettingsNavItem href="/settings/profile" label="Profile" />
    <SettingsNavItem href="/settings/workspace" label="Workspace" />
    <SettingsNavItem href="/settings/agents" label="Agents" />
    <SettingsNavItem href="/settings/team" label="Team" />
    <SettingsNavItem href="/settings/billing" label="Billing" />
  </aside>

  {/* Content */}
  <div className="flex-1 overflow-auto p-6">
    <div className="max-w-2xl space-y-8">
      {/* Section */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">{sectionTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4">{sectionDescription}</p>
        <div className="space-y-4">
          {/* fields */}
        </div>
      </div>
      <Separator />
      {/* Next section */}
    </div>
  </div>
</div>
```

**Rules:**
- Settings sections are separated by `<Separator />` with `space-y-8` between them
- Section titles are `text-sm font-semibold`, not large headings
- Save button per section, not one global save — reduces anxiety about accidental saves
- Destructive settings (delete workspace, remove member) are in their own section at the bottom, separated clearly

---

## 9. Motion & Animation

dpaperwork uses motion sparingly. The goal is to make interactions feel responsive, not to entertain.

### Principles

- **Duration:** 150ms for micro-interactions (hover, toggle), 200ms for component transitions (dropdown open, panel slide), 300ms for page-level transitions
- **Easing:** `ease-out` for elements entering the screen, `ease-in` for elements leaving, `ease-in-out` for continuous motion (loading)
- **No animation for pure data updates** — tables, lists, and text that changes data do so instantly, no fade
- **No animation if `prefers-reduced-motion` is set** — use Tailwind's `motion-reduce:` variant

### Usage

```tsx
// Hover state — use Tailwind transition-colors
className="transition-colors duration-150"

// Panel/sheet entry — handled by shadcn, do not override
// Dialog — handled by shadcn, do not override

// Collapsible sections
<Collapsible>
  <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">

// Loading spinner — only Loader2 from lucide
<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />

// Streaming cursor
<span className="animate-pulse" />
```

**Tailwind config additions:**

```js
// tailwind.config.ts
keyframes: {
  'collapsible-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-collapsible-content-height)' },
  },
  'collapsible-up': {
    from: { height: 'var(--radix-collapsible-content-height)' },
    to: { height: '0' },
  },
},
animation: {
  'collapsible-down': 'collapsible-down 200ms ease-out',
  'collapsible-up': 'collapsible-up 200ms ease-in',
}
```

---

## 10. Dark Mode

Dark mode is implemented via shadcn's CSS variable system + Tailwind's `dark:` variant. The `ThemeProvider` wraps the app and applies `dark` class to `<html>`.

**Key dark mode rules:**

- Never use raw dark colors like `dark:bg-gray-900` — always use token classes (`bg-background` which resolves to the dark background token)
- The only exceptions are agent colors and status colors (which have explicit `dark:` overrides as shown in Section 4)
- Test every surface in dark mode — token-based design means most surfaces work automatically, but check: text contrast, border visibility, muted surfaces

**Implementation:**

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

```tsx
// Theme toggle (Settings → Profile or top bar)
<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
>
  <Sun className="w-4 h-4 dark:hidden" />
  <Moon className="w-4 h-4 hidden dark:block" />
</Button>
```

**Dark mode surface hierarchy:**
- Page background: near-black (not pure black)
- Sidebar: same as background or very slightly lighter
- Cards / panels: slightly lighter than background
- Muted surfaces (table headers, input backgrounds): slightly lighter still
- Text: near-white foreground, medium gray for muted

This layering is handled by the theme generator output. The rule is: in dark mode, layers go **lighter**, not darker.

---

## 11. Icons

Use `lucide-react` exclusively. No other icon library. No custom SVGs unless a specific brand icon is needed (integration providers).

```tsx
import { MessageSquare, Inbox, Database, Repeat, Settings } from 'lucide-react'

// Default size in text contexts
<Icon className="w-4 h-4" />          // 16px — nav, buttons, inline

// In larger UI elements
<Icon className="w-5 h-5" />          // 20px — page header actions, modal icons

// Never larger than w-6 h-6 in UI contexts
```

**Color rules:**
- Icons inside active nav items: `text-foreground` (inherited)
- Icons in inactive nav, secondary actions: `text-muted-foreground` (inherited from parent)
- Icons indicating status: use status color classes, not icon size
- Icons in buttons: same color as button text (inherited)
- Never add explicit color to an icon unless it's a status indicator

---

## 12. Accessibility

Every component must meet these requirements before being considered complete.

**Keyboard navigation:**
- All interactive elements reachable by Tab in logical order
- Modals trap focus; close on Escape
- Dropdown menus navigable with arrow keys (shadcn handles this for `DropdownMenu`, `Select`, `Command`)
- Data grids: Tab moves between cells, Enter enters edit mode, Escape exits

**ARIA:**
- All icon-only buttons have `aria-label` or `<span className="sr-only">`
- All form inputs have associated `<Label>` with matching `htmlFor` / `id`
- All status indicators include text, not just color
- Dynamic content updates use `aria-live` where appropriate (inbox new items, streaming chat)

**Focus rings:**
- Never remove focus ring — shadcn's `ring` token handles this
- Focus ring must be visible in both light and dark mode

**Color contrast:**
- `text-foreground` on `bg-background`: WCAG AA (4.5:1) minimum — verify with your chosen palette
- `text-muted-foreground` on `bg-background`: verify this passes AA (many themes fail here with overly light muted foreground)
- Status colors: text color + background tint combination must pass — the 10% opacity background approach means text color carries the contrast burden

---

## 13. Do / Don't Reference

| Do | Don't |
|---|---|
| Use `text-muted-foreground` for secondary text | Use `text-gray-400` or any raw color |
| Keep page headers at `text-sm font-medium` | Use large headings for page titles |
| Show secondary actions on hover | Show all actions at all times |
| Use `border-border` for all dividers | Use `border-gray-200` or custom colors |
| One primary `<Button>` per view | Multiple primary buttons competing |
| Confirm before destructive actions with `AlertDialog` | Use `Dialog` for delete confirmations |
| Use `Field` for every form field | Build manual Label + Input + helper text |
| Use `Item` for all list rows (inbox, threads, routines) | Build custom list item layouts |
| Use `Empty` for all empty states | Build one-off empty state layouts |
| Use `Spinner` for all loading states | Use `Loader2 className="animate-spin"` |
| Use shadcn `Sidebar` component | Build a custom sidebar layout |
| Use `InputGroup` for inputs with icons/buttons | Add absolute-positioned icons inside inputs |
| Use `Combobox` for searchable selects | Build custom search-within-select |
| Use `AlertDialog` for destructive confirmations | Use `Dialog` for delete/remove actions |
| Use `Command` for the command palette (⌘K) | Build a custom search/command UI |
| Use AI Elements for chat UI | Build custom streaming message components |
| Use `font-mono` for IDs, counts, crons | Use regular font for technical data |
| Use `ButtonGroup` for grouped related actions | Place grouped buttons without container |
| Use inline alerts for persistent warnings | Use toasts for errors requiring action |
| Use shadcn `Data Table` for domain grid | Build a table from raw `<table>` elements |
| Use agent color only for agent identity | Use agent colors as decorative elements |
| Test every surface in dark mode | Assume token system handles dark mode automatically |

---

## 14. Complete shadcn Component Reference

Every shadcn component and its correct use in dpaperwork. When building any surface, check this map first — if a component exists here for the use case, use it.

### Layout & Navigation

| Component | Use in dpaperwork |
|---|---|
| `Sidebar` | **Primary app navigation.** Use shadcn's built-in Sidebar component — do not build a custom sidebar. See Section 6 update below. |
| `Separator` | Dividers in settings pages between sections |
| `Breadcrumb` | Nested settings navigation (Settings → Workspace → Context) |
| `Resizable` | Split-panel layouts (e.g., domain list + record detail side-by-side) |
| `ScrollArea` | Any container with overflow content: thread message list, inbox list, domain grid |
| `Tabs` | Settings sub-sections (Context / Memory / General; Members / Roles) |
| `NavigationMenu` | Not used — Sidebar handles primary nav |

### Shadcn Sidebar (App Shell)

shadcn ships a full `Sidebar` component. Use it instead of a custom layout:

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// app/(app)/layout.tsx
<SidebarProvider>
  <AppSidebar />
  <main className="flex-1 min-w-0">
    <SidebarTrigger />   {/* collapse button, position in header */}
    {children}
  </main>
</SidebarProvider>

// AppSidebar component
<Sidebar>
  <SidebarHeader>
    <WorkspaceSwitcher />
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item.href)}>
                <Link href={item.href}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>
    <UserMenu />
  </SidebarFooter>
</Sidebar>
```

The Sidebar component handles collapse state, keyboard shortcuts, mobile responsiveness, and ARIA attributes natively.

### Forms & Inputs

| Component | Use in dpaperwork |
|---|---|
| `Field` | **All form fields.** Replaces manual Label + Input + helper text + error pattern |
| `Input` | Single-line text inside `Field` |
| `InputGroup` | Search bars, inputs with prefix icons or suffix buttons |
| `Textarea` | Multi-line text (instructions, CONTEXT.md, role.md) |
| `Select` | Single-select dropdowns (agent picker, status, role) |
| `Combobox` | **Searchable selects.** Agent selector, integration picker, domain reference field |
| `Native Select` | Only for mobile/native contexts — prefer `Select` or `Combobox` |
| `Checkbox` | Boolean fields in domain, permission toggles, bulk table selection |
| `Radio Group` | Mutually exclusive options (output destination for routines) |
| `Switch` | Binary toggles: skill on/off, agent enabled, notifications |
| `Slider` | Not used in v1 |
| `Input OTP` | Not used in v1 |
| `Calendar` + `Date Picker` | Date fields in domain records, schedule picker for routines |

**Use `Field` for every form field:**

```tsx
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"

<Field>
  <FieldLabel htmlFor="instruction">Instruction</FieldLabel>
  <Textarea
    id="instruction"
    className="font-mono text-sm"
    placeholder="Summarize last week's projects..."
  />
  <FieldDescription>
    Written in plain English. Agents read this exactly as typed.
  </FieldDescription>
  <FieldError>{errors.instruction}</FieldError>
</Field>
```

**Use `InputGroup` for search and enhanced inputs:**

```tsx
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

<InputGroup>
  <InputGroupAddon>
    <Search className="w-4 h-4 text-muted-foreground" />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search domains..." />
</InputGroup>
```

**Use `Combobox` for searchable agent selection:**

```tsx
// Agent selector — searchable, shows agent name + avatar
<Combobox
  options={assignedAgents}
  value={selectedAgent}
  onChange={setSelectedAgent}
  placeholder="Select agent..."
  searchPlaceholder="Search agents..."
  empty="No agents found"
/>
```

### Feedback & Status

| Component | Use in dpaperwork |
|---|---|
| `Spinner` | **All loading states.** Replace `Loader2 className="animate-spin"` |
| `Skeleton` | Page-level loading skeletons (initial thread load, domain grid) |
| `Progress` | Routine run progress (if step count is known) |
| `Alert` | Persistent inline warnings (paused routine, revoked integration) |
| `Alert Dialog` | Destructive confirmations (delete, remove member) — not `Dialog` |
| `Toast` via `Sonner` | Transient action confirmations |
| `Badge` | Status chips (routine active/paused, connection connected/expired) |

```tsx
// Always use Spinner, not Loader2
import { Spinner } from "@/components/ui/spinner"

<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2" />}
  Save
</Button>
```

### Data Display

| Component | Use in dpaperwork |
|---|---|
| `Table` + `Data Table` | **Domain grid.** Use shadcn's Data Table (TanStack Table) pattern |
| `Item` | **List rows:** inbox items, thread list, routine list, member list |
| `Card` | Agent cards, integration cards, summary panels |
| `Avatar` | User and agent avatars throughout |
| `Badge` | Status labels, role chips, agent name chips |
| `Hover Card` | Preview a domain record or user profile on hover |
| `Tooltip` | Icon-only button labels, truncated text titles |
| `Kbd` | Keyboard shortcut hints in tooltips and the command palette |

**Use `Item` for all list rows:**

```tsx
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

// Inbox item
<Item asChild className={cn(isUnread && "font-medium")}>
  <button onClick={() => openItem(item)}>
    <ItemMedia variant="icon">
      <AgentAvatar agentId={item.sourceAgentId} />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>{item.title}</ItemTitle>
      <ItemDescription className="truncate">{item.bodyPreview}</ItemDescription>
    </ItemContent>
    <span className="text-xs text-muted-foreground font-mono ml-auto shrink-0">
      {formatRelativeTime(item.createdAt)}
    </span>
  </button>
</Item>
```

**Use `Empty` for all empty states:**

```tsx
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Inbox empty state
<Empty>
  <EmptyMedia variant="icon">
    <Inbox className="w-8 h-8" />
  </EmptyMedia>
  <EmptyTitle>No inbox items</EmptyTitle>
  <EmptyDescription>
    Set up a routine to get automated updates from your AI team.
  </EmptyDescription>
  <EmptyContent>
    <Button asChild>
      <Link href="/routines/new">Create a routine</Link>
    </Button>
  </EmptyContent>
</Empty>
```

### Overlays & Dialogs

| Component | Use in dpaperwork |
|---|---|
| `Dialog` | Short forms, non-destructive confirmations, agent/skill info |
| `Alert Dialog` | **Destructive actions only** (delete, remove, reset to default) |
| `Sheet` | Detail panels: record detail, routine run detail, invite member |
| `Drawer` | Mobile-only alternative to Sheet — deferred with mobile architecture |
| `Popover` | Inline date picker, colour picker, filter panel |
| `Context Menu` | Right-click on domain records, threads, inbox items |
| `Dropdown Menu` | `⋯` actions menus on cards and list items |

### Navigation & Commands

| Component | Use in dpaperwork |
|---|---|
| `Command` | **Command palette** (⌘K). Search threads, domains, run routines, navigate |
| `Breadcrumb` | Within Settings pages only |
| `Pagination` | Domain record pagination if grid exceeds 100 rows |
| `Menubar` | Not used — Sidebar handles navigation |

**Command palette (⌘K):**

```tsx
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

// Triggered by Kbd shortcut ⌘K or Ctrl+K
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search or run a command..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Chat">
      <CommandItem onSelect={() => router.push('/chat/new')}>
        <MessageSquare className="w-4 h-4 mr-2" />
        New thread
        <Kbd className="ml-auto">N</Kbd>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Domains">
      {domains.map(d => (
        <CommandItem key={d.id} onSelect={() => router.push(`/domains/${d.slug}`)}>
          <Database className="w-4 h-4 mr-2" />
          {d.name}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### Grouped Actions

**Use `ButtonGroup` for grouped actions (e.g., inbox actions, kanban column actions):**

```tsx
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"

// Inbox item actions
<ButtonGroup>
  <Button variant="outline" size="sm" onClick={resolve}>
    <Check className="w-3.5 h-3.5 mr-1" /> Resolve
  </Button>
  <ButtonGroupSeparator />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={snooze}>Snooze</DropdownMenuItem>
      <DropdownMenuItem onClick={openThread}>Reply in thread</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>
```

---

## 15. AI Elements (Chat UI)

The chat surface uses **AI Elements** — a Vercel/AI SDK component library installed separately from shadcn:

```bash
npx ai-elements@latest
```

This installs into `@/components/ai-elements/`. These components are purpose-built for streaming agent UIs and connect directly to `useChat` from `@ai-sdk/react`.

### Components

| Component | Use |
|---|---|
| `Conversation` + `ConversationContent` | Scroll container for the message list |
| `ConversationScrollButton` | Auto-scroll to bottom button |
| `Message` + `MessageContent` | Wraps a single message, handles role-based alignment |
| `MessageResponse` | Renders streaming markdown response text |
| `Tool` + `ToolHeader` + `ToolContent` | Renders tool call invocations with collapsible input/output |
| `ToolInput` + `ToolOutput` | Tool call argument and result display |
| `PromptInput` + `PromptInputBody` + `PromptInputTextarea` | The chat input area |

### Complete chat surface implementation

```tsx
'use client'
import { useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { Spinner } from '@/components/ui/spinner'

export function ThreadView({ threadId, agentId, workspaceId }) {
  const [input, setInput] = useState('')
  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  // Hydrate from thread history on mount
  useEffect(() => {
    fetch(`/api/chat?threadId=${threadId}`)
      .then(r => r.json())
      .then(setMessages)
  }, [threadId])

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map(message => (
            <div key={message.id}>
              {message.parts?.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <Message key={`${message.id}-${i}`} from={message.role}>
                      <MessageContent>
                        <MessageResponse>{part.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  )
                }
                if (part.type?.startsWith('tool-')) {
                  return (
                    <Tool key={`${message.id}-${i}`}>
                      <ToolHeader
                        type={(part as ToolUIPart).type}
                        state={(part as ToolUIPart).state || 'output-available'}
                        className="cursor-pointer"
                      />
                      <ToolContent>
                        <ToolInput input={(part as ToolUIPart).input || {}} />
                        <ToolOutput
                          output={(part as ToolUIPart).output}
                          errorText={(part as ToolUIPart).errorText}
                        />
                      </ToolContent>
                    </Tool>
                  )
                }
                return null
              })}
            </div>
          ))}
          <ConversationScrollButton />
        </ConversationContent>
      </Conversation>

      <PromptInput
        onSubmit={() => {
          if (!input.trim()) return
          sendMessage({ text: input, data: { agentId, workspaceId, threadId } })
          setInput('')
        }}
        className="border-t border-border"
      >
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${agentName}...`}
            disabled={status !== 'ready'}
          />
          {status === 'streaming' && (
            <Spinner className="absolute right-4 bottom-4" />
          )}
        </PromptInputBody>
      </PromptInput>
    </div>
  )
}
```

### What not to build manually

Because AI Elements handles it:

- Do not build a custom streaming cursor
- Do not build custom message bubble components
- Do not build custom tool call display
- Do not implement SSE reading manually
- Do not write a custom scroll-to-bottom implementation

Style AI Elements to match dpaperwork's tokens by editing the components in `@/components/ai-elements/` after installation — they are just copied files you own.
