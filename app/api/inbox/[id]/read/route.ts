import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { inboxItems } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const { id } = await params;

  await db
    .update(inboxItems)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(inboxItems.id, id),
        eq(inboxItems.workspaceId, workspace.id),
        isNull(inboxItems.deletedAt),
        isNull(inboxItems.readAt)
      )
    );

  return NextResponse.json({ success: true });
}
