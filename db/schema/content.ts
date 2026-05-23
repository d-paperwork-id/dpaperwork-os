import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspace";

const AGENT_ENUM = ["pm", "chief-of-staff", "executive-assistant"] as const;
type AgentId = (typeof AGENT_ENUM)[number];

export const contextMd = pgTable("context_md", {
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id)
    .primaryKey(),
  content: text("content").notNull().default(""),
  currentVersionId: text("current_version_id").notNull().default(""),
  updatedByUserId: text("updated_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const contextMdVersions = pgTable(
  "context_md_versions",
  {
    id: text("id").primaryKey(), // ver_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    content: text("content").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("context_md_versions_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt
    ),
  ]
);

export const roleMd = pgTable(
  "role_md",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    agentId: text("agent_id", { enum: AGENT_ENUM }).notNull(),
    content: text("content").notNull(),
    currentVersionId: text("current_version_id").notNull().default(""),
    updatedByUserId: text("updated_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.agentId] }),
  ]
);

export const roleMdVersions = pgTable(
  "role_md_versions",
  {
    id: text("id").primaryKey(), // ver_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    agentId: text("agent_id", { enum: AGENT_ENUM }).notNull(),
    content: text("content").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("role_md_versions_workspace_agent_created_idx").on(
      table.workspaceId,
      table.agentId,
      table.createdAt
    ),
  ]
);
