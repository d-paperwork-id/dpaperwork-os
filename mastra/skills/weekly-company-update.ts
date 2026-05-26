import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { db } from "@/db/drizzle";
import {
  domains,
  domainRecords,
  contextMd,
  inboxItems,
  toolCallLog,
  agentWritesLog,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { format } from "date-fns";

export const weeklyCompanyUpdateTool = createTool({
  id: "weekly_company_update",
  description:
    "Generate a weekly company update report from Projects and Deals domain data, then deliver it to the user inbox. Use when asked for a weekly summary, Monday update, or weekly company update.",
  inputSchema: z.object({
    recipient_user_id: z
      .string()
      .describe("ID of the user who will receive the weekly update"),
    week_ending: z
      .string()
      .optional()
      .describe("ISO date string for the last day of the week. Defaults to today."),
  }),
  execute: async ({ recipient_user_id, week_ending }, context) => {
    const workspaceId = context.requestContext?.get("workspace_id") as string;
    const runId =
      (context.requestContext?.get("run_id") as string) ?? "run_unknown";
    const agentId =
      (context.requestContext?.get("agent_id") as string) ?? "chief-of-staff";
    const userId =
      (context.requestContext?.get("user_id") as string) ?? "";
    const routineId = context.requestContext?.get("routine_id") as
      | string
      | undefined;
    const startedAt = new Date();

    const [projectRecords, dealRecords] = await Promise.all([
      readDomainRecords(workspaceId, "projects", 50),
      readDomainRecords(workspaceId, "deals", 50),
    ]);

    const howWeSell = await readContextSection(workspaceId, "How we sell");

    const weekEndingDate = week_ending ? new Date(week_ending) : new Date();
    const weekLabel = format(weekEndingDate, "dd MMM yyyy");

    const { text: reportBody } = await generateText({
      model: gateway("openai/gpt-4o"),
      prompt: buildReportPrompt({ projectRecords, dealRecords, howWeSell, weekLabel }),
    });

    const inboxItemId = `inb_${nanoid(16)}`;
    const title = `Weekly Update — ${weekLabel}`;

    await db.insert(inboxItems).values({
      id: inboxItemId,
      workspaceId,
      recipientUserId: recipient_user_id,
      sourceAgentId: "chief-of-staff",
      sourceRoutineId: routineId ?? null,
      sourceRunId: runId,
      title,
      body: reportBody,
      priority: "normal",
      actionChips: [],
    });

    const durationMs = Date.now() - startedAt.getTime();

    await db.insert(toolCallLog).values({
      id: `tcl_${nanoid(16)}`,
      workspaceId,
      userId,
      agentId,
      runId,
      tool: "weekly_company_update",
      args: { recipient_user_id, week_ending },
      result: { inbox_item_id: inboxItemId },
      startedAt,
      durationMs,
    });

    await db.insert(agentWritesLog).values({
      id: `awl_${nanoid(16)}`,
      workspaceId,
      agentId,
      runId,
      targetType: "inbox_item",
      targetId: inboxItemId,
      action: "insert",
      after: { title, recipient_user_id },
    });

    return { inbox_item_id: inboxItemId };
  },
});

async function readDomainRecords(
  workspaceId: string,
  slug: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const domain = await db
    .select({ id: domains.id })
    .from(domains)
    .where(
      and(
        eq(domains.workspaceId, workspaceId),
        eq(domains.slug, slug),
        isNull(domains.deletedAt)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!domain) return [];

  const rows = await db
    .select({ fields: domainRecords.fields })
    .from(domainRecords)
    .where(
      and(
        eq(domainRecords.domainId, domain.id),
        eq(domainRecords.workspaceId, workspaceId),
        isNull(domainRecords.deletedAt)
      )
    )
    .limit(limit);

  return rows.map((r) => r.fields);
}

async function readContextSection(
  workspaceId: string,
  heading: string
): Promise<string> {
  const row = await db
    .select({ content: contextMd.content })
    .from(contextMd)
    .where(eq(contextMd.workspaceId, workspaceId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row?.content) return "";

  const lines = row.content.split("\n");
  const pattern = new RegExp(
    `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
    "i"
  );
  let inSection = false;
  const sectionLines: string[] = [];

  for (const line of lines) {
    if (pattern.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^##\s/.test(line)) break;
      sectionLines.push(line);
    }
  }

  return sectionLines.join("\n").trim();
}

function buildReportPrompt(data: {
  projectRecords: Record<string, unknown>[];
  dealRecords: Record<string, unknown>[];
  howWeSell: string;
  weekLabel: string;
}): string {
  const sections: string[] = [
    `You are the Chief of Staff. Write a weekly company update for the week ending ${data.weekLabel}.`,
  ];

  if (data.howWeSell) {
    sections.push(`## How we sell\n${data.howWeSell}`);
  }

  sections.push(
    `## Projects (${data.projectRecords.length} records)\n${
      data.projectRecords.length > 0
        ? JSON.stringify(data.projectRecords, null, 2)
        : "No projects found."
    }`
  );

  sections.push(
    `## Deals (${data.dealRecords.length} records)\n${
      data.dealRecords.length > 0
        ? JSON.stringify(data.dealRecords, null, 2)
        : "No deals found."
    }`
  );

  sections.push(`## Output format
Write a markdown report between 200 and 500 words with these exact sections:
- One-sentence headline at the very top
- ## Projects
- ## Sales
- ## Notable Decisions
- ## Risks
- ## What's next

Rules:
- Only reference data present above. Do not invent progress or metrics.
- If a section has no relevant data, say so in one honest sentence — do not pad.
- If fewer than 3 records exist across both domains, acknowledge the limited data.
- Match the tone from "How we sell" if provided.`);

  return sections.join("\n\n");
}
