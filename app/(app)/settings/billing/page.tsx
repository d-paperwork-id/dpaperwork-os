import { Separator } from "@/components/ui/separator";

export default function BillingSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Billing
        </h2>
        <Separator />
        <p className="text-sm text-muted-foreground mt-4">
          Plan tier, payment method, and usage will be available here in
          Phase 2.
        </p>
      </div>
    </div>
  );
}
