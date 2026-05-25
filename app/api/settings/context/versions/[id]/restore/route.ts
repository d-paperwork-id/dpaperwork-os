import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceMembers, workspaces, contextMd, contextMdVersions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceForSession(session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const { id } = await params;

  const sourceVersions = await db
    .select({ content: contextMdVersions.content, workspaceId: contextMdVersions.workspaceId })
    .from(contextMdVersions)
    .where(eq(contextMdVersions.id, id))
    .limit(1);

  if (sourceVersions.length === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const source = sourceVersions[0];
  if (source.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newVersionId = `ver_${nanoid(16)}`;

  const updated = await db.transaction(async (tx) => {
    await tx.insert(contextMdVersions).values({
      id: newVersionId,
      workspaceId: workspace.id,
      content: source.content,
      createdByUserId: session.user.id,
    });

    const rows = await tx
      .update(contextMd)
      .set({
        content: source.content,
        currentVersionId: newVersionId,
        updatedByUserId: session.user.id,
      })
      .where(eq(contextMd.workspaceId, workspace.id))
      .returning({ updatedAt: contextMd.updatedAt });

    return rows[0];
  });

  return NextResponse.json({ currentVersionId: newVersionId, updatedAt: updated.updatedAt });
}
