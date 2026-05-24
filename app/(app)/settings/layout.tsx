"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";

const settingsNav = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Workspace", href: "/settings/workspace/general" },
  { label: "Agents", href: "/settings/agents" },
  { label: "Team", href: "/settings/team" },
  { label: "Billing", href: "/settings/billing" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 shrink-0 border-r border-border p-4 space-y-0.5">
          {settingsNav.map(({ label, href }) => {
            const isActive =
              pathname === href ||
              (href !== "/settings" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-foreground bg-background border border-border shadow-sm"
                    : "flex items-center px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                }
              >
                {label}
              </Link>
            );
          })}
        </aside>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}
