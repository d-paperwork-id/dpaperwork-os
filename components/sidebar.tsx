"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Inbox,
  Database,
  RefreshCw,
  FolderKanban,
  Plug,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Domains", href: "/domains", icon: Database },
  { label: "Routines", href: "/routines", icon: RefreshCw },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

type Workspace = { id: string; name: string; slug: string };

async function fetchWorkspace(): Promise<Workspace> {
  const res = await fetch("/api/workspace/me");
  if (!res.ok) throw new Error("failed");
  return res.json();
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: workspace } = useQuery({ queryKey: ["workspace-me"], queryFn: fetchWorkspace });

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]">
      {/* Workspace header */}
      <div className="px-4 py-5 border-b border-[var(--sidebar-border)]">
        {workspace ? (
          <p className="text-sm font-semibold text-[var(--sidebar-foreground)] truncate">
            {workspace.name}
          </p>
        ) : (
          <div className="h-4 w-32 rounded bg-[var(--sidebar-border)] animate-pulse" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-medium"
                  : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50 hover:text-[var(--sidebar-accent-foreground)]",
              ].join(" ")}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
