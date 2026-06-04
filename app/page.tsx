"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    const pendingInviteToken = localStorage.getItem("pending_invite_token");
    if (pendingInviteToken) {
      router.replace(`/invite/${pendingInviteToken}`);
      return;
    }

    if (session) {
      router.replace("/inbox");
    } else {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  return null;
}
