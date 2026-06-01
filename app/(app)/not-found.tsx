import { Construction } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

const REQUEST_EMAIL = "sam613263@gmail.com";
const MAILTO = `mailto:${REQUEST_EMAIL}?subject=Feature%20Request%3A%20Early%20Access&body=Hi%2C%0A%0AI%27d%20like%20to%20request%20access%20to%20this%20feature%20in%20dpaperwork.%0A%0APlease%20let%20me%20know%20when%20it%27s%20available.%0A%0AThanks`;

export default function NotFound() {
  return (
    <>
      <PageHeader title="Coming Soon" />
      <div className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyMedia variant="icon">
            <Construction className="w-8 h-8" />
          </EmptyMedia>
          <EmptyTitle>This page is coming soon</EmptyTitle>
          <EmptyDescription>
            We&apos;re still building this. Request early access and we&apos;ll
            let you know when it&apos;s ready.
          </EmptyDescription>
          <EmptyContent className="flex gap-2">
            <Button asChild>
              <a href={MAILTO}>Request access</a>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </>
  );
}
