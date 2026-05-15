"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { digitsOnly, formatPhone, relativeDate } from "@/lib/format";

export type ClientSummary = {
  id: string;
  name: string;
  phone: string;
  petNames: string[];
  hasAllergy: boolean;
  lastVisit: string | null; // ISO date
};

export function ClientSearch({ summaries }: { summaries: ClientSummary[] }) {
  const [query, setQuery] = useState("");

  const indexed = useMemo(
    () =>
      summaries.map((s) => ({
        summary: s,
        haystack: `${s.name} ${s.petNames.join(" ")}`.toLowerCase(),
        digits: digitsOnly(s.phone),
      })),
    [summaries],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return summaries;
    const qDigits = digitsOnly(q);
    return indexed
      .filter(
        ({ haystack, digits }) =>
          haystack.includes(q) || (qDigits.length > 0 && digits.includes(qDigits)),
      )
      .map((x) => x.summary);
  }, [query, indexed, summaries]);

  return (
    <div>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          autoFocus
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, pet, or phone"
          aria-label="Search clients"
          className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-base text-ink placeholder:text-ink-faint"
        />
      </div>

      <p className="mt-3 px-1 text-xs text-ink-faint">
        {results.length} {results.length === 1 ? "client" : "clients"}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>

      {results.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-soft">
          No clients match that search.
        </p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-2">
          {results.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className="block rounded-xl border border-line bg-surface px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-ink">{c.name}</span>
                  {c.hasAllergy ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger-ink">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-danger"
                        aria-hidden="true"
                      />
                      Allergy
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-sm text-ink-soft">
                  {formatPhone(c.phone)}
                  {c.petNames.length > 0 ? ` · ${c.petNames.join(", ")}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {c.lastVisit
                    ? `Last groom ${relativeDate(c.lastVisit)}`
                    : "No visits recorded yet"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
