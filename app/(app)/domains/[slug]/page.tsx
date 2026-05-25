"use client";

import { useState, use } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DomainGrid } from "@/components/domains/domain-grid";
import type { FilterCondition } from "@/components/domains/filter-panel";

interface Domain {
  id: string;
  name: string;
  slug: string;
}

interface DomainField {
  id: string;
  slug: string;
  name: string;
  type: string;
  isRequired: boolean;
  position: number;
  options?: { choices?: { value: string; label: string }[] } | null;
}

interface DomainRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface RecordsResponse {
  fields: DomainField[];
  records: DomainRecord[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchDomains(): Promise<{ domains: Domain[] }> {
  const res = await fetch("/api/domains");
  if (!res.ok) throw new Error("Failed to load domains");
  return res.json();
}

async function fetchRecords(
  domainId: string,
  page: number,
  pageSize: number,
  filters: FilterCondition[]
): Promise<RecordsResponse> {
  const activeFilters = filters.filter((f) => f.value !== "");
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (activeFilters.length > 0) {
    params.set("filters", JSON.stringify(activeFilters));
  }
  const res = await fetch(`/api/domains/${domainId}/records?${params}`);
  if (!res.ok) throw new Error("Failed to load records");
  return res.json();
}

export default function DomainViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const { data: domainsData, isLoading: domainsLoading } = useQuery({
    queryKey: ["domains"],
    queryFn: fetchDomains,
  });

  const domain = domainsData?.domains.find((d) => d.slug === slug);

  // Key off active filters only — empty filter rows don't trigger a refetch
  const activeFilters = filters.filter((f) => f.value !== "");
  const recordsQueryKey = ["domain-records", domain?.id, page, pageSize, activeFilters];

  const {
    data: recordsData,
    isLoading: recordsLoading,
    isFetching: recordsFetching,
    isError,
  } = useQuery({
    queryKey: recordsQueryKey,
    queryFn: () => fetchRecords(domain!.id, page, pageSize, filters),
    enabled: !!domain,
    placeholderData: keepPreviousData,
  });

  const isLoading = domainsLoading || (!!domain && recordsLoading);

  return (
    <>
      <PageHeader title={domain?.name ?? slug} breadcrumb={domain ? undefined : "Not found"} />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="px-6 py-4">
          <Alert>
            <AlertDescription>Failed to load records. Please refresh.</AlertDescription>
          </Alert>
        </div>
      )}

      {domain && recordsData && (
        <DomainGrid
          domainId={domain.id}
          fields={recordsData.fields}
          records={recordsData.records}
          total={recordsData.total}
          page={page}
          pageSize={pageSize}
          filters={filters}
          isFetching={recordsFetching}
          queryKey={recordsQueryKey}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          onFiltersChange={(f) => { setFilters(f); setPage(1); }}
        />
      )}
    </>
  );
}
