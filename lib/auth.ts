import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import VerificationEmail from "@/emails/verification";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    callbackURL: "/onboarding",
    sendVerificationEmail: async ({ user, url }) => {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const html = await render(React.createElement(VerificationEmail, { url }));
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email,
        subject: "Verify your email",
        html,
      });
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    camelCase: true,
  }),
  plugins: [nextCookies()],
});
