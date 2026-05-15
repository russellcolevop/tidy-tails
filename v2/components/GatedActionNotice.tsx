// Shown inside the groom-logging and reminder flows. This scaffold builds the
// full UI of those flows but deliberately does not save or send anything —
// writes are gated until auth + the RLS migration ship (Ship 2.2 / 2.4 / 2.5).

export function GatedActionNotice({ action }: { action: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-canvas p-3 text-ink-soft">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="text-xs leading-relaxed">
        {action} is turned off in this read-only build. The flow above is fully
        designed — it starts saving once authentication and the database security
        migration are approved.
      </p>
    </div>
  );
}
