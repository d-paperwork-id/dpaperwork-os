"use client";

import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "./agent-avatar";
import { SnoozePopover } from "./snooze-popover";
import { useResolveInboxItem, useSnoozeInboxItem } from "@/lib/hooks/use-inbox";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/lib/hooks/use-inbox";

interface InboxItemRowProps {
  item: InboxItem;
  workspaceTimezone: string;
  onClick: () => void;
}

export function InboxItemRow({ item, workspaceTimezone, onClick }: InboxItemRowProps) {
  const resolve = useResolveInboxItem();
  const snooze = useSnoozeInboxItem();
  const [exitType, setExitType] = useState<"resolve" | "snooze" | null>(null);
  const isUnread = !item.readAt;

  function handleResolve(e: React.MouseEvent) {
    e.stopPropagation();
    if (exitType) return;
    setExitType("resolve");
    setTimeout(() => resolve.mutate(item.id), 260);
  }

  function handleSnooze(snoozedUntil: string) {
    if (exitType) return;
    setExitType("snooze");
    setTimeout(() => snooze.mutate({ id: item.id, snoozedUntil }), 200);
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5",
        "cursor-pointer select-none",
        "hover:-translate-y-px hover:shadow-sm hover:border-border/60 hover:bg-accent/20",
        "transition-all duration-200 ease-out",
        isUnread && "border-l-[3px]",
        exitType === "resolve" && "animate-[inbox-resolve-out_0.28s_ease-out_forwards] pointer-events-none",
        exitType === "snooze" && "animate-[inbox-snooze-out_0.22s_ease-out_forwards] pointer-events-none",
      )}
      style={isUnread ? { borderLeftColor: `var(--agent-${item.sourceAgentId})` } : undefined}
      onClick={onClick}
    >
      <AgentAvatar agentId={item.sourceAgentId} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "text-sm truncate",
            isUnread ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
          )}>
            {item.title}
          </p>
          <span className="text-[11px] text-muted-foreground font-mono shrink-0">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
          {item.body.slice(0, 120)}
        </p>
      </div>

      {/* Hover actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 shrink-0 ml-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:text-emerald-400"
          onClick={handleResolve}
          disabled={!!exitType}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <SnoozePopover onSnooze={handleSnooze} workspaceTimezone={workspaceTimezone}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 dark:hover:text-amber-400"
            onClick={(e) => e.stopPropagation()}
            disabled={!!exitType}
          >
            <Clock className="w-3.5 h-3.5" />
          </Button>
        </SnoozePopover>
      </div>
    </div>
  );
}
