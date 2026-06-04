"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const value = pathname.startsWith("/settings/team/roles")
    ? "roles"
    : "members";

  return (
    <div className="flex flex-col items-center justify-center mx-auto gap-6 py-2">
      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground">Team</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage workspace members and their roles.
        </p>
      </div>

      <Tabs
        value={value}
        onValueChange={(v) => router.push(`/settings/team/${v}`)}
      >
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
