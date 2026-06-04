"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  canManageSettings: boolean;
  canWriteData: boolean;
  canViewData: boolean;
  position: number;
  memberCount: number;
};

function PermissionPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        active
          ? "bg-accent text-foreground border-border"
          : "text-muted-foreground border-border opacity-40",
      )}
    >
      {label}
    </span>
  );
}

export default function RolesPage() {
  const { data, isLoading } = useQuery<{ roles: Role[] }>({
    queryKey: ["settings", "roles"],
    queryFn: () => fetch("/api/settings/roles").then((r) => r.json()),
  });

  const roles = data?.roles ?? [];
  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-md divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))
        ) : (
          systemRoles.map((role) => (
            <div key={role.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{role.name}</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    System
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
              {role.description && (
                <p className="text-xs text-muted-foreground">{role.description}</p>
              )}
              <div className="flex gap-1.5 flex-wrap">
                <PermissionPill label="Manage settings" active={role.canManageSettings} />
                <PermissionPill label="Write data" active={role.canWriteData} />
                <PermissionPill label="View" active={role.canViewData} />
              </div>
            </div>
          ))
        )}
      </div>

      {customRoles.length > 0 && (
        <div className="border border-border rounded-md divide-y divide-border">
          {customRoles.map((role) => (
            <div key={role.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{role.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
              {role.description && (
                <p className="text-xs text-muted-foreground">{role.description}</p>
              )}
              <div className="flex gap-1.5 flex-wrap">
                <PermissionPill label="Manage settings" active={role.canManageSettings} />
                <PermissionPill label="Write data" active={role.canWriteData} />
                <PermissionPill label="View" active={role.canViewData} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">Custom roles coming soon.</p>
    </div>
  );
}
