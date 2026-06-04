-- Create workspace_roles (idempotent — may already exist from a partial prior run)
CREATE TABLE IF NOT EXISTS "workspace_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"can_manage_settings" boolean DEFAULT false NOT NULL,
	"can_write_data" boolean DEFAULT true NOT NULL,
	"can_view_data" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Seed system roles for every existing workspace using deterministic IDs
INSERT INTO "workspace_roles" (id, workspace_id, name, description, is_system, can_manage_settings, can_write_data, can_view_data, position, created_at, updated_at)
SELECT 'rol_admin_' || id, id, 'Admin', 'Full access — can manage settings, write data, and view everything.', true, true, true, true, 0, now(), now()
FROM workspaces WHERE deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

INSERT INTO "workspace_roles" (id, workspace_id, name, description, is_system, can_manage_settings, can_write_data, can_view_data, position, created_at, updated_at)
SELECT 'rol_member_' || id, id, 'Member', 'Can write and view data but cannot change workspace settings.', true, false, true, true, 1, now(), now()
FROM workspaces WHERE deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

INSERT INTO "workspace_roles" (id, workspace_id, name, description, is_system, can_manage_settings, can_write_data, can_view_data, position, created_at, updated_at)
SELECT 'rol_viewer_' || id, id, 'Viewer', 'Read-only access across the workspace.', true, false, false, true, 2, now(), now()
FROM workspaces WHERE deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Rename role → role_id if the column still has its old name
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workspace_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE "workspace_members" RENAME COLUMN "role" TO "role_id";
  END IF;
END $$;
--> statement-breakpoint

-- Drop the stale default carried over from the old enum column
ALTER TABLE "workspace_members" ALTER COLUMN "role_id" DROP DEFAULT;
--> statement-breakpoint

-- Remap old text values ('admin', 'member') to the seeded role IDs
UPDATE "workspace_members" SET role_id = 'rol_admin_' || workspace_id WHERE role_id = 'admin';
--> statement-breakpoint
UPDATE "workspace_members" SET role_id = 'rol_member_' || workspace_id WHERE role_id = 'member';
--> statement-breakpoint

-- Create index (idempotent)
CREATE INDEX IF NOT EXISTS "workspace_roles_workspace_idx" ON "workspace_roles" USING btree ("workspace_id");
--> statement-breakpoint

-- Add FK constraint only if it does not already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'workspace_members_role_id_workspace_roles_id_fk'
  ) THEN
    ALTER TABLE "workspace_members"
      ADD CONSTRAINT "workspace_members_role_id_workspace_roles_id_fk"
      FOREIGN KEY ("role_id") REFERENCES "public"."workspace_roles"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
