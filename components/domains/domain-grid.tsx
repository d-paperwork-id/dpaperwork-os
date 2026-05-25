"use client";

import { useState } from "react";
import {
  PenLine,
  Plus,
  Loader2,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecordSheet } from "@/components/domains/record-sheet";
import { FilterPanel, type FilterCondition } from "@/components/domains/filter-panel";

type SelectChoice = { value: string; label: string };

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
  domainId: string;
  fields: DomainField[];
  records: DomainRecord[];
  total: number;
  page: number;
  pageSize: number;
  filters: FilterCondition[];
  isFetching?: boolean;
  queryKey: unknown[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onFiltersChange: (filters: FilterCondition[]) => void;
}

const FIELD_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type,
  long_text: AlignLeft,
  number: Hash,
  date: Calendar,
  single_select: ChevronDown,
};

function FieldTypeIcon({ type }: { type: string }) {
  const Icon = FIELD_TYPE_ICONS[type];
  if (!Icon) return null;
  return <Icon className="w-3 h-3 shrink-0" />;
}

function CellRead({ field, value, isPrimary }: { field: DomainField; value: unknown; isPrimary: boolean }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/50">—</span>;
  }
  return (
    <span className={cn(isPrimary && "font-medium")}>
      {String(value)}
    </span>
  );
}

function CellEdit({
  field,
  value,
  onSave,
  onCancel,
}: {
  field: DomainField;
  value: unknown;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const choices =
    field.type === "single_select"
      ? ((field.options as { choices?: SelectChoice[] } | null)?.choices ?? [])
      : [];

  function commit() {
    if (field.type === "number") {
      const n = parseFloat(draft);
      onSave(isNaN(n) ? null : n);
    } else {
      onSave(draft === "" ? null : draft);
    }
  }

  if (field.type === "single_select") {
    return (
      <Select
        value={String(value ?? "")}
        onValueChange={(v) => onSave(v)}
        open
        onOpenChange={(open) => { if (!open) onCancel(); }}
      >
        <SelectTrigger className="h-full border-0 rounded-none focus:ring-0 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <input
      autoFocus
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      className="w-full h-full px-3 bg-background border border-primary rounded-sm outline-none text-sm ring-2 ring-primary/20"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}

function EditableCell({
  field,
  record,
  domainId,
  queryKey,
  isPrimary,
}: {
  field: DomainField;
  record: DomainRecord;
  domainId: string;
  queryKey: unknown[];
  isPrimary: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  async function save(newValue: unknown) {
    setEditing(false);
    const currentValue = record.fields[field.slug];
    if (newValue === currentValue) return;

    const res = await fetch(`/api/domains/${domainId}/records/${record.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { [field.slug]: newValue } }),
    });

    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    queryClient.invalidateQueries({ queryKey });
  }

  return (
    <td
      className={cn(
        "h-10 px-0 border-b border-border relative group/cell",
        !editing && "cursor-cell hover:bg-accent/50"
      )}
      onClick={() => !editing && setEditing(true)}
    >
      {editing ? (
        <CellEdit
          field={field}
          value={record.fields[field.slug]}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <span className="px-3 text-sm text-foreground block truncate">
          <CellRead field={field} value={record.fields[field.slug]} isPrimary={isPrimary} />
        </span>
      )}
    </td>
  );
}

export function DomainGrid({
  domainId,
  fields,
  records,
  total,
  page,
  pageSize,
  filters,
  isFetching = false,
  queryKey,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
}: Props) {
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add");
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeRecord = records.find((r) => r.id === activeRecordId);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function openAdd() {
    setSheetMode("add");
    setActiveRecordId(null);
    setSheetOpen(true);
  }

  function openEdit(record: DomainRecord) {
    setSheetMode("edit");
    setActiveRecordId(record.id);
    setSheetOpen(true);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <FilterPanel
            fields={fields}
            filters={filters}
            onChange={(f) => {
              onFiltersChange(f);
              onPageChange(1);
            }}
          />
          {isFetching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5" />
          Add Record
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-4 py-3 min-h-0">
        <div className="h-full rounded-lg border border-border overflow-hidden flex flex-col">
      <ScrollArea className="flex-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {fields.map((f, i) => (
                <th
                  key={f.id}
                  className={cn(
                    "h-9 px-3 text-left border-b border-border bg-muted/60 sticky top-0 z-10 whitespace-nowrap",
                    i === 0 && "min-w-[180px]"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FieldTypeIcon type={f.type} />
                    {f.name}
                  </span>
                </th>
              ))}
              <th className="h-9 w-10 border-b border-border bg-muted/60 sticky top-0 z-10" />
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length + 1}
                  className="py-16 text-center"
                >
                  <p className="text-sm text-muted-foreground">No records</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {filters.some((f) => f.value !== "")
                      ? "No records match the current filters"
                      : "Click Add Record or the row below to get started"}
                  </p>
                </td>
              </tr>
            )}

            {records.map((record) => (
              <tr
                key={record.id}
                className={cn(
                  "group hover:bg-accent/40 transition-colors",
                  activeRecordId === record.id && sheetOpen
                    ? "bg-accent/60 border-l-2 border-l-primary"
                    : "border-l-2 border-l-transparent"
                )}
              >
                {fields.map((f, i) => (
                  <EditableCell
                    key={f.id}
                    field={f}
                    record={record}
                    domainId={domainId}
                    queryKey={queryKey}
                    isPrimary={i === 0}
                  />
                ))}
                <td className="h-10 border-b border-border w-10 px-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(record);
                    }}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span className="sr-only">Edit record</span>
                  </Button>
                </td>
              </tr>
            ))}

            {/* New Record row */}
            <tr
              className="group cursor-pointer hover:bg-accent/40 transition-colors"
              onClick={openAdd}
            >
              <td
                colSpan={fields.length + 1}
                className="h-9 px-3 border-t border-dashed border-border"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                  <Plus className="w-3 h-3" />
                  New Record
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
        </div>
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {total === 0
            ? "No records"
            : `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground tabular-nums mr-1">
            Page {page} of {pageCount}
          </span>

          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-7 w-[90px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page * pageSize >= total}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>

      <RecordSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        domainId={domainId}
        fields={fields}
        record={sheetMode === "edit" ? activeRecord : undefined}
        queryKey={queryKey}
      />
    </div>
  );
}
