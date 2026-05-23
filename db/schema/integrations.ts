import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { workspaces } from "./workspace";

export const integrationConnections = pgTable(
  "integration_connections",
  {
    id: text("id").primaryKey(), // icn_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),

    scope: text("scope", { enum: ["user", "workspace"] })
      .notNull()
      .default("user"),
    userId: text("user_id").references(() => user.id), // nullable when scope='workspace'

    provider: text("provider").notNull(),
    composioEntityId: text("composio_entity_id").notNull(),
    composioConnectionId: text("composio_connection_id").notNull(),
    composioMcpUrl: text("composio_mcp_url").notNull(),

    status: text("status", {
      enum: ["active", "revoked", "expired", "error"],
    })
      .notNull()
      .default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
    lastErrorMessage: text("last_error_message"),

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
    uniqueIndex("integration_connections_per_user_unique")
      .on(table.workspaceId, table.userId, table.provider)
      .where(sql`scope = 'user' AND deleted_at IS NULL`),
    uniqueIndex("integration_connections_per_workspace_unique")
      .on(table.workspaceId, table.provider)
      .where(sql`scope = 'workspace' AND deleted_at IS NULL`),
    index("integration_connections_workspace_user_idx").on(
      table.workspaceId,
      table.userId
    ),
  ]
);
