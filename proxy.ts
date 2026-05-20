import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

async function hasWorkspace(userId: string): Promise<boolean> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT id FROM workspace WHERE user_id = ${userId} LIMIT 1`;
  return rows.length > 0;
}

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email";

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isAuthPage) {
    if (pathname === "/verify-email" && !session.user.emailVerified) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && !session.user.emailVerified && pathname !== "/verify-email") {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  if (session && session.user.emailVerified) {
    const workspaceExists = await hasWorkspace(session.user.id);

    if (!workspaceExists && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (workspaceExists && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/workspace|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
