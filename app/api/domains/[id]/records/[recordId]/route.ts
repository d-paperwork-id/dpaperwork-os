import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { domains, domainFields, domainRecords } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getWorkspaceForUser } from "@/lib/workspace";
import { logDomainWrite } from "@/lib/audit";

async function resolveRecord(userId: string, domainId: string, recordId: string) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return null;

  const [domain] = await db
    .select({ id: domains.id })
    .from(domains)
    .where(
      and(
        eq(domains.id, domainId),
        eq(domains.workspaceId, workspace.id),
        isNull(domains.deletedAt)
      )
    )
    .limit(1);
  if (!domain) return null;

  const [record] = await db
    .select()
    .from(domainRecords)
    .where(
      and(
        eq(domainRecords.id, recordId),
        eq(domainRecords.domainId, domainId),
        eq(domainRecords.workspaceId, workspace.id),
        isNull(domainRecords.deletedAt)
      )
    )
    .limit(1);
  if (!record) return null;

  return { workspaceId: workspace.id, record };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: domainId, recordId } = await params;
  const ctx = await resolveRecord(session.user.id, domainId, recordId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const incoming = (body.fields ?? {}) as Record<string, unknown>;

  // Fetch fields to coerce types
  const fields = await db
    .select()
    .from(domainFields)
    .where(eq(domainFields.domainId, domainId));

  const fieldBySlug = new Map(fields.map((f) => [f.slug, f]));
  const merged = { ...(ctx.record.fields as Record<string, unknown>) };

  for (const [slug, raw] of Object.entries(incoming)) {
    const field = fieldBySlug.get(slug);
    if (!field) continue;
    if (raw === null || raw === "") {
      merged[slug] = null;
      continue;
    }
    switch (field.type) {
      case "number": {
        const n = Number(raw);
        if (!isNaN(n)) merged[slug] = n;
        break;
      }
      default:
        merged[slug] = raw;
    }
  }

  const before = ctx.record.fields as Record<string, unknown>;

  const [updated] = await db
    .update(domainRecords)
    .set({ fields: merged, updatedByUserId: session.user.id })
    .where(eq(domainRecords.id, recordId))
    .returning();

  await logDomainWrite({
    workspaceId: ctx.workspaceId,
    userId: session.user.id,
    action: "update",
    targetId: recordId,
    before,
    after: merged,
  });

  return NextResponse.json({ record: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: domainId, recordId } = await params;
  const ctx = await resolveRecord(session.user.id, domainId, recordId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(domainRecords)
    .set({ deletedAt: sql`now()` })
    .where(eq(domainRecords.id, recordId));

  await logDomainWrite({
    workspaceId: ctx.workspaceId,
    userId: session.user.id,
    action: "delete",
    targetId: recordId,
    before: ctx.record.fields as Record<string, unknown>,
  });

  return new NextResponse(null, { status: 204 });
}
