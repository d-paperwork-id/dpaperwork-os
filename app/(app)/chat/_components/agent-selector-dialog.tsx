"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Agent = { id: string; label: string };

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  const data = await res.json();
  return data.agents;
}

async function createThread(agentId: string): Promise<{ id: string }> {
  const res = await fetch("/api/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  const data = await res.json();
  return data.thread;
}

interface AgentSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentSelectorDialog({ open, onOpenChange }: AgentSelectorDialogProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    enabled: open,
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: createThread,
    onSuccess: (thread) => {
      onOpenChange(false);
      setSelected(null);
      router.push(`/chat/${thread.id}`);
    },
  });

  function handleSelect(agentId: string) {
    setSelected(agentId);
    create(agentId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose an agent</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-5 h-5" />
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="flex flex-col gap-1.5 py-1">
            {agents.map((agent) => (
              <Button
                key={agent.id}
                variant="ghost"
                className="justify-start gap-3 h-auto py-3 px-3"
                disabled={isPending}
                onClick={() => handleSelect(agent.id)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `var(--agent-${agent.id}, hsl(var(--primary)))` }}
                >
                  {agent.label.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 text-left text-sm">{agent.label}</span>
                {selected === agent.id && isPending && <Spinner className="w-4 h-4" />}
                {selected === agent.id && !isPending && <Check className="w-4 h-4" />}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Bot className="w-8 h-8" />
            <span>No agents assigned to this workspace.</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
