import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mb-4 h-16 w-16 rounded-2xl" />
        <h1 className="text-2xl font-bold text-ink">Tidy Tails</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Sign in to your grooming book
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
