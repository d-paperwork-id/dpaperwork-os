import { schedules } from "@trigger.dev/sdk/v3";

export async function registerSchedule(
  routineId: string,
  scheduleCronUtc: string
): Promise<string> {
  const schedule = await schedules.create({
    task: "run-routine",
    cron: scheduleCronUtc,
    externalId: routineId,
    deduplicationKey: routineId,
  });
  return schedule.id;
}

export async function deactivateSchedule(triggerDevTaskId: string): Promise<void> {
  await schedules.deactivate(triggerDevTaskId);
}

export async function activateSchedule(triggerDevTaskId: string): Promise<void> {
  await schedules.activate(triggerDevTaskId);
}

export async function deleteSchedule(triggerDevTaskId: string): Promise<void> {
  await schedules.del(triggerDevTaskId);
}

export async function triggerRunNow(triggerDevScheduleId: string): Promise<void> {
  const schedule = await schedules.retrieve(triggerDevScheduleId);
  const { runRoutineTask } = await import("@/trigger/run-routine");
  await runRoutineTask.trigger({
    scheduleId: schedule.id,
    type: schedule.type,
    timestamp: new Date(),
    timezone: schedule.timezone,
    externalId: schedule.externalId ?? undefined,
    upcoming: schedule.nextRun ? [schedule.nextRun] : [],
  });
}
