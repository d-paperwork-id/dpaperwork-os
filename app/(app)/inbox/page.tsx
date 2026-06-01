"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Inbox, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { InboxFilterBar } from "./inbox-filter-bar";
import { InboxItemRow } from "./inbox-item-row";
import { InboxDetailPanel } from "./inbox-detail-panel";
import { useInbox } from "@/lib/hooks/use-inbox";
import { cn } from "@/lib/utils";
import type { InboxItem, InboxFilters } from "@/lib/hooks/use-inbox";

type Workspace = { id: string; name: string; slug: string; timezone: string };

function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: ["workspace-me"],
    queryFn: async () => {
      const res = await fetch("/api/workspace/me");
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return res.json();
    },
  });
}

function useRoutineNames(routineIds: string[]) {
  return useQuery({
    queryKey: ["routine-names", routineIds],
    queryFn: async () => {
      if (routineIds.length === 0) return {} as Record<string, string>;
      const res = await fetch("/api/routines");
      if (!res.ok) return {} as Record<string, string>;
      const data: { routines: Array<{ id: string; name: string }> } =
        await res.json();
      return Object.fromEntries(data.routines.map((r) => [r.id, r.name]));
    },
    enabled: routineIds.length > 0,
  });
}

function InboxContent() {
  const searchParams = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const agent = searchParams.get("agent") as InboxFilters["agent"] | null;
  const status = (searchParams.get("status") ??
    "unread") as InboxFilters["status"];

  const filters: InboxFilters = {
    ...(agent ? { agent } : {}),
    status,
  };

  const { data, isLoading } = useInbox(filters);
  const { data: workspace } = useWorkspace();

  const routineIds = Array.from(
    new Set(
      (data?.items ?? [])
        .map((i) => i.sourceRoutineId)
        .filter(Boolean) as string[],
    ),
  );
  const { data: routineNames } = useRoutineNames(routineIds);

  const workspaceTimezone = workspace?.timezone ?? "Asia/Kolkata";
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const resolvedSelectedItem = useMemo(
    () =>
      selectedItem &&
      items.length > 0 &&
      !items.some((i) => i.id === selectedItem.id)
        ? null
        : selectedItem,
    [items, selectedItem],
  );

  const emptyMessage =
    status === "resolved"
      ? {
          title: "No resolved items.",
          description: "Resolved items will appear here.",
        }
      : {
          title: "No inbox items",
          description:
            "Set up a routine to get automated updates from your AI team.",
        };

  return (
    <>
      <PageHeader title="Inbox">
        <InboxFilterBar />
      </PageHeader>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* List panel */}
        <div
          className={cn(
            "flex-col shrink-0 border-r border-border w-full md:w-95",
            resolvedSelectedItem ? "hidden md:flex" : "flex",
          )}
        >
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="w-5 h-5" />
              </div>
            ) : items.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <Inbox className="w-8 h-8" />
                </EmptyMedia>
                <EmptyTitle>{emptyMessage.title}</EmptyTitle>
                <EmptyDescription>{emptyMessage.description}</EmptyDescription>
                {status !== "resolved" && (
                  <EmptyContent>
                    <Button asChild>
                      <Link href="/routines/new">Create a routine</Link>
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <div>
                {items.map((item) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    routineName={
                      item.sourceRoutineId
                        ? routineNames?.[item.sourceRoutineId]
                        : undefined
                    }
                    workspaceTimezone={workspaceTimezone}
                    selected={resolvedSelectedItem?.id === item.id}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Detail column */}
        <div
          className={cn(
            "flex-col flex-1 min-w-0",
            resolvedSelectedItem ? "flex" : "hidden md:flex",
          )}
        >
          {/* Mobile back button */}
          <div className="flex md:hidden px-4 py-2 border-b border-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setSelectedItem(null)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </div>

          <InboxDetailPanel
            item={resolvedSelectedItem}
            routineName={
              resolvedSelectedItem?.sourceRoutineId
                ? routineNames?.[resolvedSelectedItem.sourceRoutineId]
                : undefined
            }
            workspaceTimezone={workspaceTimezone}
            onClose={() => setSelectedItem(null)}
          />
        </div>
      </div>
    </>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center flex-1">
          <Spinner className="w-5 h-5" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
