## ADDED Requirements

### Requirement: Skill is a Mastra tool (hardcoded, Phase 1)
`weeklyCompanyUpdateTool` SHALL be a Mastra `createTool` with id `weekly_company_update`. Its input schema SHALL accept `{ recipient_user_id: string, week_ending?: string }`. It SHALL be included in `chiefOfStaffAgent`'s tools. It is NOT a SKILL.md file — S3 skills are Phase 3.

#### Scenario: Tool is callable by the agent
- **WHEN** the Chief of Staff agent is invoked with an instruction that mentions running the weekly update
- **THEN** the agent can call `weekly_company_update` as a tool in its palette

---

### Requirement: Skill reads Projects and Deals domains
The tool's `execute` function SHALL call `domainReadTool` for the `projects` domain (limit 50) and `deals` domain (limit 50). If a domain does not exist for the workspace, it SHALL proceed with an empty record set for that domain (no error thrown).

#### Scenario: Both domains exist
- **WHEN** the workspace has `projects` and `deals` domains with records
- **THEN** the skill reads up to 50 records from each

#### Scenario: Only Deals domain exists
- **WHEN** the workspace has `deals` but no `projects` domain
- **THEN** the skill proceeds with Deals records only; Projects section is omitted from the report

---

### Requirement: Skill reads CONTEXT.md "How we sell" section
The tool SHALL call `contextLookupTool` with `{ section: 'How we sell' }`. The returned content SHALL inform the tone and framing of the Sales section of the report.

#### Scenario: Section present
- **WHEN** CONTEXT.md contains a `## How we sell` section
- **THEN** the skill's report Sales framing reflects that content

#### Scenario: Section absent
- **WHEN** CONTEXT.md has no `## How we sell` section
- **THEN** the skill proceeds without it; the report's Sales framing is generic

---

### Requirement: Skill synthesises a markdown report
The tool SHALL use the agent's LLM to synthesise the domain data and CONTEXT.md section into a markdown report between 200 and 500 words. The report SHALL:
- Lead with a one-sentence headline
- Group content under H2 headings: Projects, Sales, Notable Decisions, Risks
- Use bullet points for items
- End with a "What's next" section
- Omit sections with no relevant data rather than padding with filler

#### Scenario: Report stays within word count
- **WHEN** the LLM produces the report
- **THEN** the report body is between 200 and 500 words

#### Scenario: Empty workspace produces honest acknowledgement
- **WHEN** the workspace has fewer than 3 domain records across both domains
- **THEN** the report acknowledges the limited data honestly rather than inventing progress

---

### Requirement: Skill delivers report via inbox.create
After synthesising the report, the tool SHALL call `inboxCreateTool` with:
- `title`: A date-stamped title, e.g., `"Weekly Update — 26 May 2026"`
- `body`: The full markdown report
- `recipient_user_id`: Passed in from the tool's input
- `priority`: `'normal'`

The tool SHALL return `{ inbox_item_id: string }` from the `inboxCreateTool` call.

#### Scenario: Inbox item created with correct title format
- **WHEN** the tool executes on a Monday
- **THEN** the created inbox item title matches the pattern `Weekly Update — DD Mon YYYY`

#### Scenario: Returns inbox item id
- **WHEN** the tool completes successfully
- **THEN** the returned object contains `{ inbox_item_id: 'inb_...' }`
