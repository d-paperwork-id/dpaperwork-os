## 1. Install Dependencies

- [x] 1.1 Add `@trigger.dev/sdk` to `package.json` and run `bun install`

## 2. Project Configuration

- [x] 2.1 Create `trigger.config.ts` at the project root with `defineConfig`, setting `project` (project ID from Trigger.dev dashboard), `dirs: ["./src/trigger"]`, and sensible retry defaults
- [x] 2.2 Add `TRIGGER_SECRET_KEY` to `.env.example` with a placeholder and comment

## 3. Hello-World Job

- [x] 3.1 Create `src/trigger/` directory and add `hello-world.ts` that exports a `task` logging "Hello from dpaperwork"

## 4. Verification

- [ ] 4.1 Run `bunx trigger dev` and confirm the `hello-world` job appears in the Trigger.dev dashboard
- [ ] 4.2 Trigger the job manually from the dashboard and verify it completes with status `COMPLETED`
