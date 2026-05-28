import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { inboxItems, toolCallLog, agentWritesLog } from "@/db/schema";
import { nanoid } from "nanoid";

const ACTION_CHIP_ACTIONS = [
  "open_thread",
  "resolve",
  "snooze",
  "open_record",
  "open_routine",
] as const;

export const inboxCreateTool = createTool({
  id: "inbox.create",
  description:
    "Create an inbox item to deliver a report or notification to a user. Use this as the final step when producing output that a user should read.",
  inputSchema: z.object({
    title: z.string().describe("Short title for the inbox item"),
    body: z.string().describe("Full markdown content of the inbox item"),
    recipient_user_id: z.string().optional().describe("ID of the user to receive this item. Defaults to the user who triggered this run."),
    priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
    action_chips: z
      .array(
        z.object({
          label: z.string(),
          action: z.enum(ACTION_CHIP_ACTIONS),
          target_id: z.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
  execute: async (
    { title, body, recipient_user_id, priority, action_chips },
    context
  ) => {
    const workspaceId = context.requestContext?.get("workspace_id") as string;
    const runId =
      (context.requestContext?.get("run_id") as string) ?? "run_unknown";
    const agentId =
      (context.requestContext?.get("agent_id") as string) ?? "chief-of-staff";
    const userId =
      (context.requestContext?.get("user_id") as string) ?? "";
    const resolvedRecipient = recipient_user_id || userId;
    const routineId = context.requestContext?.get("routine_id") as
      | string
      | undefined;
    const startedAt = new Date();

    const inboxItemId = `inb_${nanoid(16)}`;

    await db.insert(inboxItems).values({
      id: inboxItemId,
      workspaceId,
      recipientUserId: resolvedRecipient,
      sourceAgentId: agentId as "pm" | "chief-of-staff" | "executive-assistant",
      sourceRoutineId: routineId ?? null,
      sourceRunId: runId,
      title,
      body,
      priority: priority ?? "normal",
      actionChips: action_chips ?? [],
    });

    const durationMs = Date.now() - startedAt.getTime();

    await db.insert(toolCallLog).values({
      id: `tcl_${nanoid(16)}`,
      workspaceId,
      userId,
      agentId,
      runId,
      tool: "inbox.create",
      args: { title, recipient_user_id, priority },
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
      after: { title, body: body.slice(0, 200), recipient_user_id },
    });

    return { inbox_item_id: inboxItemId };
  },
});
