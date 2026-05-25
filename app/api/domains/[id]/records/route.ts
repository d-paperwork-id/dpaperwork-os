import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { domains, domainFields, domainRecords } from "@/db/schema";
import { eq, and, isNull, count, asc, SQL, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getWorkspaceForUser } from "@/lib/workspace";
import { logDomainWrite } from "@/lib/audit";

type FilterCondition = { field: string; value: string };

function buildFieldValue(
  type: string,
  raw: unknown
): { ok: true; value: unknown } | { ok: false; error: string } {
  switch (type) {
    case "text":
    case "long_text":
    case "single_select":
      if (typeof raw !== "string") return { ok: false, error: "Expected string" };
      return { ok: true, value: raw };
    case "number": {
      const n = Number(raw);
      if (isNaN(n)) return { ok: false, error: "Expected number" };
      return { ok: true, value: n };
    }
    case "date":
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw))
        return { ok: false, error: "Expected ISO date string (YYYY-MM-DD)" };
      return { ok: true, value: raw };
    default:
      return { ok: true, value: raw };
  }
}

async function resolveWorkspaceAndDomain(userId: string, domainId: string) {
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
  return { workspaceId: workspace.id };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: domainId } = await params;
  const ctx = await resolveWorkspaceAndDomain(session.user.id, domainId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = parseInt(searchParams.get("pageSize") ?? "50", 10);
  const filtersRaw = searchParams.get("filters");

  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const pageSize = isNaN(pageSizeRaw) || pageSizeRaw < 1 ? 50 : pageSizeRaw;

  if (pageSize > 200) {
    return NextResponse.json({ error: "pageSize must be 200 or less" }, { status: 400 });
  }

  let filters: FilterCondition[] = [];
  if (filtersRaw) {
    try {
      const parsed = JSON.parse(filtersRaw);
      if (!Array.isArray(parsed)) throw new Error();
      filters = parsed as FilterCondition[];
    } catch {
      return NextResponse.json({ error: "Invalid filters format" }, { status: 400 });
    }
  }

  // Fetch fields to validate filter slugs and types
  const fields = await db
    .select()
    .from(domainFields)
    .where(eq(domainFields.domainId, domainId))
    .orderBy(asc(domainFields.position));

  const fieldBySlug = new Map(fields.map((f) => [f.slug, f]));

  // Build filter conditions
  const filterClauses: SQL[] = [
    eq(domainRecords.domainId, domainId),
    isNull(domainRecords.deletedAt),
  ];

  for (const cond of filters) {
    const field = fieldBySlug.get(cond.field);
    if (!field) continue; // skip unknown field slugs silently

    if (field.type === "text" || field.type === "long_text") {
      filterClauses.push(
        sql`(${domainRecords.fields} ->> ${cond.field}) ILIKE ${"%" + cond.value + "%"}`
      );
    } else {
      filterClauses.push(
        sql`(${domainRecords.fields} ->> ${cond.field}) = ${cond.value}`
      );
    }
  }

  const whereClause = and(...filterClauses)!;

  const [{ total }] = await db
    .select({ total: count() })
    .from(domainRecords)
    .where(whereClause);

  const records = await db
    .select()
    .from(domainRecords)
    .where(whereClause)
    .orderBy(asc(domainRecords.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return NextResponse.json({ fields, records, total, page, pageSize });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: domainId } = await params;
  const ctx = await resolveWorkspaceAndDomain(session.user.id, domainId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const rawFields = (body.fields ?? {}) as Record<string, unknown>;

  const fields = await db
    .select()
    .from(domainFields)
    .where(eq(domainFields.domainId, domainId));

  const coerced: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const raw = rawFields[field.slug];
    if (raw === undefined || raw === null || raw === "") {
      if (field.isRequired) {
        errors[field.slug] = `${field.name} is required`;
      }
      continue;
    }
    const result = buildFieldValue(field.type, raw);
    if (!result.ok) {
      errors[field.slug] = result.error;
    } else {
      coerced[field.slug] = result.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const recordId = `rec_${nanoid(16)}`;
  const [record] = await db
    .insert(domainRecords)
    .values({
      id: recordId,
      domainId,
      workspaceId: ctx.workspaceId,
      fields: coerced,
      createdByUserId: session.user.id,
    })
    .returning();

  await logDomainWrite({
    workspaceId: ctx.workspaceId,
    userId: session.user.id,
    action: "insert",
    targetId: recordId,
    after: coerced,
  });

  return NextResponse.json({ record }, { status: 201 });
}
