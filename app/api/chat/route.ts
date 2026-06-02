import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { handleChatStream } from "@mastra/ai-sdk";
import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { createUIMessageStreamResponse } from "ai";
import {
  RequestContext,
  MASTRA_THREAD_ID_KEY,
  MASTRA_RESOURCE_ID_KEY,
} from "@mastra/core/request-context";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { threads } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";
import { mastra } from "@/mastra";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

const postSchema = z.object({
  messages: z.array(z.unknown()),
  threadId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace)
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { messages, threadId } = parsed.data;

  const [thread] = await db
    .select({ mastraThreadId: threads.mastraThreadId, agentId: threads.agentId })
    .from(threads)
    .where(
      and(
        eq(threads.id, threadId),
        eq(threads.workspaceId, workspace.id),
        eq(threads.ownerUserId, session.user.id),
        isNull(threads.deletedAt),
      ),
    )
    .limit(1);

  if (!thread)
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const stream = await handleChatStream({
    mastra,
    agentId: thread.agentId,
    version: "v6",
    params: {
      messages: messages as Parameters<
        typeof handleChatStream
      >[0]["params"]["messages"],
      requestContext: new RequestContext([
        [MASTRA_THREAD_ID_KEY, thread.mastraThreadId],
        [MASTRA_RESOURCE_ID_KEY, session.user.id],
        ["workspace_id", workspace.id],
        ["user_id", session.user.id],
      ]),
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceForUser(session.user.id);
  if (!workspace)
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const threadId = req.nextUrl.searchParams.get("threadId");
  if (!threadId)
    return NextResponse.json({ error: "threadId required" }, { status: 400 });

  const [thread] = await db
    .select({ mastraThreadId: threads.mastraThreadId })
    .from(threads)
    .where(
      and(
        eq(threads.id, threadId),
        eq(threads.workspaceId, workspace.id),
        eq(threads.ownerUserId, session.user.id),
        isNull(threads.deletedAt),
      ),
    )
    .limit(1);

  if (!thread)
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const storage = mastra.getStorage();
  const memoryStore = await storage?.getStore("memory");

  if (!memoryStore) return NextResponse.json([]);

  const result = await memoryStore.listMessages({
    threadId: thread.mastraThreadId,
    perPage: false,
  });

  const uiMessages = toAISdkMessages(result.messages, { version: "v6" });
  return NextResponse.json(uiMessages);
}
