import type { Vaccination } from "@/lib/data/types";
import { vaccinationState } from "@/lib/derive";
import { formatDate, relativeDate } from "@/lib/format";
import { StatusPill } from "./StatusPill";

export function VaccinationList({
  vaccinations,
}: {
  vaccinations: Vaccination[];
}) {
  if (vaccinations.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        No vaccination records on file for this pet.
      </p>
    );
  }

  const sorted = [...vaccinations].sort((a, b) =>
    a.expires_at.localeCompare(b.expires_at),
  );

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((v) => {
        const state = vaccinationState(v);
        return (
          <li
            key={v.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink">{v.vaccine_type}</p>
              <p className="text-xs text-ink-soft">
                {state === "expired" ? "Expired" : "Expires"} {formatDate(v.expires_at)}
                {" · "}
                {relativeDate(v.expires_at)}
              </p>
            </div>
            {state === "expired" ? (
              <StatusPill tone="danger">Expired</StatusPill>
            ) : state === "expiring" ? (
              <StatusPill tone="warn">Expiring soon</StatusPill>
            ) : (
              <StatusPill tone="ok">Current</StatusPill>
            )}
          </li>
        );
      })}
    </ul>
  );
}
