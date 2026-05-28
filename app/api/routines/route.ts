import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { z } from "zod";
import { eq, isNull, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { routines, workspaces, workspaceMembers } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";
import { buildCronStrings } from "@/lib/routines/schedule";
import { registerSchedule } from "@/lib/routines/trigger";

const createRoutineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  agentId: z.enum(["chief-of-staff", "pm", "executive-assistant"]),
  instruction: z.string().min(1, "Instruction is required"),
  dayOfWeek: z.number().int().min(1).max(7),
  timeLocal: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  outputDestination: z.object({ kind: z.literal("inbox") }).default({ kind: "inbox" }),
});

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const rows = await db
    .select()
    .from(routines)
    .where(and(eq(routines.workspaceId, workspace.id), isNull(routines.deletedAt)))
    .orderBy(desc(routines.createdAt));

  return NextResponse.json({ routines: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const body = await req.json();
  const parsed = createRoutineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, agentId, instruction, dayOfWeek, timeLocal, outputDestination } = parsed.data;

  const [ws] = await db
    .select({ timezone: workspaces.timezone })
    .from(workspaces)
    .where(eq(workspaces.id, workspace.id))
    .limit(1);

  const timezone = ws?.timezone ?? "Asia/Kolkata";
  const { scheduleCronLocal, scheduleCronUtc } = buildCronStrings({ dayOfWeek, timeLocal, timezone });

  const routineId = `rtn_${nanoid(16)}`;

  let triggerDevTaskId: string | null = null;
  try {
    triggerDevTaskId = await registerSchedule(routineId, scheduleCronUtc);
  } catch (err) {
    console.error("Failed to register Trigger.dev schedule:", err);
    return NextResponse.json({ error: "Failed to register schedule" }, { status: 500 });
  }

  const [routine] = await db
    .insert(routines)
    .values({
      id: routineId,
      workspaceId: workspace.id,
      creatorUserId: session.user.id,
      name,
      agentId,
      instruction,
      scheduleCronLocal,
      scheduleCronUtc,
      scheduleTimezone: timezone,
      outputDestination,
      isPaused: false,
      triggerDevTaskId,
    })
    .returning();

  return NextResponse.json({ routine }, { status: 201 });
}
