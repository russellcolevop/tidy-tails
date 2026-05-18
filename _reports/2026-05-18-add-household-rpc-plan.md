---
title: Add Household — transactional RPC implementation plan
venture: tidy-tails
date: 2026-05-18
status: PLAN — RPC drafted as an artifact; not applied, not rehearsed, not flipped
type: cutover-plan
ship: post-2.2b
parent-docs:
  - _reports/2026-05-18-ship-2.2b-write-flip-plan.md
  - _reports/2026-05-18-add-household-rpc.sql
---

# Add Household — transactional RPC implementation plan

Add Household is the **fourth and last** write flip. It is held back from the
first three because its write is not one row — it is a `clients` insert plus a
dependent `pets` insert — and those two are **not atomic** in PostgREST. A
pet-insert failure after a client-insert success **orphans a client row**
(REQ-30). This plan closes that gap with a Postgres function.

> **Nothing here is applied or enabled.** The SQL is a draft artifact
> (`2026-05-18-add-household-rpc.sql`). It needs its own migration, its own
> Supabase-branch rehearsal, and its own explicit approval — it is **not** part
> of the Ship 2.2b cutover and must not ride along with it.

## Why an RPC (not a client-side revert)

Two options were considered:

1. **A client-side revert** — on pet-insert failure, delete the just-created
   client row. Simpler, but a crash *between* the two calls (network drop,
   server restart) still orphans a client. It is best-effort, not atomic.
2. **A Postgres function** *(chosen)* — both inserts run inside one function,
   inside one transaction. If the pet insert raises, the client insert rolls
   back with it. Atomic by construction, with no failure window.

## The function — `create_client_with_first_pet`

Drafted in `_reports/2026-05-18-add-household-rpc.sql`. Key properties:

- **`SECURITY INVOKER`** (not `DEFINER`). It runs with the caller's identity, so
  RLS is enforced normally: `auth.uid()` inside the function is Samantha's UID.
  A `SECURITY DEFINER` function would *bypass* RLS — exactly the posture Ship
  2.2b removed by dropping the `client_overview` view. The Add Household path
  must never bypass RLS.
- **`groomer_id` via the column DEFAULT.** The function omits `groomer_id` on
  both inserts; the `groomer_id uuid DEFAULT auth.uid()` column (added by the
  Ship 2.2b cutover) stamps it, and the `groomer_insert` policies
  `WITH CHECK (groomer_id = auth.uid())` pass. `groomer_id` is never set to a
  literal — same rule as the Add Appointment / Log Groom inserts.
- **Atomicity.** A plpgsql function executes within the calling statement's
  transaction; a raise inside it rolls back every prior statement in the call.
  No orphan client can remain.
- **Grants.** `EXECUTE` is revoked from `public`/`anon` and granted only to
  `authenticated` — anon must not be able to create a household.
- **`SET search_path = public`** — pins the search path (also clears the
  `function_search_path_mutable` advisor lint for this function).
- **Depends on the cutover.** The function references the `groomer_id` column
  and the `groomer_insert` policies; it can only be created *after* the Ship
  2.2b forward migration is live.

## Rehearsal plan (before production)

Mirror the Ship 2.2b branch rehearsal — never first-run this on production:

1. Create a Supabase **branch** off production; apply the Ship 2.2b forward
   migration to it (the RPC depends on that schema).
2. Apply `2026-05-18-add-household-rpc.sql` to the branch as a named migration.
3. As an authenticated branch user, call the RPC for a valid household → assert
   exactly **one** `clients` row + **one** `pets` row, both `groomer_id` = the
   caller's UID, `pets.client_id` correct.
4. **Force the pet insert to fail** (e.g. a `pets.size` value outside the CHECK
   enum, or a too-long field) → assert **no** `clients` row was left behind —
   this is the orphan-prevention proof.
5. Confirm an **anon** RPC call is rejected (the `REVOKE … FROM anon`).
6. Apply the rollback (`DROP FUNCTION …`) → assert the function is gone and the
   branch advisors are unchanged.
7. Delete the branch.

Record the rehearsal in an execution report, exactly as Ship 2.2b did.

## v2 wiring (when the flip is approved)

`saveIntake()` in `v2/lib/actions/intake.ts` — replace the live `gated` branch
with, behind the kill-switch:

```ts
if (!isAddHouseholdWriteEnabled()) {
  return { status: "gated", summary, message: /* unchanged */ };
}
const supabase = await createServerSupabase();
const { data, error } = await supabase
  .rpc("create_client_with_first_pet", {
    p_first_name: clientPayload.first_name,
    p_last_name: clientPayload.last_name,
    p_phone: clientPayload.phone,
    p_email: clientPayload.email,
    p_address: clientPayload.address,
    p_notes: clientPayload.notes,
    p_pet_name: petPayload.name,
    p_pet_breed: petPayload.breed,
    p_pet_size: petPayload.size,
    p_pet_allergies: petPayload.allergies,
    p_pet_allergies_detail: petPayload.allergies_detail,
    p_pet_grooming_notes: petPayload.grooming_notes,
    p_pet_standard_fee: petPayload.standard_fee,
  })
  .single();
if (error) {
  return { status: "error", errors: {}, formError: "That household could not be saved. Nothing was written." };
}
revalidatePath("/");
return { status: "saved", summary };
```

`isAddHouseholdWriteEnabled()` already exists in `v2/lib/writeGate.ts` (env flag
`TIDYTAILS_ENABLE_ADD_HOUSEHOLD_WRITE`, default OFF). The `IntakeState` type
gains a `saved` variant and `AddHousehold.tsx` renders it — same shape as the
Add Appointment / Log Groom flips.

## Sequencing — what must be true first

| Gate | Requirement |
|---|---|
| 1 | Ship 2.2b RLS cutover applied and green |
| 2 | Add Appointment, Log Groom, Reminder flips done and watch-week-verified |
| 3 | `2026-05-18-add-household-rpc.sql` rehearsed green on a Supabase branch |
| 4 | Russell approves the RPC migration **and** the Add Household flip |

Only after all four: apply the RPC migration to production (its own approval),
then flip `TIDYTAILS_ENABLE_ADD_HOUSEHOLD_WRITE=on` in Vercel + redeploy.

---

*Generated 2026-05-18. Planning only — the RPC is a draft artifact, not applied
to any database, and the Add Household write surface remains gated.*
