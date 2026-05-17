"use server";

// Supabase Auth server actions for Ship 2.2a — real email/password auth.
//
// This is app-side auth only: it signs the operator in against the existing
// Supabase project. It does NOT run migrations or change RLS — the database is
// still on permissive policies until the Ship 2.2b cutover.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;

// Maps a Supabase Auth error to something an operator can act on, without
// revealing whether a given email is registered.
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match. Check them and try again.";
  }
  if (m.includes("email not confirmed")) {
    return "This account isn't confirmed yet. Check your inbox for the confirmation link.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  return "Couldn't sign in. Try again in a moment.";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  // Drop any cached render produced while signed out, then enter the app.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
