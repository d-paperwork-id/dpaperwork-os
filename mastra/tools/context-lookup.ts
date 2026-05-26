import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { contextMd, toolCallLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const contextLookupTool = createTool({
  id: "context.lookup",
  description:
    'Read a named section from the workspace CONTEXT.md. Use this to understand how the company operates, its ICP, how it sells, or any other section defined in CONTEXT.md.',
  inputSchema: z.object({
    section: z
      .string()
      .describe(
        'Section heading to extract, e.g. "How we sell" or "What we do"'
      ),
  }),
  execute: async ({ section }, context) => {
    const workspaceId = context.requestContext?.get("workspace_id") as string;
    const runId =
      (context.requestContext?.get("run_id") as string) ?? "run_unknown";
    const agentId =
      (context.requestContext?.get("agent_id") as string) ?? "chief-of-staff";
    const userId =
      (context.requestContext?.get("user_id") as string) ?? "";
    const startedAt = new Date();

    const row = await db
      .select({ content: contextMd.content })
      .from(contextMd)
      .where(eq(contextMd.workspaceId, workspaceId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const content = row?.content ? extractSection(row.content, section) : "";

    await db.insert(toolCallLog).values({
      id: `tcl_${nanoid(16)}`,
      workspaceId,
      userId,
      agentId,
      runId,
      tool: "context.lookup",
      args: { section },
      result: { found: content.length > 0 },
      startedAt,
      durationMs: Date.now() - startedAt.getTime(),
    });

    return { content };
  },
});

function extractSection(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const pattern = new RegExp(
    `^##\\s+${escapeRegex(heading)}\\s*$`,
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
