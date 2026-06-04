import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { workspaceMembers, workspaceRoles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

type RoleFlag = "can_manage_settings" | "can_write_data" | "can_view_data";

export async function requireRole(
  userId: string,
  workspaceId: string,
  flag: RoleFlag,
): Promise<NextResponse | null> {
  const [row] = await db
    .select({
      canManageSettings: workspaceRoles.canManageSettings,
      canWriteData: workspaceRoles.canWriteData,
      canViewData: workspaceRoles.canViewData,
    })
    .from(workspaceMembers)
    .innerJoin(workspaceRoles, eq(workspaceMembers.roleId, workspaceRoles.id))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flagMap: Record<RoleFlag, boolean> = {
    can_manage_settings: row.canManageSettings,
    can_write_data: row.canWriteData,
    can_view_data: row.canViewData,
  };

  if (!flagMap[flag]) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return null;
}
