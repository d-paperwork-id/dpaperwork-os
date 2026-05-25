"use client";

import { useEffect, useRef } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { X, Plus, GripVertical } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "single_select", label: "Single select" },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]["value"];

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["text", "long_text", "number", "date", "single_select"]),
  choices: z.array(z.string().min(1)).optional(),
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

function ChoicesEditor({
  fieldIndex,
  control,
  setValue,
}: {
  fieldIndex: number;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
}) {
  const choices: string[] = useWatch({ control, name: `fields.${fieldIndex}.choices` }) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  function addChoice() {
    const val = inputRef.current?.value.trim();
    if (!val) return;
    setValue(`fields.${fieldIndex}.choices`, [...choices, val], { shouldDirty: true });
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  }

  function removeChoice(i: number) {
    setValue(
      `fields.${fieldIndex}.choices`,
      choices.filter((_, ci) => ci !== i),
      { shouldDirty: true }
    );
  }

  return (
    <div className="mt-2 ml-6 space-y-2 border-l border-border pl-3">
      <p className="text-xs text-muted-foreground font-medium">Options</p>

      {choices.length > 0 && (
        <ul className="space-y-1">
          {choices.map((choice, i) => (
            <li key={i} className="flex items-center gap-1.5 group">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              <span className="flex-1 text-sm px-2 py-0.5 rounded bg-muted text-foreground truncate">
                {choice}
              </span>
              <button
                type="button"
                onClick={() => removeChoice(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          placeholder="Add option…"
          className="h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addChoice();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={addChoice}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function FieldRow({
  index,
  control,
  register,
  setValue,
  remove,
  error,
}: {
  index: number;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  register: ReturnType<typeof useForm<FormValues>>["register"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  remove: () => void;
  error?: { name?: { message?: string } };
}) {
  const fieldType = useWatch({ control, name: `fields.${index}.type` });

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <Input placeholder="Field name" {...register(`fields.${index}.name`)} />
          {error?.name?.message && (
            <p className="text-xs text-destructive">{error.name.message}</p>
          )}
        </div>
        <Select
          value={fieldType ?? "text"}
          onValueChange={(v) =>
            setValue(`fields.${index}.type`, v as FieldType, { shouldDirty: true })
          }
        >
          <SelectTrigger className="w-[148px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => (
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
          onClick={remove}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {fieldType === "single_select" && (
        <ChoicesEditor fieldIndex={index} control={control} setValue={setValue} />
      )}
    </div>
  );
}

export function NewDomainSheet({
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
      name: values.name,
      slug: values.slug,
      description: values.description,
      icon: values.icon,
      fields: (values.fields ?? []).map((f, i) => ({
        name: f.name,
        type: f.type,
        slug: toFieldSlug(f.name),
        position: i,
        options:
          f.type === "single_select"
            ? {
                choices: (f.choices ?? []).map((label) => ({
                  value: toFieldSlug(label),
                  label,
                })),
              }
            : undefined,
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
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent className="sm:max-w-[520px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-sm font-semibold">New Domain</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Deals"
                autoFocus
                {...register("name")}
              />
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Fields</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => append({ name: "", type: "text", choices: undefined })}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add field
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No fields yet. Add fields to define the structure of this domain.
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <FieldRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      setValue={setValue}
                      remove={() => remove(index)}
                      error={errors.fields?.[index] as { name?: { message?: string } } | undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 text-primary-foreground" />}
              Create Domain
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
