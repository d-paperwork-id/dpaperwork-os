"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, isTextUIPart } from "ai";
import { MoreHorizontal, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

type Thread = {
  id: string;
  title: string;
  agentId: string;
  mastraThreadId: string;
  lastMessageAt: string | null;
};

interface ThreadViewProps {
  threadId: string;
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasSentInSession, setHasSentInSession] = useState(false);
  const [centerOffset, setCenterOffset] = useState(0);
  const isFirstMessage = useRef(true);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: threadData, isLoading: threadLoading } = useQuery<{
    thread: Thread;
  }>({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}`);
      if (!res.ok) throw new Error("Thread not found");
      return res.json();
    },
  });

  const thread = threadData?.thread;

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { threadId } }),
    [threadId],
  );

  const { messages, setMessages, sendMessage, status } = useChat({ transport });

  const hasStarted =
    hasSentInSession || thread?.lastMessageAt != null || messages.length > 0;

  // Calculate how far to translate the input upward so it appears vertically centered
  useLayoutEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const h = el.clientHeight;
      const headerH = 48;
      const inputH = 148;
      setCenterOffset(Math.max(0, Math.floor((h - headerH) / 2 - inputH / 2)));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!thread) return;
    isFirstMessage.current = thread.title === "New thread";
  }, [thread]);

  useEffect(() => {
    if (!thread) return;
    fetch(`/api/chat?threadId=${threadId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
          isFirstMessage.current = false;
        }
      })
      .catch(() => {});
  }, [threadId, thread, setMessages]);

  const { mutate: patchThread } = useMutation({
    mutationFn: async (updates: { title?: string; lastMessageAt?: string }) => {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update thread");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["thread", threadId], data);
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const { mutate: deleteThread, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete thread");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      router.push("/chat");
    },
  });

  const saveTitle = useCallback(() => {
    const newTitle = titleInput.trim();
    if (!newTitle || newTitle === thread?.title) {
      setIsEditingTitle(false);
      setTitleInput(thread?.title ?? "");
      return;
    }
    patchThread({ title: newTitle });
    setIsEditingTitle(false);
  }, [titleInput, thread?.title, patchThread]);

  const handleSend = useCallback(
    (message: { text: string }) => {
      if (
        !message.text.trim() ||
        status === "submitted" ||
        status === "streaming"
      )
        return;
      setHasSentInSession(true);
      const isFirst = isFirstMessage.current;
      sendMessage({ text: message.text });
      if (isFirst) {
        isFirstMessage.current = false;
        const newTitle =
          message.text.length > 57
            ? `${message.text.slice(0, 57)}...`
            : message.text;
        patchThread({
          title: newTitle,
          lastMessageAt: new Date().toISOString(),
        });
        setTitleInput(newTitle);
      } else {
        patchThread({ lastMessageAt: new Date().toISOString() });
      }
    },
    [status, sendMessage, patchThread],
  );

  const isStreaming = status === "submitted" || status === "streaming";

  // containerRef must always be on the outermost div so useLayoutEffect can measure
  // it even during the loading state (avoids centerOffset staying at 0).
  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      {threadLoading && (
        <div className="flex items-center justify-center flex-1">
          <Spinner className="w-5 h-5" />
        </div>
      )}

      {!threadLoading && !thread && (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          Thread not found.
        </div>
      )}

      {!threadLoading && thread && (
        <>
          {/* Header */}
          <div className="flex items-center h-12 px-4 border-b border-border shrink-0 gap-2">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none border-b border-primary"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") {
                      setIsEditingTitle(false);
                      setTitleInput(thread.title);
                    }
                  }}
                  onBlur={saveTitle}
                  autoFocus
                />
              ) : (
                <button
                  className="text-sm font-medium text-foreground truncate hover:text-foreground/80 transition-colors text-left w-full"
                  onClick={() => {
                    setTitleInput(thread.title);
                    setIsEditingTitle(true);
                  }}
                >
                  {thread.title}
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {AGENT_LABELS[thread.agentId] ?? thread.agentId}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">Thread actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setTitleInput(thread.title);
                    setIsEditingTitle(true);
                  }}
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Messages */}
          <Conversation
            className={cn(
              "flex-1 min-h-0 transition-opacity duration-500 ease-out",
              hasStarted ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <ConversationContent className="px-4 py-4 max-w-3xl mx-auto w-full space-y-6">
              {messages.length === 0 && !isStreaming && (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Start a conversation with{" "}
                  {AGENT_LABELS[thread.agentId] ?? thread.agentId}
                </div>
              )}
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <Message key={message.id} from="user">
                      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm max-w-[80%] ml-auto whitespace-pre-wrap leading-relaxed">
                        {message.parts?.map((part, i) => {
                          if (isTextUIPart(part))
                            return <span key={i}>{part.text}</span>;
                          return null;
                        })}
                      </div>
                    </Message>
                  );
                }

                return (
                  <Message key={message.id} from="assistant" className="gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1"
                      style={{
                        backgroundColor: `var(--agent-${thread.agentId}, hsl(var(--primary)))`,
                      }}
                    >
                      {(AGENT_LABELS[thread.agentId] ?? thread.agentId)
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 w-full space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {AGENT_LABELS[thread.agentId] ?? thread.agentId}
                      </span>
                      <MessageContent className="bg-white dark:bg-black shadow-sm text-foreground rounded-lg px-4 py-3 text-sm leading-relaxed">
                        {message.parts?.map((part, i) => {
                          if (isTextUIPart(part)) {
                            return (
                              <MessageResponse key={i}>
                                {part.text}
                              </MessageResponse>
                            );
                          }
                          if (isToolUIPart(part)) {
                            return (
                              <Tool key={i}>
                                {part.type === "dynamic-tool" ? (
                                  <ToolHeader
                                    type="dynamic-tool"
                                    state={part.state}
                                    toolName={part.toolName}
                                  />
                                ) : (
                                  <ToolHeader
                                    type={part.type as `tool-${string}`}
                                    state={part.state}
                                  />
                                )}
                                <ToolContent>
                                  {"input" in part &&
                                    part.input !== undefined && (
                                      <ToolInput
                                        input={
                                          part.input as Record<string, unknown>
                                        }
                                      />
                                    )}
                                  {(("output" in part &&
                                    part.output !== undefined) ||
                                    ("errorText" in part &&
                                      (part as { errorText?: string })
                                        .errorText)) && (
                                    <ToolOutput
                                      output={
                                        "output" in part
                                          ? (part.output as Record<
                                              string,
                                              unknown
                                            >)
                                          : undefined
                                      }
                                      errorText={
                                        "errorText" in part
                                          ? (part as { errorText?: string })
                                              .errorText
                                          : undefined
                                      }
                                    />
                                  )}
                                </ToolContent>
                              </Tool>
                            );
                          }
                          return null;
                        })}
                      </MessageContent>
                    </div>
                  </Message>
                );
              })}
              {isStreaming &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: `var(--agent-${thread.agentId}, hsl(var(--primary)))`,
                      }}
                    >
                      {(AGENT_LABELS[thread.agentId] ?? thread.agentId)
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              {status === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Something went wrong. Please try again.
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Input — translates up to appear centered on a new thread, slides down after first send */}
          <div
            className={cn(
              "shrink-0 max-w-3xl mx-auto w-full px-4 py-4 transition-all duration-500 ease-out",
              hasStarted
                ? "border-t border-border/60"
                : "border-t border-transparent",
            )}
            style={{
              transform:
                !hasStarted && centerOffset > 0
                  ? `translateY(-${centerOffset}px)`
                  : "translateY(0)",
            }}
          >
            {/* Elevated card container — provides white bg + shadow; InputGroup inside is made transparent */}
            <div className="rounded-2xl bg-card border border-black/[0.07] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.07)] transition-shadow duration-200 focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.10)] focus-within:border-black/[0.10]">
              <PromptInput
                onSubmit={(msg) => handleSend({ text: msg.text })}
                className="[&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:border-0"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    placeholder="Message your AI team…"
                    disabled={isStreaming}
                    className="`min-h-8 max-h-12 resize-none px-4 pt-4 pb-1 text-sm placeholder:text-muted-foreground/60"
                  />
                </PromptInputBody>
                <PromptInputFooter className="justify-end px-3 pb-3 pt-1">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={isStreaming}
                  >
                    {isStreaming ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>

          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete thread?</AlertDialogTitle>
                <AlertDialogDescription>
                  This thread will be permanently removed. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteThread()}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
