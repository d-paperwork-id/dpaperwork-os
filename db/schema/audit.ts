import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Audit tables are append-only. No FKs to workspace/user to keep them
// independently queryable even after soft-deletes on parent tables.

export const toolCallLog = pgTable(
  "tool_call_log",
  {
    id: text("id").primaryKey(), // tcl_...
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    agentId: text("agent_id").notNull(),
    runId: text("run_id").notNull(),
    stepId: text("step_id"),
    tool: text("tool").notNull(),
    args: jsonb("args")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    result: jsonb("result").$type<Record<string, unknown>>(),
    isError: boolean("is_error").notNull().default(false),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tool_call_log_workspace_started_idx").on(
      table.workspaceId,
      table.startedAt
    ),
    index("tool_call_log_run_idx").on(table.runId),
    index("tool_call_log_workspace_tool_idx").on(
      table.workspaceId,
      table.tool
    ),
  ]
);

export const agentWritesLog = pgTable(
  "agent_writes_log",
  {
    id: text("id").primaryKey(), // awl_...
    workspaceId: text("workspace_id").notNull(),
    agentId: text("agent_id").notNull(),
    runId: text("run_id").notNull(),

    targetType: text("target_type", {
      enum: ["domain_record", "inbox_item", "context_md", "role_md", "memory"],
    }).notNull(),
    targetId: text("target_id").notNull(),
    action: text("action", { enum: ["insert", "update", "delete"] }).notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_writes_log_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("agent_writes_log_target_idx").on(table.targetType, table.targetId),
    index("agent_writes_log_run_idx").on(table.runId),
  ]
);

export const integrationActionLog = pgTable(
  "integration_action_log",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    agentId: text("agent_id").notNull(),
    runId: text("run_id").notNull(),

    provider: text("provider").notNull(),
    action: text("action").notNull(),
    args: jsonb("args").$type<Record<string, unknown>>(),
    resultSummary: text("result_summary"),
    isError: boolean("is_error").notNull().default(false),
    errorMessage: text("error_message"),

    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("integration_action_log_workspace_started_idx").on(
      table.workspaceId,
      table.startedAt
    ),
    index("integration_action_log_provider_idx").on(
      table.workspaceId,
      table.provider
    ),
  ]
);
