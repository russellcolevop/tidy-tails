---
when: 2026-05-17
who: Cowork
purpose: Phase 3 INSERTs execution record. What ran, when, what was verified, what the state looks like after.
venture: tidy-tails
supabase_project: pgkwovokciaqnbhpttba
---

# Phase 3 Execution Report — 2026-05-17

## Approval

Russell Cole approved Phase 3 COMMIT in this Cowork session on 2026-05-17, after a fresh pre-commit backup and live pre-flight re-verification.

**Approval conditions met:**

- Rollback-only Section 1-7 test (2026-05-17 00:47 UTC) passed cleanly with all 7 pre-write gates and all 7 post-write invariants. Korrie Silver / Gavi were held out per the 2026-05-16 G5 catch (see `_reports/2026-05-16-phase-3-rollback-test-outcome.md`).
- Fresh pre-COMMIT backup taken 2026-05-17 00:49 UTC at `_private/backups/2026-05-17-phase-3-precommit/` (six tables, MANIFEST + SHA-256 sealed).
- Live pre-flight re-verified at 00:50 UTC: 131 / 181 / 730, Landry 4, Korrie holdout 1, dependent tables 0/0/0.
- Default `ROLLBACK;` line consciously edited to `COMMIT;` immediately before execution and restored immediately after.

---

## Execution

**SQL file:** `_reports/2026-05-16-phase-3-inserts.sql` (Sections 1–7).

**Executed via:** Supabase MCP (`execute_sql`) against project `pgkwovokciaqnbhpttba`.

**Executed at:** Server-side `created_at` on all 6 new client rows = `2026-05-17 00:53:40.955915+00 UTC` (the transactional `NOW()` call). Verification SELECT returned at `00:53:56 UTC`.

**Transaction:** Single `BEGIN ... COMMIT` block containing 2 temp-table creations, 7 pre-write gate `DO` blocks (G1, G2, G3, G4, G5a, G5b, G6), 6 client INSERTs with `RETURNING`, 7 pet INSERTs, 7 post-write invariant `DO` blocks (I1–I7), and the final summary `SELECT`. Result: the Section 6 summary row plus a clean COMMIT — no errors, no notices.

---

## Scope executed

| Section | Statement | Effect |
|---|---|---|
| 1 | Temp tables `_phase3_pre_counts`, `_phase3_new_clients` | Pre-state snapshot + UUID-capture table |
| 2 (G1–G6) | 7 fail-loud `DO` blocks | All passed |
| 3 | 6 `INSERT INTO public.clients ... RETURNING` (Mary Anca, Nancy Cauchi, Gardy, Ashley Nichols, Mary Nichols, Christina Kitchen) | 6 client rows created |
| 4 | 7 `INSERT INTO public.pets` with FK lookup against `_phase3_new_clients` | 7 pet rows created |
| 5 (I1–I7) | 7 fail-loud `DO` blocks | All passed |
| 6 | Summary `SELECT` returning pre/post/delta columns | Returned single row (below) |
| 7 | `COMMIT;` (consciously swapped from `ROLLBACK;` before run; restored after) | Transaction committed |

Korrie Silver client INSERT and Gavi pet INSERT were **not** in scope — held out per the 2026-05-16 G5 catch. See §6 below for the follow-up plan.

---

## Verification results

### Section 6 summary row (in-transaction, verbatim)

```json
[{
  "clients_pre": 131,
  "clients_post": 137,
  "clients_delta": 6,
  "pets_pre": 181,
  "pets_post": 188,
  "pets_delta": 7,
  "appointments_pre": 730,
  "appointments_post": 730,
  "appointments_delta": 0,
  "new_clients_count": 6
}]
```

All three deltas match the hard-asserted expected values: `clients_delta == +6`, `pets_delta == +7`, `appointments_delta == 0`.

### Independent post-commit live verification (2026-05-17 00:53:56 UTC)

```json
[{
  "clients": 137,
  "pets": 188,
  "appointments": 730,
  "landry_rows": 4,
  "korrie_holdout": 1,
  "booking_requests": 0,
  "client_accounts": 0,
  "automations_log": 0,
  "orphan_appts_client": 0,
  "orphan_appts_pet": 0
}]
```

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Clients | 137 | 137 | PASS |
| Pets | 188 | 188 | PASS |
| Appointments | 730 | 730 | PASS (load-bearing invariant) |
| Landry/Laundry rows | 4 | 4 | PASS (untouched) |
| Korrie holdout at 647-300-7952 | 1 | 1 | PASS (held out, untouched) |
| booking_requests | 0 | 0 | PASS |
| client_accounts | 0 | 0 | PASS |
| automations_log | 0 | 0 | PASS |
| Orphan appointment client_id | 0 | 0 | PASS |
| Orphan appointment pet_id | 0 | 0 | PASS |

### Inserted client + pet UUIDs

| client_id | first_name | last_name | phone | pet_id | pet_name | breed |
|---|---|---|---|---|---|---|
| `7aa4190d-100d-40eb-92e6-35e8480fbcd0` | Mary | Anca | 705-330-1807 | `a02edb6c-6d27-4a09-a046-ddb7bf394035` | Whiskey | Silver Terrier Yorkie |
| `696e6353-19ee-4712-a741-ac274bdb1a3b` | Nancy | Cauchi | 1-416-801-6775 | `86f8ed37-6bea-49c3-8bf2-15969a1a3390` | Ruby | German Shepherd |
| `a0b78f7c-88af-4652-a1fd-65f1f52d2259` | NULL | Gardy | 705-345-2272 | `b670ba87-8c2d-4f6e-a263-c569ae43ac00` | Coco | Pomeranian |
| `51f7495e-a5f9-4ebb-bb2e-fba9995bf952` | Ashley | Nichols | 705-330-1907 | `64581eba-24af-4b72-b6e0-ca002821b720` | Kahlúa | Husky/Aussie |
| `04d1a760-0e1a-41f8-a249-9a39f3286631` | Mary | Nichols | 705-345-2699 | `c183a9e1-bdd8-4587-96a0-2eb60679b814` | Merlyn | Pug |
| `04d1a760-0e1a-41f8-a249-9a39f3286631` | (same row) | | | `cca1980c-19d2-4f53-b004-d18415ea3d37` | Vader | German Shepherd |
| `a11dee90-4be6-45ab-a34c-931ebee09083` | Christina | Kitchen | 705-323-6293 | `caf288a8-29f8-478b-acf9-b5c8f6e6e97b` | Winston | NULL |

All 6 clients share `created_at = 2026-05-17 00:53:40.955915+00 UTC` (the transactional `NOW()`), which fingerprints them as Phase 3 inserts.

### Gate / invariant summary

- **Pre-write gates G1, G2, G3, G4, G5a, G5b, G6:** ALL PASSED. No exception raised.
- **Post-write invariants I1–I7:** ALL PASSED. No exception raised.
- **Supabase notices/errors:** None. The G6 `RAISE NOTICE` path for hypothetical `appointments.updated_at` did not fire (column doesn't exist).

---

## Pre-commit backup record

| Item | Value |
|---|---|
| Backup path | `_private/backups/2026-05-17-phase-3-precommit/` (workspace, gitignored under `_private/`) |
| Backup timestamp | 2026-05-17 00:49:49.518448 UTC |
| Method | Supabase REST anon `SELECT *` with `Range` pagination (`/tmp/backup_phase3_precommit.py`) |
| Manifest | `MANIFEST.json` (1,663 bytes) |
| clients.json | 131 rows, 66,185 bytes, SHA-256 `7b283d649a4603cc6f48dc798f5102167b5d8a8afcd9a4bdcaa8c3cd243f71b5` |
| pets.json | 181 rows, 117,940 bytes, SHA-256 `9897b35bd7117519f1f070f28111dfc36362cefe3571518580cf2ce12c9cd8cc` |
| appointments.json | 730 rows, 353,175 bytes, SHA-256 `e8f77ddc93a79e06541705dca3dcdf75f1722bc633f5103785c815f8f3d8071c` |
| booking_requests.json | 0 rows, 2 bytes, SHA-256 `4f53cda1...` |
| client_accounts.json | 0 rows, 2 bytes, SHA-256 `4f53cda1...` |
| automations_log.json | 0 rows, 2 bytes, SHA-256 `4f53cda1...` |

**Note:** Russell should mirror this snapshot to `~/venture-ops/backups/tidy-tails/2026-05-17-phase-3-precommit/` on the Mac filesystem at first opportunity. The workspace copy is operational backup, not the canonical archive.

The earlier 2026-05-16 Phase 2 backup at `_private/backups/2026-05-16-phase-2-precommit/` remains valid as a deeper restore point (pre-Phase-2 state).

---

## SQL state after execution

The `ROLLBACK;` / `-- COMMIT;` lines in `_reports/2026-05-16-phase-3-inserts.sql` were consciously swapped to `-- ROLLBACK;` / `COMMIT;` immediately before execution, and consciously restored to `ROLLBACK;` / `-- COMMIT;` immediately after. The committed file is back to its default rollback-only posture so a future re-run is impossible without another deliberate flip.

---

## Outstanding items after Phase 3

### Korrie Silver / Gavi (held out by Phase 3)

The 2026-05-16 G5 rollback test caught that Korrie Silver already exists at phone `647-300-7952` (client_id `56f4385b-b103-4aab-86a3-f18219d7aabe`) with 8 appointments and two existing Gavi pet rows (Medium Mix + Yorkie Mix, both with `allergies = false`). Follow-up work is a Phase-1-style UPDATE patch:

1. Decide canonical phone format for Korrie's row (`647-300-7952` vs `1-647-300-7952`).
2. Dedupe the two within-client Gavi pet rows. Likely a row-merge where the surviving Gavi keeps the breed Sam confirms and inherits all appointment FKs.
3. UPDATE the surviving Gavi row to set `allergies = true`, `allergies_detail = 'No chicken, no grain (food allergy)'` per Sam C62.

Russell needs to ask Sam to clarify the two Gavi rows (same dog, or two pets?) before this patch can be written.

### Other outstanding items

- **Landry/Laundry (705-796-0620)** — 4 rows still present, deliberately excluded by Phases 1, 2, and 3. Sam decision pending on Cash vs Charlotte.
- **Phase 3.5 — appointment backfills** — planning at `_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md`. Now unblocked (Whiskey FK target exists). 5 strong-evidence rows ready (Whiskey×3 + Kiwi×2); 3 date-ambiguous deferred.
- **Phase 4 Codex enrichment** — typical_fee, color, sex, special_notes additions for pre-existing pets. Lower priority.
- **Cards 80–268+** — ~189 unprocessed contact cards in Workstream B.
- **`venture-ops/dump_supabase.py`** — still does not exist; the Python script in `/tmp/backup_phase3_precommit.py` is a one-off prototype.
- **B1 / R-1 (permissive RLS)** — unchanged. v2 auth layer remains the canonical fix path.
- **Anita Nicholls first-name-as-last-name row** — `client_id = ef09cb9e-9227-4674-9b2c-a016c115266b`, currently `first_name = 'Nicholls'`, `last_name = ''`. Phase-1-style normalization candidate; track in Workstream B.

---

## Files written this session

- `_private/backups/2026-05-17-phase-3-precommit/clients.json`
- `_private/backups/2026-05-17-phase-3-precommit/pets.json`
- `_private/backups/2026-05-17-phase-3-precommit/appointments.json`
- `_private/backups/2026-05-17-phase-3-precommit/booking_requests.json`
- `_private/backups/2026-05-17-phase-3-precommit/client_accounts.json`
- `_private/backups/2026-05-17-phase-3-precommit/automations_log.json`
- `_private/backups/2026-05-17-phase-3-precommit/MANIFEST.json`
- `_reports/2026-05-17-phase-3-execution-report.md` (this file)

## Files edited this session

- `_reports/2026-05-16-phase-3-inserts.sql` — `ROLLBACK;` ↔ `COMMIT;` swap (now restored to default ROLLBACK)
- `HANDOFF.md` — Phase 3 execution log entry, Whose-turn / Focus update
- `_reports/2026-05-15-tidy-tails-venture-state-snapshot.md` — counts re-baselined to 137/188/730
- `_reports/2026-05-15-tidy-tails-source-registry.md` — current-state line updated
- `v1-active-bugs.md` — B4 progress update

---

*Generated by Cowork 2026-05-17. Phase 3 INSERTs committed cleanly. 6 net-new clients + 7 net-new pets added. All 730 appointments preserved. Korrie Silver / Gavi held out for separate reconciliation.*
