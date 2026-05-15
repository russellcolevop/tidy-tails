"use server";

// Placeholder auth actions for Ship 2.1.
//
// This is NOT real authentication. The sign-in below accepts any non-empty
// email and sets an opaque session cookie so the authenticated-shell UX exists.
// Ship 2.2 replaces this entirely with Supabase Auth (email/password, SSR
// session, RLS scoped to groomer_id) — see the design-lock spec §3.2.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, SESSION_VALUE } from "@/lib/session";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?error=missing");
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
