import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const usageDaily = pgTable(
  "usage_daily",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    day: date("day").notNull(), // YYYY-MM-DD in workspace-local timezone
    tokensUsed: integer("tokens_used").notNull().default(0),
    llmCalls: integer("llm_calls").notNull().default(0),
    toolCalls: integer("tool_calls").notNull().default(0),
    runs: integer("runs").notNull().default(0),
    inferenceCostInrPaise: integer("inference_cost_inr_paise")
      .notNull()
      .default(0), // ₹1 = 100 paise
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("usage_daily_workspace_day_unique").on(
      table.workspaceId,
      table.day
    ),
  ]
);
