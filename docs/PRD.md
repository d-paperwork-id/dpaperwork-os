# dpaperwork — Product Requirements Document

**Status:** Draft v0.3
**Owner:** [Founder]
**Last updated:** May 21, 2026

---

## 1. Problem

Small and mid-sized companies (10-50 people) want to operate like "AI-first" businesses but can't. The barriers are concrete:

- Context about the business lives in founders' heads, scattered Notion pages, Slack threads, and tribal knowledge. AI tools have no durable place to learn it.
- General-purpose AI tools (ChatGPT, Claude, Notion AI) are stateless assistants. They don't own outcomes, don't run on a schedule, and forget what they learned yesterday.
- Hiring a chief of staff, PMO, or ops manager costs ₹15-30L/year fully loaded. Most companies in this segment can't justify the spend until much later, and meanwhile founders are the bottleneck on coordination.
- Existing "AI agent" platforms are either developer toolkits (require engineering to deploy) or vertical point solutions (AI SDR, AI recruiter) that don't compose into a coherent operating layer.

The result: businesses that *should* be AI-first remain founder-bottlenecked, with the same coordination overhead they had three years ago.

## 2. Vision

dpaperwork is the **company brain and AI operations team** for growing businesses. A durable context layer (CONTEXT.md, domains, memory) combined with specialized AI agents that execute work on a schedule and on demand. Tenants get the equivalent of a small ops team — PM, Chief of Staff, Executive Assistant, and more — for the cost of a SaaS subscription.

## 3. Goals

**Product goals:**

- Tenant can describe their business in a structured CONTEXT.md and see agents use it within minutes of onboarding.
- Tenant can create domains (structured tables) and have agents read/write them as working memory.
- Tenant can chat with specialized agents and get useful, context-aware responses.
- Tenant can set up scheduled routines that produce inbox updates, reports, and execute work autonomously.
- Tenant can connect productivity tools (email, calendar, chat, CRM, etc.) via Composio and have agents act through them.
- Tenant can customize agent behavior, skills, team structure, and roles to fit their business.
- Tenant can assign specific agents to specific users so each team member works with the right AI staff.
- Tenant can manage projects in kanban view, with agents participating as task owners or contributors.
- Tenant can interact with the platform via web, mobile companion app, and voice — including multi-lingual voice.

**Business goals:**

- Become the default operating layer for 10-50 person companies in India and similar markets.
- Validate willingness-to-pay via a first 10 design-partner cohort, then scale to standard pricing.
- High weekly engagement — dpaperwork is used daily, not occasionally.
- Tenants credibly describe dpaperwork as having replaced or deferred a hire.

## 4. Non-Goals

- **Not a developer toolkit.** No-code/low-code is the bar. Tenants are founders and operators, not engineers.
- **Not a replacement for domain-specific SaaS.** dpaperwork does not replace dedicated CRM, ERP, or accounting systems. It coordinates across them.
- **Not a vertical AI product.** dpaperwork is horizontal. We do not build AI SDR, AI recruiter, or other vertical agents — we provide the platform for tenants to operate their entire business.
- **Not on-prem.** Cloud-only. Enterprises requiring on-prem deployment are out of scope.
- **Not a chat-only product.** Chat is one surface; routines, inbox, domains, and projects are equally important. A pure conversational interface would underdeliver on the operator promise.
- **Not a BI / dashboards product.** Visualization and analytics are out of scope. Agent-authored summaries land in the inbox; tenants use dedicated BI tools for charting.

## 5. Users & Personas

**Primary persona — Founder/COO at a 10-50 person company.** Probably technical or operations-minded. Has tried Notion AI, ChatGPT for Work, maybe a Custom GPT. Frustrated that none of it sticks. Spends 10+ hours a week on coordination work they don't want to do. Will pay for a product that meaningfully reduces that load.

**Secondary persona — Operator at the same company.** Ops lead, EA, program manager, or department head. Day-to-day user. Cares about whether the agents actually help them get their work done and whether the platform respects how their team operates.

**Tertiary persona — Individual contributor at the same company.** Engineer, designer, marketer. Uses dpaperwork when an agent assigns them a task, pings them for input, or surfaces something relevant. Low-touch usage but needs the experience to feel respectful, not noisy.

## 6. Positioning

dpaperwork is your **company brain and AI operations team.** A durable, structured representation of how your business works, combined with specialized AI staff that execute on a schedule and on demand.

What it's not:

- Not Notion AI (Notion AI is stateless help-on-the-page; dpaperwork owns outcomes via routines).
- Not a Custom GPT (Custom GPTs have no domains, no memory, no scheduled execution, no team structure).
- Not Zapier (Zapier is deterministic automation; dpaperwork reasons over context).
- Not a chief-of-staff hire (dpaperwork extends the founder's capacity; the framing is "AI staff," not human replacement).

## 7. Functional Requirements

### 7.1 Application Surfaces

dpaperwork is available across three surfaces. Feature parity is the long-term goal; each surface is optimized for how the user shows up to it.

- **Web app.** Primary surface. Full feature set including CONTEXT.md editing, domains, agent configuration, routines, projects, and team management.
- **Mobile companion app.** Optimized for on-the-go usage: inbox triage, chat with agents, quick domain record views and edits, push notifications for agent updates and escalations. Native iOS and Android.
- **Voice interface.** Available on mobile and web. Hands-free chat with agents, dictation, and agent responses spoken back. Multi-lingual support — initial languages to be determined, with English and Hindi as defaults and 2-3 regional Indian languages (Tamil, Telugu, Kannada, Marathi) prioritized based on customer base.

### 7.2 Application Layer

#### Chat

- Thread-based interaction. Each thread is bound to one agent at creation. User can change the bound agent mid-thread, within the set of agents they have access to.
- An orchestrator decomposes each request: it **plans** the steps needed, **executes** each step (potentially across multiple specialized agents), and **synthesizes** a final response. Routing is mostly invisible to the user but inspectable on request.
- Threads are persistent, listed in a sidebar, named automatically from the first message (editable).
- Streaming responses. Tool-call traces and orchestration plans are collapsible per message.
- Threads can reference domain records, projects, and inbox items inline.
- Users can share threads with teammates (read-only or collaborative) where permissions allow.

#### Inbox

- Agent-initiated only. No raw integration noise (no "new email from X" — those stay in the underlying tool).
- Sources: scheduled routine outputs, proactive agent observations (e.g., "I noticed three deals in your CRM domain haven't been updated in 14 days"), task completions, escalations.
- Items have: source agent, routine name (if applicable), title, body, timestamp, read/unread state, action chips (reply, mark resolved, snooze, escalate).
- Inbox supports filtering by agent, routine, and priority.
- Users can convert inbox items into threads, tasks, or domain records.

#### Domains

- Notion-style data grid. Each domain is a typed table that serves as agent working memory.
- Default domains seeded at workspace creation: Customers, Deals, Vendors, Team, Tasks. Tenant can disable, edit, or add.
- Field types: text, long text, number, date, single-select, multi-select, person reference, domain reference (foreign key to another domain), file attachment, formula.
- Multiple views per domain: grid, kanban, calendar, gallery.
- Filtering, sorting, grouping per view.
- Agents read and write domains via tool calls. Writes are logged with attribution (which agent, which routine or thread, what changed).
- User can create new domains with custom fields. Domain schemas are versioned with a lightweight change log.
- Domains can be imported from CSV or synced from external sources via integrations.

#### Integrations

- Powered by Composio. Coverage spans email, calendar, chat, CRM, project management, file storage, accounting, HR, and more.
- Per-user connection. Each user connects their own accounts. There is no shared workspace-level connection in v1.
- When an agent acts on behalf of a user, it uses that user's connections. Agents do not have ambient access to data from users who haven't connected the relevant integration.
- Cross-user / team-wide operations (e.g., "summarize the team's calendar") are not supported in v1 unless every relevant team member has connected the necessary integration. Per-workspace integration scope is a planned v2 capability.
- Integration UI shows the user their own connection status per integration, last sync, and a usage log of which agents have used it recently.
- Tenants can choose which integrations each agent is allowed to call. Actual access for a given (user, agent) pair is the intersection of "agent allowed to use X" and "user has connected X."

#### Projects

- Kanban-style task management. Each project has columns (configurable), tasks, owners, due dates, and links to threads, domain records, and inbox items.
- Agents participate as task owners or contributors. An agent can be assigned a task and execute it (e.g., "Draft Q3 board update," owned by Chief of Staff).
- Tasks can be created manually, generated by agents, or auto-created from routines and inbox items.
- Projects support dependencies, milestones, and timelines.
- Multiple views per project: kanban, list, timeline, calendar.

#### Settings

- **Profile.** Name, email, avatar, timezone, notification preferences, language.
- **Workspace.**
  - *Context* tab: CONTEXT.md editor. Markdown with section guidance (What we do, Why this matters now, ICP/Buyer/Not for us, How we sell, Team, Tools we use). Versioned, with diff view.
  - *Memory* tab: append-only log of cross-domain learnings. Date-stamped, attributed to source agent. Users can read, edit, delete entries. UI prompts a quarterly prune review.
  - *General* tab: workspace name, default agent, working hours, language, branding (logo, primary color).
- **Agents.** Card view of all available agents in the workspace. Each card opens to a role.md editor (tenant-editable, with reset-to-default), skills list (with explanations and toggle on/off), assigned users, and usage history. Tenants can also create new agents from scratch or by cloning an existing one.
- **Team.**
  - *Members* tab: invite, remove, assign roles, and assign agents per member.
  - *Roles* tab: configurable roles with granular permissions (which domains they can edit, which agents they can configure, which routines they can create, which integrations they can connect).
- **Billing.** Plan, usage, invoices, payment method.

### 7.3 Agent Layer

#### Available Agents

Specialized agents shipped by the platform. Each has a default role.md and a fixed skill set. Tenants can customize role.md per workspace and toggle skills on/off.

- **Product Manager.** Roadmap thinking, feature prioritization, spec drafting, user feedback synthesis, sprint planning, release notes.
- **Chief of Staff.** Cross-functional coordination, weekly reviews, meeting prep, decision logs, follow-up tracking, board prep, OKR check-ins.
- **Executive Assistant.** Calendar management, email triage, travel planning, expense tracking, contact management, meeting scheduling.
- **Additional specialized agents** (long-term): Sales Ops, Marketing Ops, People Ops / HR, Finance, Customer Success, Recruiter. Final roster determined by tenant demand and platform readiness.

#### Orchestrator

- Internal agent. Receives every chat message and routine trigger. Operates on a **plan, execute, solve** pattern: decomposes the request into a multi-step plan, executes each step (which may involve calling specific specialized agents and tools), and synthesizes a final response from the results.
- The orchestrator can only route to specialized agents the requesting user has access to. If a task plausibly requires an agent the user does not have, the orchestrator surfaces this gap rather than silently skipping the step.
- Not directly exposed as a chat target. Plans are inspectable on request.

#### Agent Assignment

- Agents are assigned to users at the user level, not the role level. Each member of the workspace has a defined set of agents they can interact with.
- Workspace admins manage agent assignments via the Team tab.
- Users only see, chat with, and receive inbox messages from agents assigned to them.
- An agent can be assigned to multiple users; assignments are independent.
- Default assignment policies (e.g., "all members get the EA by default") are configurable per workspace.

#### role.md

- Each agent has a default role.md (markdown) describing the agent's mandate, communication style, escalation rules, and what it should not do.
- Tenant can fork and edit per workspace. Reset-to-default available.
- Versioned with change log.

#### Skills

Skills are capabilities an agent can use. At runtime, skills read CONTEXT.md, role.md, relevant domain data, memory, and connected integrations to produce tenant-specific output.

- Platform ships a curated skill library per agent.
- Tenants can toggle skills on/off per agent.
- Tenants can refine agent behavior via conversation and role.md edits; refinements accumulate into a tenant-specific overlay that skills read at runtime.
- Long-term: a skills marketplace where tenants discover and install community or partner-built skills.

#### Routines

- A routine is: trigger (cron schedule or event) + agent + instruction + output destination.
- Output destinations: inbox, domain record, project task, integration action (e.g., send email, post to Slack).
- Every routine is bound to its creator. When the routine fires, it executes using the creator's integration connections. If the creator's connection is revoked or the creator leaves the workspace, the routine pauses and notifies the workspace admin, who can reassign or delete it.
- Tenants can create, edit, pause, delete routines.
- Routine runs are logged with timestamp, duration, tools called, output produced, errors.
- Starter routines are provided per agent that tenants can clone and modify.
- Routines can chain into other routines or trigger workflows across multiple agents via the orchestrator.

### 7.4 Data Layer

- **CONTEXT.md** — markdown file per workspace. Single file in initial scope; may expand to a directory/tree of context files as businesses grow more complex.
- **Domains** — relational tables per workspace, schemas editable by tenant.
- **Memory** — append-only log of cross-domain learnings, date-stamped, attributed, optionally linked to domain records.
- **Threads, inbox items, projects, routines** — first-class objects with full CRUD and audit trail.

### 7.5 Multi-Tenancy

- The platform is multi-tenant. Each tenant has an isolated workspace with its own CONTEXT.md, domains, memory, agents, routines, and team.
- Tenants cannot see or access each other's data.
- Role-based access control within a tenant, layered with per-user agent assignment.

## 8. Pricing

**Design-partner pricing (first 10 clients):**

- ₹50,000 one-time setup fee
- ₹10,000/month subscription
- Includes white-glove onboarding (see Section 9)

**Standard pricing (post-validation):**

- ₹1,00,000 one-time setup fee
- ₹20,000/month subscription
- Includes structured onboarding

The first-10 pricing exists to validate willingness-to-pay and gather product feedback from real deployments. Standard pricing becomes the default once design-partner learnings are incorporated.

Open: seat-based pricing, integration tier limits, routine run quotas, and enterprise pricing are TBD.

## 9. Onboarding

White-glove onboarding for every customer in the design-partner cohort and continuing as the default for standard pricing.

- Dedicated onboarding lead works with the customer to draft CONTEXT.md.
- Integrations connected and tested with the customer's actual accounts.
- Default domains reviewed; custom domains created as needed.
- Agents configured: role.md refined per the customer's culture and language; agent-to-user assignments set up.
- 2-3 starter routines built with the customer based on observed needs.
- First-week check-ins to course-correct.

Self-serve onboarding is a long-term goal but not in initial scope. The white-glove process is also a critical learning loop: every onboarding informs platform defaults, starter routines, and skill design.

Post-onboarding support is standard (email/chat, response SLA based on plan), not white-glove. This boundary should be explicit in the customer agreement.

## 10. User Journeys

**Onboarding.** New tenant signs up, scheduled white-glove onboarding session. dpaperwork team works with the customer over 1-2 weeks to draft CONTEXT.md, connect integrations, configure agents, assign agents to users, and build initial routines. By the end of the onboarding, the customer has a live workspace producing real inbox updates.

**Daily use — founder.** Opens dpaperwork in the morning (web or mobile). Reviews inbox (overnight routine outputs, agent observations from Chief of Staff and PM). Replies to a Chief of Staff thread about next week's board prep — uses voice on the commute. Glances at the latest deal updates in the CRM domain. Closes the app and gets on with the day.

**Daily use — operator.** Checks projects for tasks assigned by agents. Reviews the agent-generated weekly report in inbox. Updates a few domain records. Chats with PM agent (which they have access to) to draft a spec.

**Daily use — IC.** Receives a push notification on mobile: an agent has assigned them a task or asked for input. Opens the app, responds, marks done. No deep engagement required.

**Setting up a routine.** User goes to Routines, clicks "New Routine," selects Chief of Staff, schedules for Monday 9am, writes the instruction ("Summarize last week's progress across all projects and key domain changes"), sets output to inbox, saves. Next Monday, the summary lands.

**Customizing an agent.** Tenant opens Agents, selects PM, edits role.md to add specifics about their product methodology, toggles off a skill they don't need, reviews assigned users, saves. Future PM interactions reflect the change.

**Assigning agents.** Admin opens Team → Members, selects a new hire, assigns Executive Assistant and Product Manager but not Chief of Staff. The new hire now sees only those two agents in their workspace.

## 11. Success Metrics

- **Activation:** % of new tenants who complete CONTEXT.md, have at least one routine running, and have weekly agent interactions across multiple users in their first 30 days.
- **Engagement:** Weekly active workspaces, agent interactions per workspace per week, routine run volume, % of assigned agents that have at least one interaction per week per user.
- **Retention:** Monthly logo retention, 6-month and 12-month cohort retention.
- **Outcome quality:** Tenant-reported satisfaction with agent outputs, frequency of negative feedback on agent responses, rate of agent writes that get reverted.
- **Revenue:** ARR, ARPU, setup-fee conversion rate from trial to paid, expansion from seat growth.
- **Validation milestone:** 10 design-partner customers live and renewing at design-partner pricing before standard pricing rolls out.

## 12. Risks & Open Questions

**Risks**

- *Skill fit across tenants.* Every business is different. Mitigation: combine fixed platform skills with tenant overlays from CONTEXT.md, role.md, and memory; track refinement patterns to inform skill evolution and the long-term marketplace.
- *Trust on writes.* Agents writing to domains, sending emails, and updating projects will sometimes get it wrong. Mitigation: full attribution and audit trail, reversible writes, optional "review before commit" mode for destructive actions.
- *Notion-AI perception.* Buyers may not see the differentiation. Mitigation: lead demos with routines, inbox, and project execution — the operator surface that stateless assistants can't match.
- *Cost overrun.* LLM costs can scale faster than revenue. Mitigation: model tiering per skill, prompt caching, per-tenant budgets, routine frequency limits.
- *Scope sprawl.* The product touches many surfaces (chat, inbox, domains, projects, routines, integrations, mobile, voice). Mitigation: roadmap document governs sequencing; PRD captures the destination, not the order of arrival.
- *Multi-tenant data isolation.* Bugs here are existential. Mitigation: tenant_id discipline as a non-negotiable engineering norm; security review before any cross-tenant features ship.
- *White-glove scalability.* Hand-onboarding doesn't scale beyond a few dozen customers. Mitigation: every white-glove engagement feeds platform defaults, starter routines, and eventual self-serve flows. White-glove is a learning loop, not a permanent model.
- *Agent assignment blocking orchestration.* A user lacking an agent the orchestrator wants to call creates a dead-end. Mitigation: orchestrator surfaces the gap with a clear message ("This task needs Chief of Staff; ask your admin for access") rather than failing silently.
- *Voice and multi-lingual complexity.* Quality varies by language; latency, accent handling, and code-switching (Hindi-English mixed speech, common in India) are real problems. Mitigation: launch with the strongest 1-2 languages, expand based on demand.
- *Per-user integration scope friction.* In v1, every team member must connect their own integrations for agents to help them. Tenants will discover the limits of this when they ask for team-wide operations. Mitigation: documented v1 limitation, clear UX when agents can't access data because connections are missing, per-workspace scope expansion planned for v2.

**Open questions**

- Specific languages to support in voice — English and Hindi confirmed; which regional languages first?
- Should the orchestrator's plan be visible by default, or only on request?
- Pricing — should seats be limited or unlimited at the ₹10k / ₹20k tiers? At what team size does an enterprise tier kick in?
- Failure modes for integration outages — degrade gracefully or block affected skills?
- Memory governance — how much should be agent-curated vs. user-curated? What's the right prune cadence?
- Marketplace — partner-built skills, community skills, both? What's the quality bar and revenue model?
- Mobile parity — should the mobile app launch with full feature parity or focused on inbox/chat first?
- Voice — is it part of mobile only, or also a feature of the web app? Are there scenarios (driving, walking) where voice is the *only* interface?
