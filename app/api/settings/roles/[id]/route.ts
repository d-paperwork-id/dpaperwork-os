import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceRoles, workspaceMembers } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { requireRole } from "@/lib/auth/require-role";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const guardError = await requireRole(session.user.id, workspace.id, "can_manage_settings");
  if (guardError) return guardError;

  const [role] = await db
    .select({ isSystem: workspaceRoles.isSystem })
    .from(workspaceRoles)
    .where(and(eq(workspaceRoles.id, id), eq(workspaceRoles.workspaceId, workspace.id)))
    .limit(1);

  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  if (role.isSystem) {
    return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 403 });
  }

  const [{ assignedCount }] = await db
    .select({ assignedCount: count() })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.roleId, id), isNull(workspaceMembers.deletedAt)));

  if (assignedCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a role that has members assigned. Reassign members first." },
      { status: 409 },
    );
  }

  await db.delete(workspaceRoles).where(eq(workspaceRoles.id, id));
  return NextResponse.json({ success: true });
}
