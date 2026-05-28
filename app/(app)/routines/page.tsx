"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemMedia } from "@/components/ui/item";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { formatSchedule } from "@/lib/routines/schedule";
import { formatDistanceToNow } from "date-fns";

interface Routine {
  id: string;
  name: string;
  agentId: string;
  scheduleCronLocal: string;
  scheduleTimezone: string;
  isPaused: boolean;
  createdAt: string;
}

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function StatusBadge({ isPaused }: { isPaused: boolean }) {
  const key = isPaused ? "paused" : "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[key]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isPaused ? "Paused" : "Active"}
    </span>
  );
}

async function fetchRoutines(): Promise<{ routines: Routine[] }> {
  const res = await fetch("/api/routines");
  if (!res.ok) throw new Error("Failed to load routines");
  return res.json();
}

export default function RoutinesPage() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["routines"],
    queryFn: fetchRoutines,
  });

  return (
    <>
      <PageHeader title="Routines">
        <Button variant="outline" size="sm" asChild>
          <Link href="/routines/new">New Routine</Link>
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}

        {isError && (
          <div className="px-6 py-4">
            <Alert>
              <AlertDescription>Failed to load routines. Please refresh.</AlertDescription>
            </Alert>
          </div>
        )}

        {data && data.routines.length === 0 && (
          <Empty>
            <EmptyMedia variant="icon">
              <Repeat className="w-8 h-8" />
            </EmptyMedia>
            <EmptyTitle>No routines yet</EmptyTitle>
            <EmptyDescription>
              Set up a routine to get automated updates from your AI team.
            </EmptyDescription>
            <EmptyContent>
              <Button asChild>
                <Link href="/routines/new">New Routine</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {data && data.routines.length > 0 && (
          <div>
            {data.routines.map((routine) => (
              <Item key={routine.id} asChild>
                <button
                  className="w-full text-left"
                  onClick={() => router.push(`/routines/${routine.id}`)}
                >
                  <ItemMedia variant="icon">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <div className="flex items-center justify-between gap-2">
                      <ItemTitle>{routine.name}</ItemTitle>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {formatDistanceToNow(new Date(routine.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <ItemDescription>
                      {AGENT_LABELS[routine.agentId] ?? routine.agentId} ·{" "}
                      {formatSchedule(routine.scheduleCronLocal, routine.scheduleTimezone)}
                    </ItemDescription>
                  </ItemContent>
                  <StatusBadge isPaused={routine.isPaused} />
                </button>
              </Item>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
