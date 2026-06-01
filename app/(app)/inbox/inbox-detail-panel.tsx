"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { X, Check, Clock, Calendar, Inbox } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { AgentAvatar } from "./agent-avatar";
import { SnoozePopover } from "./snooze-popover";
import {
  useResolveInboxItem,
  useSnoozeInboxItem,
  useMarkInboxItemRead,
} from "@/lib/hooks/use-inbox";
import type { InboxItem } from "@/lib/hooks/use-inbox";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

interface InboxDetailPanelProps {
  item: InboxItem | null;
  routineName?: string;
  workspaceTimezone: string;
  onClose: () => void;
}

export function InboxDetailPanel({
  item,
  routineName,
  workspaceTimezone,
  onClose,
}: InboxDetailPanelProps) {
  const resolve = useResolveInboxItem();
  const snooze = useSnoozeInboxItem();
  const markRead = useMarkInboxItemRead();

  useEffect(() => {
    if (item && !item.readAt) {
      markRead.mutate(item.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  function handleResolve() {
    if (!item) return;
    resolve.mutate(item.id);
    onClose();
  }

  function handleSnooze(snoozedUntil: string) {
    if (!item) return;
    snooze.mutate({ id: item.id, snoozedUntil });
    onClose();
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {item === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyMedia variant="icon">
              <Inbox className="w-8 h-8" />
            </EmptyMedia>
            <EmptyTitle>Nothing selected</EmptyTitle>
            <EmptyDescription>Pick an item from the list to read it.</EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div key={item.id} className="flex flex-col h-full animate-detail-in">
          {/* Agent-colored accent bar */}
          <div
            className="h-0.5 w-full shrink-0"
            style={{ backgroundColor: `var(--agent-${item.sourceAgentId})` }}
          />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <AgentAvatar agentId={item.sourceAgentId} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {AGENT_LABELS[item.sourceAgentId] ?? item.sourceAgentId}
                </span>
                {routineName && (
                  <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                    {routineName}
                  </Badge>
                )}
                {!item.readAt && (
                  <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>
                  {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg shrink-0 text-muted-foreground"
              onClick={onClose}
            >
              <X className="w-3.5 h-3.5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-5">
              <div className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight
                prose-h2:text-sm prose-h2:mt-5 prose-h2:mb-2
                prose-h3:text-xs prose-h3:uppercase prose-h3:tracking-wider prose-h3:text-muted-foreground prose-h3:mt-4 prose-h3:mb-1.5
                prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground prose-p:my-2
                prose-li:text-sm prose-li:text-foreground prose-li:my-0.5
                prose-ul:my-2 prose-ol:my-2
                prose-strong:text-foreground prose-strong:font-semibold
                prose-hr:border-border prose-hr:my-4
              ">
                <ReactMarkdown>{item.body}</ReactMarkdown>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/40 shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950"
              onClick={handleResolve}
              disabled={resolve.isPending}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {resolve.isPending ? "Resolving…" : "Resolve"}
            </Button>
            <SnoozePopover onSnooze={handleSnooze} workspaceTimezone={workspaceTimezone}>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Snooze
              </Button>
            </SnoozePopover>
          </div>
        </div>
      )}
    </div>
  );
}
