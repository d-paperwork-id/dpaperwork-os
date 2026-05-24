"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Inbox,
  Database,
  Repeat,
  FolderKanban,
  Plug,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const primaryNav = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Domains", href: "/domains", icon: Database },
  { label: "Routines", href: "/routines", icon: Repeat },
  { label: "Projects", href: "/projects", icon: FolderKanban },
];

const secondaryNav = [
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

type Workspace = { id: string; name: string; slug: string };

async function fetchWorkspace(): Promise<Workspace> {
  const res = await fetch("/api/workspace/me");
  if (!res.ok) throw new Error("failed");
  return res.json();
}

function NavItem({
  label,
  href,
  icon: Icon,
  pathname,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150 ease-out",
          isActive
            ? "bg-sidebar-accent text-foreground font-medium [&>svg]:text-foreground"
            : "bg-transparent text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground [&>svg]:text-muted-foreground hover:[&>svg]:text-foreground"
        )}
      >
        <Icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:scale-[1.08]" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: workspace } = useQuery({
    queryKey: ["workspace-me"],
    queryFn: fetchWorkspace,
  });
  const { data: session } = authClient.useSession();

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Brand */}
      <SidebarHeader className="px-4 pt-5 pb-4">
        <span className="text-[18px] font-bold tracking-tight text-foreground leading-none">
          dpaperwork
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2 gap-1">
        {/* Workspace selector */}
        <div className="px-1 mb-1">
          {workspace ? (
            <button className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-background px-3 py-2 hover:bg-sidebar-accent/50 transition-colors duration-150 group">
              <div className="h-5 w-5 rounded-full bg-primary shrink-0" />
              <span className="flex-1 text-left text-sm font-medium text-foreground truncate">
                {workspace.name}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-150 group-hover:scale-110" />
            </button>
          ) : (
            <Skeleton className="h-9 w-full rounded-lg" />
          )}
        </div>

        {/* Primary nav */}
        <ul className="flex flex-col gap-0.5">
          {primaryNav.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </ul>

        {/* Secondary nav */}
        <div className="mt-4">
          <p className="px-3 mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
            Workspace
          </p>
          <ul className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <NavItem key={item.href} {...item} pathname={pathname} />
            ))}
          </ul>
        </div>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        {/* Invite card */}
        <div className="mb-3 rounded-xl border border-sidebar-border bg-background p-3.5">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Plug className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[13px] font-semibold text-foreground leading-snug">
            Connect integrations
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">
            Link your tools to give agents full context.
          </p>
        </div>

        {/* User menu */}
        <SidebarMenu>
          <SidebarMenuItem>
            {session?.user ? (
              <UserMenu
                name={session.user.name}
                email={session.user.email}
              />
            ) : (
              <Skeleton className="h-10 w-full rounded-md" />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
