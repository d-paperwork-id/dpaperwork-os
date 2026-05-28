"use client";

import { addHours, addWeeks, setHours, setMinutes, setSeconds, setMilliseconds, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function nextMorning9am(timezone: string): Date {
  const nowInTz = toZonedTime(new Date(), timezone);
  let candidate = addDays(nowInTz, 1);
  candidate = setHours(setMinutes(setSeconds(setMilliseconds(candidate, 0), 0), 0), 9);
  return fromZonedTime(candidate, timezone);
}

const PRESETS = (timezone: string) => [
  { label: "1 hour", getValue: () => addHours(new Date(), 1) },
  { label: "4 hours", getValue: () => addHours(new Date(), 4) },
  { label: "Tomorrow 9am", getValue: () => nextMorning9am(timezone) },
  { label: "Next week", getValue: () => addWeeks(new Date(), 1) },
];

interface SnoozePopoverProps {
  onSnooze: (snoozedUntil: string) => void;
  workspaceTimezone: string;
  children: React.ReactNode;
}

export function SnoozePopover({ onSnooze, workspaceTimezone, children }: SnoozePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col">
          {PRESETS(workspaceTimezone).map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="justify-start h-8 text-xs font-normal"
              onClick={() => onSnooze(preset.getValue().toISOString())}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
