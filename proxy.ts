import { NextRequest, NextResponse } from "next/server";

// better-auth sets this cookie on sign-in
const SESSION_COOKIE = "better-auth.session_token";

// Always accessible without auth
const publicRoutes = ["/login", "/register", "/verify-email"];
// Accessible with a session but no workspace yet
const preWorkspaceRoutes = ["/onboarding"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  const hasWorkspace = req.cookies.get("has_workspace")?.value === "1";

  // Root: redirect based on state
  if (pathname === "/") {
    if (hasSession && hasWorkspace) {
      return NextResponse.redirect(new URL("/inbox", req.url));
    }
    if (hasSession) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Onboarding: kick out users who already have a workspace
  if (pathname === "/onboarding" && hasSession && hasWorkspace) {
    return NextResponse.redirect(new URL("/inbox", req.url));
  }

  // Public routes: no auth needed
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // All remaining routes require a session
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Pre-workspace routes: session required but workspace not yet needed
  if (preWorkspaceRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // App routes: require workspace
  if (!hasWorkspace) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$).*)"],
};
