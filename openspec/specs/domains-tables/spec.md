## ADDED Requirements

### Requirement: domains table stores tenant-defined data categories
The system SHALL have a `domains` table with `id` (PK, `dom_` prefix), `workspace_id` (FK), `name`, `slug` (used by agents), `description` (nullable), `icon` (nullable), `created_by_user_id` (nullable FK), `created_at`, `updated_at`, `deleted_at`. A partial unique index on `(workspace_id, slug)` WHERE `deleted_at IS NULL` exists. An index on `workspace_id` exists.

#### Scenario: Domain slug is unique per workspace among non-deleted domains
- **WHEN** two active domains in the same workspace have the same slug
- **THEN** the second insert violates the partial unique index and fails

#### Scenario: Soft-deleted domain slug can be reused
- **WHEN** a domain with slug `deals` is soft-deleted
- **THEN** a new domain with slug `deals` in the same workspace can be inserted

### Requirement: domain_fields table defines the schema for each domain
The system SHALL have a `domain_fields` table with `id` (PK), `domain_id` (FK), `workspace_id` (FK), `name`, `slug` (used as JSON key in records), `type` (enum: `text`, `long_text`, `number`, `date`, `datetime`, `single_select`, `multi_select`, `person_ref`, `domain_ref`, `file`, `formula`, `boolean`), `options` (jsonb, nullable), `position` (integer, default 0), `is_required` (boolean, default false), `default_value` (jsonb, nullable), `created_at`, `updated_at`. A unique index on `(domain_id, slug)` and index on `domain_id` exist.

#### Scenario: Field slug is unique per domain
- **WHEN** two fields in the same domain have the same slug
- **THEN** the unique index rejects the second insert

#### Scenario: Single-select field stores choices in options jsonb
- **WHEN** a field of type `single_select` is inserted with `options = { choices: [...] }`
- **THEN** the row is stored and options are retrievable as-is

### Requirement: domain_records table stores flexible record data
The system SHALL have a `domain_records` table with `id` (PK, `rec_` prefix), `domain_id` (FK), `workspace_id` (FK), `fields` (jsonb, default `{}`), `created_by_user_id` (nullable FK), `created_by_agent_id` (nullable text), `updated_by_user_id` (nullable FK), `updated_by_agent_id` (nullable text), `created_at`, `updated_at`, `deleted_at`. A GIN index on `fields` exists. Composite index on `(workspace_id, domain_id, created_at DESC)` exists. Partial index on `domain_id` WHERE `deleted_at IS NULL` exists.

#### Scenario: Record fields are stored as JSONB and queryable with GIN index
- **WHEN** a record is inserted with `fields = { "stage": "negotiation", "value": 50000 }`
- **THEN** a query using `fields @> '{"stage": "negotiation"}'` returns the record via the GIN index

#### Scenario: Either user or agent attribution is set, not both
- **WHEN** a record is created by a human user
- **THEN** `created_by_user_id` is set and `created_by_agent_id` is null

#### Scenario: Soft-deleted records are excluded from default domain view
- **WHEN** listing records for a domain
- **THEN** rows with `deleted_at IS NOT NULL` are excluded via the partial index predicate
