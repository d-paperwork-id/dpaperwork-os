import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(), // ws_...
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    planTier: text("plan_tier", {
      enum: ["design_partner", "standard"],
    })
      .notNull()
      .default("design_partner"),
    dailyBudgetTokens: integer("daily_budget_tokens")
      .notNull()
      .default(200_000),

    workingHoursStart: text("working_hours_start"), // "09:00"
    workingHoursEnd: text("working_hours_end"), // "18:00"
    language: text("language").notNull().default("en"),
    brandingLogoS3Key: text("branding_logo_s3_key"),
    brandingPrimaryColor: text("branding_primary_color"),

    defaultAgentId: text("default_agent_id", {
      enum: ["pm", "chief-of-staff", "executive-assistant"],
    }),

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
    uniqueIndex("workspaces_slug_unique")
      .on(table.slug)
      .where(sql`deleted_at IS NULL`),
  ]
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(), // mem_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    role: text("role", { enum: ["admin", "member"] })
      .notNull()
      .default("member"),
    invitedByUserId: text("invited_by_user_id").references(() => user.id),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    uniqueIndex("workspace_members_workspace_user_unique")
      .on(table.workspaceId, table.userId)
      .where(sql`deleted_at IS NULL`),
    index("workspace_members_workspace_idx").on(table.workspaceId),
    index("workspace_members_user_idx").on(table.userId),
  ]
);
