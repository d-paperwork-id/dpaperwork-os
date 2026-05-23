-- Drop the old stub workspace table (replaced by workspaces + workspace_members)
DROP TABLE IF EXISTS "workspace" CASCADE;
--> statement-breakpoint

-- Extend the Better Auth user table with dpaperwork fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "timezone" text DEFAULT 'Asia/Kolkata' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "notifications_email_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint

CREATE TABLE "user_agent_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"assigned_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_agent_config" (
	"workspace_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"allowed_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_integrations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_agent_config_workspace_id_agent_id_pk" PRIMARY KEY("workspace_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_writes_log" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"run_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_action_log" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"run_id" text NOT NULL,
	"provider" text NOT NULL,
	"action" text NOT NULL,
	"args" jsonb,
	"result_summary" text,
	"is_error" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_call_log" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"run_id" text NOT NULL,
	"step_id" text,
	"tool" text NOT NULL,
	"args" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"is_error" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"started_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_items" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"source_agent_id" text NOT NULL,
	"source_routine_id" text,
	"source_run_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"action_chips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"title" text DEFAULT 'New thread' NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"mastra_thread_id" text NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "threads_mastra_thread_id_unique" UNIQUE("mastra_thread_id")
);
--> statement-breakpoint
CREATE TABLE "context_md" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"current_version_id" text DEFAULT '' NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_md_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_md" (
	"workspace_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"content" text NOT NULL,
	"current_version_id" text DEFAULT '' NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_md_workspace_id_agent_id_pk" PRIMARY KEY("workspace_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "role_md_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_records" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" text,
	"created_by_agent_id" text,
	"updated_by_user_id" text,
	"updated_by_agent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by_user_id" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"plan_tier" text DEFAULT 'design_partner' NOT NULL,
	"daily_budget_tokens" integer DEFAULT 200000 NOT NULL,
	"working_hours_start" text,
	"working_hours_end" text,
	"language" text DEFAULT 'en' NOT NULL,
	"branding_logo_s3_key" text,
	"branding_primary_color" text,
	"default_agent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"routine_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_summary" text,
	"output_summary" text,
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"creator_user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"agent_id" text NOT NULL,
	"instruction" text NOT NULL,
	"schedule_cron_local" text NOT NULL,
	"schedule_cron_utc" text NOT NULL,
	"schedule_timezone" text NOT NULL,
	"output_destination" jsonb NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"pause_reason" text,
	"trigger_dev_task_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"scope" text DEFAULT 'user' NOT NULL,
	"user_id" text,
	"provider" text NOT NULL,
	"composio_entity_id" text NOT NULL,
	"composio_connection_id" text NOT NULL,
	"composio_mcp_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text,
	"routine_id" text,
	"request" text NOT NULL,
	"plan" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"step_results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"variables" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"llm_calls" integer DEFAULT 0 NOT NULL,
	"tool_calls" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "usage_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"day" date NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"llm_calls" integer DEFAULT 0 NOT NULL,
	"tool_calls" integer DEFAULT 0 NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"inference_cost_inr_paise" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_agent_assignments" ADD CONSTRAINT "user_agent_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agent_assignments" ADD CONSTRAINT "user_agent_assignments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agent_assignments" ADD CONSTRAINT "user_agent_assignments_assigned_by_user_id_user_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_agent_config" ADD CONSTRAINT "workspace_agent_config_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_source_routine_id_routines_id_fk" FOREIGN KEY ("source_routine_id") REFERENCES "public"."routines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_md" ADD CONSTRAINT "context_md_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_md" ADD CONSTRAINT "context_md_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_md_versions" ADD CONSTRAINT "context_md_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_md_versions" ADD CONSTRAINT "context_md_versions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_md" ADD CONSTRAINT "role_md_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_md" ADD CONSTRAINT "role_md_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_md_versions" ADD CONSTRAINT "role_md_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_md_versions" ADD CONSTRAINT "role_md_versions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_fields" ADD CONSTRAINT "domain_fields_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_fields" ADD CONSTRAINT "domain_fields_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_records" ADD CONSTRAINT "domain_records_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_records" ADD CONSTRAINT "domain_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_records" ADD CONSTRAINT "domain_records_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_records" ADD CONSTRAINT "domain_records_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_runs" ADD CONSTRAINT "routine_runs_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_runs" ADD CONSTRAINT "routine_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_creator_user_id_user_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_agent_assignments_uniq" ON "user_agent_assignments" USING btree ("workspace_id","user_id","agent_id");--> statement-breakpoint
CREATE INDEX "user_agent_assignments_workspace_user_idx" ON "user_agent_assignments" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "agent_writes_log_workspace_created_idx" ON "agent_writes_log" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_writes_log_target_idx" ON "agent_writes_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "agent_writes_log_run_idx" ON "agent_writes_log" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "integration_action_log_workspace_started_idx" ON "integration_action_log" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "integration_action_log_provider_idx" ON "integration_action_log" USING btree ("workspace_id","provider");--> statement-breakpoint
CREATE INDEX "tool_call_log_workspace_started_idx" ON "tool_call_log" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "tool_call_log_run_idx" ON "tool_call_log" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "tool_call_log_workspace_tool_idx" ON "tool_call_log" USING btree ("workspace_id","tool");--> statement-breakpoint
CREATE INDEX "inbox_workspace_recipient_unresolved_idx" ON "inbox_items" USING btree ("workspace_id","recipient_user_id","created_at") WHERE deleted_at IS NULL AND resolved_at IS NULL;--> statement-breakpoint
CREATE INDEX "inbox_routine_idx" ON "inbox_items" USING btree ("source_routine_id") WHERE source_routine_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "threads_workspace_owner_idx" ON "threads" USING btree ("workspace_id","owner_user_id");--> statement-breakpoint
CREATE INDEX "threads_workspace_last_message_idx" ON "threads" USING btree ("workspace_id","last_message_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "context_md_versions_workspace_created_idx" ON "context_md_versions" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "role_md_versions_workspace_agent_created_idx" ON "role_md_versions" USING btree ("workspace_id","agent_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "domain_fields_domain_slug_unique" ON "domain_fields" USING btree ("domain_id","slug");--> statement-breakpoint
CREATE INDEX "domain_fields_domain_idx" ON "domain_fields" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "domain_records_domain_idx" ON "domain_records" USING btree ("domain_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "domain_records_workspace_domain_created_idx" ON "domain_records" USING btree ("workspace_id","domain_id","created_at");--> statement-breakpoint
CREATE INDEX "domain_records_fields_gin" ON "domain_records" USING gin ("fields");--> statement-breakpoint
CREATE UNIQUE INDEX "domains_workspace_slug_unique" ON "domains" USING btree ("workspace_id","slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "domains_workspace_idx" ON "domains" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_unique" ON "workspace_members" USING btree ("workspace_id","user_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "routine_runs_routine_started_idx" ON "routine_runs" USING btree ("routine_id","started_at");--> statement-breakpoint
CREATE INDEX "routine_runs_workspace_started_idx" ON "routine_runs" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "routines_workspace_creator_idx" ON "routines" USING btree ("workspace_id","creator_user_id");--> statement-breakpoint
CREATE INDEX "routines_workspace_active_idx" ON "routines" USING btree ("workspace_id","is_paused") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "integration_connections_per_user_unique" ON "integration_connections" USING btree ("workspace_id","user_id","provider") WHERE scope = 'user' AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "integration_connections_per_workspace_unique" ON "integration_connections" USING btree ("workspace_id","provider") WHERE scope = 'workspace' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "integration_connections_workspace_user_idx" ON "integration_connections" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "runs_workspace_started_idx" ON "runs" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "runs_thread_idx" ON "runs" USING btree ("thread_id") WHERE thread_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "runs_routine_idx" ON "runs" USING btree ("routine_id") WHERE routine_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "runs_status_idx" ON "runs" USING btree ("status") WHERE status NOT IN ('complete', 'failed');--> statement-breakpoint
CREATE UNIQUE INDEX "usage_daily_workspace_day_unique" ON "usage_daily" USING btree ("workspace_id","day");
