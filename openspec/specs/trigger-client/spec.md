## ADDED Requirements

### Requirement: SDK is installed and configured
The project SHALL have `@trigger.dev/sdk` installed and a `trigger.config.ts` at the project root that defines the Trigger.dev project ID, job directories (`src/trigger/`), and default retry settings.

#### Scenario: Config file exists at project root
- **WHEN** the repository is checked out
- **THEN** a `trigger.config.ts` file SHALL exist at the project root with a valid `defineConfig` export

#### Scenario: Job directory is registered
- **WHEN** `trigger.config.ts` is parsed by the Trigger.dev CLI
- **THEN** the `dirs` field SHALL include `./src/trigger` so all jobs in that directory are discovered

### Requirement: Environment variables are documented
The system SHALL document all required Trigger.dev environment variables in `.env.example` so that new developers can configure the integration.

#### Scenario: TRIGGER_SECRET_KEY is present in .env.example
- **WHEN** a developer opens `.env.example`
- **THEN** `TRIGGER_SECRET_KEY` SHALL be listed with a placeholder value and an explanatory comment

### Requirement: Hello-world job runs successfully
The system SHALL include a minimal example job at `src/trigger/hello-world.ts` that logs a message, confirming the integration is wired correctly.

#### Scenario: Job is discoverable
- **WHEN** `trigger dev` CLI is started
- **THEN** the `hello-world` job SHALL appear in the Trigger.dev dashboard job list

#### Scenario: Job executes without error
- **WHEN** the `hello-world` job is triggered manually from the dashboard or via SDK
- **THEN** the job SHALL complete with status `COMPLETED` and a log entry containing "Hello from dpaperwork"
