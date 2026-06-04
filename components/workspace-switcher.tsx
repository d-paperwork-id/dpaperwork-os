"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

type Workspace = { id: string; name: string; slug: string };

function useWorkspaceMemberships() {
  return useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["workspace-memberships"],
    queryFn: () => fetch("/api/workspace/memberships").then((r) => r.json()),
  });
}

function useActiveWorkspace() {
  return useQuery<{ id: string; name: string; slug: string }>({
    queryKey: ["workspace-me"],
    queryFn: () => fetch("/api/workspace/me").then((r) => r.json()),
  });
}

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: membershipsData, isLoading } = useWorkspaceMemberships();
  const { data: activeWorkspace } = useActiveWorkspace();

  const workspaces = membershipsData?.workspaces ?? [];

  function switchWorkspace(workspace: Workspace) {
    if (workspace.id === activeWorkspace?.id) return;
    document.cookie = `active-workspace-id=${workspace.id}; path=/; SameSite=Lax`;
    router.push("/inbox");
    router.refresh();
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-background px-3 py-2 hover:bg-sidebar-accent/50 transition-colors duration-150 group",
            isCollapsed && "justify-center px-2",
          )}
        >
          <div className="h-5 w-5 rounded-full bg-primary shrink-0" />
          <span className="flex-1 text-left text-sm font-medium text-foreground truncate group-data-[collapsible=icon]:hidden">
            {activeWorkspace?.name ?? "Workspace"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-150 group-hover:scale-110 group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => switchWorkspace(ws)}
            className="flex items-center gap-2"
          >
            <div className="h-4 w-4 rounded-full bg-primary shrink-0" />
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.id === activeWorkspace?.id && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
