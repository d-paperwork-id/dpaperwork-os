"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { NewDomainSheet } from "@/components/domains/new-domain-sheet";
import { getDomainIcon } from "@/components/domains/domain-icons";

interface Domain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  recordCount: number;
}

async function fetchDomains(): Promise<{ domains: Domain[] }> {
  const res = await fetch("/api/domains");
  if (!res.ok) throw new Error("Failed to load domains");
  return res.json();
}

export default function DomainsPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["domains"],
    queryFn: fetchDomains,
  });

  return (
    <>
      <PageHeader title="Domains">
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          New Domain
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}

        {isError && (
          <div className="px-6 py-4">
            <Alert>
              <AlertDescription>Failed to load domains. Please refresh.</AlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && !isError && data?.domains.length === 0 && (
          <Empty>
            <EmptyMedia variant="icon">
              {(() => { const Icon = getDomainIcon(null); return <Icon className="w-8 h-8" />; })()}
            </EmptyMedia>
            <EmptyTitle>No domains yet</EmptyTitle>
            <EmptyDescription>
              Create your first domain to organize and track your data.
            </EmptyDescription>
            <EmptyContent>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                New Domain
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && !isError && (data?.domains.length ?? 0) > 0 && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data!.domains.map((domain) => {
              const Icon = getDomainIcon(domain.icon);
              return (
                <button
                  key={domain.id}
                  onClick={() => router.push(`/domains/${domain.slug}`)}
                  className="group text-left rounded-xl border border-border bg-background p-5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-[18px] h-[18px] text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {domain.name}
                      </p>
                      {domain.description ? (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {domain.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 mt-1">No description</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {domain.recordCount.toLocaleString()}{" "}
                      {domain.recordCount === 1 ? "record" : "records"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <NewDomainSheet open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
