## 1. Remove Neon Dependency

- [x] 1.1 Uninstall `@neondatabase/serverless` from `package.json` via `bun remove @neondatabase/serverless`

## 2. Fix proxy.ts

- [x] 2.1 Replace the `neon()` workspace check in `proxy.ts` with a Drizzle query using `db` from `@/db/drizzle` and `workspace` table from `@/db/schema`, returning `true` if any row exists for the given `userId`
- [x] 2.2 Remove the `import { neon } from "@neondatabase/serverless"` line from `proxy.ts`

## 3. Update Environment Config

- [x] 3.1 Update `DATABASE_URL` in `.env.example` to use a Supabase transaction pooler placeholder (e.g., `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)

## 4. Verification

- [x] 4.1 Run `bun run build` and confirm it passes with no TypeScript or import errors
