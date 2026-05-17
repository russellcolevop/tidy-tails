// Browser-side Supabase client for the Next.js App Router.
//
// Ship 2.2a does all auth on the server (Server Functions + the proxy), so this
// is not yet consumed by any component. It is the client half of the
// server/client pair: later ships that need client-side Supabase access
// (realtime, optimistic UI) have one correct place to obtain a client.

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCredentials } from "./env";

export function createBrowserSupabase() {
  const { url, anonKey } = getSupabaseCredentials();
  return createBrowserClient(url, anonKey);
}
