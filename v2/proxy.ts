// Next.js 16 Proxy (the renamed `middleware`).
//
// Ship 2.2a: real Supabase Auth. Every app route runs through updateSession,
// which refreshes the SSR session and gates unauthenticated access to /login.

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on app routes only. Anything under _next or any file with an extension
  // (icons, manifest, sw.js) is excluded so static assets load without a gate.
  matcher: ["/((?!_next|.*\\.).*)"],
};
