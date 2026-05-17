---
when: 2026-05-16
who: Cowork
purpose: Phase 3 INSERT planning for Tidy Tails data reconciliation. Plan only — no SQL executed, no Supabase mutations. Companion: `_reports/2026-05-16-phase-3-inserts.sql` (DRAFT, defaults to ROLLBACK).
venture: tidy-tails
supabase_project: pgkwovokciaqnbhpttba
status: DRAFT — awaiting Russell + Codex verifier review
gated_on: pre-flight verification, Codex verifier sign-off, final Russell approval
predecessors:
  - _reports/2026-05-14-reconciliation-plan.md (Phase 3 section, written pre-Phase-1)
  - _reports/2026-05-13-card-batch-1.md (cards 2, 13, 26, 38, 48, 50, 51, 62, 70, 78)
  - _reports/2026-05-13-sam-answers-batch-1.md (Sam's identity corrections)
  - _reports/2026-05-15-phase-1-execution-report.md (Phase 1 closed)
  - _reports/2026-05-16-phase-2-execution-report.md (Phase 2 closed)
  - _private/source-artifacts/2026-05-11-codex-extraction/tidy_tails_owners.csv (O001–O032)
  - _private/source-artifacts/2026-05-11-codex-extraction/tidy_tails_pets.csv (P001–P038)
  - _private/source-artifacts/2026-05-11-codex-extraction/tidy_tails_appointments.csv (220 rows)
---

# Phase 3 — INSERT plan

## 0. Scope summary

Phase 3 brings net-new clients and pets into the live Supabase database. Net-new means: identity confirmed by Sam and/or contact-card photo, no existing row to dedupe against. **Appointment backfills are out of Phase 3 scope** and live in a separate Phase 3.5 plan (`_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md`).

| Category | Proposed inserts | Confidence | Evidence sources |
|---|---|---|---|
| New clients | 6 | HIGH (3 Codex+Sam, 3 Sam-only) | Codex O002/O011/O021 = Mary Anca, Nancy Cauchi, Gardy; Sam-only = Ashley Nichols, Mary Nichols, Christina Kitchen |
| New pets | 7 | HIGH | Codex P002/P013/P026 + Sam-confirmed pets per client |
| Appointments | 0 | N/A | Backfills tracked in Phase 3.5 planning, not this phase |

**Korrie Silver / Gavi held out 2026-05-16** — see §8 exclusions. G5 caught an existing Korrie Silver row at a phone-format variant; needs row-level reconciliation before any INSERT.

Phase 3 does **not** include:

- **Appointment backfills (Phase 3.5).** Whiskey×3, Kiwi×2, plus deferred date-ambiguous entries — all moved to `_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md`. Keeping Phase 3 INSERT-only on `clients` and `pets` gives one clean invariant path: `+7 / +8 / 0`.
- The 3 Landry/Laundry ghost rows at 705-796-0620 (still excluded; needs Sam decision on Cash vs Charlotte). See `_reports/2026-05-16-phase-2-execution-report.md` and v1-active-bugs.md B4.
- Gunner / David Tommassetti (Sam flagged as deceased but no phone, no card; insufficient evidence to INSERT).
- C9 Apollo (Sam said it was a misread, not a pet name). No INSERT needed; possible DELETE in a later patch.
- Phase 4 Codex enrichment for existing pets (typical_fee, color, sex, etc.). Separate phase, lower priority.
- Cards 80–268+ from the broader handwritten archive. Workstream B continues batch-driven.

---

## 1. Baseline (post-Phase-2)

Confirmed live state from the Phase 2 COMMIT (2026-05-16 19:18:07 UTC):

| Table | Rows | Notes |
|---|---|---|
| `clients` | 131 | Was 268 pre-Phase-2. 137 ghost rows deleted; 3 Landry ghosts retained. |
| `pets` | 181 | Was 352 pre-Phase-2. 171 ghost pets deleted; 38 appointments re-pointed to canonical clients. |
| `appointments` | 730 | Unchanged through Phases 1 and 2 (load-bearing invariant I1 held). |
| `booking_requests` | 0 | Unchanged. |
| `client_accounts` | 0 | Unchanged. |
| `automations_log` | 0 | Unchanged. |
| Landry/Laundry (705-796-0620) | 4 rows | Excluded from Phases 1/2; pending Sam decision. |
| Remaining duplicate phone groups (excluding Landry) | 0 | Phase 2 cleared all of them. |
| Orphan appointment FKs | 0 | All `appointments.client_id` and `appointments.pet_id` resolve. |

After Phase 3 (single invariant path — clients + pets only, Korrie Silver / Gavi held out):

| Table | Pre | Δ | Post |
|---|---|---|---|
| `clients` | 131 | +6 | 137 |
| `pets` | 181 | +7 | 188 |
| `appointments` | 730 | 0 | 730 |
| `booking_requests` | 0 | 0 | 0 |
| `client_accounts` | 0 | 0 | 0 |
| `automations_log` | 0 | 0 | 0 |
| Landry/Laundry phone 705-796-0620 | 4 | 0 | 4 |

`appointments` is unchanged — the load-bearing invariant from Phases 1 and 2 carries through. Any appointment INSERTs are gated to Phase 3.5. Korrie Silver and Gavi remain in the live DB at their existing (pre-Phase-3) state; their reconciliation is tracked separately in §8.

---

## 2. Proposed client + pet INSERTs (3a + 3b)

Each row below carries explicit source citation per field. Fields not populated are set to `NULL` because evidence is absent — that absence is itself the evidence.

### Client #1 — Mary Anca

**Confidence: HIGH** (Sam's corrected name + Codex card + Codex appointment evidence).

| Field | Value | Source |
|---|---|---|
| first_name | `Mary` | Sam C2 (corrected from my OCR misread "Acca Mary"); Codex O002.First_Name |
| last_name | `Anca` | Sam C2; Codex O002.Last_Name |
| phone | `705-330-1807` | Codex O002.Phone |
| alt_contact | NULL | Codex O002.Alt_Phone is empty |
| notes | NULL | Codex O002.Notes is empty; no Sam note |

**Pet #1 — Whiskey**

| Field | Value | Source |
|---|---|---|
| name | `Whiskey` | Sam C2; Codex P002.Pet_Name |
| breed | `Silver Terrier Yorkie` | Codex P002.Breed (Sam corrected "long-haired Yorkie, NOT a cat") |
| allergies | `false` | No Codex/Sam allergy mention |
| allergies_detail | NULL | Same |
| grooming_notes | `Long hair; spayed/neutered; vaccinations current; no medical issues. Male, ~5 yrs at card creation. Typical fee $50-$60.` | Codex P002.Special_Notes + Sex + Age + Typical_Fee |
| client_id | (FK to Mary Anca above) | — |

### Client #2 — Nancy Cauchi

**Confidence: HIGH** (Sam's corrected name + Codex card; one partial-date appointment exists).

| Field | Value | Source |
|---|---|---|
| first_name | `Nancy` | Sam C13 (corrected from my OCR "Caughn"); Codex O011.First_Name |
| last_name | `Cauchi` | Sam C13; Codex O011.Last_Name |
| phone | `1-416-801-6775` | Codex O011.Phone (Sam confirmed) |
| alt_contact | `705-220-8115 (Nancy)` | Codex O011.Alt_Phone + Codex O011.Notes |
| notes | `New client (not in 2022-2024 spreadsheets). Alt contact also Nancy.` | Codex O011.Notes |

**Pet #2 — Ruby**

| Field | Value | Source |
|---|---|---|
| name | `Ruby` | Sam C13 (corrected from my OCR "Riley"); Codex P013.Pet_Name |
| breed | `German Shepherd` | Sam C13; Codex P013.Breed |
| allergies | `false` | No mention |
| allergies_detail | NULL | — |
| grooming_notes | `Female.` | Codex P013.Sex; rest of Codex P013 fields empty |
| client_id | (FK to Nancy Cauchi above) | — |

### Client #3 — Gardy (first name unknown)

**Confidence: HIGH on identity; MEDIUM on completeness** (Sam confirmed; first name still unknown).

| Field | Value | Source |
|---|---|---|
| first_name | NULL | **Unknown.** Sam: "elderly pickup, rescue 2 dogs note was wrong, one visit only." No first name recorded on card. Codex O021.First_Name is empty. |
| last_name | `Gardy` | Sam C26 (corrected from my OCR "Gandy"); Codex O021.Last_Name |
| phone | `705-345-2272` | Codex O021.Phone |
| alt_contact | NULL | — |
| notes | `Elderly client — pickup only. Not in 2022-2024 spreadsheets (card-only client). One visit on file (2023-12-14).` | Codex O021.Notes + Codex appointment for P026 |

**Pet #3 — Coco**

| Field | Value | Source |
|---|---|---|
| name | `Coco` | Sam C26; Codex P026.Pet_Name |
| breed | `Pomeranian` | Sam C26; Codex P026.Breed |
| allergies | `false` | — |
| allergies_detail | NULL | — |
| grooming_notes | `Female, ~5 yrs at card creation. Typical fee $50.` | Codex P026.Sex + Age + Typical_Fee |
| client_id | (FK to Gardy above) | — |

### Client #4 — Ashley Nichols

**Confidence: HIGH on identity; MEDIUM on details** (Sam-only; no Codex card; no appointments).

| Field | Value | Source |
|---|---|---|
| first_name | `Ashley` | Sam C48 |
| last_name | `Nichols` | Sam C48 |
| phone | `705-330-1907` | Sam C48 |
| alt_contact | NULL | — |
| notes | `Sam-only entry: identity confirmed but no contact card extracted in batch 1.` | This file |

**Pet #4 — Kahlúa**

| Field | Value | Source |
|---|---|---|
| name | `Kahlúa` | Sam C48 (corrected from my OCR "Khaleesi") |
| breed | `Husky/Aussie` | Sam C48 |
| allergies | `false` | No mention |
| allergies_detail | NULL | — |
| grooming_notes | NULL | No detail from Sam beyond breed |
| client_id | (FK to Ashley Nichols above) | — |

### Client #5 — Mary Nichols

**Confidence: HIGH on identity; MEDIUM on per-pet details** (Sam-only; two pets confirmed by Sam; no Codex).

| Field | Value | Source |
|---|---|---|
| first_name | `Mary` | Sam C50/C51 |
| last_name | `Nichols` | Sam C50/C51; Sam confirmed "Three Nichols/Nicholls — all three different families" |
| phone | `705-345-2699` | Sam C50 |
| alt_contact | NULL | — |
| notes | `Sam-only entry; two pets (Merlyn, Vader).` | This file |

**Pet #5 — Merlyn**

| Field | Value | Source |
|---|---|---|
| name | `Merlyn` | Sam C50 (corrected from my OCR "Megan") |
| breed | `Pug` | Sam C50 |
| allergies | `false` | — |
| allergies_detail | NULL | — |
| grooming_notes | NULL | — |
| client_id | (FK to Mary Nichols above) | — |

**Pet #6 — Vader**

| Field | Value | Source |
|---|---|---|
| name | `Vader` | Sam C51 |
| breed | `German Shepherd` | Sam C51 / card-batch-1 #51 |
| allergies | `false` | — |
| allergies_detail | NULL | — |
| grooming_notes | NULL | — |
| client_id | (FK to Mary Nichols above) | — |

### Client #6 — Christina Kitchen

**Confidence: HIGH on identity; LOW on pet details** (Sam-only; Kitchen-family clarification).

| Field | Value | Source |
|---|---|---|
| first_name | `Christina` | Sam free-form answer ("Christina (Winston, 705-323-6293 — NEW, not in our records yet)") |
| last_name | `Kitchen` | Same |
| phone | `705-323-6293` | Sam free-form answer |
| alt_contact | NULL | — |
| notes | `Sam-only entry; part of the five-Kitchen-household cluster. Separate from Jennifer Kitchen (705-330-9119), Krystal Kitchen (705-955-2350), Marina Kitchen (no phone — saved in Sam's phone), and the no-first-name Kitchen with Ebony.` | Sam free-form answer |

**Pet #7 — Winston**

| Field | Value | Source |
|---|---|---|
| name | `Winston` | Sam free-form answer |
| breed | NULL | **Unknown.** Sam did not provide breed. Flag for follow-up question to Sam. |
| allergies | `false` | No mention |
| allergies_detail | NULL | — |
| grooming_notes | NULL | — |
| client_id | (FK to Christina Kitchen above) | — |

---

## 3. Appointment backfills — moved to Phase 3.5

All historical appointment backfills for the new pets, plus the Russell Cole / Kiwi import-gap backfill, are tracked separately in `_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md`. Per Codex verifier feedback, Phase 3 stays INSERT-only on `clients` and `pets` so the invariant path is unambiguous (+7 / +8 / 0).

Phase 3.5 covers: 3 Whiskey appointments (Mary Anca), 2 Kiwi appointments (Russell Cole), plus deferred date-ambiguous candidates (Kiwi 2024-07-??, Ruby 2024-08-??, Coco 2023-12-14) that need Sam to clarify before they can ship.

Phase 3.5 has its own gate set, pre-flight queries, and a dependency on Phase 3 having committed first (so the new pet rows for Whiskey exist to receive their `pet_id` FKs).

---

## 4. Pre-flight verification queries (SELECT only — run before any INSERT)

Each query has an expected result based on the Phase 2 post-state. If any returns unexpected output, abort Phase 3 and reconcile.

### 4.1 Baseline counts (expect 131 / 181 / 730)

```sql
SELECT
  (SELECT COUNT(*) FROM public.clients)      AS clients,
  (SELECT COUNT(*) FROM public.pets)         AS pets,
  (SELECT COUNT(*) FROM public.appointments) AS appointments;
-- Expected: 131 / 181 / 730
```

### 4.2 New-client phone-uniqueness check (expect 0 rows for each phone)

```sql
SELECT phone, COUNT(*) AS existing_rows
FROM public.clients
WHERE phone IN (
  '705-330-1807',     -- Mary Anca
  '1-416-801-6775',   -- Nancy Cauchi
  '705-345-2272',     -- Gardy
  '705-330-1907',     -- Ashley Nichols
  '705-345-2699',     -- Mary Nichols
  '705-323-6293'      -- Christina Kitchen
)
GROUP BY phone;
-- Expected: empty result set (no existing rows at any of the 6 phones).
-- If any phone returns a row, that's a Phase 3 blocker for that specific client.
-- Note: Korrie Silver's proposed phone (1-647-300-7952) was removed from this
-- list 2026-05-16 because the existing row at 647-300-7952 is the same person.
-- See §8 holdout and §11 rollback-test followup.
```

### 4.3 Landry/Laundry untouched (expect 4 rows)

```sql
SELECT COUNT(*) AS landry_rows FROM public.clients WHERE phone = '705-796-0620';
-- Expected: 4
```

### 4.4 Dependent tables empty (expect 0/0/0)

```sql
SELECT
  (SELECT COUNT(*) FROM public.booking_requests) AS booking_requests,
  (SELECT COUNT(*) FROM public.client_accounts)  AS client_accounts,
  (SELECT COUNT(*) FROM public.automations_log)  AS automations_log;
-- Expected: 0 / 0 / 0
```

### 4.5 Schema audit (expect 0 rows — neither `pets` nor `appointments` has `updated_at`)

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name  IN ('pets', 'appointments')
  AND column_name = 'updated_at';
-- Expected: 0 rows. If non-zero, edit Phase 3 INSERTs to set updated_at = NOW() on relevant tables.
```

### 4.6 Mary Nichols / Anita Nicholls disambiguation (sanity check)

Card 49 (Anita Nicholls / Sassy at 705-955-9211) and card 50 (Mary Nichols / Merlyn at 705-345-2699) are different households per Sam. Confirm Anita Nicholls is still present in Supabase under her own phone — and check both `first_name` and `last_name` columns because Phase 2's pre-flight surfaced that Anita Nicholls is stored with `first_name = 'Nicholls'`, `last_name = ''` (a "first-name-as-last-name" legacy row that batch-1 reconciliation did not reach):

```sql
SELECT id, first_name, last_name, phone
FROM public.clients
WHERE first_name ILIKE 'Nicholls'
   OR first_name ILIKE 'Nichols'
   OR last_name  ILIKE 'Nicholls'
   OR last_name  ILIKE 'Nichols'
ORDER BY phone;
```

**Expected result** (post-Phase-2, pre-Phase-3, verified live on 2026-05-16):

- 1 row with `first_name = 'Nicholls'`, `last_name = ''`, `phone = '705-955-9211'` (Anita Nicholls; legacy first-name-as-last-name storage).
- 0 rows matching `'Nichols'` anywhere (we are about to add the first two Nichols rows for Ashley and Mary).

**Why this does not block Phase 3:**

- Proposed Ashley Nichols phone `705-330-1907` and proposed Mary Nichols phone `705-345-2699` both differ from Anita Nicholls's `705-955-9211`, so G2 (phone-collision gate) will not fire.
- G5 (name-collision gate) checks paired `(lower(first_name), lower(last_name))` against the proposed identities (`Ashley/Nichols`, `Mary/Nichols`). Anita Nicholls's row has `first_name = 'Nicholls'`, `last_name = ''`, so G5 correctly does not flag it as a collision against Ashley or Mary.
- Sam confirmed in batch-1 answers: "Three Nichols/Nicholls — all three different families."

Follow-up (not a Phase 3 blocker): Anita Nicholls's row should be normalized to `first_name = 'Anita'`, `last_name = 'Nicholls'` in a later UPDATE patch, consistent with the Phase 1 surname-storage cleanup pattern. Track in Workstream B.

---

## 5. Fail-loud pre-write gates (for the Phase 3 INSERT transaction)

If/when the INSERT script runs, these gates fire INSIDE the transaction, BEFORE any INSERT statement executes. Any failure raises and rolls back.

| Gate | What it asserts | Why |
|---|---|---|
| **G1** | Baseline counts are `(131, 181, 730)`. | Phase 2 post-state matches. If anything has changed since Phase 2, the plan is stale. |
| **G2** | None of the 6 proposed phones already exists in `clients`. | Prevents accidental duplicate creation. |
| **G3** | Landry/Laundry phone has exactly 4 rows. | Untouched-blocker invariant; same as Phases 1/2. |
| **G4** | Dependent tables (`booking_requests`, `client_accounts`, `automations_log`) are still 0/0/0. | Same FK blast-radius concern as Phase 2 G8. |
| **G5a** | No client row in DB matches any of the 6 proposed `(first_name, last_name)` pairs (case-insensitive): `Mary Anca / Nancy Cauchi / Ashley Nichols / Mary Nichols / Christina Kitchen` plus `last_name = 'Gardy'`. | Defense in depth against name-but-different-phone matches. Manual review if any match. |
| **G5b** | Korrie Silver existing-row check — documented as a known holdout. Phase 3 expects exactly 1 existing row matching `(first_name = 'Korrie', last_name = 'Silver')` at phone `647-300-7952`, untouched by Phase 3. If the count changes, the holdout assumption is stale. | Defense against the holdout state itself drifting (e.g. someone deletes the existing Korrie row outside Phase 3). |
| **G6** | Schema columns expected by INSERT exist (`clients.first_name`, `clients.last_name`, `clients.phone`, `clients.alt_contact`, `clients.notes`; `pets.name`, `pets.breed`, `pets.allergies`, `pets.allergies_detail`, `pets.grooming_notes`, `pets.client_id`). | Catches schema drift since Phase 2. |

The draft SQL embeds these gates as `DO $$ ... $$` blocks. See `_reports/2026-05-16-phase-3-inserts.sql`.

---

## 6. Post-insert verification (inside the same transaction, before COMMIT)

Each invariant raises and rolls back on failure.

| Invariant | What it asserts |
|---|---|
| **I1** | `clients_post = clients_pre + 6`. |
| **I2** | `pets_post = pets_pre + 7`. |
| **I3** | `appointments_post = appointments_pre` (delta exactly 0 — Phase 3 does not touch appointments). |
| **I4** | Each of the 6 new client rows is present and has a non-null `id` and the expected `phone`. |
| **I5** | Each of the 7 new pet rows is present and FK-resolves to the correct new client. |
| **I6** | Zero appointments reference a non-existent `client_id` or `pet_id` (full FK sweep). |
| **I7** | Landry/Laundry phone still has 4 rows (untouched). |

Final summary `SELECT` returns: `clients_pre / clients_post / clients_delta / pets_pre / pets_post / pets_delta / appointments_pre / appointments_post / appointments_delta`.

Expected (single invariant path):

```
clients:      131 → 137   (delta = +6)
pets:         181 → 188   (delta = +7)
appointments: 730 → 730   (delta =  0)
```

Landry/Laundry rows: 4 → 4 (unchanged). Dependent tables: 0 / 0 / 0 → 0 / 0 / 0 (unchanged). Korrie Silver row at `647-300-7952` and her two existing Gavi pet rows: unchanged (held out per §8).

---

## 7. Rollback plan

### Pre-COMMIT rollback (during transaction)

If any pre-write gate (G1–G6) or post-write invariant (I1–I6) fires, `RAISE EXCEPTION` aborts the transaction. No DB state changes.

### Post-COMMIT rollback (if a problem is discovered after COMMIT)

Phase 3 inserts only — no UPDATEs, no DELETEs of existing rows. The rollback procedure is therefore well-bounded:

1. **Take a fresh post-COMMIT snapshot** before any rollback (same method as Phase 2 pre-commit backup).
2. **Capture the new UUIDs** from the Phase 3 execution report (every INSERT will return the assigned `id`).
3. **Reverse via targeted DELETEs (pets → clients in reverse FK order; no appointments to reverse because Phase 3 does not touch the appointments table):**
   - `DELETE FROM public.pets WHERE id IN (<7 pet UUIDs>)`
   - `DELETE FROM public.clients WHERE id IN (<6 client UUIDs>)`
4. **Verify counts return to 131/181/730.**
5. **Source of UUIDs:** the Phase 3 execution report and the post-COMMIT backup. Both must be present before any rollback fires.

### Backup-restore rollback (catastrophic case)

If the targeted DELETE approach is not safe (e.g. Phase 3 ran out of order or pre-COMMIT backup was lost), restore the pre-Phase-3 snapshot in full:

- Restore source: `_private/backups/<timestamp>-phase-3-precommit/` (created using the same Python script template as Phase 2).
- Procedure: TRUNCATE the three tables, restore via `INSERT INTO public.<table> SELECT * FROM jsonb_array_elements(:json_blob)` or equivalent. Russell or Cowork to script as a one-off.
- **This is destructive of any v1 writes between Phase 3 and the restore.** Only acceptable if Phase 3 caused active customer-data corruption that targeted DELETE can't fix.

---

## 8. Explicit exclusions (Phase 3 will not touch these)

| Item | Reason | Disposition |
|---|---|---|
| **Korrie Silver / Gavi (held out 2026-05-16)** | Held out because G5 found an existing Korrie Silver name match under a phone-format or existing-row variant. The 2026-05-16 rollback test surfaced a row at `647-300-7952` (client_id `56f4385b-b103-4aab-86a3-f18219d7aabe`) with 8 appointments and two existing Gavi pet rows (Medium Mix + Yorkie Mix). The proposed phone `1-647-300-7952` differs by the `1-` prefix only. Needs row-level reconciliation before insert. | Separate follow-up patch (Phase 1.x style): (a) decide canonical phone format for Korrie's row; (b) dedupe the two within-client Gavi pet rows; (c) UPDATE the surviving Gavi pet with `allergies = true`, `allergies_detail = 'No chicken, no grain (food allergy)'`. Track in Workstream B. |
| Landry/Laundry (705-796-0620, 4 rows) | Sam decision pending on Cash vs Charlotte | Follow-up patch after Phase 3 |
| Gunner / David Tommassetti (deceased pet flag) | Not in Supabase; no phone; insufficient evidence to INSERT | Russell asks Sam for the phone first; then a separate small INSERT |
| C9 Apollo | Sam said it was a misread, not a real pet | Possible DELETE in a later patch if a stray Apollo row exists in `pets` |
| All appointment backfills (Whiskey×3, Kiwi×2, Ruby×1, Coco×1, Kiwi-partial×1) | Moved out of Phase 3 scope per Codex verifier feedback | Tracked in `_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md` |
| Russell Cole / Kiwi appt #2 (2024-07-??) | Date partially obscured on Codex card | Phase 3.5, after Sam confirms date |
| Ruby / Cauchi appt 2024-08-?? | Date partial | Phase 3.5, after Sam confirms date |
| Coco / Gardy appt 2023-12-14 | Codex notes date could be 2023 or 2024 | Phase 3.5, after Sam confirms year |
| Cards 80–268+ (Workstream B continuation) | ~189 unprocessed contact cards | Continued batch processing, separate phases |
| Phase 4 enrichment (typical_fee, color, sex, etc.) | Lower priority; scoped separately | Phase 4 |
| Anita Nicholls phone discrepancy (card 705-326-7185 vs DB 705-955-9211) | Sam needs to clarify which is current | Follow-up question, not a Phase 3 blocker (existing row stays as-is) |

---

## 9. Codex verifier checklist

Before flipping the Phase 3 SQL from ROLLBACK to COMMIT, Codex verifier confirms each of the following:

**Plan completeness**

- [ ] Every proposed INSERT row has a source citation for every non-null field.
- [ ] Every NULL field is annotated with the reason (Codex/Sam absence-of-evidence).
- [ ] No proposed row collides with an existing Supabase row at the same phone (G2 has been run against live DB as a SELECT and returned the expected empty set for the 6 proposed phones).
- [ ] Mary Nichols vs Anita Nicholls disambiguation has been confirmed by the pre-flight (§4.6) query against live state.
- [ ] Korrie Silver / Gavi holdout (§8) is documented; no Korrie Silver INSERT and no Gavi INSERT in the executable SQL.
- [ ] Phase 3 scope is INSERT-only on `clients` and `pets`; no statement touches `public.appointments` (appointment backfills are Phase 3.5).

**SQL hygiene**

- [ ] All 6 pre-write gates (G1, G2, G3, G4, G5a, G5b, G6) are present and fail-loud (G5 split into G5a and G5b).
- [ ] All 7 post-write invariants I1–I7 are present and fail-loud.
- [ ] Default end-of-script is `ROLLBACK;` with `COMMIT;` commented out.
- [ ] No `UPDATE`, no `DELETE`, no `INSERT INTO public.appointments` (Phase 3 is INSERT-only on `clients` and `pets`).
- [ ] No statement references `updated_at` on `pets` or `appointments` (schema audit confirms absent).
- [ ] Final summary `SELECT` returns explicit `*_delta` columns and shows `appointments_delta = 0`, `clients_delta = +6`, `pets_delta = +7`.

**Evidence chain**

- [ ] Sam's identity corrections in `_reports/2026-05-13-sam-answers-batch-1.md` cover all 7 new clients.
- [ ] Codex citations resolve to specific row IDs in `_private/source-artifacts/.../tidy_tails_owners.csv` / `tidy_tails_pets.csv`.
- [ ] Card-batch-1 cross-references named for each Codex-backed entry (cards C2, C13, C26, C48, C50, C51, C62, plus C70 Stillman and C78 Ethan Beasley which are NOT in this phase because they already exist after Phase 1).

**Safety gates**

- [ ] Fresh pre-COMMIT backup exists at `_private/backups/<timestamp>-phase-3-precommit/` with MANIFEST + SHA-256.
- [ ] Live pre-flight counts re-verified at the same UTC minute as the backup.
- [ ] Russell has consciously flipped `ROLLBACK;` to `COMMIT;` and is supervising the run.

---

## 10. KoyaOS dogfood lessons (live-reconciliation phases)

Patterns from Phases 1–3 worth lifting into KoyaOS templates and ROADMAP entries:

### 10.1 Phase artifacts come as a triplet, not a singleton

Each phase produces three durable artifacts:

1. **Plan** (this kind of document — narrative, source-cited, with exclusions)
2. **Script** (SQL or migration, defaults to ROLLBACK, with embedded gates + invariants)
3. **Execution report** (timestamped, counts pre/post/delta, gate outcomes, backup hashes)

Treat any phase that ships without all three as incomplete. The plan-without-script case is acceptable for planning sessions (this one), but a script-without-plan or a script-without-execution-report is a process bug.

### 10.2 Pre-flight queries are different from gates

Both check the same shape of thing (baseline counts, dup inventory, FK integrity) but serve different functions:

- **Pre-flight queries** run as ad-hoc SELECTs by the operator before the transaction begins. They surface unexpected drift in human-readable form, and Russell uses them to decide whether to run the script at all.
- **Pre-write gates** run inside the transaction as `DO $$ ... $$` blocks that `RAISE EXCEPTION` on divergence. They are the last-mile safety net that prevents the script from mutating a stale baseline.

KoyaOS BUILD-mode reconciliation phases should template both, and the gate constants should be derived from the pre-flight expected values, not hand-edited.

### 10.3 Source citation per field, not per row

Phase 3's per-field citation table format is more useful than the prior per-row narrative style. It makes it trivial to spot a row where one field is well-evidenced and another is NULL because of absence-of-evidence. The Codex verifier checklist gets faster too — it can scan the citation column rather than reading the row context.

### 10.4 Codex and Sam are different evidence types

The Codex extraction CSVs are structured, machine-readable artifacts derived from contact-card OCR + a one-pass human review by Russell. Sam's answers are first-hand operator corrections to those OCR reads. Where they conflict, Sam wins; where Codex is silent and Sam is silent, the field is NULL.

The lesson for KoyaOS: when a reconciliation phase has both a "structured prior data" source and a "live operator" source, the priority order should be explicit in the plan, and the plan should call out fields where the two sources disagree.

### 10.5 Approval gates compound across phases

Phase 2 introduced the halt-and-fresh-backup pattern (Cowork couldn't see `~/venture-ops/backups/` from the sandbox, Russell halted and asked for a fresh in-sandbox backup, then re-approved). That pattern should be Phase 3's default, not a discovery:

- The pre-COMMIT backup is taken by Cowork into `_private/backups/<phase-tag>-precommit/`.
- The manifest with SHA-256 is sealed before the live re-pre-flight runs.
- Russell explicitly re-approves COMMIT after seeing the backup manifest.
- After COMMIT, Russell mirrors the backup off the workspace to the canonical `~/venture-ops/backups/` store.

### 10.6 Provenance lives in the file path

`_private/source-artifacts/2026-05-11-codex-extraction/` is good provenance signaling: date + source-type in the directory name, raw CSVs inside, gitignored. This pattern generalizes: any external source artifact gets a `_private/source-artifacts/<date>-<source-tag>/` directory, raw files inside, and a small `README.md` or manifest naming the source and the import method. ROADMAP item: "Provenance directory template for KoyaOS BUILD-mode ventures."

### 10.7 Execution-report-driven retrospectives

After Phase 2 COMMIT, the execution report at `_reports/2026-05-16-phase-2-execution-report.md` carried the backup paths, hashes, counts, gate outcomes, and outstanding items. That report is the natural input to a venture's "what happened" review — better than git log or HANDOFF.md because it groups one action's worth of state changes plus the safety artifacts that supported them.

KoyaOS RFC: each major mutation should produce a single, named execution report with a fixed section structure (Approval, Execution, Scope, Verification, Backup, Outstanding). Make it a skill template.

---

## 11. Open questions for Russell (none block Phase 3 by default)

Per Codex verifier feedback, Gardy's NULL first_name and Winston's NULL breed are acceptable absence-of-evidence NULLs and do not block COMMIT. They are tracked here as follow-ups, not gates:

1. **Christina Kitchen / Winston breed.** Sam didn't provide. Default action: insert with NULL breed; add to a Sam follow-up question for a later UPDATE patch.
2. **Gardy first name.** Card says "Owner elderly - picks up dog" but no first name on record. Default action: insert with NULL first_name; revisit if Sam has more context in a later session.
3. **Korrie Silver / Gavi reconciliation (held out 2026-05-16; see §8).** Three sub-questions: (a) canonical phone format for Korrie's row — `647-300-7952` or `1-647-300-7952`?; (b) the existing two Gavi pet rows (Medium Mix + Yorkie Mix) — same dog with mis-extracted breeds or two different pets?; (c) Sam's allergy detail (no chicken, no grain) — apply to which Gavi row? Resolution path: ask Sam, then write a small UPDATE patch.

All other open items (appointment date ambiguities, Russell Cole / Kiwi backfill, pet-row-existence checks for Kiwi) are tracked in the Phase 3.5 plan and are not Phase 3 concerns.

---

## 12. Predecessors and relationships

- **Phase 1 (COMMITTED 2026-05-15)** — 29 UPDATEs for name/phone/pet/allergy corrections. Phase 3 INSERTs depend on Phase 1's name normalizations (e.g. Lisa Madden, Leona Beasley) being already in the DB.
- **Phase 2 (COMMITTED 2026-05-16)** — 137 ghost client deletions, 171 ghost pet deletions, 38 appointment re-pointings. Phase 3 baseline = Phase 2 post-state.
- **Phase 3.5 (appointment backfills, planning written 2026-05-16)** — Adds historical appointment rows for the new pets from Phase 3 (and for Russell Cole / Kiwi). Depends on Phase 3 having committed first so the FK targets exist. See `_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md`.
- **Phase 4 (Codex enrichment, not yet planned)** — Adds Codex-derived `typical_fee`, `color`, `sex`, `special_notes` to existing pets. Phase 3 INSERTs already include these in `grooming_notes` for the new pets, so Phase 4 will only touch pre-existing rows.

---

*Generated by Cowork 2026-05-16. Planning only. No SQL executed. No Supabase calls made. Companion draft SQL at `_reports/2026-05-16-phase-3-inserts.sql` defaults to ROLLBACK and explicitly marks each NULL field with its evidence-absent rationale.*
