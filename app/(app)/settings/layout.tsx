"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Settings2,
  FileText,
  Brain,
  Bot,
  Users,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const settingsGroups = [
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/settings/profile", icon: User },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "General", href: "/settings/workspace/general", icon: Settings2 },
      { label: "Context", href: "/settings/workspace/context", icon: FileText },
      { label: "Memory", href: "/settings/workspace/memory", icon: Brain },
      { label: "Agents", href: "/settings/agents", icon: Bot },
      { label: "Team", href: "/settings/team", icon: Users },
      { label: "Billing", href: "/settings/billing", icon: CreditCard },
    ],
  },
];

const allItems = settingsGroups.flatMap((g) => g.items);

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeItem = allItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/settings" && pathname.startsWith(item.href))
  );

  return (
    <>
      <PageHeader title="Settings" breadcrumb={activeItem?.label} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 shrink-0 border-r border-border overflow-y-auto py-4 px-3 space-y-5">
          {settingsGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon }) => {
                  const isActive =
                    pathname === href ||
                    (href !== "/settings" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-150",
                        isActive
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}
