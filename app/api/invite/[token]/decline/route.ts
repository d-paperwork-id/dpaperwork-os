import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;

  const [invite] = await db
    .select({ id: workspaceInvitations.id, status: workspaceInvitations.status })
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  if (invite.status !== "pending") {
    return NextResponse.json({ success: true });
  }

  await db
    .update(workspaceInvitations)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(workspaceInvitations.id, invite.id));

  return NextResponse.json({ success: true });
}
