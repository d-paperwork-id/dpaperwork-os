## ADDED Requirements

### Requirement: integration_connections table stores Composio OAuth connections
The system SHALL have an `integration_connections` table with `id` (PK, `icn_` prefix), `workspace_id` (FK), `scope` (enum: `user`, `workspace`; default `user`), `user_id` (nullable FK — required when scope is `user`), `provider` (text), `composio_entity_id`, `composio_connection_id`, `composio_mcp_url`, `status` (enum: `active`, `revoked`, `expired`, `error`; default `active`), `last_used_at` (nullable), `last_error_at` (nullable), `last_error_message` (nullable), `created_at`, `updated_at`, `deleted_at`. Two partial unique indexes enforce one active connection per (workspace, user, provider) for user-scoped and one per (workspace, provider) for workspace-scoped connections.

#### Scenario: Per-user connection uniqueness is enforced among active rows
- **WHEN** a user attempts a second active connection for the same provider in the same workspace
- **THEN** the partial unique index `WHERE scope = 'user' AND deleted_at IS NULL` rejects the insert

#### Scenario: Per-workspace connection uniqueness is enforced
- **WHEN** a workspace-scoped connection for provider 'gmail' already exists and a second is attempted
- **THEN** the partial unique index `WHERE scope = 'workspace' AND deleted_at IS NULL` rejects the insert

#### Scenario: Revoked connection does not block a new connection for same provider
- **WHEN** an existing connection for a provider has status 'revoked' or deleted_at set
- **THEN** a new active connection for the same provider can be inserted successfully

#### Scenario: composio_mcp_url is stored per connection
- **WHEN** a connection is established with Composio
- **THEN** `composio_mcp_url` is stored and used at runtime to initialize MCPClient
