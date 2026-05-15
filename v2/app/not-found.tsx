import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">
        Tidy Tails
      </p>
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="max-w-sm text-ink-soft">
        That client or page does not exist. It may have been removed, or the link
        was mistyped.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-white"
      >
        Back to search
      </Link>
    </main>
  );
}
