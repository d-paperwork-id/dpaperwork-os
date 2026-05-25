import { db } from "@/db/drizzle";
import { workspaces, workspaceMembers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function getWorkspaceForUser(userId: string) {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        isNull(workspaceMembers.deletedAt),
        isNull(workspaces.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}
