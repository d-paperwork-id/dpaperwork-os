## 1. Platform Tools

- [x] 1.1 Create `src/mastra/tools/domain-read.ts` — `domainReadTool` with id `domain.read`, inputSchema `{ domain, filter?, limit? }`, reads `domain_records` joined to `domains.slug` scoped by `workspace_id` from `runtimeContext`, writes audit row to `tool_call_log` before returning `{ records }`
- [x] 1.2 Create `src/mastra/tools/context-lookup.ts` — `contextLookupTool` with id `context.lookup`, inputSchema `{ section }`, reads `context_md.content` for workspace, extracts H2 section by case-insensitive match, writes audit row to `tool_call_log`, returns `{ content }`
- [x] 1.3 Create `src/mastra/tools/inbox-create.ts` — `inboxCreateTool` with id `inbox.create`, inputSchema `{ title, body, recipient_user_id, priority?, action_chips? }`, inserts `inbox_items` row with `source_agent_id`, `source_run_id`, `source_routine_id` from `runtimeContext`, writes rows to both `tool_call_log` and `agent_writes_log`, returns `{ inbox_item_id }`

## 2. Weekly Company Update Skill

- [x] 2.1 Create `src/mastra/skills/weekly-company-update.ts` — `weeklyCompanyUpdateTool` with id `weekly_company_update`, inputSchema `{ recipient_user_id, week_ending? }`
- [x] 2.2 Implement skill execute: call `domainReadTool` for `projects` (limit 50) and `deals` (limit 50); treat missing domain as empty array
- [x] 2.3 Implement skill execute: call `contextLookupTool` for `'How we sell'`
- [x] 2.4 Implement skill execute: call LLM to synthesise markdown report (200–500 words) from domain records + context section, following the required section structure (headline, Projects, Sales, Notable Decisions, Risks, What's next)
- [x] 2.5 Implement skill execute: call `inboxCreateTool` with date-stamped title (`Weekly Update — DD Mon YYYY`), full report body, `recipient_user_id` from input, `priority: 'normal'`; return `{ inbox_item_id }`

## 3. Chief of Staff Agent

- [x] 3.1 Create `src/mastra/agents/chief-of-staff.ts` — define `chiefOfStaffAgent` as Mastra `Agent` with `id: 'chief-of-staff'`
- [x] 3.2 Implement dynamic `instructions` async function: reads `context_md.content` and `role_md.content` (agentId `'chief-of-staff'`) via `runtimeContext.get('workspace_id')`; returns combined platform system prompt + CONTEXT.md + role.md; falls back to empty string if role_md is missing
- [x] 3.3 Wire tools into agent: `domainReadTool`, `contextLookupTool`, `inboxCreateTool`, `weeklyCompanyUpdateTool`
- [x] 3.4 Set `model` to `'anthropic/claude-sonnet-4'` (via Vercel AI Gateway); no `memory` field in Phase 1

## 4. Mastra Registration

- [x] 4.1 Import `chiefOfStaffAgent` in `src/mastra/index.ts` and add to the `agents` map in `new Mastra({ agents: { 'chief-of-staff': chiefOfStaffAgent } })`
- [x] 4.2 Run `npm run build` and confirm TypeScript compiles without errors
