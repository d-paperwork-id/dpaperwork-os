import { db } from "@/db/drizzle";
import { agentWritesLog } from "@/db/schema";
import { nanoid } from "nanoid";

export async function logDomainWrite({
  workspaceId,
  userId,
  action,
  targetId,
  before,
  after,
}: {
  workspaceId: string;
  userId: string;
  action: "insert" | "update" | "delete";
  targetId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  await db.insert(agentWritesLog).values({
    id: `awl_${nanoid(16)}`,
    workspaceId,
    agentId: "user",
    runId: `user:${userId}`,
    targetType: "domain_record",
    targetId,
    action,
    before: before ?? undefined,
    after: after ?? undefined,
  });
}
