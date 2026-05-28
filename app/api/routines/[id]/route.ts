import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { routines } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";
import { deleteSchedule } from "@/lib/routines/trigger";

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
    .select()
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
  return NextResponse.json({ routine });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const { id } = await params;
  const [routine] = await db
    .select({ triggerDevTaskId: routines.triggerDevTaskId })
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

  if (routine.triggerDevTaskId) {
    try {
      await deleteSchedule(routine.triggerDevTaskId);
    } catch (err) {
      console.error("Failed to delete Trigger.dev schedule:", err);
    }
  }

  await db
    .update(routines)
    .set({ deletedAt: new Date() })
    .where(eq(routines.id, id));

  return NextResponse.json({ ok: true });
}
