import {
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

type PlanStep = {
  id: string;
  description: string;
  tool?: string;
  depends_on?: string[];
};

type StepResult = {
  status: "pending" | "running" | "done" | "failed";
  output?: unknown;
  error?: string;
};

type ExecutionError = {
  step_id?: string;
  message: string;
  code?: string;
};

export const runs = pgTable(
  "runs",
  {
    id: text("id").primaryKey(), // run_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),

    threadId: text("thread_id"),   // null for routines
    routineId: text("routine_id"), // null for chat

    request: text("request").notNull(),
    plan: jsonb("plan").$type<PlanStep[]>().notNull().default([]),
    stepResults: jsonb("step_results")
      .$type<Record<string, StepResult>>()
      .notNull()
      .default({}),
    variables: jsonb("variables")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    errors: jsonb("errors").$type<ExecutionError[]>().notNull().default([]),

    status: text("status", {
      enum: ["planning", "executing", "synthesizing", "complete", "failed"],
    }).notNull(),

    tokensUsed: integer("tokens_used").notNull().default(0),
    llmCalls: integer("llm_calls").notNull().default(0),
    toolCalls: integer("tool_calls").notNull().default(0),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("runs_workspace_started_idx").on(table.workspaceId, table.startedAt),
    index("runs_thread_idx")
      .on(table.threadId)
      .where(sql`thread_id IS NOT NULL`),
    index("runs_routine_idx")
      .on(table.routineId)
      .where(sql`routine_id IS NOT NULL`),
    index("runs_status_idx")
      .on(table.status)
      .where(sql`status NOT IN ('complete', 'failed')`),
  ]
);
