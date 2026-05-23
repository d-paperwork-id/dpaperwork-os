## ADDED Requirements

### Requirement: seedWorkspace function initializes all defaults in a single transaction
The system SHALL export a `seedWorkspace(db, workspaceId, userId)` function from `db/seed.ts` that runs all insertions in a single Drizzle transaction. If any insert fails, the entire seed is rolled back.

#### Scenario: Seed is atomic — partial failure rolls back all inserts
- **WHEN** any insert within the seed transaction fails
- **THEN** no rows are written (the transaction is rolled back)

### Requirement: Seed creates five default domains with their fields
The system SHALL insert five domains on workspace creation: Customers, Deals, Vendors, Team, Tasks — each with the fields defined in Backend Schema Section 8.3.

#### Scenario: Customers domain is seeded with standard fields
- **WHEN** a workspace is seeded
- **THEN** a domain with `slug = 'customers'` exists with fields: name (text), email (text), phone (text), company (text), status (single_select), owner (person_ref), notes (long_text)

#### Scenario: Deals domain is seeded with domain_ref to Customers
- **WHEN** a workspace is seeded
- **THEN** a domain with `slug = 'deals'` exists with a `customer` field of type `domain_ref` pointing to the Customers domain

### Requirement: Seed creates workspace_agent_config for all three agents
The system SHALL insert three `workspace_agent_config` rows (pm, chief-of-staff, executive-assistant) with `is_enabled = true` and empty `allowed_tools` and `allowed_integrations`.

#### Scenario: All three agents are enabled by default
- **WHEN** a workspace is seeded
- **THEN** three rows exist in `workspace_agent_config`, all with `is_enabled = true`

### Requirement: Seed assigns all three agents to the workspace creator
The system SHALL insert three `user_agent_assignments` rows for the creating user, one per agent.

#### Scenario: Creator has all agents assigned
- **WHEN** a workspace is seeded with `userId = 'abc'`
- **THEN** three `user_agent_assignments` rows exist linking `user_id = 'abc'` to each of the three agents

### Requirement: Seed creates empty context_md and default role_md rows
The system SHALL insert one `context_md` row (empty content) and three `role_md` rows (one per agent with default role content loaded from a platform template string).

#### Scenario: context_md row exists immediately after seed
- **WHEN** a workspace is seeded
- **THEN** one `context_md` row with `workspace_id` set and `content = ''` exists

#### Scenario: role_md rows contain default content
- **WHEN** a workspace is seeded
- **THEN** three `role_md` rows exist, one per agent, each with non-empty default `content`
