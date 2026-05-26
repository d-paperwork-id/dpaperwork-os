import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { domains, domainRecords, toolCallLog } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

export const domainReadTool = createTool({
  id: "domain.read",
  description:
    "Read records from a domain in the current workspace. Use this to access structured business data like deals, projects, tasks, customers, etc.",
  inputSchema: z.object({
    domain: z
      .string()
      .describe('Domain slug to read from, e.g. "deals" or "projects"'),
    filter: z.record(z.string(), z.unknown()).optional().describe("Optional field filters"),
    limit: z.number().int().min(1).max(200).default(50),
  }),
  execute: async ({ domain, filter, limit }, context) => {
    const workspaceId = context.requestContext?.get("workspace_id") as string;
    const runId =
      (context.requestContext?.get("run_id") as string) ?? "run_unknown";
    const agentId =
      (context.requestContext?.get("agent_id") as string) ?? "chief-of-staff";
    const userId =
      (context.requestContext?.get("user_id") as string) ?? "";
    const startedAt = new Date();

    const domainRow = await db
      .select({ id: domains.id })
      .from(domains)
      .where(
        and(
          eq(domains.workspaceId, workspaceId),
          eq(domains.slug, domain),
          isNull(domains.deletedAt)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    let records: Record<string, unknown>[] = [];

    if (domainRow) {
      const rows = await db
        .select({ fields: domainRecords.fields })
        .from(domainRecords)
        .where(
          and(
            eq(domainRecords.domainId, domainRow.id),
            eq(domainRecords.workspaceId, workspaceId),
            isNull(domainRecords.deletedAt)
          )
        )
        .limit(limit ?? 50);

      records = rows.map((r) => r.fields);
    }

    await db.insert(toolCallLog).values({
      id: `tcl_${nanoid(16)}`,
      workspaceId,
      userId,
      agentId,
      runId,
      tool: "domain.read",
      args: { domain, filter, limit },
      result: { count: records.length },
      startedAt,
      durationMs: Date.now() - startedAt.getTime(),
    });

    return { records };
  },
});
