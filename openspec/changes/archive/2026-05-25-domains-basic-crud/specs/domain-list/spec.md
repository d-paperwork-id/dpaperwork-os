## ADDED Requirements

### Requirement: Display workspace domains
The system SHALL display all non-deleted domains for the current workspace at `/domains`, sorted by `created_at` ascending.

#### Scenario: Domains exist
- **WHEN** the user navigates to `/domains`
- **THEN** each domain is rendered as an `Item` row showing name, icon, and description

#### Scenario: No domains exist
- **WHEN** the user navigates to `/domains` and the workspace has no domains
- **THEN** an `Empty` component is shown with a message directing the user to contact the team

### Requirement: Navigate to a domain
The system SHALL navigate to `/domains/[slug]` when the user clicks a domain row.

#### Scenario: Click domain item
- **WHEN** the user clicks any domain `Item` row
- **THEN** the browser navigates to `/domains/[slug]` for that domain

### Requirement: Page header
The system SHALL render a page header with the title "Domains" at `h-12` with a `border-b border-border`.

#### Scenario: Header renders
- **WHEN** the `/domains` page loads
- **THEN** the header shows "Domains" as `text-sm font-medium text-foreground`

### Requirement: New Domain button in header
The system SHALL render a "New Domain" `Button` (variant `outline`, size `sm`) in the page header actions slot. Clicking it opens a `Dialog` for domain creation.

#### Scenario: Click New Domain
- **WHEN** the user clicks the "New Domain" button
- **THEN** a `Dialog` opens with title "New Domain" and fields for name, slug, description, and icon

### Requirement: Domain creation Dialog
The system SHALL allow the user to create a domain via a `Dialog` with the following fields: `name` (required text), `slug` (required text, auto-derived from name, editable, lowercase alphanumeric + hyphens only), `description` (optional text), `icon` (optional text — lucide icon name). On submit it calls `POST /api/domains`. On success it navigates to `/domains/[slug]` and shows a success toast.

#### Scenario: Name drives slug auto-derive
- **WHEN** the user types in the name field
- **THEN** the slug field updates automatically to `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`; the user may override it manually

#### Scenario: Successful creation
- **WHEN** the user fills name + slug and clicks "Create"
- **THEN** `POST /api/domains` is called; on success the Dialog closes, the browser navigates to `/domains/[slug]`, and a success toast is shown

#### Scenario: Duplicate slug
- **WHEN** the API returns `409` (slug conflict)
- **THEN** a `FieldError` is shown below the slug field: "A domain with this slug already exists"

#### Scenario: Name required
- **WHEN** the user submits with an empty name field
- **THEN** a `FieldError` is shown below the name field and no API call is made

### Requirement: Data fetched via TanStack Query
The system SHALL fetch domains from `GET /api/domains` using TanStack Query; no SSR data fetching.

#### Scenario: Loading state
- **WHEN** the domain list is loading
- **THEN** a `Spinner` is shown in the content area

#### Scenario: Fetch error
- **WHEN** the API returns an error
- **THEN** an inline `Alert` is shown with the error message
