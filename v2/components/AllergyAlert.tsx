// The pet safety signal. Allergy information is a first-class object in Tidy
// Tails — visually impossible to miss, shown before grooming notes and history.
// (design-lock spec §5.6)

export function AllergyAlert({ detail }: { detail: string | null }) {
  return (
    <div className="rounded-xl border-2 border-danger bg-danger-soft p-3.5">
      <div className="flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-danger"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-sm font-bold uppercase tracking-wide text-danger-ink">
          Allergy — check before grooming
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-danger-ink">
        {detail ?? "This pet has a recorded allergy. Confirm details with the owner."}
      </p>
    </div>
  );
}
