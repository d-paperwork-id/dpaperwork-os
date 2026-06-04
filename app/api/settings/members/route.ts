import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceMembers, workspaceRoles, user } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { nanoid } from "nanoid";
import { requireRole } from "@/lib/auth/require-role";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const members = await db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      roleId: workspaceMembers.roleId,
      roleName: workspaceRoles.name,
      joinedAt: workspaceMembers.joinedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(workspaceMembers.userId, user.id))
    .leftJoin(workspaceRoles, eq(workspaceMembers.roleId, workspaceRoles.id))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspace.id),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .orderBy(workspaceMembers.joinedAt);

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const guardError = await requireRole(session.user.id, workspace.id, "can_manage_settings");
  if (guardError) return guardError;

  const { email, roleId } = await req.json() as { email: string; roleId: string };

  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found. They must sign up first." }, { status: 404 });
  }

  const [role] = await db
    .select({ id: workspaceRoles.id })
    .from(workspaceRoles)
    .where(and(eq(workspaceRoles.id, roleId), eq(workspaceRoles.workspaceId, workspace.id)))
    .limit(1);

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  await db.insert(workspaceMembers).values({
    id: `mem_${nanoid(16)}`,
    workspaceId: workspace.id,
    userId: targetUser.id,
    roleId,
    invitedByUserId: session.user.id,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
