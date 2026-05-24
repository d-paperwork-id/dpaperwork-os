import { Separator } from "@/components/ui/separator";

export default function WorkspaceMemorySettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Memory
        </h2>
        <Separator />
        <p className="text-sm text-muted-foreground mt-4">
          Agent working memory will be visible here in Phase 2. You will be
          able to review, edit, and prune what each agent has learned about
          your workspace.
        </p>
      </div>
    </div>
  );
}
