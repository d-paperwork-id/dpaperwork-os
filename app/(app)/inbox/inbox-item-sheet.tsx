"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Check, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "./agent-avatar";
import { SnoozePopover } from "./snooze-popover";
import { useResolveInboxItem, useSnoozeInboxItem, useMarkInboxItemRead } from "@/lib/hooks/use-inbox";
import type { InboxItem } from "@/lib/hooks/use-inbox";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

interface InboxItemSheetProps {
  item: InboxItem | null;
  routineName?: string;
  workspaceTimezone: string;
  onClose: () => void;
}

export function InboxItemSheet({ item, routineName, workspaceTimezone, onClose }: InboxItemSheetProps) {
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
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        {item && (
          <>
            <SheetHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-start gap-3">
                <AgentAvatar agentId={item.sourceAgentId} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {AGENT_LABELS[item.sourceAgentId] ?? item.sourceAgentId}
                    </span>
                    {routineName && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {routineName}
                      </Badge>
                    )}
                  </div>
                  <SheetTitle className="text-base font-semibold text-foreground mt-1 text-left">
                    {item.title}
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{item.body}</ReactMarkdown>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center gap-2">
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
