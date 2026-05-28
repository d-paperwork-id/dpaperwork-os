import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { routines } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";
import { triggerRunNow } from "@/lib/routines/trigger";

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
  const [routine] = await db
    .select({ id: routines.id, triggerDevTaskId: routines.triggerDevTaskId })
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
  if (!routine.triggerDevTaskId)
    return NextResponse.json({ error: "No schedule registered" }, { status: 400 });

  await triggerRunNow(routine.triggerDevTaskId);

  return NextResponse.json({ triggered: true });
}
