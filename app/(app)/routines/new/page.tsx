"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { formatSchedule } from "@/lib/routines/schedule";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  agentId: z.enum(["chief-of-staff", "pm", "executive-assistant"]),
  instruction: z.string().min(1, "Instruction is required"),
  dayOfWeek: z.number().int().min(1).max(7),
  timeLocal: z.string().regex(/^\d{2}:\d{2}$/, "Time is required"),
});

type FormValues = z.infer<typeof formSchema>;

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export default function NewRoutinePage() {
  const router = useRouter();
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentId: "chief-of-staff",
      dayOfWeek: 1,
      timeLocal: "09:00",
    },
  });

  const dayOfWeek = watch("dayOfWeek");
  const timeLocal = watch("timeLocal");

  useEffect(() => {
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((d) => {
        if (d.workspace?.timezone) setTimezone(d.workspace.timezone);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, outputDestination: { kind: "inbox" } }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error("Failed to create routine", { description: JSON.stringify(err.error) });
        return;
      }

      const { routine } = await res.json();
      toast.success("Routine created", {
        description: formatSchedule(routine.scheduleCronLocal, routine.scheduleTimezone),
      });
      router.push(`/routines/${routine.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="New Routine" />

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Weekly company update"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Agent */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Agent</Label>
            <Select
              defaultValue="chief-of-staff"
              onValueChange={(v) => setValue("agentId", v as FormValues["agentId"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chief-of-staff">Chief of Staff</SelectItem>
              </SelectContent>
            </Select>
            {errors.agentId && (
              <p className="text-xs text-destructive">{errors.agentId.message}</p>
            )}
          </div>

          {/* Instruction */}
          <div className="space-y-1.5">
            <Label htmlFor="instruction" className="text-sm font-medium">
              Instruction
            </Label>
            <Textarea
              id="instruction"
              className="font-mono text-sm resize-none min-h-[160px]"
              placeholder="Summarize last week's deals, projects, and any notable decisions..."
              {...register("instruction")}
            />
            <p className="text-xs text-muted-foreground">
              Written in plain English. The agent reads this exactly as typed.
            </p>
            {errors.instruction && (
              <p className="text-xs text-destructive">{errors.instruction.message}</p>
            )}
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Schedule</h2>
              <p className="text-xs text-muted-foreground">
                Schedules run in {timezone}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Day of week</Label>
                <Select
                  defaultValue="1"
                  onValueChange={(v) => setValue("dayOfWeek", parseInt(v, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfWeek && (
                  <p className="text-xs text-destructive">{errors.dayOfWeek.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timeLocal" className="text-sm font-medium">
                  Time
                </Label>
                <Input
                  id="timeLocal"
                  type="time"
                  defaultValue="09:00"
                  {...register("timeLocal")}
                />
                {errors.timeLocal && (
                  <p className="text-xs text-destructive">{errors.timeLocal.message}</p>
                )}
              </div>
            </div>

            {dayOfWeek && timeLocal && (
              <p className="text-xs text-muted-foreground">
                Preview:{" "}
                <span className="font-medium text-foreground">
                  {formatSchedule(
                    `0 ${timeLocal.split(":")[1] === "00" ? parseInt(timeLocal.split(":")[0], 10) : parseInt(timeLocal.split(":")[0], 10)} * * ${dayOfWeek === 7 ? 0 : dayOfWeek}`,
                    timezone
                  )}
                </span>
              </p>
            )}
          </div>

          <Separator />

          {/* Output */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-foreground mb-1">Output</h2>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40">
              <span className="text-sm text-foreground">Inbox</span>
              <span className="text-xs text-muted-foreground ml-1">— delivered to your inbox</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Create Routine
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/routines")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
