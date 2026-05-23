import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspace";

const AGENT_ENUM = ["pm", "chief-of-staff", "executive-assistant"] as const;

export const workspaceAgentConfig = pgTable(
  "workspace_agent_config",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    agentId: text("agent_id", { enum: AGENT_ENUM }).notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    allowedTools: jsonb("allowed_tools").$type<string[]>().notNull().default([]),
    allowedIntegrations: jsonb("allowed_integrations")
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.agentId] })]
);

export const userAgentAssignments = pgTable(
  "user_agent_assignments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    agentId: text("agent_id", { enum: AGENT_ENUM }).notNull(),
    assignedByUserId: text("assigned_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_agent_assignments_uniq").on(
      table.workspaceId,
      table.userId,
      table.agentId
    ),
    index("user_agent_assignments_workspace_user_idx").on(
      table.workspaceId,
      table.userId
    ),
  ]
);
