import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaces, workspaceMembers, workspaceRoles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { nanoid } from "nanoid";
import { seedWorkspace, seedWorkspaceRoles } from "@/db/seed";

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")),
  about: z.string().min(1),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ws = await getWorkspaceForUser(session.user.id);
  if (!ws) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, timezone: workspaces.timezone })
    .from(workspaces)
    .where(eq(workspaces.id, ws.id))
    .limit(1);

  return NextResponse.json({ workspace });
}

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
    .select({ id: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .innerJoin(workspaceRoles, eq(workspaceMembers.roleId, workspaceRoles.id))
    .where(
      and(
        eq(workspaceMembers.userId, session.user.id),
        eq(workspaceRoles.canManageSettings, true),
        isNull(workspaceMembers.deletedAt)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Workspace already exists for this user" },
      { status: 409 }
    );
  }

  const { name, industry: _industry, website: _website, about: _about } = parsed.data;

  const workspaceId = `ws_${nanoid(16)}`;
  const memberId = `mem_${nanoid(16)}`;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: workspaceId,
      name,
      slug: `${slug}-${nanoid(6)}`,
    });

    const { adminRoleId } = await seedWorkspaceRoles(tx, workspaceId);

    await tx.insert(workspaceMembers).values({
      id: memberId,
      workspaceId,
      userId: session.user.id,
      roleId: adminRoleId,
    });

    await seedWorkspace(tx, workspaceId, session.user.id);
  });

  const response = NextResponse.json({ id: workspaceId }, { status: 201 });
  response.cookies.set("has_workspace", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
