import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceMembers, workspaceRoles } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { requireRole } from "@/lib/auth/require-role";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const guardError = await requireRole(session.user.id, workspace.id, "can_manage_settings");
  if (guardError) return guardError;

  const { roleId } = await req.json() as { roleId: string };

  const [targetRole] = await db
    .select({ canManageSettings: workspaceRoles.canManageSettings })
    .from(workspaceRoles)
    .where(and(eq(workspaceRoles.id, roleId), eq(workspaceRoles.workspaceId, workspace.id)))
    .limit(1);

  if (!targetRole) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  if (!targetRole.canManageSettings) {
    const [currentMember] = await db
      .select({ roleId: workspaceMembers.roleId })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.id, id), eq(workspaceMembers.workspaceId, workspace.id)))
      .limit(1);

    if (currentMember?.roleId) {
      const [currentRole] = await db
        .select({ canManageSettings: workspaceRoles.canManageSettings })
        .from(workspaceRoles)
        .where(eq(workspaceRoles.id, currentMember.roleId))
        .limit(1);

      if (currentRole?.canManageSettings) {
        const [{ adminCount }] = await db
          .select({ adminCount: count() })
          .from(workspaceMembers)
          .innerJoin(workspaceRoles, eq(workspaceMembers.roleId, workspaceRoles.id))
          .where(
            and(
              eq(workspaceMembers.workspaceId, workspace.id),
              eq(workspaceRoles.canManageSettings, true),
              isNull(workspaceMembers.deletedAt),
            ),
          );

        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Workspace must have at least one admin" },
            { status: 409 },
          );
        }
      }
    }
  }

  await db
    .update(workspaceMembers)
    .set({ roleId })
    .where(and(eq(workspaceMembers.id, id), eq(workspaceMembers.workspaceId, workspace.id)));

  return NextResponse.json({ success: true });
}

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

  await db
    .update(workspaceMembers)
    .set({ deletedAt: new Date() })
    .where(and(eq(workspaceMembers.id, id), eq(workspaceMembers.workspaceId, workspace.id)));

  return NextResponse.json({ success: true });
}
