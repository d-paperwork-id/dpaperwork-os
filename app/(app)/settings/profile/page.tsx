"use client";

import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
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

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

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

export default function ProfileSettings() {
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();

  const user = session?.user;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Personal information
        </h2>
        <Separator className="mb-0" />
        <div className="divide-y divide-border">
          <SettingRow label="Name" description="Your display name across the workspace.">
            <div className="flex items-center gap-2">
              <Input
                id="name"
                defaultValue={user?.name ?? ""}
                className="w-48"
              />
              <Button size="sm" variant="outline">Save</Button>
            </div>
          </SettingRow>
          <SettingRow label="Email" description="Your sign-in email address.">
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                defaultValue={user?.email ?? ""}
                className="w-48"
              />
              <Button size="sm" variant="outline">Save</Button>
            </div>
          </SettingRow>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Preferences
        </h2>
        <Separator className="mb-0" />
        <div className="divide-y divide-border">
          <SettingRow
            label="Appearance"
            description="Choose how dpaperwork looks on your device."
          >
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow
            label="Timezone"
            description="Used for scheduling and displaying timestamps."
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
          <SettingRow
            label="Language"
            description="The language used across the interface."
          >
            <Select defaultValue="en">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
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
