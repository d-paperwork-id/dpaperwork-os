import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { inboxItems } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

const bodySchema = z.object({
  snoozedUntil: z.string().datetime({ message: "Must be a valid ISO 8601 timestamp" }),
});

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;

  const [updated] = await db
    .update(inboxItems)
    .set({ snoozedUntil: new Date(parsed.data.snoozedUntil) })
    .where(
      and(
        eq(inboxItems.id, id),
        eq(inboxItems.workspaceId, workspace.id),
        isNull(inboxItems.deletedAt)
      )
    )
    .returning({ id: inboxItems.id });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
