// Read-only Supabase client for the optional live-data path.
//
// SAFETY: this client is ONLY ever used to run `.select()` queries (see repo.ts).
// It is never instantiated unless NEXT_PUBLIC_USE_LIVE_DATA=on. No write method
// (.insert / .update / .delete / .rpc) is called anywhere in v2 Ship 2.1.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getReadOnlySupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Live data was requested (NEXT_PUBLIC_USE_LIVE_DATA=on) but " +
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
        "Copy .env.local.example to .env.local and fill them in, or remove the flag " +
        "to use the bundled fixtures.",
    );
  }

  if (!cached) {
    cached = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
