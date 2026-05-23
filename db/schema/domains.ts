import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { workspaces } from "./workspace";

type SelectChoice = { value: string; label: string; color?: string };

type DomainFieldOptions =
  | { choices: SelectChoice[] }                                   // single_select, multi_select
  | { target_domain_id: string }                                  // domain_ref
  | { expression: string; return_type: "text" | "number" | "boolean" } // formula
  | { precision?: number; format?: "plain" | "currency" | "percent" }  // number
  | { max_size_mb?: number; allowed_types?: string[] };           // file

export const domains = pgTable(
  "domains",
  {
    id: text("id").primaryKey(), // dom_...
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    icon: text("icon"),
    createdByUserId: text("created_by_user_id").references(() => user.id),
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
    uniqueIndex("domains_workspace_slug_unique")
      .on(table.workspaceId, table.slug)
      .where(sql`deleted_at IS NULL`),
    index("domains_workspace_idx").on(table.workspaceId),
  ]
);

export const domainFields = pgTable(
  "domain_fields",
  {
    id: text("id").primaryKey(),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: text("type", {
      enum: [
        "text",
        "long_text",
        "number",
        "date",
        "datetime",
        "single_select",
        "multi_select",
        "person_ref",
        "domain_ref",
        "file",
        "formula",
        "boolean",
      ],
    }).notNull(),
    options: jsonb("options").$type<DomainFieldOptions>(),
    position: integer("position").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(false),
    defaultValue: jsonb("default_value"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("domain_fields_domain_slug_unique").on(
      table.domainId,
      table.slug
    ),
    index("domain_fields_domain_idx").on(table.domainId),
  ]
);

export const domainRecords = pgTable(
  "domain_records",
  {
    id: text("id").primaryKey(), // rec_...
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    fields: jsonb("fields")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdByAgentId: text("created_by_agent_id"),
    updatedByUserId: text("updated_by_user_id").references(() => user.id),
    updatedByAgentId: text("updated_by_agent_id"),
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
    index("domain_records_domain_idx")
      .on(table.domainId)
      .where(sql`deleted_at IS NULL`),
    index("domain_records_workspace_domain_created_idx").on(
      table.workspaceId,
      table.domainId,
      table.createdAt
    ),
    index("domain_records_fields_gin").using("gin", table.fields),
  ]
);
