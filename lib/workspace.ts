import { db } from "@/db/drizzle";
import { workspaces, workspaceMembers } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function getWorkspaceForUser(userId: string) {
  const cookieStore = await cookies();
  const activeWorkspaceId = cookieStore.get("active-workspace-id")?.value;

  if (activeWorkspaceId) {
    const [row] = await db
      .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, activeWorkspaceId),
          isNull(workspaceMembers.deletedAt),
          isNull(workspaces.deletedAt),
        ),
      )
      .limit(1);

    if (row) return row;
  }

  const [row] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        isNull(workspaceMembers.deletedAt),
        isNull(workspaces.deletedAt),
      ),
    )
    .orderBy(asc(workspaceMembers.joinedAt))
    .limit(1);

  return row ?? null;
}
