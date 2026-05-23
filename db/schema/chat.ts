import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { workspaces } from "./workspace";
import { routines } from "./routines";

type InboxActionChip = {
  label: string;
  action:
    | "open_thread"
    | "resolve"
    | "snooze"
    | "open_record"
    | "open_routine";
  target_id?: string;
};

export const threads = pgTable(
  "threads",
  {
    id: text("id").primaryKey(), // thr_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id),
    agentId: text("agent_id", {
      enum: ["pm", "chief-of-staff", "executive-assistant"],
    }).notNull(),
    title: text("title").notNull().default("New thread"),
    isShared: boolean("is_shared").notNull().default(false),
    mastraThreadId: text("mastra_thread_id").notNull().unique(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
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
    index("threads_workspace_owner_idx").on(
      table.workspaceId,
      table.ownerUserId
    ),
    index("threads_workspace_last_message_idx")
      .on(table.workspaceId, table.lastMessageAt)
      .where(sql`deleted_at IS NULL`),
  ]
);

export const inboxItems = pgTable(
  "inbox_items",
  {
    id: text("id").primaryKey(), // inb_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    recipientUserId: text("recipient_user_id")
      .notNull()
      .references(() => user.id),
    sourceAgentId: text("source_agent_id", {
      enum: ["pm", "chief-of-staff", "executive-assistant"],
    }).notNull(),
    sourceRoutineId: text("source_routine_id").references(() => routines.id),
    sourceRunId: text("source_run_id"),

    title: text("title").notNull(),
    body: text("body").notNull(),
    priority: text("priority", { enum: ["low", "normal", "high"] })
      .notNull()
      .default("normal"),
    actionChips: jsonb("action_chips")
      .$type<InboxActionChip[]>()
      .notNull()
      .default([]),

    readAt: timestamp("read_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),

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
    index("inbox_workspace_recipient_unresolved_idx")
      .on(table.workspaceId, table.recipientUserId, table.createdAt)
      .where(sql`deleted_at IS NULL AND resolved_at IS NULL`),
    index("inbox_routine_idx")
      .on(table.sourceRoutineId)
      .where(sql`source_routine_id IS NOT NULL`),
  ]
);
