// Derived computations: lapsed clients, vaccination status, revenue.
// All pure — no data access. Callers pass in the records they already loaded.

import type { Appointment, Client, Pet, Vaccination } from "./data/types";
import { daysFromToday } from "./format";

/** Most recent appointment in a list, or null. */
export function lastAppointment(appointments: Appointment[]): Appointment | null {
  if (appointments.length === 0) return null;
  return [...appointments].sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** Newest-first copy of an appointment list. */
export function sortByDateDesc(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => b.date.localeCompare(a.date));
}

/** Whole days since this client was last seen, or null if never. */
export function daysSinceLastVisit(appointments: Appointment[]): number | null {
  const last = lastAppointment(appointments);
  if (!last) return null;
  return -daysFromToday(last.date);
}

/**
 * The service a pet usually gets — the most frequently booked one. A frequency
 * tie is broken toward the service on the most recent appointment, so "usual"
 * tracks what Sam is doing lately. Null when there is no history.
 */
export function usualService(appointments: Appointment[]): string | null {
  if (appointments.length === 0) return null;

  const counts = new Map<string, number>();
  for (const a of appointments) {
    counts.set(a.service, (counts.get(a.service) ?? 0) + 1);
  }
  const max = Math.max(...counts.values());
  const topServices = new Set(
    [...counts].filter(([, n]) => n === max).map(([service]) => service),
  );
  if (topServices.size === 1) return [...topServices][0];

  // Tie: pick the tied service seen on the most recent appointment.
  for (const a of sortByDateDesc(appointments)) {
    if (topServices.has(a.service)) return a.service;
  }
  return null; // unreachable — topServices is non-empty
}

/**
 * The price a pet's groom usually costs — the median of past prices. Median,
 * not average or most-recent, so a one-off high or low charge does not skew the
 * figure Sam quotes on a call. Null when there is no history.
 */
export function usualPrice(appointments: Appointment[]): number | null {
  if (appointments.length === 0) return null;

  const prices = appointments.map((a) => a.price).sort((x, y) => x - y);
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 === 0
    ? (prices[mid - 1] + prices[mid]) / 2
    : prices[mid];
}

export type LapsedClient = {
  client: Client;
  pets: Pet[];
  lastVisit: Appointment | null;
  daysSince: number | null;
};

/** Clients with no appointment within `thresholdDays`. Most-overdue first. */
export function lapsedClients(
  clients: Client[],
  appointments: Appointment[],
  pets: Pet[],
  thresholdDays: number,
): LapsedClient[] {
  return clients
    .map((client) => {
      const own = appointments.filter((a) => a.client_id === client.id);
      const last = lastAppointment(own);
      const daysSince = daysSinceLastVisit(own);
      return {
        client,
        pets: pets.filter((p) => p.client_id === client.id),
        lastVisit: last,
        daysSince,
      };
    })
    .filter((row) => row.daysSince == null || row.daysSince >= thresholdDays)
    .sort((a, b) => (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity));
}

export type VaxState = "current" | "expiring" | "expired" | "unknown";

/** Status of a single vaccination record. "expiring" = within 30 days. */
export function vaccinationState(vax: Vaccination): VaxState {
  const days = daysFromToday(vax.expires_at);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "current";
}

/** Worst status across a pet's vaccination records. */
export function petVaccinationState(records: Vaccination[]): VaxState {
  if (records.length === 0) return "unknown";
  const states = records.map(vaccinationState);
  if (states.includes("expired")) return "expired";
  if (states.includes("expiring")) return "expiring";
  return "current";
}

export type RevenueSummary = {
  count: number;
  gross: number;
  average: number;
};

/** Totals for appointments whose date falls within [from, to] inclusive. */
export function revenueInRange(
  appointments: Appointment[],
  from: string,
  to: string,
): RevenueSummary {
  const inRange = appointments.filter((a) => a.date >= from && a.date <= to);
  const gross = inRange.reduce((sum, a) => sum + a.price, 0);
  return {
    count: inRange.length,
    gross,
    average: inRange.length ? gross / inRange.length : 0,
  };
}

/** First and last day of the month containing `ref` (defaults to today). */
export function monthBounds(ref: Date = new Date()): { from: string; to: string } {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return { from: iso(first), to: iso(last) };
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
