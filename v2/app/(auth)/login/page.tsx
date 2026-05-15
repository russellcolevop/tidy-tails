import type { Metadata } from "next";
import { signIn } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mb-4 h-16 w-16 rounded-2xl" />
        <h1 className="text-2xl font-bold text-ink">Tidy Tails</h1>
        <p className="mt-1 text-sm text-ink-soft">Grooming cockpit</p>
      </div>

      <form action={signIn} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">Email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-faint"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-faint"
          />
        </label>

        {error ? (
          <p className="text-sm text-danger">Enter an email to continue.</p>
        ) : null}

        <button
          type="submit"
          className="mt-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white active:bg-brand-ink"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-center text-xs leading-relaxed text-brand-ink">
        Placeholder sign-in for the v2 scaffold. Any email works — no credentials
        are checked or stored. Real Supabase Auth lands in Ship 2.2.
      </p>
    </div>
  );
}
