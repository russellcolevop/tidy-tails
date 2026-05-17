"use client";

import { useMemo, useState } from "react";
import { searchHouseholds, type SearchHousehold } from "@/lib/search";
import { HouseholdCard, type HouseholdCardData } from "./HouseholdCard";

// The Call/Text → Identify → Book wedge (PRD §1.1). Sam types one clue — a
// phone number, an owner's first or last name, a pet name, or a partial/typo'd
// fragment — and pulls up the matching households, ranked. Matching and
// ranking live in lib/search.ts (pure, unit-tested); this component is the
// search box and the result list.

export function ClientSearch({
  households,
}: {
  households: HouseholdCardData[];
}) {
  const [query, setQuery] = useState("");

  const byId = useMemo(
    () => new Map(households.map((h) => [h.id, h])),
    [households],
  );

  // The lean shape lib/search.ts matches against — just the searchable fields.
  const searchIndex = useMemo<SearchHousehold[]>(
    () =>
      households.map((h) => ({
        id: h.id,
        firstName: h.firstName,
        lastName: h.lastName,
        phone: h.phone,
        pets: h.pets.map((p) => ({ id: p.id, name: p.name })),
      })),
    [households],
  );

  const results = useMemo(
    () => searchHouseholds(query, searchIndex),
    [query, searchIndex],
  );

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
          placeholder="Search a name, phone, or pet"
          aria-label="Search households by owner name, phone, or pet name"
          className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-base text-ink placeholder:text-ink-faint"
        />
      </div>

      <p className="mt-3 px-1 text-xs text-ink-faint">
        {results.length} {results.length === 1 ? "household" : "households"}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>

      {results.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-soft">
          No households match that search.
        </p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-2.5">
          {results.map((result) => {
            const household = byId.get(result.household.id);
            if (!household) return null;
            return (
              <li key={result.household.id}>
                <HouseholdCard
                  household={household}
                  matchedPetIds={result.matchedPetIds}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
