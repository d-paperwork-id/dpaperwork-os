"use client";

import { useNewThread } from "@/components/new-thread-provider";
import { ThreadListSidebar } from "./_components/thread-list-sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const openNewThread = useNewThread();

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <ThreadListSidebar onNewThread={openNewThread} />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {children}
      </div>
    </div>
  );
}
