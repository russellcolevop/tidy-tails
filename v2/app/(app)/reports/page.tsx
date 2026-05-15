import type { Metadata } from "next";
import Link from "next/link";
import { loadDataset } from "@/lib/data/repo";
import { lapsedClients, revenueInRange, vaccinationState } from "@/lib/derive";
import {
  formatDate,
  formatMoney,
  formatPhone,
  fullName,
  relativeDate,
} from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

const LAPSED_THRESHOLD_DAYS = 90;

function parseMonth(raw: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthKey(year: number, month: number, delta: number): string {
  const d = new Date(year, month + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);
  const { clients, pets, appointments, vaccinations } = await loadDataset();

  const from = `${year}-${pad(month + 1)}-01`;
  const to = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
  const revenue = revenueInRange(appointments, from, to);

  const lapsed = lapsedClients(clients, appointments, pets, LAPSED_THRESHOLD_DAYS);

  const vaxAlerts = vaccinations
    .map((v) => ({ v, state: vaccinationState(v) }))
    .filter((x) => x.state === "expired" || x.state === "expiring")
    .map((x) => {
      const pet = pets.find((p) => p.id === x.v.pet_id);
      const client = pet ? clients.find((c) => c.id === pet.client_id) : undefined;
      return { ...x, pet, client };
    })
    .filter((x) => x.pet && x.client)
    .sort((a, b) => a.v.expires_at.localeCompare(b.v.expires_at));

  return (
    <main className="px-4 py-5">
      <h1 className="text-xl font-bold text-ink">Reports</h1>

      {/* Revenue ------------------------------------------------------------ */}
      <section className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Revenue
          </h2>
          <div className="flex items-center gap-1">
            <Link
              href={`/reports?month=${monthKey(year, month, -1)}`}
              aria-label="Previous month"
              className="rounded-lg border border-line bg-surface px-2 py-1 text-ink-soft"
            >
              ‹
            </Link>
            <span className="min-w-[7.5rem] text-center text-sm font-semibold text-ink">
              {monthLabel}
            </span>
            <Link
              href={`/reports?month=${monthKey(year, month, 1)}`}
              aria-label="Next month"
              className="rounded-lg border border-line bg-surface px-2 py-1 text-ink-soft"
            >
              ›
            </Link>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <StatTile label="Appointments" value={String(revenue.count)} />
          <StatTile label="Gross" value={formatMoney(revenue.gross)} />
          <StatTile label="Average" value={formatMoney(revenue.average)} />
        </div>
      </section>

      {/* Lapsed clients ----------------------------------------------------- */}
      <section className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          Lapsed clients
        </h2>
        <p className="mb-2 text-xs text-ink-faint">
          No visit in {LAPSED_THRESHOLD_DAYS}+ days · {lapsed.length} client
          {lapsed.length === 1 ? "" : "s"}
        </p>
        {lapsed.length === 0 ? (
          <p className="text-sm text-ink-faint">Everyone has been seen recently.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lapsed.map((row) => (
              <li key={row.client.id}>
                <Link
                  href={`/clients/${row.client.id}`}
                  className="block rounded-xl border border-line bg-surface px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">
                      {fullName(row.client.first_name, row.client.last_name)}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-warn">
                      {row.daysSince != null ? `${row.daysSince} days` : "never"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">
                    {row.pets.map((p) => p.name).join(", ") || "No pets on file"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {row.lastVisit
                      ? `Last groom ${formatDate(row.lastVisit.date)}`
                      : "No visits recorded"}
                    {" · "}
                    {formatPhone(row.client.phone)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Vaccination alerts ------------------------------------------------- */}
      <section className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          Vaccination alerts
        </h2>
        <p className="mb-2 text-xs text-ink-faint">
          Expired or expiring within 30 days · {vaxAlerts.length} record
          {vaxAlerts.length === 1 ? "" : "s"}
        </p>
        {vaxAlerts.length === 0 ? (
          <p className="text-sm text-ink-faint">
            No vaccinations need attention.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vaxAlerts.map(({ v, state, pet, client }) => (
              <li key={v.id}>
                <Link
                  href={`/clients/${client!.id}/pets/${pet!.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {pet!.name}{" "}
                      <span className="font-normal text-ink-soft">
                        · {v.vaccine_type}
                      </span>
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      {fullName(client!.first_name, client!.last_name)} ·{" "}
                      {relativeDate(v.expires_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      state === "expired"
                        ? "bg-danger-soft text-danger-ink"
                        : "bg-warn-soft text-warn"
                    }`}
                  >
                    {state === "expired" ? "Expired" : "Expiring"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-7 text-center text-xs text-ink-faint">
        Reports are read-only. CSV export and an adjustable lapsed threshold
        arrive with the Settings write flows.
      </p>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-3 text-center">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
