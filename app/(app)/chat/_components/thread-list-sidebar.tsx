"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { useEffect, useRef, useState, useMemo } from "react";

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

const OLDER_PAGE_SIZE = 10;

type Thread = {
  id: string;
  title: string;
  agentId: string;
  lastMessageAt: string | null;
  createdAt: string;
};

export function useThreads() {
  return useQuery<Thread[]>({
    queryKey: ["threads"],
    queryFn: async () => {
      const res = await fetch("/api/threads");
      if (!res.ok) throw new Error("Failed to fetch threads");
      const data = await res.json();
      return data.threads;
    },
  });
}

interface ThreadListSidebarProps {
  onNewThread: () => void;
}

function ThreadItem({
  thread,
  isActive,
}: {
  thread: Thread;
  isActive: boolean;
}) {
  const ts = thread.lastMessageAt ?? thread.createdAt;
  return (
    <Item
      asChild
      className={cn(
        " border-border/0 transition-colors duration-150 m-2 rounded-lg",
        isActive && "bg-accent",
      )}
    >
      <Link href={`/chat/${thread.id}`}>
        <ItemContent>
          <ItemTitle className={cn(isActive && "text-foreground")}>
            {thread.title}
          </ItemTitle>
          <ItemDescription>
            {AGENT_LABELS[thread.agentId] ?? thread.agentId}
            {ts && (
              <>
                {" · "}
                {formatDistanceToNow(new Date(ts), { addSuffix: true })}
              </>
            )}
          </ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function ThreadListSidebar({ onNewThread }: ThreadListSidebarProps) {
  const pathname = usePathname();
  const { data: threads, isLoading } = useThreads();
  const [olderLimit, setOlderLimit] = useState(OLDER_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevThreadsLengthRef = useRef(threads?.length);

  const grouped = useMemo(() => {
    if (!threads) return { today: [], yesterday: [], older: [] };
    return threads.reduce(
      (acc, thread) => {
        const date = new Date(thread.lastMessageAt ?? thread.createdAt);
        if (isToday(date)) acc.today.push(thread);
        else if (isYesterday(date)) acc.yesterday.push(thread);
        else acc.older.push(thread);
        return acc;
      },
      {
        today: [] as Thread[],
        yesterday: [] as Thread[],
        older: [] as Thread[],
      },
    );
  }, [threads]);

  const visibleOlder = grouped.older.slice(0, olderLimit);
  const hasMoreOlder = grouped.older.length > olderLimit;

  // Load more older threads when sentinel scrolls into view
  useEffect(() => {
    if (!hasMoreOlder || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setOlderLimit((prev) => prev + OLDER_PAGE_SIZE);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreOlder, visibleOlder.length]);

  if (prevThreadsLengthRef.current !== threads?.length) {
    prevThreadsLengthRef.current = threads?.length;
    setOlderLimit(OLDER_PAGE_SIZE);
  }

  const hasAny =
    grouped.today.length > 0 ||
    grouped.yesterday.length > 0 ||
    grouped.older.length > 0;

  return (
    <div className="flex flex-col h-full border-r border-border w-72 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium text-foreground">Threads</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onNewThread}
        >
          <Plus className="w-4 h-4" />
          <span className="sr-only">New Thread</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-4 h-4" />
          </div>
        ) : !hasAny ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No threads yet</p>
            <Button size="sm" onClick={onNewThread}>
              New Thread
            </Button>
          </div>
        ) : (
          <div>
            {grouped.today.length > 0 && (
              <>
                <SectionLabel label="Today" />
                {grouped.today.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={pathname === `/chat/${thread.id}`}
                  />
                ))}
              </>
            )}

            {grouped.yesterday.length > 0 && (
              <>
                <SectionLabel label="Yesterday" />
                {grouped.yesterday.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={pathname === `/chat/${thread.id}`}
                  />
                ))}
              </>
            )}

            {grouped.older.length > 0 && (
              <>
                <SectionLabel label="Older" />
                {visibleOlder.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={pathname === `/chat/${thread.id}`}
                  />
                ))}
                {/* Sentinel triggers loading the next page */}
                <div ref={sentinelRef} className="h-1" />
                {hasMoreOlder && (
                  <div className="flex items-center justify-center py-3">
                    <Spinner className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
