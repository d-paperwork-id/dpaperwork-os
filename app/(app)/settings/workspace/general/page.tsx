"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

type Workspace = { id: string; name: string; slug: string };

async function fetchWorkspace(): Promise<Workspace> {
  const res = await fetch("/api/workspace/me");
  if (!res.ok) throw new Error("failed");
  return res.json();
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function WorkspaceGeneralSettings() {
  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace-me"],
    queryFn: fetchWorkspace,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Workspace
        </h2>
        <Separator className="mb-0" />
        <div className="divide-y divide-border">
          <SettingRow
            label="Name"
            description="The display name of your workspace."
          >
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <Input defaultValue={workspace?.name ?? ""} className="w-48" />
              )}
              <Button size="sm" variant="outline">Save</Button>
            </div>
          </SettingRow>
          <SettingRow
            label="Slug"
            description="Used in URLs. Changing this will break existing links."
          >
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <Input defaultValue={workspace?.slug ?? ""} className="w-48" />
              )}
              <Button size="sm" variant="outline">Save</Button>
            </div>
          </SettingRow>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Localization
        </h2>
        <Separator className="mb-0" />
        <div className="divide-y divide-border">
          <SettingRow
            label="Timezone"
            description="Used for routine scheduling and timestamps across the workspace."
          >
            <Select defaultValue="UTC">
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
