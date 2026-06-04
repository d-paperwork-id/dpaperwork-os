import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceInvitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { render } from "@react-email/render";
import { Resend } from "resend";
import WorkspaceInviteEmail from "@/emails/workspace-invite";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const guardError = await requireRole(session.user.id, workspace.id, "can_manage_settings");
  if (guardError) return guardError;

  const { id } = await params;

  const [invite] = await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      token: workspaceInvitations.token,
      status: workspaceInvitations.status,
    })
    .from(workspaceInvitations)
    .where(
      and(eq(workspaceInvitations.id, id), eq(workspaceInvitations.workspaceId, workspace.id)),
    )
    .limit(1);

  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.status === "accepted") {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 409 });
  }

  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(workspaceInvitations)
    .set({ expiresAt: newExpiresAt, status: "pending", updatedAt: new Date() })
    .where(eq(workspaceInvitations.id, id));

  const appHost = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appHost}/invite/${invite.token}`;

  const html = await render(
    WorkspaceInviteEmail({
      workspaceName: workspace.name,
      inviterName: session.user.name,
      acceptUrl,
    }),
  );

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@dpaperwork.in",
    to: invite.email,
    subject: `You've been invited to join ${workspace.name} on dpaperwork`,
    html,
  });

  return NextResponse.json({ success: true });
}
