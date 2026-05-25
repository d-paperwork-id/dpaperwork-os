"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Check, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ContextEditor } from "@/components/context-md-editor/editor";
import { cn } from "@/lib/utils";

interface ContextData {
  content: string;
  updatedAt: string | null;
  currentVersionId: string | null;
}

interface VersionRow {
  id: string;
  createdAt: string;
  createdByUserId: string | null;
  createdByName: string | null;
}

async function fetchContext(): Promise<ContextData> {
  const res = await fetch("/api/settings/context");
  if (!res.ok) throw new Error("Failed to load context");
  return res.json();
}

async function fetchVersions(): Promise<VersionRow[]> {
  const res = await fetch("/api/settings/context/versions");
  if (!res.ok) throw new Error("Failed to load versions");
  return res.json();
}

export default function WorkspaceContextSettings() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);

  const { data: contextData, isLoading } = useQuery({
    queryKey: ["context"],
    queryFn: fetchContext,
  });

  const { data: versions } = useQuery({
    queryKey: ["context-versions"],
    queryFn: fetchVersions,
  });

  const savedContent = contextData?.content ?? "";
  const currentDraft = draft ?? savedContent;
  const isDirty = draft !== null && draft !== savedContent;
  const charCount = currentDraft.length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentDraft,
          updatedAt: contextData?.updatedAt ?? null,
        }),
      });
      if (res.status === 409) throw new Error("conflict");
      if (!res.ok) throw new Error("save-failed");
      return res.json();
    },
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["context"] });
      queryClient.invalidateQueries({ queryKey: ["context-versions"] });
      toast.success("Context saved");
    },
    onError: (err: Error) => {
      if (err.message === "conflict") {
        toast.error("Conflict detected", {
          description:
            "Someone else saved while you were editing. Reload to see the latest version.",
        });
      } else {
        toast.error("Failed to save context");
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(
        `/api/settings/context/versions/${versionId}/restore`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("restore-failed");
      return res.json();
    },
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["context"] });
      queryClient.invalidateQueries({ queryKey: ["context-versions"] });
      toast.success("Version restored");
    },
    onError: () => {
      toast.error("Failed to restore version");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-1">Context</h2>
          <Separator />
          <div className="mt-4 h-[420px] rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const lastSavedAt = contextData?.updatedAt
    ? formatDistanceToNow(new Date(contextData.updatedAt), { addSuffix: true })
    : null;

  return (
    <div className="space-y-8">
      {/* Editor section */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-base font-semibold text-foreground">Context</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Describe your business so every agent has the right background before it runs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-6">
            {!isDirty && lastSavedAt && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-emerald-500" />
                Saved {lastSavedAt}
              </span>
            )}
            <Button
              size="sm"
              disabled={!isDirty || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        <ContextEditor
          key={contextData?.currentVersionId ?? "init"}
          defaultValue={savedContent}
          onChange={setDraft}
        />

        {/* Below-editor metadata row */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Use <kbd className="font-mono bg-muted rounded px-1 py-0.5 text-[10px]">/</kbd> to
            insert headings, lists, and more. Select text for formatting options.
          </p>
          <span className="text-xs font-mono text-muted-foreground">
            {charCount.toLocaleString()} chars
          </span>
        </div>
      </div>

      {/* Version history */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Version history</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Every save creates a snapshot. Restore any version to make it current — the history is never deleted.
        </p>
        <Separator className="mb-1" />

        {!versions || versions.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground text-center">
            No saved versions yet. Save the editor above to create the first snapshot.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {versions.map((v, idx) => (
              <div
                key={v.id}
                className="group flex items-center justify-between gap-4 py-2.5 px-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Version number (newest = 1) */}
                  <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                    v{versions.length - idx}
                  </span>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm text-foreground",
                      idx === 0 && "font-medium"
                    )}>
                      {idx === 0 ? "Current version" : v.createdByName ?? "Unknown"}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                      {idx !== 0 && v.createdByName ? ` · ${v.createdByName}` : ""}
                    </p>
                  </div>
                </div>

                {idx === 0 ? (
                  <span className="text-xs text-muted-foreground shrink-0 mr-1">Current</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(v.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-7 gap-1.5 text-xs"
                  >
                    <RotateCcw className="size-3" />
                    Restore
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
