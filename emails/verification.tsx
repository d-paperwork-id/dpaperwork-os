import React from "react";

export default function VerificationEmail({ url }: { url: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Verify your email address</title>
      </head>
      <body
        style={{
          backgroundColor: "#f9fafb",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
              margin: "0 0 12px",
            }}
          >
            Verify your email address
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px" }}>
            Click the button below to verify your email and complete your
            registration.
          </p>
          <a
            href={url}
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
            Verify email
          </a>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "12px",
              margin: "24px 0 0",
            }}
          >
            If you didn&apos;t create an account, you can safely ignore this
            email. The link expires in 1 hour.
          </p>
        </div>
      </body>
    </html>
  );
}
