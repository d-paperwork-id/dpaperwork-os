"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Plus, ArrowRight, Sparkles } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  title: string;
  agentId: string;
};

interface CommandPaletteProps {
  onNewThread: () => void;
}

export function CommandPalette({ onNewThread }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: threads } = useQuery<Thread[]>({
    queryKey: ["threads"],
    queryFn: async () => {
      const res = await fetch("/api/threads");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return data.threads;
    },
    enabled: open,
    staleTime: 30_000,
  });

  const handleNewThread = useCallback(() => {
    setOpen(false);
    onNewThread();
  }, [onNewThread]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setOpen(false);
      router.push(`/chat/${threadId}`);
    },
    [router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search threads or run a command…" />
      <CommandList className="pb-1.5">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Sparkles className="size-5 opacity-40" />
            <span className="text-sm">No results found</span>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={handleNewThread}
            className="group cursor-pointer transition-all duration-150"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-150 group-data-selected:bg-primary group-data-selected:text-primary-foreground group-data-selected:ring-primary">
              <Plus className="size-3.5" />
            </div>
            <span className="font-medium">New thread</span>
            <CommandShortcut>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-data-selected:border-border/60 group-data-selected:bg-background/60">
                ⌘
              </kbd>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-data-selected:border-border/60 group-data-selected:bg-background/60">
                N
              </kbd>
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {threads && threads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent threads">
              {threads.map((thread, i) => (
                <CommandItem
                  key={thread.id}
                  onSelect={() => handleSelectThread(thread.id)}
                  className={cn(
                    "group cursor-pointer transition-all duration-150",
                    "animate-in fade-in-0 slide-in-from-bottom-1 m-2",
                  )}
                  style={{
                    animationDelay: `${i * 30}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 group-data-selected:bg-accent group-data-selected:text-foreground group-data-selected:ring-1 group-data-selected:ring-border">
                    <MessageSquare className="size-3.5" />
                  </div>
                  <span className="flex-1 truncate text-[13px]">
                    {thread.title}
                  </span>
                  <ArrowRight className="size-3.5 opacity-0 transition-all duration-150 group-data-selected:translate-x-0.5 group-data-selected:opacity-50" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
