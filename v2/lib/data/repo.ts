// Data access layer for Tidy Tails v2 Ship 2.1.
//
// This is the ONLY place the app reads data. Everything here is read-only:
//   - default: anonymized fixtures bundled in fixtures.ts
//   - opt-in (NEXT_PUBLIC_USE_LIVE_DATA=on): SELECT-only reads from live Supabase
//
// There is no write path in this ship. Swapping fixtures for live data is a
// change confined to this file — pages and components never know the difference.
//
// Intended for use by Server Components only.

import type { Appointment, Client, ClientRecord, Pet, Vaccination } from "./types";
import {
  FIXTURE_APPOINTMENTS,
  FIXTURE_CLIENTS,
  FIXTURE_PETS,
  FIXTURE_VACCINATIONS,
} from "./fixtures";

export type DataMode = "fixtures" | "live";

export function dataMode(): DataMode {
  return process.env.NEXT_PUBLIC_USE_LIVE_DATA === "on" ? "live" : "fixtures";
}

type Row = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const numOrNull = (v: unknown): number | null => (typeof v === "number" ? v : null);

// ---- live reads (SELECT only) -------------------------------------------------
// `select("*")` is used deliberately: it is read-only and cannot fail on a
// column-name mismatch. v2-only columns absent from live v1 map to null.

async function liveSelect(table: string): Promise<Row[]> {
  const { getReadOnlySupabase } = await import("./supabase");
  const { data, error } = await getReadOnlySupabase().from(table).select("*");
  if (error) throw new Error(`Live read failed (${table}): ${error.message}`);
  return (data ?? []) as Row[];
}

async function liveClients(): Promise<Client[]> {
  return (await liveSelect("clients")).map((r) => ({
    id: str(r.id),
    first_name: str(r.first_name),
    last_name: str(r.last_name),
    phone: str(r.phone),
    alt_contact: strOrNull(r.alt_contact),
    email: strOrNull(r.email),
    notes: strOrNull(r.notes),
    created_at: str(r.created_at),
  }));
}

async function livePets(): Promise<Pet[]> {
  return (await liveSelect("pets")).map((r) => ({
    id: str(r.id),
    client_id: str(r.client_id),
    name: str(r.name),
    breed: strOrNull(r.breed),
    color: strOrNull(r.color),
    sex: r.sex === "M" || r.sex === "F" ? r.sex : null,
    date_of_birth: strOrNull(r.date_of_birth),
    allergies: r.allergies === true,
    allergies_detail: strOrNull(r.allergies_detail),
    grooming_notes: strOrNull(r.grooming_notes),
    typical_fee: numOrNull(r.typical_fee),
    created_at: str(r.created_at),
  }));
}

async function liveAppointments(): Promise<Appointment[]> {
  return (await liveSelect("appointments")).map((r) => ({
    id: str(r.id),
    client_id: str(r.client_id),
    pet_id: str(r.pet_id),
    date: str(r.date).slice(0, 10),
    service: str(r.service),
    price: typeof r.price === "number" ? r.price : Number(r.price) || 0,
    notes: strOrNull(r.notes),
    created_at: str(r.created_at),
  }));
}

// ---- public load functions ---------------------------------------------------

export async function loadClients(): Promise<Client[]> {
  return dataMode() === "live" ? liveClients() : FIXTURE_CLIENTS;
}

export async function loadPets(): Promise<Pet[]> {
  return dataMode() === "live" ? livePets() : FIXTURE_PETS;
}

export async function loadAppointments(): Promise<Appointment[]> {
  return dataMode() === "live" ? liveAppointments() : FIXTURE_APPOINTMENTS;
}

export async function loadVaccinations(): Promise<Vaccination[]> {
  // The `vaccinations` table is a v2 schema addition (design-lock spec §6.2).
  // It does not exist on live v1, so the live path returns an empty set.
  return dataMode() === "live" ? [] : FIXTURE_VACCINATIONS;
}

export type Dataset = {
  clients: Client[];
  pets: Pet[];
  appointments: Appointment[];
  vaccinations: Vaccination[];
};

export async function loadDataset(): Promise<Dataset> {
  const [clients, pets, appointments, vaccinations] = await Promise.all([
    loadClients(),
    loadPets(),
    loadAppointments(),
    loadVaccinations(),
  ]);
  return { clients, pets, appointments, vaccinations };
}

/** A single client with their pets and appointments attached, or null. */
export async function getClientRecord(id: string): Promise<ClientRecord | null> {
  const { clients, pets, appointments } = await loadDataset();
  const client = clients.find((c) => c.id === id);
  if (!client) return null;
  return {
    client,
    pets: pets.filter((p) => p.client_id === id),
    appointments: appointments.filter((a) => a.client_id === id),
  };
}
