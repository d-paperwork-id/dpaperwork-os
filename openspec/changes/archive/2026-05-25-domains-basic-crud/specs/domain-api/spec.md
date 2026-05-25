## ADDED Requirements

### Requirement: GET /api/domains returns workspace domains
The system SHALL return all non-deleted domains for the authenticated user's workspace.

#### Scenario: Authenticated request
- **WHEN** an authenticated user sends `GET /api/domains`
- **THEN** the response is `200` with `{ domains: Domain[] }`, scoped to `workspace_id` from session

#### Scenario: Unauthenticated request
- **WHEN** the request has no valid session
- **THEN** the response is `401`

### Requirement: POST /api/domains creates a domain
The system SHALL create a new domain with name, slug, description, and icon. Slug must be unique within the workspace among non-deleted domains.

#### Scenario: Valid payload
- **WHEN** the request body contains `{ name, slug, description?, icon? }`
- **THEN** a new `domains` row is inserted and returned as `{ domain }` with `201`

#### Scenario: Duplicate slug
- **WHEN** the slug already exists in the workspace
- **THEN** the response is `409` with `{ error: "A domain with this slug already exists" }`

### Requirement: GET /api/domains/[id]/records returns fields and paginated records
The system SHALL return `domain_fields` (ordered by `position`) and a paginated, optionally filtered page of `domain_records`. It accepts the following query params:
- `page` — 1-based page number, default `1`
- `pageSize` — records per page, default `50`, max `200`
- `filters` — URL-encoded JSON array of `{ field: string, value: string }` objects; all conditions are AND-combined; each condition filters on `domain_records.fields->>'<slug>'` using a type-appropriate operator (`ILIKE '%value%'` for `text`/`long_text`; `=` cast for `number`, `date`, `single_select`)

The response shape is `{ fields: DomainField[], records: DomainRecord[], total: number, page: number, pageSize: number }`.

#### Scenario: Default (no params)
- **WHEN** an authenticated user sends `GET /api/domains/[id]/records` with no query params
- **THEN** the response is `200` with `{ fields, records: first 50 records ordered by created_at asc, total, page: 1, pageSize: 50 }`

#### Scenario: Paginated request
- **WHEN** the request includes `?page=2&pageSize=25`
- **THEN** the response contains records 26–50 (if they exist) and correct `total`, `page: 2`, `pageSize: 25`

#### Scenario: Filtered request
- **WHEN** the request includes `?filters=[{"field":"stage","value":"negotiation"}]`
- **THEN** only records where `fields->>'stage' ILIKE '%negotiation%'` (or `=` for non-text types) are returned, with correct `total` reflecting the filtered count

#### Scenario: Filter + pagination combined
- **WHEN** the request includes both `filters` and `page`/`pageSize` params
- **THEN** filtering is applied first, then pagination is applied to the filtered set; `total` is the filtered record count

#### Scenario: Invalid filters JSON
- **WHEN** the `filters` param is not valid JSON
- **THEN** the response is `400` with `{ error: "Invalid filters format" }`

#### Scenario: pageSize exceeds maximum
- **WHEN** the request includes `pageSize > 200`
- **THEN** the response is `400` with `{ error: "pageSize must be 200 or less" }`

#### Scenario: Domain belongs to different workspace
- **WHEN** the domain does not belong to the user's workspace
- **THEN** the response is `404`

### Requirement: POST /api/domains/[id]/records creates a record
The system SHALL insert a new `domain_records` row. It MUST validate each field value against `domain_fields.type`. It MUST write a row to `agent_writes_log` with `agent_id = 'user'`, `run_id = 'user:{userId}'`, `target_type = 'domain_record'`, `action = 'insert'`, and `after` set to the new fields JSON.

#### Scenario: Valid record
- **WHEN** the request body contains a valid `fields` object
- **THEN** a new record is inserted, an `agent_writes_log` row is written, and the response is `201` with `{ record }`

#### Scenario: Missing required field
- **WHEN** the request body omits a field where `is_required = true`
- **THEN** the response is `422` with a Zod validation error

### Requirement: PUT /api/domains/[id]/records/[recordId] updates a record
The system SHALL update `domain_records.fields` with a partial or full field map. It MUST write a row to `agent_writes_log` with `action = 'update'`, `before` = the previous fields JSON, and `after` = the new fields JSON.

#### Scenario: Valid update
- **WHEN** the request body contains a `fields` object with one or more field updates
- **THEN** the record is updated, an `agent_writes_log` row is written, and the response is `200` with `{ record }`

#### Scenario: Record not found
- **WHEN** the record does not exist or belongs to a different workspace
- **THEN** the response is `404`

### Requirement: DELETE /api/domains/[id]/records/[recordId] soft-deletes a record
The system SHALL set `deleted_at = now()` on the record. It MUST write a row to `agent_writes_log` with `action = 'delete'` and `before` = the record's fields JSON.

#### Scenario: Valid delete
- **WHEN** an authenticated user sends `DELETE /api/domains/[id]/records/[recordId]`
- **THEN** `deleted_at` is set, an `agent_writes_log` row is written, and the response is `204`

#### Scenario: Record not found
- **WHEN** the record does not exist or belongs to a different workspace
- **THEN** the response is `404`

### Requirement: All routes enforce workspace isolation
Every API route MUST scope reads and writes to the `workspace_id` extracted from the session. No route SHALL accept a `workspace_id` in the request body or query params.

#### Scenario: Cross-workspace access attempt
- **WHEN** a user attempts to read or write a domain or record that belongs to another workspace
- **THEN** the response is `404` (not `403`, to avoid leaking resource existence)
