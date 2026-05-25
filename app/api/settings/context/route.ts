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

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceForSession(session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(contextMd)
    .where(eq(contextMd.workspaceId, workspace.id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ content: "", updatedAt: null, currentVersionId: null });
  }

  const row = rows[0];
  return NextResponse.json({
    content: row.content,
    updatedAt: row.updatedAt,
    currentVersionId: row.currentVersionId,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceForSession(session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const body = await req.json();
  const { content, updatedAt } = body as { content: string; updatedAt: string | null };

  const versionId = `ver_${nanoid(16)}`;

  try {
    const result = await db.transaction(async (tx) => {
      // Optimistic concurrency check
      const current = await tx
        .select({ updatedAt: contextMd.updatedAt })
        .from(contextMd)
        .where(eq(contextMd.workspaceId, workspace.id))
        .limit(1);

      if (current.length > 0 && updatedAt !== null) {
        const serverUpdatedAt = current[0].updatedAt.toISOString();
        const clientUpdatedAt = new Date(updatedAt).toISOString();
        if (serverUpdatedAt !== clientUpdatedAt) {
          return { conflict: true };
        }
      }

      await tx.insert(contextMdVersions).values({
        id: versionId,
        workspaceId: workspace.id,
        content,
        createdByUserId: session.user.id,
      });

      const updated = await tx
        .update(contextMd)
        .set({
          content,
          currentVersionId: versionId,
          updatedByUserId: session.user.id,
        })
        .where(eq(contextMd.workspaceId, workspace.id))
        .returning({ updatedAt: contextMd.updatedAt });

      return { updatedAt: updated[0].updatedAt, versionId };
    });

    if ("conflict" in result && result.conflict) {
      return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }

    return NextResponse.json({ updatedAt: result.updatedAt, currentVersionId: result.versionId });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
