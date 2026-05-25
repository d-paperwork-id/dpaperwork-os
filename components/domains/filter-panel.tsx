"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectChoice = { value: string; label: string };

interface DomainField {
  id: string;
  slug: string;
  name: string;
  type: string;
  options?: { choices?: SelectChoice[] } | null;
}

export interface FilterCondition {
  field: string;
  value: string;
}

interface Props {
  fields: DomainField[];
  filters: FilterCondition[];
  onChange: (filters: FilterCondition[]) => void;
}

export function FilterPanel({ fields, filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function addFilter() {
    if (fields.length === 0) return;
    onChange([...filters, { field: fields[0].slug, value: "" }]);
  }

  function updateFilter(index: number, patch: Partial<FilterCondition>) {
    const next = filters.map((f, i) => (i === index ? { ...f, ...patch } : f));
    // Reset value when field changes
    if (patch.field !== undefined) {
      next[index] = { field: patch.field, value: "" };
    }
    onChange(next);
  }

  function removeFilter(index: number) {
    onChange(filters.filter((_, i) => i !== index));
  }

  function clearAll() {
    onChange([]);
    setOpen(false);
  }

  const activeCount = filters.filter((f) => f.value !== "").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeCount > 0 ? `Filter · ${activeCount}` : "Filter"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[420px] p-4" align="start">
        <div className="space-y-3">
          {filters.length === 0 && (
            <p className="text-sm text-muted-foreground">No filters applied.</p>
          )}

          {filters.map((cond, i) => {
            const selectedField = fields.find((f) => f.slug === cond.field) ?? fields[0];
            const choices =
              selectedField?.type === "single_select"
                ? ((selectedField.options as { choices?: SelectChoice[] } | null)?.choices ?? [])
                : [];

            const isTextType = selectedField?.type === "text" || selectedField?.type === "long_text";
            const operatorLabel = isTextType ? "contains" : "is";

            return (
              <div key={i} className="flex items-center gap-2">
                {/* Field picker */}
                <Select
                  value={cond.field}
                  onValueChange={(v) => updateFilter(i, { field: v })}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.slug} value={f.slug} className="text-xs">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-xs text-muted-foreground shrink-0">{operatorLabel}</span>

                {/* Value input by type */}
                {selectedField?.type === "single_select" ? (
                  <Select
                    value={cond.value || undefined}
                    onValueChange={(v) => updateFilter(i, { value: v })}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Select value…" />
                    </SelectTrigger>
                    <SelectContent>
                      {choices.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="flex-1 h-8 text-xs"
                    type={selectedField?.type === "number" ? "number" : selectedField?.type === "date" ? "date" : "text"}
                    placeholder="Value…"
                    value={cond.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                  />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFilter(i)}
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="sr-only">Remove filter</span>
                </Button>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addFilter}>
              + Add filter
            </Button>
            {filters.length > 0 && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={clearAll}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
