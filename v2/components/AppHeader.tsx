import Link from "next/link";

// Compact brand mark for the authenticated shell — a small, work-focused strip
// so every screen reads as Tidy Tails without crowding the task. The full logo
// lives on the login screen; in-app this is just the mark plus wordmark.
export function AppHeader() {
  return (
    <header className="flex items-center border-b border-line bg-surface px-4 py-2.5">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="h-6 w-6" />
        <span className="text-sm font-semibold tracking-tight text-ink">
          Tidy Tails
        </span>
      </Link>
    </header>
  );
}
