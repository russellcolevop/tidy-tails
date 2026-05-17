import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/tidy-tails-logo.jpg"
          alt="Tidy Tails"
          className="h-40 w-40 rounded-2xl border border-line shadow-sm"
        />
        <h1 className="sr-only">Tidy Tails</h1>
        <p className="mt-5 text-sm text-ink-soft">
          Sign in to your grooming book
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
