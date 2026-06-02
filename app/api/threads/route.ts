import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { threads } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

const createSchema = z.object({
  agentId: z.enum(["pm", "chief-of-staff", "executive-assistant"]),
});

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const rows = await db
    .select()
    .from(threads)
    .where(
      and(
        eq(threads.workspaceId, workspace.id),
        eq(threads.ownerUserId, session.user.id),
        isNull(threads.deletedAt)
      )
    )
    .orderBy(desc(threads.lastMessageAt));

  return NextResponse.json({ threads: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { agentId } = parsed.data;
  const id = `thr_${nanoid()}`;
  const mastraThreadId = `mastra_${nanoid()}`;

  const [thread] = await db
    .insert(threads)
    .values({
      id,
      workspaceId: workspace.id,
      ownerUserId: session.user.id,
      agentId,
      title: "New thread",
      mastraThreadId,
    })
    .returning();

  return NextResponse.json({ thread }, { status: 201 });
}
