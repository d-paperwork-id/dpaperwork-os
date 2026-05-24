import { PageHeader } from "@/components/page-header";

export default function InboxPage() {
  return (
    <>
      <PageHeader title="Inbox" />
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-lg border border-border bg-card p-4 max-w-md">
          <p className="text-sm font-medium text-card-foreground mb-1">Welcome to dpaperwork</p>
          <p className="text-sm text-muted-foreground">
            Your workspace is ready. Your Chief of Staff will start surfacing items here as your
            agents get to work.
          </p>
        </div>
      </div>
    </>
  );
}
