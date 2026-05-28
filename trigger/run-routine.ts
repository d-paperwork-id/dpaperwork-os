import { schedules, logger } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { routines, routineRuns, runs } from "@/db/schema";
import { chiefOfStaffAgent } from "@/mastra/agents/chief-of-staff";
import { RequestContext } from "@mastra/core/request-context";

export const runRoutineTask = schedules.task({
  id: "run-routine",
  retry: { maxAttempts: 1 },
  run: async (payload) => {
    const routineId = payload.externalId;
    if (!routineId) {
      logger.error("run-routine: missing externalId on schedule payload");
      return;
    }

    const [routine] = await db
      .select({
        id: routines.id,
        workspaceId: routines.workspaceId,
        creatorUserId: routines.creatorUserId,
        agentId: routines.agentId,
        instruction: routines.instruction,
        isPaused: routines.isPaused,
      })
      .from(routines)
      .where(and(eq(routines.id, routineId), isNull(routines.deletedAt)))
      .limit(1);

    if (!routine) {
      logger.warn("run-routine: routine not found", { routineId });
      return;
    }

    if (routine.isPaused) {
      logger.info("run-routine: routine is paused, inserting skipped run", { routineId });
      await db.insert(routineRuns).values({
        id: `rrn_${nanoid(16)}`,
        routineId,
        workspaceId: routine.workspaceId,
        runId: `run_${nanoid(16)}`,
        status: "skipped",
      });
      return;
    }

    const runId = `run_${nanoid(16)}`;
    const routineRunId = `rrn_${nanoid(16)}`;

    await db.insert(runs).values({
      id: runId,
      workspaceId: routine.workspaceId,
      userId: routine.creatorUserId,
      routineId,
      request: routine.instruction,
      status: "executing",
    });

    await db.insert(routineRuns).values({
      id: routineRunId,
      routineId,
      workspaceId: routine.workspaceId,
      runId,
      status: "running",
    });

    const requestContext = new RequestContext([
      ["workspace_id", routine.workspaceId],
      ["user_id", routine.creatorUserId],
      ["agent_id", "chief-of-staff"],
      ["run_id", runId],
      ["routine_id", routineId],
    ]);

    try {
      const result = await chiefOfStaffAgent.generate(routine.instruction, {
        requestContext,
      });

      const outputText = typeof result.text === "string" ? result.text : JSON.stringify(result);
      const outputSummary = outputText.slice(0, 500);
      const tokensUsed = (result.usage?.totalTokens as number | undefined) ?? 0;

      await db
        .update(routineRuns)
        .set({ status: "succeeded", completedAt: new Date(), outputSummary, tokensUsed })
        .where(eq(routineRuns.id, routineRunId));

      await db
        .update(runs)
        .set({ status: "complete", completedAt: new Date(), tokensUsed })
        .where(eq(runs.id, runId));
    } catch (err) {
      const errorSummary = err instanceof Error ? err.message : String(err);
      logger.error("run-routine: agent failed", { routineId, error: errorSummary });

      await db
        .update(routineRuns)
        .set({ status: "failed", completedAt: new Date(), errorSummary })
        .where(eq(routineRuns.id, routineRunId));

      await db
        .update(runs)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(runs.id, runId));
    }
  },
});
