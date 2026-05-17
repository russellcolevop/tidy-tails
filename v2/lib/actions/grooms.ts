"use server";

// Log Groom — the "record a completed groom" write action.
//
// IMPORTANT: this action does NOT persist anything in this ship. Like the M2
// booking action it runs the COMPLETE flow (auth re-check, input validation,
// pet/client ownership check, insert-payload construction) and then, instead of
// persisting, returns a result:
//   - fixture mode  → a "demo" dry-run: nothing is saved (fixtures are immutable
//     demo data).
//   - live mode     → the write gate is CLOSED. Live groom writes turn on only
//     after the Ship 2.2b RLS cutover. Until then this action refuses to write.
//
// There is deliberately no `.insert()` here yet. The validated payload is built
// (buildGroomInsert) so the shape is proven; persistence waits for the gate.

import { dataMode, getClientRecord } from "@/lib/data/repo";
import { serviceLabel } from "@/lib/data/live";
import { getCurrentUser } from "@/lib/supabase/server";
import { findOwnedPet } from "@/lib/booking";
import {
  buildGroomInsert,
  validateGroomLog,
  type GroomLogErrors,
} from "@/lib/groom";
import { fullName } from "@/lib/format";

// A human-readable echo of the logged groom — for the review and result screens.
export type GroomSummary = {
  petName: string;
  ownerName: string;
  date: string;
  service: string | null; // user-facing label
  fee: number | null;
};

export type GroomState =
  | { status: "idle" }
  | { status: "error"; errors: GroomLogErrors; formError?: string }
  | { status: "demo"; summary: GroomSummary }
  | { status: "gated"; summary: GroomSummary; message: string };

export async function logGroom(
  _prev: GroomState,
  formData: FormData,
): Promise<GroomState> {
  // Defense-in-depth: the proxy gates every route, but a server action is its
  // own POST endpoint — re-verify the operator before doing anything.
  const user = await getCurrentUser();
  if (!user) {
    return {
      status: "error",
      errors: {},
      formError: "Your session ended. Sign in again.",
    };
  }

  const raw = {
    client_id: String(formData.get("client_id") ?? ""),
    pet_id: String(formData.get("pet_id") ?? ""),
    date: String(formData.get("date") ?? ""),
    service_type: String(formData.get("service_type") ?? ""),
    fee: String(formData.get("fee") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const validation = validateGroomLog(raw);
  if (!validation.ok) {
    return { status: "error", errors: validation.errors };
  }
  const groom = validation.value;

  // Ownership: re-fetch the household and confirm the pet belongs to it. The
  // client_id/pet_id pair from the form is never trusted — the appointments
  // table has no constraint tying a pet to its client.
  const record = await getClientRecord(groom.client_id);
  if (!record) {
    return {
      status: "error",
      errors: {},
      formError: "That client could not be found. Nothing was saved.",
    };
  }
  const pet = findOwnedPet(record.pets, groom.pet_id, groom.client_id);
  if (!pet) {
    return {
      status: "error",
      errors: {},
      formError: "That pet is not on this client's file. Nothing was saved.",
    };
  }

  // The validated INSERT payload — proven shape, not yet persisted.
  const payload = buildGroomInsert(groom);

  const summary: GroomSummary = {
    petName: pet.name,
    ownerName: fullName(record.client.first_name, record.client.last_name),
    date: payload.date,
    service: serviceLabel(payload.service_type),
    fee: payload.fee,
  };

  if (dataMode() === "fixtures") {
    // Dry-run — the flow ran end to end; fixtures are demo data, nothing saved.
    return { status: "demo", summary };
  }

  // Live mode: write gate CLOSED. When it lifts (Ship 2.2b cutover), the live
  // persist is one call:
  //   const supabase = await createServerSupabase();
  //   const { error } = await supabase.from("appointments").insert(payload);
  //   ...then revalidatePath(`/clients/${groom.client_id}`).
  return {
    status: "gated",
    summary,
    message:
      "Live groom logging isn't switched on yet — it turns on after the " +
      "Ship 2.2b security cutover. Nothing was saved.",
  };
}
