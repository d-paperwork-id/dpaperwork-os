import { Construction } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const REQUEST_EMAIL = "sam613263@gmail.com";
const MAILTO = `mailto:${REQUEST_EMAIL}?subject=Feature%20Request%3A%20Early%20Access&body=Hi%2C%0A%0AI%27d%20like%20to%20request%20access%20to%20this%20feature%20in%20dpaperwork.%0A%0APlease%20let%20me%20know%20when%20it%27s%20available.%0A%0AThanks`;

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-muted-foreground">
        <Construction className="w-10 h-10" />
      </div>
      <h1 className="text-sm font-medium text-foreground mb-1">
        This page is coming soon
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        We&apos;re still building this. Request early access and we&apos;ll let
        you know when it&apos;s ready.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <a href={MAILTO}>Request access</a>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
