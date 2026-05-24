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

export default function ProfileSettings() {
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();

  const user = session?.user;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Personal information
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update your name and email address.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user?.name ?? ""} className="max-w-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email ?? ""}
              className="max-w-sm"
            />
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
          Set your timezone and preferred language.
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
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select defaultValue="en">
              <SelectTrigger className="max-w-sm">
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
          </div>
          <Button size="sm">Save</Button>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how dpaperwork looks for you.
        </p>
        <div className="space-y-1.5">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
