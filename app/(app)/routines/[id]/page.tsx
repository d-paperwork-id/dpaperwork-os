"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Item, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";
import { formatSchedule } from "@/lib/routines/schedule";

interface Routine {
  id: string;
  name: string;
  agentId: string;
  instruction: string;
  scheduleCronLocal: string;
  scheduleTimezone: string;
  isPaused: boolean;
  pauseReason: string | null;
  createdAt: string;
}

interface RoutineRun {
  id: string;
  status: "running" | "succeeded" | "failed" | "paused" | "skipped";
  startedAt: string;
  completedAt: string | null;
  outputSummary: string | null;
  errorSummary: string | null;
}

const AGENT_LABELS: Record<string, string> = {
  "chief-of-staff": "Chief of Staff",
  pm: "Product Manager",
  "executive-assistant": "Executive Assistant",
};

const RUN_STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  running: "bg-muted text-muted-foreground",
  skipped: "bg-muted text-muted-foreground",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function RunStatusBadge({ status }: { status: RoutineRun["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

async function fetchRoutine(id: string): Promise<{ routine: Routine }> {
  const res = await fetch(`/api/routines/${id}`);
  if (!res.ok) throw new Error("Failed to load routine");
  return res.json();
}

async function fetchRuns(id: string): Promise<{ runs: RoutineRun[] }> {
  const res = await fetch(`/api/routines/${id}/runs`);
  if (!res.ok) throw new Error("Failed to load runs");
  return res.json();
}

export default function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const routineQuery = useQuery({
    queryKey: ["routine", id],
    queryFn: () => fetchRoutine(id),
  });

  const runsQuery = useQuery({
    queryKey: ["routine-runs", id],
    queryFn: () => fetchRuns(id),
  });

  const pauseMutation = useMutation({
    mutationFn: () => fetch(`/api/routines/${id}/pause`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine", id] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Routine paused");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => fetch(`/api/routines/${id}/resume`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine", id] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Routine resumed");
    },
  });

  const runNowMutation = useMutation({
    mutationFn: () => fetch(`/api/routines/${id}/run-now`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Run triggered");
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["routine-runs", id] });
      }, 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/routines/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Routine deleted");
      router.push("/routines");
    },
  });

  const routine = routineQuery.data?.routine;
  const runs = runsQuery.data?.runs ?? [];

  if (routineQuery.isLoading) {
    return (
      <>
        <PageHeader title="Routine" />
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      </>
    );
  }

  if (routineQuery.isError || !routine) {
    return (
      <>
        <PageHeader title="Routine" />
        <div className="px-6 py-4">
          <Alert>
            <AlertDescription>Failed to load routine.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const isActioning =
    pauseMutation.isPending || resumeMutation.isPending || runNowMutation.isPending;

  return (
    <>
      <PageHeader title={routine.name}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runNowMutation.mutate()}
          disabled={isActioning}
        >
          {runNowMutation.isPending ? (
            <Spinner className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Play className="mr-1.5 h-3.5 w-3.5" />
          )}
          Run Now
        </Button>

        {routine.isPaused ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => resumeMutation.mutate()}
            disabled={isActioning}
          >
            {resumeMutation.isPending ? (
              <Spinner className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Play className="mr-1.5 h-3.5 w-3.5" />
            )}
            Resume
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => pauseMutation.mutate()}
            disabled={isActioning}
          >
            {pauseMutation.isPending ? (
              <Spinner className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Pause className="mr-1.5 h-3.5 w-3.5" />
            )}
            Pause
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete routine &ldquo;{routine.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the routine and cancel its schedule. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                {deleteMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {routine.isPaused && routine.pauseReason && (
          <Alert>
            <AlertDescription>
              This routine is paused: {routine.pauseReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Detail card */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Agent</p>
              <p className="text-sm font-medium text-foreground">
                {AGENT_LABELS[routine.agentId] ?? routine.agentId}
              </p>
            </div>
            <div className="ml-8">
              <p className="text-xs text-muted-foreground mb-0.5">Schedule</p>
              <p className="text-sm font-medium text-foreground">
                {formatSchedule(routine.scheduleCronLocal, routine.scheduleTimezone)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Instruction</p>
            <div className="font-mono text-sm bg-muted rounded p-3 whitespace-pre-wrap">
              {routine.instruction}
            </div>
          </div>
        </div>

        {/* Run history */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Run History</h2>

          {runsQuery.isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}

          {!runsQuery.isLoading && runs.length === 0 && (
            <p className="text-sm text-muted-foreground px-1">
              This routine hasn&rsquo;t run yet.
            </p>
          )}

          {runs.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              {runs.map((run) => (
                <Item key={run.id} className="cursor-default hover:bg-accent/50">
                  <ItemContent>
                    <div className="flex items-center gap-2">
                      <RunStatusBadge status={run.status} />
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {(run.outputSummary || run.errorSummary) && (
                      <ItemDescription className="mt-0.5 line-clamp-2">
                        {run.outputSummary ?? run.errorSummary}
                      </ItemDescription>
                    )}
                  </ItemContent>
                </Item>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
