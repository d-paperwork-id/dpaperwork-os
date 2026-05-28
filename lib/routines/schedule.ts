import { fromZonedTime } from "date-fns-tz";

// dayOfWeek: 1=Monday ... 7=Sunday (ISO week numbering)
// timeLocal: "HH:MM" (24h)
export function buildCronStrings({
  dayOfWeek,
  timeLocal,
  timezone,
}: {
  dayOfWeek: number;
  timeLocal: string;
  timezone: string;
}): { scheduleCronLocal: string; scheduleCronUtc: string } {
  const [hourStr, minuteStr] = timeLocal.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // ISO 1=Mon...7=Sun → cron 1=Mon...6=Sat, 0=Sun
  const localCronDow = dayOfWeek === 7 ? 0 : dayOfWeek;
  const scheduleCronLocal = `${minute} ${hour} * * ${localCronDow}`;

  // Reference week: Jan 6-12 2025 (Mon=6 through Sun=12)
  // dayOfWeek=1(Mon)→Jan 6, dayOfWeek=2(Tue)→Jan 7, ..., dayOfWeek=7(Sun)→Jan 12
  const dayOfMonth = 5 + dayOfWeek;
  const localDateStr = `2025-01-${String(dayOfMonth).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  const utcDate = fromZonedTime(localDateStr, timezone);

  const utcHour = utcDate.getUTCHours();
  const utcMinute = utcDate.getUTCMinutes();
  const utcDow = utcDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const scheduleCronUtc = `${utcMinute} ${utcHour} * * ${utcDow}`;

  return { scheduleCronLocal, scheduleCronUtc };
}

// Build a human-readable schedule string from scheduleCronLocal and scheduleTimezone
// e.g. "Every Monday at 9:00 AM IST"
export function formatSchedule(
  scheduleCronLocal: string,
  scheduleTimezone: string
): string {
  const parts = scheduleCronLocal.split(" ");
  if (parts.length !== 5) return scheduleCronLocal;

  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  const dow = parseInt(parts[4], 10);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[dow] ?? "Unknown";

  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, "0");
  const timeStr = `${displayHour}:${displayMinute} ${period}`;

  // Get short timezone abbreviation
  try {
    const tz = new Intl.DateTimeFormat("en", { timeZone: scheduleTimezone, timeZoneName: "short" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? scheduleTimezone;
    return `Every ${dayName} at ${timeStr} ${tz}`;
  } catch {
    return `Every ${dayName} at ${timeStr} ${scheduleTimezone}`;
  }
}
