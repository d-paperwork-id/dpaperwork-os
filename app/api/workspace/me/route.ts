import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaces, workspaceMembers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, session.user.id),
        isNull(workspaceMembers.deletedAt),
        isNull(workspaces.deletedAt)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
