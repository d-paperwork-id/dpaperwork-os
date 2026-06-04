import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceInvitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { requireRole } from "@/lib/auth/require-role";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const guardError = await requireRole(session.user.id, workspace.id, "can_manage_settings");
  if (guardError) return guardError;

  const { id } = await params;

  const [invite] = await db
    .select({ id: workspaceInvitations.id, status: workspaceInvitations.status })
    .from(workspaceInvitations)
    .where(
      and(eq(workspaceInvitations.id, id), eq(workspaceInvitations.workspaceId, workspace.id)),
    )
    .limit(1);

  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  await db
    .update(workspaceInvitations)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(workspaceInvitations.id, id));

  return NextResponse.json({ success: true });
}

