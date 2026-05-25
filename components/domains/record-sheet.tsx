"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

type SelectChoice = { value: string; label: string; color?: string };

interface DomainField {
  id: string;
  slug: string;
  name: string;
  type: string;
  isRequired: boolean;
  options?: { choices?: SelectChoice[] } | null;
}

interface DomainRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  domainId: string;
  fields: DomainField[];
  record?: DomainRecord;
  queryKey: unknown[];
}

function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: DomainField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const strVal = value == null ? "" : String(value);
  const choices =
    field.type === "single_select"
      ? ((field.options as { choices?: SelectChoice[] } | null)?.choices ?? [])
      : [];

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {field.name}
        {field.isRequired && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {field.type === "text" && (
        <Input value={strVal} onChange={(e) => onChange(e.target.value)} />
      )}

      {field.type === "long_text" && (
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none min-h-[80px]"
        />
      )}

      {field.type === "number" && (
        <Input
          type="number"
          value={strVal}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      )}

      {field.type === "date" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !strVal && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {strVal ? format(new Date(strVal + "T00:00:00"), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={strVal ? new Date(strVal + "T00:00:00") : undefined}
              onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
            />
          </PopoverContent>
        </Popover>
      )}

      {field.type === "single_select" && (
        <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {choices.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function RecordSheet({
  open,
  onOpenChange,
  mode,
  domainId,
  fields,
  record,
  queryKey,
}: Props) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(mode === "edit" && record ? { ...record.fields } : {});
      setErrors({});
    }
  }, [open, mode, record]);

  function validate() {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.slug];
      if (f.isRequired && (v === undefined || v === null || v === "")) {
        errs[f.slug] = `${f.name} is required`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const url =
        mode === "add"
          ? `/api/domains/${domainId}/records`
          : `/api/domains/${domainId}/records/${record!.id}`;
      const method = mode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: values }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.errors) setErrors(body.errors);
        else toast.error("Failed to save record");
        return;
      }

      await queryClient.invalidateQueries({ queryKey });
      toast.success(mode === "add" ? "Record created" : "Record saved");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/domains/${domainId}/records/${record!.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Failed to delete record");
        return;
      }
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Record deleted");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  }

  const primaryField = fields[0];
  const sheetTitle =
    mode === "add"
      ? "New Record"
      : primaryField
      ? String(record?.fields[primaryField.slug] ?? "Edit Record")
      : "Edit Record";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[380px] sm:max-w-[380px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
            <SheetTitle className="text-sm font-semibold">{sheetTitle}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fields.map((f) => (
              <FieldInput
                key={f.id}
                field={f}
                value={values[f.slug]}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.slug]: v }))}
                error={errors[f.slug]}
              />
            ))}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-border flex items-center justify-between gap-2">
            {mode === "edit" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting && <Spinner className="mr-2 text-primary-foreground" />}
                {mode === "add" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This record will be soft-deleted and can be restored within the retention window.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
