"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function WorkspaceGeneralSettings() {
  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace-me"],
    queryFn: fetchWorkspace,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Workspace
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update your workspace name and URL.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Name</Label>
            {isLoading ? (
              <Skeleton className="h-9 max-w-sm" />
            ) : (
              <Input
                id="ws-name"
                defaultValue={workspace?.name ?? ""}
                className="max-w-sm"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-slug">Slug</Label>
            {isLoading ? (
              <Skeleton className="h-9 max-w-sm" />
            ) : (
              <Input
                id="ws-slug"
                defaultValue={workspace?.slug ?? ""}
                className="max-w-sm"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Used in URLs. Changing this will break existing links.
            </p>
          </div>
          <Button size="sm">Save</Button>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Localization
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set the default timezone for routine scheduling and timestamps.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select defaultValue="UTC">
              <SelectTrigger className="max-w-sm">
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
          </div>
          <Button size="sm">Save</Button>
        </div>
      </div>
    </div>
  );
}
