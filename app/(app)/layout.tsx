import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NewThreadProvider } from "@/components/new-thread-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <NewThreadProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 min-h-0 overflow-hidden">
          {children}
        </SidebarInset>
      </NewThreadProvider>
    </SidebarProvider>
  );
}
