"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOMAIN_ICONS, DOMAIN_ICON_NAMES } from "@/components/domains/domain-icons";

const PHASE1_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "single_select", label: "Single select" },
] as const;

type FieldType = (typeof PHASE1_FIELD_TYPES)[number]["value"];

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["text", "long_text", "number", "date", "single_select"]),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  icon: z.string().optional(),
  fields: z.array(fieldSchema).optional(),
});

type FormValues = z.infer<typeof schema>;

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function toFieldSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DOMAIN_ICON_NAMES.map((name) => {
        const Icon = DOMAIN_ICONS[name];
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(value === name ? "" : name)}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
              value === name
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

export function NewDomainDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", icon: "", fields: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "fields" });

  const nameValue = watch("name");
  const iconValue = watch("icon") ?? "";

  useEffect(() => {
    if (!dirtyFields.slug) {
      setValue("slug", toSlug(nameValue), { shouldValidate: false });
    }
  }, [nameValue, dirtyFields.slug, setValue]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      fields: (values.fields ?? []).map((f, i) => ({
        name: f.name,
        type: f.type,
        slug: toFieldSlug(f.name),
        position: i,
      })),
    };

    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      setError("slug", { message: "A domain with this slug already exists" });
      return;
    }
    if (!res.ok) {
      toast.error("Failed to create domain");
      return;
    }

    const { domain } = await res.json();
    await queryClient.invalidateQueries({ queryKey: ["domains"] });
    toast.success(`${domain.name} created`);
    onOpenChange(false);
    reset();
    router.push(`/domains/${domain.slug}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Domain</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" placeholder="e.g., Deals" autoFocus {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-sm font-medium">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input id="slug" placeholder="e.g., deals" {...register("slug")} />
            <p className="text-xs text-muted-foreground">
              Used by agents to reference this domain. Cannot be changed after creation.
            </p>
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              placeholder="What this domain tracks…"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Icon</Label>
            <IconPicker
              value={iconValue}
              onChange={(v) => setValue("icon", v, { shouldDirty: true })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Fields</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => append({ name: "", type: "text" })}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add field
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Field name"
                        {...register(`fields.${index}.name`)}
                      />
                      {errors.fields?.[index]?.name && (
                        <p className="text-xs text-destructive">
                          {errors.fields[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <Select
                      defaultValue="text"
                      onValueChange={(v) =>
                        setValue(`fields.${index}.type`, v as FieldType, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASE1_FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => remove(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No fields yet. Add fields to define the structure of this domain.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 text-primary-foreground" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
