"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { InboxFilterBar } from "./inbox-filter-bar";
import { InboxItemRow } from "./inbox-item-row";
import { InboxItemSheet } from "./inbox-item-sheet";
import { useInbox } from "@/lib/hooks/use-inbox";
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
      const data: { routines: Array<{ id: string; name: string }> } = await res.json();
      return Object.fromEntries(data.routines.map((r) => [r.id, r.name]));
    },
    enabled: routineIds.length > 0,
  });
}

function InboxContent() {
  const searchParams = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const agent = searchParams.get("agent") as InboxFilters["agent"] | null;
  const status = (searchParams.get("status") ?? "unread") as InboxFilters["status"];

  const filters: InboxFilters = {
    ...(agent ? { agent } : {}),
    status,
  };

  const { data, isLoading } = useInbox(filters);
  const { data: workspace } = useWorkspace();

  const routineIds = Array.from(
    new Set((data?.items ?? []).map((i) => i.sourceRoutineId).filter(Boolean) as string[])
  );
  const { data: routineNames } = useRoutineNames(routineIds);

  const workspaceTimezone = workspace?.timezone ?? "Asia/Kolkata";
  const items = data?.items ?? [];

  const emptyMessage =
    status === "resolved"
      ? { title: "No resolved items.", description: "Resolved items will appear here." }
      : {
          title: "No inbox items",
          description: "Set up a routine to get automated updates from your AI team.",
        };

  return (
    <>
      <PageHeader title="Inbox">
        <InboxFilterBar />
      </PageHeader>

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
          <div className="px-4 py-3 flex flex-col gap-1.5">
            {items.map((item) => (
              <InboxItemRow
                key={item.id}
                item={item}
                workspaceTimezone={workspaceTimezone}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <InboxItemSheet
        item={selectedItem}
        routineName={
          selectedItem?.sourceRoutineId
            ? routineNames?.[selectedItem.sourceRoutineId]
            : undefined
        }
        workspaceTimezone={workspaceTimezone}
        onClose={() => setSelectedItem(null)}
      />
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
