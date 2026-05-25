import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { domains, domainFields, domainRecords } from "@/db/schema";
import { eq, isNull, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getWorkspaceForUser } from "@/lib/workspace";

const choiceSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const fieldInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["text", "long_text", "number", "date", "single_select"]),
  slug: z.string().min(1),
  position: z.number().int().default(0),
  options: z.object({ choices: z.array(choiceSchema) }).optional(),
});

const createDomainSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fields: z.array(fieldInputSchema).optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const rows = await db
    .select({
      id: domains.id,
      name: domains.name,
      slug: domains.slug,
      description: domains.description,
      icon: domains.icon,
      createdAt: domains.createdAt,
      recordCount: sql<number>`cast(count(${domainRecords.id}) filter (where ${domainRecords.deletedAt} is null) as int)`,
    })
    .from(domains)
    .leftJoin(domainRecords, eq(domainRecords.domainId, domains.id))
    .where(and(eq(domains.workspaceId, workspace.id), isNull(domains.deletedAt)))
    .groupBy(domains.id)
    .orderBy(domains.createdAt);

  return NextResponse.json({ domains: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const body = await req.json();
  const parsed = createDomainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, slug, description, icon, fields: inputFields = [] } = parsed.data;

  const existing = await db
    .select({ id: domains.id })
    .from(domains)
    .where(
      and(
        eq(domains.workspaceId, workspace.id),
        eq(domains.slug, slug),
        isNull(domains.deletedAt)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A domain with this slug already exists" },
      { status: 409 }
    );
  }

  const domainId = `dom_${nanoid(16)}`;

  await db.transaction(async (tx) => {
    await tx.insert(domains).values({
      id: domainId,
      workspaceId: workspace.id,
      name,
      slug,
      description,
      icon,
      createdByUserId: session.user.id,
    });

    if (inputFields.length > 0) {
      await tx.insert(domainFields).values(
        inputFields.map((f, i) => ({
          id: `fld_${nanoid(16)}`,
          domainId,
          workspaceId: workspace.id,
          name: f.name,
          slug: f.slug,
          type: f.type,
          position: f.position ?? i,
          options: f.options ?? null,
        }))
      );
    }
  });

  const domain = await db
    .select()
    .from(domains)
    .where(eq(domains.id, domainId))
    .then((rows) => rows[0]);

  return NextResponse.json({ domain }, { status: 201 });
}
