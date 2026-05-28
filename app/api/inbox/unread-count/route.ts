import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull, or, lt, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { inboxItems } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const now = new Date();

  const [result] = await db
    .select({ count: count() })
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.workspaceId, workspace.id),
        eq(inboxItems.recipientUserId, session.user.id),
        isNull(inboxItems.deletedAt),
        isNull(inboxItems.readAt),
        isNull(inboxItems.resolvedAt),
        or(isNull(inboxItems.snoozedUntil), lt(inboxItems.snoozedUntil, now))
      )
    );

  return NextResponse.json({ count: result?.count ?? 0 });
}
