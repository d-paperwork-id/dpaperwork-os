import { Agent } from "@mastra/core/agent";
import { gateway } from "@ai-sdk/gateway";
import { db } from "@/db/drizzle";
import { contextMd, roleMd } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { domainReadTool } from "../tools/domain-read";
import { contextLookupTool } from "../tools/context-lookup";
import { inboxCreateTool } from "../tools/inbox-create";
import { weeklyCompanyUpdateTool } from "../skills/weekly-company-update";

const PLATFORM_SYSTEM_PROMPT = `You are the Chief of Staff for this company. You help with strategic operations, weekly summaries, and business intelligence.

Available tools:
- domain.read: Read records from any domain (deals, projects, customers, etc.)
- context.lookup: Read a section of the company's CONTEXT.md
- inbox.create: Deliver output to a user's inbox
- weekly_company_update: Generate and deliver a full weekly company update report

When asked to run a weekly update, use the weekly_company_update tool directly.
When the task requires reading specific domain data or context sections step by step, use the individual tools.
Always deliver output via inbox.create or weekly_company_update — do not return long reports as plain text.`;

export const chiefOfStaffAgent = new Agent({
  id: "chief-of-staff",
  name: "Chief of Staff",
  model: gateway("openai/gpt-4o"),
  instructions: async ({ requestContext }) => {
    const workspaceId = requestContext.get("workspace_id") as string;

    const [contextRow, roleRow] = await Promise.all([
      db
        .select({ content: contextMd.content })
        .from(contextMd)
        .where(eq(contextMd.workspaceId, workspaceId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      db
        .select({ content: roleMd.content })
        .from(roleMd)
        .where(
          and(
            eq(roleMd.workspaceId, workspaceId),
            eq(roleMd.agentId, "chief-of-staff")
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null),
    ]);

    return [
      PLATFORM_SYSTEM_PROMPT,
      contextRow?.content ? `# Company context\n${contextRow.content}` : "",
      roleRow?.content ? `# Your role here\n${roleRow.content}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  },
  tools: {
    "domain.read": domainReadTool,
    "context.lookup": contextLookupTool,
    "inbox.create": inboxCreateTool,
    weekly_company_update: weeklyCompanyUpdateTool,
  },
});
