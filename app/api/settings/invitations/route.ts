import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceInvitations, workspaceMembers, workspaceRoles, user } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { requireRole } from "@/lib/auth/require-role";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import { render } from "@react-email/render";
import WorkspaceInviteEmail from "@/emails/workspace-invite";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const now = new Date();
  const invites = await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      roleId: workspaceInvitations.roleId,
      roleName: workspaceRoles.name,
      status: workspaceInvitations.status,
      invitedByUserName: user.name,
      createdAt: workspaceInvitations.createdAt,
      expiresAt: workspaceInvitations.expiresAt,
    })
    .from(workspaceInvitations)
    .leftJoin(workspaceRoles, eq(workspaceInvitations.roleId, workspaceRoles.id))
    .leftJoin(user, eq(workspaceInvitations.invitedByUserId, user.id))
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspace.id),
        eq(workspaceInvitations.status, "pending"),
        gt(workspaceInvitations.expiresAt, now),
      ),
    )
    .orderBy(workspaceInvitations.createdAt);

  return NextResponse.json({ invitations: invites });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const guardError = await requireRole(session.user.id, workspace.id, "can_manage_settings");
  if (guardError) return guardError;

  const { email, roleId } = (await req.json()) as { email: string; roleId?: string };
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const [existingMember] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .innerJoin(user, eq(workspaceMembers.userId, user.id))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(user.email, email),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .limit(1);

  if (existingMember) {
    return NextResponse.json({ error: "This person is already a member" }, { status: 409 });
  }

  const now = new Date();
  const [existingInvite] = await db
    .select({ id: workspaceInvitations.id })
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspace.id),
        eq(workspaceInvitations.email, email),
        eq(workspaceInvitations.status, "pending"),
        gt(workspaceInvitations.expiresAt, now),
      ),
    )
    .limit(1);

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite is already pending for this email" },
      { status: 409 },
    );
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const id = `inv_${nanoid(16)}`;

  await db.insert(workspaceInvitations).values({
    id,
    workspaceId: workspace.id,
    email,
    roleId: roleId ?? null,
    token,
    invitedByUserId: session.user.id,
    status: "pending",
    expiresAt,
  });

  const appHost = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appHost}/invite/${token}`;

  const html = await render(
    WorkspaceInviteEmail({
      workspaceName: workspace.name,
      inviterName: session.user.name,
      acceptUrl,
    }),
  );

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@dpaperwork.in",
    to: email,
    subject: `You've been invited to join ${workspace.name} on dpaperwork`,
    html,
  });

  return NextResponse.json({ id, email, status: "pending", expiresAt }, { status: 201 });
}
