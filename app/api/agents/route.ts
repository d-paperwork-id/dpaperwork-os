import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { workspaceAgentConfig } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const rows = await db
    .select({ agentId: workspaceAgentConfig.agentId })
    .from(workspaceAgentConfig)
    .where(
      and(
        eq(workspaceAgentConfig.workspaceId, workspace.id),
        eq(workspaceAgentConfig.isEnabled, true)
      )
    );

  const agents = rows.map((r) => ({
    id: r.agentId,
    label: AGENT_LABELS[r.agentId] ?? r.agentId,
  }));

  return NextResponse.json({ agents });
}
