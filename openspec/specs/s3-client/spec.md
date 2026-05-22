# S3 Client Spec

## Capability: s3-client

Provides a typed S3 client for workspace file storage. All operations are scoped to `workspaces/<tenantId>/` within the configured bucket. Supports AWS S3 and S3-compatible stores (Cloudflare R2, MinIO) via the `S3_ENDPOINT` environment variable.

---

### Requirement: Upload workspace file
The system SHALL upload a file to S3 at the path `workspaces/<tenantId>/<relativePath>` given a tenant ID, relative path, and content (string or Buffer). The operation SHALL set an appropriate `ContentType` based on the file extension.

#### Scenario: Upload a markdown brain file
- **WHEN** `upload(tenantId, "CONTEXT.md", content)` is called
- **THEN** the file is stored at `workspaces/<tenantId>/CONTEXT.md` in the configured bucket

#### Scenario: Upload a YAML skill file
- **WHEN** `upload(tenantId, "skills/email-reply.yaml", content)` is called
- **THEN** the file is stored at `workspaces/<tenantId>/skills/email-reply.yaml`

---

### Requirement: Download workspace file
The system SHALL retrieve the content of a file from S3 given a tenant ID and relative path, returning its content as a UTF-8 string. The operation SHALL throw a typed `S3NotFoundError` when the object does not exist.

#### Scenario: Download an existing file
- **WHEN** `download(tenantId, "MEMORY.md")` is called and the object exists
- **THEN** the string content of the file is returned

#### Scenario: Download a missing file
- **WHEN** `download(tenantId, "missing.md")` is called and the object does not exist
- **THEN** an `S3NotFoundError` is thrown with the key included in the message

---

### Requirement: Delete workspace file
The system SHALL delete a single object from S3 given a tenant ID and relative path. The operation SHALL succeed (no error) even if the object does not exist.

#### Scenario: Delete an existing file
- **WHEN** `deleteObject(tenantId, "domains/prospects.md")` is called
- **THEN** the object is removed from the bucket

#### Scenario: Delete a non-existent file
- **WHEN** `deleteObject(tenantId, "nonexistent.md")` is called
- **THEN** no error is thrown

---

### Requirement: List workspace files
The system SHALL list all object keys under `workspaces/<tenantId>/` (or a sub-prefix) and return them as an array of relative paths (with the `workspaces/<tenantId>/` prefix stripped).

#### Scenario: List all files for a tenant
- **WHEN** `listObjects(tenantId)` is called
- **THEN** an array of relative paths is returned (e.g., `["CONTEXT.md", "skills/email-reply.yaml"]`)

#### Scenario: List files under a sub-prefix
- **WHEN** `listObjects(tenantId, "skills/")` is called
- **THEN** only paths under `workspaces/<tenantId>/skills/` are returned, with the prefix stripped

---

### Requirement: S3-compatible endpoint support
The S3 client SHALL use the `S3_ENDPOINT` environment variable as the endpoint URL when set, enabling use with Cloudflare R2, MinIO, or other S3-compatible stores. When `S3_ENDPOINT` is absent, the client SHALL default to the standard AWS endpoint for the configured region.

#### Scenario: Custom endpoint configured
- **WHEN** `S3_ENDPOINT` is set to a non-AWS URL
- **THEN** all SDK requests are directed to that endpoint

#### Scenario: No custom endpoint
- **WHEN** `S3_ENDPOINT` is not set
- **THEN** the AWS SDK uses the default regional endpoint derived from `AWS_REGION`

---

### Requirement: Generate presigned GET URL
The system SHALL generate a time-limited presigned GET URL for a workspace object given a tenant ID, relative path, and optional expiry in seconds (default 3600). The URL SHALL allow the caller to download the object without AWS credentials. The bucket SHALL remain private — the URL encodes temporary IAM authorization, not public access.

#### Scenario: Generate URL with default expiry
- **WHEN** `getSignedUrl(tenantId, "domains/report.pdf")` is called without an expiry argument
- **THEN** a presigned URL valid for 3600 seconds is returned

#### Scenario: Generate URL with custom expiry
- **WHEN** `getSignedUrl(tenantId, "domains/report.pdf", { expiresIn: 300 })` is called
- **THEN** a presigned URL valid for 300 seconds is returned

#### Scenario: URL scoped to tenant path
- **WHEN** `getSignedUrl(tenantId, relativePath)` is called
- **THEN** the URL encodes the key `workspaces/<tenantId>/<relativePath>` and no other path is accessible via that URL
