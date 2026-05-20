import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspace } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")),
  about: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.userId, session.user.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Workspace already exists for this user" },
      { status: 409 }
    );
  }

  const { name, industry, website: websiteUrl, about } = parsed.data;

  const [created] = await db
    .insert(workspace)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      industry,
      website: websiteUrl || null,
      about,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
