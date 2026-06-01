/**
 * Run once to seed mock data into an existing workspace.
 *
 * Usage:
 *   bun scripts/seed-existing-workspace.ts <workspaceId> <userId>
 *
 * Find your IDs:
 *   bun run db:studio  →  open workspaces table and workspace_members table
 */
import { db } from "../db/drizzle";
import { seedWorkspace } from "../db/seed";

const [workspaceId, userId] = process.argv.slice(2);

if (!workspaceId || !userId) {
  console.error("Usage: bun scripts/seed-existing-workspace.ts <workspaceId> <userId>");
  process.exit(1);
}

console.log(`Seeding workspace ${workspaceId} for user ${userId}...`);

await db.transaction(async (tx) => {
  await seedWorkspace(tx, workspaceId, userId);
});

console.log("Done.");
process.exit(0);
