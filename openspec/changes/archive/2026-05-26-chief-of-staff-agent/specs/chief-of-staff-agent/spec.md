## ADDED Requirements

### Requirement: Agent is defined with dynamic per-tenant instructions
The `chiefOfStaffAgent` SHALL be a Mastra `Agent` with `id: 'chief-of-staff'`. Its `instructions` field SHALL be an async function that reads `context_md.content` and `role_md.content` from the database using `runtimeContext.get('workspace_id')`, then returns a combined system prompt string: platform system prompt + CONTEXT.md section + role.md section.

#### Scenario: Instructions load correct tenant data
- **WHEN** the agent is invoked with a `RuntimeContext` containing `workspace_id: 'ws_abc'`
- **THEN** the instructions function reads `context_md` and `role_md` for `ws_abc` and returns their combined content

#### Scenario: Missing role_md falls back to empty string
- **WHEN** a workspace has no `role_md` row for `chief-of-staff`
- **THEN** the instructions function returns the platform system prompt + CONTEXT.md only (no error thrown)

---

### Requirement: Agent has three platform tools
The agent's `tools` object SHALL include `domainReadTool`, `contextLookupTool`, and `inboxCreateTool`. No other tools are configured in Phase 1 (no Composio, no working memory tools).

#### Scenario: Agent tool palette in Phase 1
- **WHEN** `chiefOfStaffAgent.tools` is inspected
- **THEN** it contains exactly `domain.read`, `context.lookup`, and `inbox.create`

---

### Requirement: Agent is registered in the Mastra instance
`src/mastra/index.ts` SHALL include `chiefOfStaffAgent` in the `agents` map passed to `new Mastra({ agents: { ... } })`.

#### Scenario: Agent retrievable from Mastra instance
- **WHEN** `mastra.getAgent('chief-of-staff')` is called
- **THEN** it returns the `chiefOfStaffAgent` instance without throwing

---

### Requirement: domain.read tool reads workspace-scoped domain records
The `domainReadTool` (id: `domain.read`) SHALL accept `{ domain: string, filter?: Record<string, unknown>, limit?: number }` as input. It SHALL read `workspace_id` from `runtimeContext`, query `domain_records` joined to `domains` by slug, and return `{ records: Record<string, unknown>[] }`. It SHALL write a row to `tool_call_log` before returning.

#### Scenario: Reads records for named domain
- **WHEN** the tool is called with `{ domain: 'deals', limit: 20 }` and `workspace_id: 'ws_abc'` in context
- **THEN** it returns up to 20 `domain_records.fields` objects for the `deals` domain in workspace `ws_abc`

#### Scenario: Returns empty array for non-existent domain
- **WHEN** the tool is called with `{ domain: 'nonexistent' }`
- **THEN** it returns `{ records: [] }` without throwing

#### Scenario: Audit row written before return
- **WHEN** the tool executes successfully
- **THEN** a row is inserted into `tool_call_log` with `tool: 'domain.read'`, `run_id`, and `workspace_id` before the result is returned to the agent

---

### Requirement: context.lookup tool reads a named CONTEXT.md section
The `contextLookupTool` (id: `context.lookup`) SHALL accept `{ section: string }` as input. It SHALL read `context_md.content` for the workspace from DB, extract the heading and content block matching `section` (case-insensitive, H2 match), and return `{ content: string }`. If the section is not found, it SHALL return `{ content: '' }`. It SHALL write a row to `tool_call_log` before returning.

#### Scenario: Extracts matching section
- **WHEN** called with `{ section: 'How we sell' }` and CONTEXT.md contains `## How we sell\n<content>`
- **THEN** returns `{ content: '<content>' }`

#### Scenario: Missing section returns empty string
- **WHEN** called with `{ section: 'Missing Section' }` and CONTEXT.md has no such heading
- **THEN** returns `{ content: '' }`

---

### Requirement: inbox.create tool writes an inbox item
The `inboxCreateTool` (id: `inbox.create`) SHALL accept `{ title: string, body: string, recipient_user_id: string, priority?: 'low' | 'normal' | 'high', action_chips?: InboxActionChip[] }`. It SHALL insert a row into `inbox_items` with `source_agent_id: 'chief-of-staff'`, `source_run_id` from `runtimeContext`, and `source_routine_id` from `runtimeContext` (if set). It SHALL write rows to both `tool_call_log` and `agent_writes_log` (targetType: `inbox_item`) before returning. It SHALL return `{ inbox_item_id: string }`.

#### Scenario: Creates inbox item with agent attribution
- **WHEN** called with valid inputs and `source_agent_id` is `'chief-of-staff'`
- **THEN** a row is inserted in `inbox_items` with `source_agent_id: 'chief-of-staff'` and the returned `inbox_item_id` matches the inserted row's `id`

#### Scenario: Audit rows written before return
- **WHEN** the tool executes successfully
- **THEN** rows are inserted in both `tool_call_log` and `agent_writes_log` before the result is returned
