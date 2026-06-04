import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceRoles, workspaceMembers } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const roles = await db
    .select({
      id: workspaceRoles.id,
      name: workspaceRoles.name,
      description: workspaceRoles.description,
      isSystem: workspaceRoles.isSystem,
      canManageSettings: workspaceRoles.canManageSettings,
      canWriteData: workspaceRoles.canWriteData,
      canViewData: workspaceRoles.canViewData,
      position: workspaceRoles.position,
      memberCount: sql<number>`(
        SELECT count(*)::int FROM workspace_members
        WHERE workspace_members.role_id = ${workspaceRoles.id}
          AND workspace_members.deleted_at IS NULL
      )`,
    })
    .from(workspaceRoles)
    .where(eq(workspaceRoles.workspaceId, workspace.id))
    .orderBy(workspaceRoles.position);

  return NextResponse.json({ roles });
}
