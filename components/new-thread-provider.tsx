"use client";

import { createContext, useContext, useState } from "react";
import { AgentSelectorDialog } from "@/app/(app)/chat/_components/agent-selector-dialog";
import { CommandPalette } from "@/components/command-palette";

const NewThreadCtx = createContext<() => void>(() => {});

export function useNewThread() {
  return useContext(NewThreadCtx);
}

export function NewThreadProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <NewThreadCtx.Provider value={() => setOpen(true)}>
      {children}
      <CommandPalette onNewThread={() => setOpen(true)} />
      <AgentSelectorDialog open={open} onOpenChange={setOpen} />
    </NewThreadCtx.Provider>
  );
}
