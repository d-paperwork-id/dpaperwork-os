import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull, isNotNull, or, lt, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { inboxItems } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

const querySchema = z.object({
  agent: z.enum(["pm", "chief-of-staff", "executive-assistant"]).optional(),
  status: z.enum(["unread", "all", "resolved"]).optional(),
  cursor: z.string().optional(),
});

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { agent, status } = parsed.data;
  const now = new Date();

  const baseWhere = and(
    eq(inboxItems.workspaceId, workspace.id),
    eq(inboxItems.recipientUserId, session.user.id),
    isNull(inboxItems.deletedAt)
  );

  const statusWhere =
    status === "resolved"
      ? isNotNull(inboxItems.resolvedAt)
      : status === "all"
        ? undefined
        : and(
            isNull(inboxItems.resolvedAt),
            or(isNull(inboxItems.snoozedUntil), lt(inboxItems.snoozedUntil, now))
          );

  const agentWhere = agent ? eq(inboxItems.sourceAgentId, agent) : undefined;

  const rows = await db
    .select()
    .from(inboxItems)
    .where(and(baseWhere, statusWhere, agentWhere))
    .orderBy(desc(inboxItems.createdAt))
    .limit(50);

  return NextResponse.json({ items: rows });
}
