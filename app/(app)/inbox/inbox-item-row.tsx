"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/lib/hooks/use-inbox";

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

interface InboxItemRowProps {
  item: InboxItem;
  routineName?: string;
  workspaceTimezone: string;
  selected?: boolean;
  onClick: () => void;
}

export function InboxItemRow({
  item,
  routineName,
  selected,
  onClick,
}: InboxItemRowProps) {
  const [exitType] = useState<"resolve" | "snooze" | null>(null);
  const isUnread = !item.readAt;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3",
        "border-b border-border cursor-pointer select-none transition-colors",
        "hover:bg-accent",
        isUnread && "border-l-[3px]",
        selected && "bg-accent",
        exitType === "resolve" &&
          "animate-inbox-resolve-out pointer-events-none",
        exitType === "snooze" && "animate-inbox-snooze-out pointer-events-none",
      )}
      style={
        isUnread
          ? { borderLeftColor: `var(--agent-${item.sourceAgentId})` }
          : undefined
      }
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        {/* Title */}
        <p
          className={cn(
            "text-sm truncate leading-snug",
            isUnread
              ? "font-medium text-foreground"
              : "font-normal text-muted-foreground",
          )}
        >
          {item.title}
        </p>
        {/* Agent name + time row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs font-medium text-muted-foreground">
            {AGENT_LABELS[item.sourceAgentId] ?? item.sourceAgentId}
            {routineName && (
              <span className="font-normal text-muted-foreground/60">
                {" "}
                · {routineName}
              </span>
            )}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono shrink-0">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
