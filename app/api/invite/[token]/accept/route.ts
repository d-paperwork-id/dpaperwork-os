import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceInvitations, workspaceMembers, workspaces } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const now = new Date();

  const [invite] = await db
    .select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      roleId: workspaceInvitations.roleId,
      invitedByUserId: workspaceInvitations.invitedByUserId,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
    })
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  if (invite.status === "revoked" || invite.status === "expired") {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (invite.expiresAt < now) {
    await db
      .update(workspaceInvitations)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(workspaceInvitations.id, invite.id));
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, invite.workspaceId))
    .limit(1);

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const [existingMember] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, invite.workspaceId),
        eq(workspaceMembers.userId, session.user.id),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .limit(1);

  const workspaceCookie = (res: NextResponse) => {
    res.cookies.set("has_workspace", "1", { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  };

  if (existingMember) {
    return workspaceCookie(
      NextResponse.json(
        { workspaceId: workspace.id, workspaceName: workspace.name, workspaceSlug: workspace.slug, alreadyMember: true },
        { status: 200 },
      ),
    );
  }

  await db.insert(workspaceMembers).values({
    id: `mem_${nanoid(16)}`,
    workspaceId: invite.workspaceId,
    userId: session.user.id,
    roleId: invite.roleId,
    invitedByUserId: invite.invitedByUserId,
  });

  await db
    .update(workspaceInvitations)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(workspaceInvitations.id, invite.id));

  return workspaceCookie(
    NextResponse.json(
      { workspaceId: workspace.id, workspaceName: workspace.name, workspaceSlug: workspace.slug },
      { status: 201 },
    ),
  );
}
