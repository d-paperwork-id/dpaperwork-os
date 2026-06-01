"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const AGENT_OPTIONS = [
  { value: "all", label: "All agents" },
  { value: "chief-of-staff", label: "Chief of Staff" },
  { value: "pm", label: "Product Manager" },
  { value: "executive-assistant", label: "Executive Assistant" },
];

const STATUS_OPTIONS = [
  { value: "unread", label: "Unread" },
  { value: "all", label: "All" },
  { value: "resolved", label: "Resolved" },
];

export function InboxFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const agent = searchParams.get("agent") ?? "all";
  const status = searchParams.get("status") ?? "unread";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" && key === "agent") {
        params.delete("agent");
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-3">
      <Select value={agent} onValueChange={(v) => update("agent", v)}>
        <SelectTrigger className="h-7 w-40 text-xs border-dashed">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AGENT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Segmented status control */}
      <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/50">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("status", opt.value)}
            className={cn(
              "px-2.5 py-0.5 text-xs rounded-sm transition-all duration-150",
              status === opt.value
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
