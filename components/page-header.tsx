import { ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Props = {
  title: string;
  breadcrumb?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, breadcrumb, children }: Props) {
  return (
    <header className="h-12 px-6 flex items-center justify-between border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-1.5">
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
          {breadcrumb && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{breadcrumb}</span>
            </>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </header>
  );
}
