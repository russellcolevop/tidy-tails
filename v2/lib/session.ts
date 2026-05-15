// Placeholder session handling for Ship 2.1.
//
// This is a deliberately thin cookie gate so the authenticated-shell UX exists
// and `proxy.ts` has something to check. It is NOT real authentication.
//
// Ship 2.2 replaces this with Supabase Auth (email/password, SSR cookie
// session, RLS scoped to groomer_id = auth.uid()) — see the design-lock spec
// §3.2 and the Ship 2.1 scaffold addendum.

export const SESSION_COOKIE = "tt_v2_session";
export const SESSION_VALUE = "placeholder";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
