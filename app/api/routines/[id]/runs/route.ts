import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { routines, routineRuns } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const { id } = await params;

  const [routine] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(
      and(
        eq(routines.id, id),
        eq(routines.workspaceId, workspace.id),
        isNull(routines.deletedAt)
      )
    )
    .limit(1);

  if (!routine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const runsRows = await db
    .select()
    .from(routineRuns)
    .where(eq(routineRuns.routineId, id))
    .orderBy(desc(routineRuns.startedAt))
    .limit(50);

  return NextResponse.json({ runs: runsRows });
}
