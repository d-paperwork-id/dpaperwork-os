# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

@AGENTS.md

## CRITICAL: Load `dpaperwork-dev` skill before any feature work

**Before implementing any feature, page, API route, schema, or agent code — load the `dpaperwork-dev` skill FIRST.**

The skill reads the project docs (`docs/`) and returns the exact schema definitions, user flow diagrams, UI component patterns, and implementation scope for the task. Never rely on memory for these — the docs are the source of truth and the skill fetches them directly.

```
Triggers: any dpaperwork feature, route, schema, domain, agent, UI surface, or "what to build next" question.
Skill: dpaperwork-dev
Docs: docs/implementation-plan.md, docs/backend-schema.md, docs/app-flow.md, docs/ui-ux.md, docs/agent-runtime.md, docs/architecture.md, docs/PRD.md
```

---

## Project: dpaperwork

Multi-tenant AI brain platform. Businesses run AI-first operations through agents that use skills to complete tasks. Platform admins define base agents/skills; tenants customize at the workspace level.

---

## Commands

```bash
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push Drizzle schema to database
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Drizzle Studio UI
```

---

## Architecture Decisions

### Routing: API-routes only, no SSR
- **Never use `getServerSideProps`, `getStaticProps`, server components that fetch data, or server actions for data fetching.**
- All data fetching goes through `app/api/` route handlers.
- Client components use **TanStack Query** (`@tanstack/react-query`) to call those routes.

### Authentication
- **better-auth** handles auth and authorization.
- Admin role manages: clients, agents, skills, per-tenant customization.
- Multi-tenant isolation: each tenant gets its own database (separate Neon instance or schema).

### Database
- **Drizzle ORM** with **@neondatabase/serverless** (Postgres).
- Schemas live in `lib/db/schema/`.
- One Drizzle client per tenant connection string.

### AI Layer
- **Mastra** (`@mastra/core`, `mastra`) is the AI framework — always load the `mastra` skill before writing Mastra code.
- **Composio** provides tool integrations for agents.
- Agents and skills are registered in `src/mastra/index.ts`.

---

## Multi-Tenant "Brain" File Structure

Each tenant workspace has a file-based brain (stored in S3 via Mastra's workspace API):

```
workspaces/<tenant-id>/
  CONTEXT.md        # Static company knowledge
  MEMORY.md         # Accumulated learnings
  skills/           # How-to procedures agents reference
  agents/           # Role definitions per persona
  domains/          # Live operational data (prospects, pipeline, posts, clients — customizable)
```

### Agent & Skill Access via YAML

Agents and skills are resolved from a YAML manifest:
- Points to base platform file paths when not customized.
- Points to tenant-specific paths when the tenant has overridden them.
- The YAML is the source of truth for what an agent or skill resolves to per tenant.

---

## Key Constraints

- **Zod v4** for all schema validation — import from `"zod"` (not `"zod/v4"`).
- **Tailwind CSS v4** — no `tailwind.config.js`; configuration is in `app/globals.css` via `@theme`.
- Next.js version is **16.2.6** — read `node_modules/next/dist/docs/` before using any Next.js API; do not assume v13/v14/v15 conventions apply.
- Use **`bunx`** (not `npx`) for CLI tools like `drizzle-kit`.

## UI Components

- **Always use shadcn/ui components first** — `Button`, `Input`, `Dialog`, `Card`, `Select`, `Form`, etc.
- Only build a custom component when shadcn has no equivalent or the design requirement genuinely can't be met by composing shadcn primitives.
- Add new shadcn components with `bunx shadcn@latest add <component>`.

## Commit style

Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`. Subject focuses on the "why". not more than 120 characters.

## What NOT to add

- `loading.tsx` files
- Server Actions
- `db.ts` inside any `domains/*/` folder
- SSR data fetching or data work in Server Components
- `window.location` for navigation
- `../../` relative imports
- Inline `style` attributes in UI components
- Comments that narrate what the code does
