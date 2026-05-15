// Next.js 16 Proxy (the renamed `middleware`). Placeholder auth gate for
// Ship 2.1: redirects unauthenticated requests to /login.
//
// Ship 2.2 swaps the cookie check for a real Supabase Auth session check.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function proxy(request: NextRequest) {
  const authed = request.cookies.has(SESSION_COOKIE);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!authed && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on app routes only. Anything under _next or any file with an extension
  // (icons, manifest, sw.js) is excluded so static assets load without a gate.
  matcher: ["/((?!_next|.*\\.).*)"],
};
