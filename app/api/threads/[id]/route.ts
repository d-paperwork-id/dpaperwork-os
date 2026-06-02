import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { threads } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  lastMessageAt: z.string().datetime().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const { id } = await params;
  const [thread] = await db
    .select()
    .from(threads)
    .where(
      and(
        eq(threads.id, id),
        eq(threads.workspaceId, workspace.id),
        eq(threads.ownerUserId, session.user.id),
        isNull(threads.deletedAt)
      )
    )
    .limit(1);

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Partial<{ title: string; lastMessageAt: Date }> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.lastMessageAt !== undefined) {
    updates.lastMessageAt = new Date(parsed.data.lastMessageAt);
  }

  const [updated] = await db
    .update(threads)
    .set(updates)
    .where(
      and(
        eq(threads.id, id),
        eq(threads.workspaceId, workspace.id),
        eq(threads.ownerUserId, session.user.id),
        isNull(threads.deletedAt)
      )
    )
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread: updated });
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
  const [deleted] = await db
    .update(threads)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(threads.id, id),
        eq(threads.workspaceId, workspace.id),
        eq(threads.ownerUserId, session.user.id),
        isNull(threads.deletedAt)
      )
    )
    .returning({ id: threads.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
