import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { workspaceInvitations, workspaces, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const now = new Date();
  const [invite] = await db
    .select({
      status: workspaceInvitations.status,
      email: workspaceInvitations.email,
      expiresAt: workspaceInvitations.expiresAt,
      workspaceName: workspaces.name,
      inviterName: user.name,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .leftJoin(user, eq(workspaceInvitations.invitedByUserId, user.id))
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ error: "accepted" }, { status: 410 });
  }

  if (invite.status === "revoked") {
    return NextResponse.json({ error: "revoked" }, { status: 410 });
  }

  if (invite.status === "expired" || invite.expiresAt < now) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  return NextResponse.json({
    workspaceName: invite.workspaceName,
    inviterName: invite.inviterName ?? "Someone",
    email: invite.email,
    status: invite.status,
  });
}
