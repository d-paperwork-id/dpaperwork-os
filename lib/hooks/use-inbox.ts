"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type InboxItem = {
  id: string;
  workspaceId: string;
  recipientUserId: string;
  sourceAgentId: "pm" | "chief-of-staff" | "executive-assistant";
  sourceRoutineId: string | null;
  sourceRunId: string | null;
  title: string;
  body: string;
  priority: "low" | "normal" | "high";
  actionChips: Array<{
    label: string;
    action: "open_thread" | "resolve" | "snooze" | "open_record" | "open_routine";
    target_id?: string;
  }>;
  readAt: string | null;
  resolvedAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type InboxFilters = {
  agent?: "pm" | "chief-of-staff" | "executive-assistant";
  status?: "unread" | "all" | "resolved";
};

async function fetchInbox(filters: InboxFilters): Promise<{ items: InboxItem[] }> {
  const params = new URLSearchParams();
  if (filters.agent) params.set("agent", filters.agent);
  if (filters.status) params.set("status", filters.status);
  const res = await fetch(`/api/inbox?${params}`);
  if (!res.ok) throw new Error("Failed to fetch inbox");
  return res.json();
}

export function useInbox(filters: InboxFilters = {}) {
  return useQuery({
    queryKey: ["inbox", filters],
    queryFn: () => fetchInbox(filters),
  });
}

export function useInboxUnreadCount() {
  return useQuery({
    queryKey: ["inbox-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/inbox/unread-count");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json() as Promise<{ count: number }>;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useResolveInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inbox/${id}/resolve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to resolve item");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["inbox"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["inbox"] });
      queryClient.setQueriesData(
        { queryKey: ["inbox"] },
        (old: { items: InboxItem[] } | undefined) =>
          old ? { items: old.items.filter((item) => item.id !== id) } : old
      );
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error("Failed to resolve item. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
    },
  });
}

export function useSnoozeInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, snoozedUntil }: { id: string; snoozedUntil: string }) => {
      const res = await fetch(`/api/inbox/${id}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snoozedUntil }),
      });
      if (!res.ok) throw new Error("Failed to snooze item");
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["inbox"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["inbox"] });
      queryClient.setQueriesData(
        { queryKey: ["inbox"] },
        (old: { items: InboxItem[] } | undefined) =>
          old ? { items: old.items.filter((item) => item.id !== id) } : old
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        context.snapshot.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error("Failed to snooze item. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
    },
  });
}

export function useMarkInboxItemRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/inbox/${id}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
    },
  });
}
