"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, Mail, RefreshCw, X } from "lucide-react";

type Role = { id: string; name: string };
type Member = {
  id: string;
  userId: string;
  roleId: string | null;
  roleName: string | null;
  joinedAt: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
};
type Invitation = {
  id: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  status: string;
  invitedByUserName: string | null;
  createdAt: string;
  expiresAt: string;
};

function useRoles() {
  return useQuery<{ roles: Role[] }>({
    queryKey: ["settings", "roles"],
    queryFn: () => fetch("/api/settings/roles").then((r) => r.json()),
  });
}

function useMembers() {
  return useQuery<{ members: Member[] }>({
    queryKey: ["settings", "members"],
    queryFn: () => fetch("/api/settings/members").then((r) => r.json()),
  });
}

function usePendingInvitations() {
  return useQuery<{ invitations: Invitation[] }>({
    queryKey: ["settings", "invitations"],
    queryFn: () => fetch("/api/settings/invitations").then((r) => r.json()),
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MembersPage() {
  const { data: membersData, isLoading: membersLoading } = useMembers();
  const { data: rolesData } = useRoles();
  const { data: invitationsData } = usePendingInvitations();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");

  const roles = rolesData?.roles ?? [];
  const defaultRoleId = roles.find((r) => r.name === "Member")?.id ?? roles[0]?.id ?? "";
  const pendingInvitations = invitationsData?.invitations ?? [];

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, roleId: inviteRoleId || defaultRoleId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to send invite");
      }
    },
    onSuccess: () => {
      toast.success("Invite sent");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRoleId("");
      queryClient.invalidateQueries({ queryKey: ["settings", "invitations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleId }: { memberId: string; roleId: string }) => {
      const res = await fetch(`/api/settings/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update role");
      }
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["settings", "members"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/settings/invitations/${inviteId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to revoke invite");
      }
    },
    onSuccess: () => {
      toast.success("Invite revoked");
      queryClient.invalidateQueries({ queryKey: ["settings", "invitations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resendMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/settings/invitations/${inviteId}/resend`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to resend invite");
      }
    },
    onSuccess: () => toast.success("Invite resent"),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {membersData?.members.length ?? 0} member{membersData?.members.length === 1 ? "" : "s"}
          </p>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite member
          </Button>
        </div>

        <div className="border border-border rounded-md divide-y divide-border">
          {membersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
            ))
          ) : (membersData?.members ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No members yet.</p>
          ) : (
            (membersData?.members ?? []).map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.userImage ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(member.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                </div>
                <Select
                  defaultValue={member.roleId ?? ""}
                  onValueChange={(roleId) =>
                    updateRoleMutation.mutate({ memberId: member.id, roleId })
                  }
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id} className="text-xs">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>
      </div>

      {pendingInvitations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Pending invites</p>
          <div className="border border-border rounded-md divide-y divide-border">
            {pendingInvitations.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {invite.roleName ?? "No role"} · Invited{" "}
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    disabled={resendMutation.isPending}
                    onClick={() => resendMutation.mutate(invite.id)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(invite.id)}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRoleId || defaultRoleId}
                onValueChange={setInviteRoleId}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending invite…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
