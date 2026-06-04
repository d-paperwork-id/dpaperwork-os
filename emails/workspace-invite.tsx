import React from "react";

type Props = {
  workspaceName: string;
  inviterName: string;
  acceptUrl: string;
};

export default function WorkspaceInviteEmail({ workspaceName, inviterName, acceptUrl }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>You&apos;ve been invited to {workspaceName}</title>
      </head>
      <body
        style={{
          backgroundColor: "#f9fafb",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "40px 32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 24px",
              letterSpacing: "-0.01em",
            }}
          >
            dpaperwork
          </p>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
              margin: "0 0 12px",
            }}
          >
            You&apos;ve been invited to join {workspaceName}
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.6" }}>
            {inviterName} has invited you to join their workspace on dpaperwork. Click the button
            below to accept the invite and get started.
          </p>
          <a
            href={acceptUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#111827",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "500",
              padding: "10px 24px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Accept invite
          </a>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e5e7eb",
              margin: "24px 0",
            }}
          />
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
            Or copy this link into your browser:{" "}
            <a href={acceptUrl} style={{ color: "#6b7280", wordBreak: "break-all" }}>
              {acceptUrl}
            </a>
          </p>
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: "12px 0 0" }}>
            This invite link expires in 7 days. If you didn&apos;t expect this invitation, you can
            safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  );
}
