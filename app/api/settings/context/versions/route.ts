import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceMembers, workspaces, contextMdVersions } from "@/db/schema";
import { user } from "@/db/schema/auth";
import { eq, and, isNull, desc } from "drizzle-orm";
import { headers } from "next/headers";

async function getWorkspaceForSession(userId: string) {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        isNull(workspaceMembers.deletedAt),
        isNull(workspaces.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceForSession(session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const versions = await db
    .select({
      id: contextMdVersions.id,
      createdAt: contextMdVersions.createdAt,
      createdByUserId: contextMdVersions.createdByUserId,
      createdByName: user.name,
    })
    .from(contextMdVersions)
    .leftJoin(user, eq(contextMdVersions.createdByUserId, user.id))
    .where(eq(contextMdVersions.workspaceId, workspace.id))
    .orderBy(desc(contextMdVersions.createdAt));

  return NextResponse.json(versions);
}
