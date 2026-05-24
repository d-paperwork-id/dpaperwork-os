import { Separator } from "@/components/ui/separator";

export default function WorkspaceContextSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Context
        </h2>
        <Separator />
        <p className="text-sm text-muted-foreground mt-4">
          The CONTEXT.md editor will be available here in Phase 1. It lets you
          describe your business so agents can reference it in every task they
          run.
        </p>
      </div>
    </div>
  );
}
