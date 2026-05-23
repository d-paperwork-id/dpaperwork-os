import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { workspaces } from "./workspace";

type RoutineOutputDestination =
  | { kind: "inbox" }
  | { kind: "domain_write"; domain_id: string }
  | { kind: "integration_action"; provider: string; action: string }
  | { kind: "project_task"; project_id: string };

export const routines = pgTable(
  "routines",
  {
    id: text("id").primaryKey(), // rtn_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    creatorUserId: text("creator_user_id")
      .notNull()
      .references(() => user.id),
    name: text("name").notNull(),
    description: text("description"),
    agentId: text("agent_id", {
      enum: ["pm", "chief-of-staff", "executive-assistant"],
    }).notNull(),
    instruction: text("instruction").notNull(),

    scheduleCronLocal: text("schedule_cron_local").notNull(),
    scheduleCronUtc: text("schedule_cron_utc").notNull(),
    scheduleTimezone: text("schedule_timezone").notNull(),

    outputDestination: jsonb("output_destination")
      .$type<RoutineOutputDestination>()
      .notNull(),

    isPaused: boolean("is_paused").notNull().default(false),
    pauseReason: text("pause_reason"),

    triggerDevTaskId: text("trigger_dev_task_id"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("routines_workspace_creator_idx").on(
      table.workspaceId,
      table.creatorUserId
    ),
    index("routines_workspace_active_idx")
      .on(table.workspaceId, table.isPaused)
      .where(sql`deleted_at IS NULL`),
  ]
);

export const routineRuns = pgTable(
  "routine_runs",
  {
    id: text("id").primaryKey(), // rrn_...
    routineId: text("routine_id")
      .notNull()
      .references(() => routines.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    runId: text("run_id").notNull(), // run_... (FK to runs.id, no DB-level FK to avoid circular dep)
    status: text("status", {
      enum: ["running", "succeeded", "failed", "paused", "skipped"],
    }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorSummary: text("error_summary"),
    outputSummary: text("output_summary"),
    tokensUsed: integer("tokens_used"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("routine_runs_routine_started_idx").on(
      table.routineId,
      table.startedAt
    ),
    index("routine_runs_workspace_started_idx").on(
      table.workspaceId,
      table.startedAt
    ),
  ]
);
