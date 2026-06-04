"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type InviteData = {
  workspaceName: string;
  inviterName: string;
  email: string;
  status: string;
};

type InviteErrorKind = "accepted" | "revoked" | "expired" | "invalid";

function errorMessage(kind: InviteErrorKind) {
  if (kind === "accepted") return "This invite has already been accepted.";
  if (kind === "revoked") return "This invite has been revoked by the workspace admin.";
  if (kind === "expired") return "This invite link has expired.";
  return "This invite link is invalid or has expired.";
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState<InviteErrorKind | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const kind = (body.error as InviteErrorKind | undefined) ?? "invalid";
          setInviteError(["accepted", "revoked", "expired"].includes(kind) ? kind : "invalid");
        } else {
          setInvite(body);
        }
      })
      .catch(() => setInviteError("invalid"))
      .finally(() => setInviteLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 410) {
          setInviteError("accepted");
          return;
        }
        setAcceptError(body.error ?? "Failed to accept invite. Please try again.");
        return;
      }
      localStorage.removeItem("pending_invite_token");
      if (body.alreadyMember) {
        router.push("/inbox");
        return;
      }
      toast.success(`Welcome to ${invite?.workspaceName}!`);
      router.push("/inbox");
    } catch {
      setAcceptError("Failed to accept invite. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await fetch(`/api/invite/${token}/decline`, { method: "POST" });
    } finally {
      localStorage.removeItem("pending_invite_token");
      setDeclining(false);
      router.push("/");
    }
  }

  const isLoading = inviteLoading || sessionPending;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        backgroundColor: "var(--background)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <p
          style={{
            fontSize: "16px",
            fontWeight: "700",
            letterSpacing: "-0.01em",
            marginBottom: "32px",
            color: "var(--foreground)",
          }}
        >
          dpaperwork
        </p>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ) : inviteError ? (
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--foreground)",
              }}
            >
              {inviteError === "accepted" ? "Invite already used" : "Invite unavailable"}
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "14px" }}>
              {errorMessage(inviteError)}
            </p>
          </div>
        ) : invite && !session ? (
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--foreground)",
              }}
            >
              You&apos;ve been invited to join {invite.workspaceName}
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "14px", marginBottom: "24px" }}>
              {invite.inviterName} has invited you to join their workspace.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                onClick={() => {
                  localStorage.setItem("pending_invite_token", token);
                  router.push(`/register?callbackURL=/invite/${token}`);
                }}
              >
                Create account
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem("pending_invite_token", token);
                  router.push(`/login?callbackURL=/invite/${token}`);
                }}
              >
                Sign in
              </Button>
            </div>
          </div>
        ) : invite && session ? (
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--foreground)",
              }}
            >
              Join {invite.workspaceName}
            </h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "14px", marginBottom: "24px" }}>
              {invite.inviterName} has invited you to join their workspace on dpaperwork.
            </p>
            {acceptError && (
              <p
                style={{
                  color: "var(--destructive)",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                {acceptError}
              </p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={handleAccept} disabled={accepting || declining}>
                {accepting ? "Accepting…" : "Accept invite"}
              </Button>
              <Button variant="outline" onClick={handleDecline} disabled={accepting || declining}>
                {declining ? "Declining…" : "Decline"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
