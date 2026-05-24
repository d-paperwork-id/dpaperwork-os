import { SidebarTrigger } from "@/components/ui/sidebar";

type Props = {
  title: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, children }: Props) {
  return (
    <header className="h-12 px-6 flex items-center justify-between border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-sm font-medium text-foreground">{title}</h1>
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </header>
  );
}
