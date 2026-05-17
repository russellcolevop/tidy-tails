-- =============================================================================
-- Tidy Tails — Phase 3 INSERTs (new clients + pets)
-- Generated:        2026-05-16 by Cowork
-- Supabase project: pgkwovokciaqnbhpttba
-- Status:           DRAFT — DO NOT EXECUTE
-- Companion plan:   _reports/2026-05-16-phase-3-insert-plan.md
-- =============================================================================
-- Purpose
--   Insert 6 net-new clients + 7 net-new pets identified during Workstream B
--   batch-1 contact-card reconciliation. Identity confirmed by Sam (cards
--   C2, C13, C26, C48, C50, C51 + Sam's free-form Kitchen-cluster answer).
--   Codex extraction CSVs (O002, O011, O021, P002, P013, P026) provide
--   structured detail for 3 of the 6. The other 3 are Sam-only.
--
--   Korrie Silver / Gavi (Sam C62) was held out 2026-05-16 after the
--   rollback test caught a phone-format / existing-row collision via G5
--   (the existing row sits at phone 647-300-7952 with two existing Gavi pet
--   rows). See plan §8 for the reconciliation follow-up plan.
--
--   Appointment backfills are NOT in Phase 3 scope. They live in a separate
--   Phase 3.5 plan at `_reports/2026-05-16-phase-3.5-appointment-backfills-plan.md`.
--   Phase 3 is INSERT-only on `public.clients` and `public.pets`; the
--   `public.appointments` table is not touched.
--
-- Pre-conditions
--   - Phase 1 COMMITTED 2026-05-15 (`_reports/2026-05-15-phase-1-execution-report.md`)
--   - Phase 2 COMMITTED 2026-05-16 (`_reports/2026-05-16-phase-2-execution-report.md`)
--   - Live baseline: 131 clients / 181 pets / 730 appointments
--   - Fresh pre-COMMIT backup at `_private/backups/<timestamp>-phase-3-precommit/`
--   - Pre-flight queries in plan §4 have been run and returned expected values
--   - Service_role context (Supabase SQL editor or apply_migration) — anon does
--     not have INSERT permissions narrowed to this script's surface
--
-- Strategy
--   1. BEGIN transaction.
--   2. Pre-snapshot baseline counts into temp.
--   3. Run pre-write gates G1, G2, G3, G4, G5a, G5b, G6 (RAISE EXCEPTION on
--      any divergence).
--   4. INSERT 6 clients with RETURNING into a temp table keyed by phone, so
--      pet INSERTs can FK-lookup.
--   5. INSERT 7 pets with FK lookup against the temp.
--   6. Run I1-I7 post-write invariants.
--   7. Print final summary SELECT (expected deltas: +6 / +7 / 0).
--   8. Default end-of-script is ROLLBACK. Operator must consciously edit
--      to COMMIT before this can ship.
--
-- Pre-write gates (each RAISE EXCEPTION on failure):
--   G1 baseline counts == (131, 181, 730)
--   G2 none of the 6 proposed phones exists in clients
--   G3 Landry/Laundry phone has exactly 4 rows (untouched-blocker invariant)
--   G4 dependent tables (booking_requests/client_accounts/automations_log)
--      are still 0/0/0
--   G5a no client row exists with first/last names matching the 6 new clients
--       (case-insensitive); flags potential same-name-different-phone duplicates
--   G5b Korrie Silver existing-row check (held-out invariant) — expects
--       exactly 1 existing row matching ('Korrie','Silver') at phone
--       647-300-7952; aborts if the holdout state has drifted
--   G6 schema audit: clients/pets columns expected by this script all exist;
--      pets has no updated_at column (Phase 3 actionable);
--      appointments updated_at is NOTICE-only (Phase 3.5 concern)
--
-- Post-write invariants I1-I7 (each RAISE EXCEPTION on failure):
--   I1 clients_post = clients_pre + 6
--   I2 pets_post = pets_pre + 7
--   I3 appointments_post = appointments_pre (exactly 0 delta)
--   I4 every new client row is present with the expected phone
--   I5 every new pet row is present and FK-resolves to its client
--   I6 zero orphan FKs across the entire appointments table
--   I7 Landry/Laundry still has 4 rows
--
-- DEFAULT END-OF-SCRIPT IS `ROLLBACK;`. The script as written CANNOT mutate
-- the database. Section 7 has the swap instructions.
-- =============================================================================


-- =============================================================================
-- SECTION 0 — PRE-FLIGHT (run BEFORE BEGIN; pure SELECT)
-- =============================================================================
-- Russell: uncomment one at a time, run in SQL editor, verify expected.

-- 0.1 Baseline counts (expect 131 / 181 / 730)
-- SELECT (SELECT COUNT(*) FROM public.clients)      AS clients,
--        (SELECT COUNT(*) FROM public.pets)         AS pets,
--        (SELECT COUNT(*) FROM public.appointments) AS appointments;

-- 0.2 New-client phone collisions (expect 0 rows)
-- SELECT phone, COUNT(*) AS rows
-- FROM public.clients
-- WHERE phone IN (
--   '705-330-1807','1-416-801-6775','705-345-2272','705-330-1907',
--   '705-345-2699','705-323-6293'
-- )
-- GROUP BY phone;
-- Note: Korrie Silver's proposed phone (1-647-300-7952) was removed
-- 2026-05-16 because the rollback test confirmed an existing same-person row
-- at 647-300-7952. See plan §8 holdout.

-- 0.3 Landry/Laundry untouched (expect 4)
-- SELECT COUNT(*) AS landry FROM public.clients WHERE phone = '705-796-0620';

-- 0.4 Dependent tables (expect 0 / 0 / 0)
-- SELECT (SELECT COUNT(*) FROM public.booking_requests) AS booking_requests,
--        (SELECT COUNT(*) FROM public.client_accounts)  AS client_accounts,
--        (SELECT COUNT(*) FROM public.automations_log)  AS automations_log;

-- 0.5 Schema audit (expect 0 rows)
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name  IN ('pets', 'appointments')
--   AND column_name = 'updated_at';

-- 0.6 Nichols/Nicholls disambiguation. Checks both first_name and last_name
-- because legacy "first-name-as-last-name" rows (e.g. Anita Nicholls) store
-- the surname in first_name with last_name = ''.
-- Expected (post-Phase-2):
--   - 1 row with first_name='Nicholls', last_name='', phone='705-955-9211'
--     (Anita Nicholls — legacy storage; Phase 1 batch-1 did not normalize this card).
--   - 0 rows matching 'Nichols' anywhere (we are about to add the first two
--     Nichols rows for Ashley and Mary).
-- This does NOT block Phase 3: proposed phones 705-330-1907 (Ashley) and
-- 705-345-2699 (Mary) differ from 705-955-9211, and Sam confirmed all three
-- Nichols/Nicholls households are different families.
-- SELECT id, first_name, last_name, phone
-- FROM public.clients
-- WHERE first_name ILIKE 'Nicholls'
--    OR first_name ILIKE 'Nichols'
--    OR last_name  ILIKE 'Nicholls'
--    OR last_name  ILIKE 'Nichols'
-- ORDER BY phone;


-- =============================================================================
-- SECTION 1 — TRANSACTION START + BASELINE SNAPSHOT
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _phase3_pre_counts AS
SELECT
  (SELECT COUNT(*) FROM public.clients)      AS clients_pre,
  (SELECT COUNT(*) FROM public.pets)         AS pets_pre,
  (SELECT COUNT(*) FROM public.appointments) AS appointments_pre;

-- _phase3_new_clients captures the UUIDs that the INSERTs assign, keyed
-- by phone so pet INSERTs can FK-lookup cleanly.
CREATE TEMP TABLE _phase3_new_clients (
  phone       text PRIMARY KEY,
  client_id   uuid NOT NULL,
  expected_first_name text,
  expected_last_name  text
);


-- =============================================================================
-- SECTION 2 — PRE-WRITE GATES G1, G2, G3, G4, G5a, G5b, G6 (fail-loud before any INSERT)
-- =============================================================================

-- G1 — Baseline counts match Phase 2 post-state.
DO $$
DECLARE c_count INT; p_count INT; a_count INT;
BEGIN
  SELECT COUNT(*) INTO c_count FROM public.clients;
  SELECT COUNT(*) INTO p_count FROM public.pets;
  SELECT COUNT(*) INTO a_count FROM public.appointments;
  IF c_count <> 131 OR p_count <> 181 OR a_count <> 730 THEN
    RAISE EXCEPTION
      'G1 FAIL: baseline counts (clients=%, pets=%, appointments=%) do not match Phase 2 post-state (131/181/730). Re-baseline Phase 3 against current state before proceeding.',
      c_count, p_count, a_count;
  END IF;
END$$;

-- G2 — None of the 6 proposed phones already exist in clients.
DO $$
DECLARE collisions INT;
BEGIN
  SELECT COUNT(*) INTO collisions
  FROM public.clients
  WHERE phone IN (
    '705-330-1807','1-416-801-6775','705-345-2272','705-330-1907',
    '705-345-2699','705-323-6293'
  );
  IF collisions > 0 THEN
    RAISE EXCEPTION
      'G2 FAIL: % phone collision(s) found among the 6 proposed new clients. Run pre-flight 0.2 to identify which phone collides and reconcile manually before Phase 3.',
      collisions;
  END IF;
END$$;

-- G3 — Landry/Laundry has exactly 4 rows (untouched-blocker invariant).
DO $$
DECLARE landry_count INT;
BEGIN
  SELECT COUNT(*) INTO landry_count FROM public.clients WHERE phone = '705-796-0620';
  IF landry_count <> 4 THEN
    RAISE EXCEPTION 'G3 FAIL: phone 705-796-0620 has % row(s) (expected 4). Landry/Laundry must remain untouched.', landry_count;
  END IF;
END$$;

-- G4 — Dependent tables still 0/0/0.
DO $$
DECLARE br INT; ca INT; al INT;
BEGIN
  SELECT COUNT(*) INTO br FROM public.booking_requests;
  SELECT COUNT(*) INTO ca FROM public.client_accounts;
  SELECT COUNT(*) INTO al FROM public.automations_log;
  IF br <> 0 OR ca <> 0 OR al <> 0 THEN
    RAISE EXCEPTION
      'G4 FAIL: dependent tables non-empty (booking_requests=%, client_accounts=%, automations_log=%). Investigate before Phase 3.',
      br, ca, al;
  END IF;
END$$;

-- G5a — No client row with first/last names matching the 6 NEW clients
-- (case-insensitive). Catches same-name-different-phone duplicates.
-- Note: Gardy is identified by last_name alone since first_name is NULL.
-- Korrie Silver is NOT in this list — she is the documented held-out case
-- (G5b below covers her existing-row state).
DO $$
DECLARE name_match INT;
BEGIN
  SELECT COUNT(*) INTO name_match
  FROM public.clients
  WHERE (lower(first_name) = 'mary'      AND lower(last_name) = 'anca')
     OR (lower(first_name) = 'nancy'     AND lower(last_name) = 'cauchi')
     OR (lower(last_name)  = 'gardy')
     OR (lower(first_name) = 'ashley'    AND lower(last_name) = 'nichols')
     OR (lower(first_name) = 'mary'      AND lower(last_name) = 'nichols')
     OR (lower(first_name) = 'christina' AND lower(last_name) = 'kitchen');
  IF name_match > 0 THEN
    RAISE EXCEPTION
      'G5a FAIL: % client row(s) already exist with names matching the 6 proposed new inserts. Manual reconciliation required.',
      name_match;
  END IF;
END$$;

-- G5b — Korrie Silver holdout check. The rollback test on 2026-05-16
-- confirmed exactly 1 existing row matching ('Korrie','Silver') at phone
-- 647-300-7952. Phase 3 expects that row to remain untouched. If the count
-- has drifted (someone outside Phase 3 deleted, renamed, or duplicated the
-- row), the holdout assumption is stale and the script aborts so the
-- operator can re-investigate.
DO $$
DECLARE korrie_count INT;
BEGIN
  SELECT COUNT(*) INTO korrie_count
  FROM public.clients
  WHERE lower(first_name) = 'korrie'
    AND lower(last_name)  = 'silver'
    AND phone = '647-300-7952';
  IF korrie_count <> 1 THEN
    RAISE EXCEPTION
      'G5b FAIL: Korrie Silver holdout-row count is % at phone 647-300-7952 (expected exactly 1). Investigate before Phase 3 — the held-out reconciliation case may have changed.',
      korrie_count;
  END IF;
END$$;

-- G6 — Schema audit: columns we INSERT must exist; `pets.updated_at` must NOT
-- exist (this Phase 3 script does not set it). We also report on
-- `appointments.updated_at` for continuity with Phase 1/2 audits, but Phase 3
-- does not insert into appointments, so any appointments.updated_at change is
-- a Phase 3.5+ concern, not a blocker for this script.
DO $$
DECLARE missing INT; pets_has_updated_at INT; appts_has_updated_at INT;
BEGIN
  -- Required columns for this script's INSERTs (clients + pets only)
  SELECT COUNT(*) INTO missing
  FROM (VALUES
    ('clients','first_name'),('clients','last_name'),('clients','phone'),
    ('clients','alt_contact'),('clients','notes'),
    ('pets','name'),('pets','breed'),('pets','allergies'),
    ('pets','allergies_detail'),('pets','grooming_notes'),('pets','client_id')
  ) AS req(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns ic
    WHERE ic.table_schema = 'public'
      AND ic.table_name   = req.table_name
      AND ic.column_name  = req.column_name
  );
  IF missing > 0 THEN
    RAISE EXCEPTION 'G6 FAIL: % required column(s) missing from clients/pets schema.', missing;
  END IF;

  -- pets.updated_at is the Phase 3 actionable check.
  SELECT COUNT(*) INTO pets_has_updated_at
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'pets' AND column_name = 'updated_at';
  IF pets_has_updated_at > 0 THEN
    RAISE EXCEPTION
      'G6 FAIL: pets now has an updated_at column. Edit the Section 4 pet INSERTs in THIS script to set updated_at = NOW() before proceeding.';
  END IF;

  -- appointments.updated_at is reported for continuity only. Phase 3 does not
  -- insert into appointments, so a change here does not block this script;
  -- it is a Phase 3.5+ concern.
  SELECT COUNT(*) INTO appts_has_updated_at
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'updated_at';
  IF appts_has_updated_at > 0 THEN
    RAISE NOTICE
      'G6 NOTE: appointments now has an updated_at column. Not a Phase 3 blocker (this script does not insert appointments). Update the Phase 3.5 plan/script accordingly.';
  END IF;
END$$;


-- =============================================================================
-- SECTION 3 — CLIENT INSERTS (6 rows, RETURNING into _phase3_new_clients)
-- =============================================================================

-- 3.1 Mary Anca
WITH ins AS (
  INSERT INTO public.clients (first_name, last_name, phone, alt_contact, notes, created_at, updated_at)
  VALUES ('Mary', 'Anca', '705-330-1807', NULL, NULL, NOW(), NOW())
  RETURNING id, phone, first_name, last_name
)
INSERT INTO _phase3_new_clients (phone, client_id, expected_first_name, expected_last_name)
SELECT phone, id, first_name, last_name FROM ins;

-- 3.2 Nancy Cauchi
WITH ins AS (
  INSERT INTO public.clients (first_name, last_name, phone, alt_contact, notes, created_at, updated_at)
  VALUES (
    'Nancy', 'Cauchi', '1-416-801-6775',
    '705-220-8115 (Nancy)',
    'New client (not in 2022-2024 spreadsheets). Alt contact also Nancy.',
    NOW(), NOW()
  )
  RETURNING id, phone, first_name, last_name
)
INSERT INTO _phase3_new_clients (phone, client_id, expected_first_name, expected_last_name)
SELECT phone, id, first_name, last_name FROM ins;

-- 3.3 Gardy (first name unknown — see plan §11 open question #3)
WITH ins AS (
  INSERT INTO public.clients (first_name, last_name, phone, alt_contact, notes, created_at, updated_at)
  VALUES (
    NULL, 'Gardy', '705-345-2272', NULL,
    'Elderly client — pickup only. Not in 2022-2024 spreadsheets (card-only client). One visit on file (2023-12-14 per Codex; date ambiguity flagged).',
    NOW(), NOW()
  )
  RETURNING id, phone, first_name, last_name
)
INSERT INTO _phase3_new_clients (phone, client_id, expected_first_name, expected_last_name)
SELECT phone, id, first_name, last_name FROM ins;

-- 3.4 Ashley Nichols
WITH ins AS (
  INSERT INTO public.clients (first_name, last_name, phone, alt_contact, notes, created_at, updated_at)
  VALUES (
    'Ashley', 'Nichols', '705-330-1907', NULL,
    'Sam-only entry: identity confirmed but no contact card extracted in batch 1.',
    NOW(), NOW()
  )
  RETURNING id, phone, first_name, last_name
)
INSERT INTO _phase3_new_clients (phone, client_id, expected_first_name, expected_last_name)
SELECT phone, id, first_name, last_name FROM ins;

-- 3.5 Mary Nichols
WITH ins AS (
  INSERT INTO public.clients (first_name, last_name, phone, alt_contact, notes, created_at, updated_at)
  VALUES (
    'Mary', 'Nichols', '705-345-2699', NULL,
    'Sam-only entry; two pets (Merlyn, Vader). Per Sam: all three Nichols/Nicholls households are different families.',
    NOW(), NOW()
  )
  RETURNING id, phone, first_name, last_name
)
INSERT INTO _phase3_new_clients (phone, client_id, expected_first_name, expected_last_name)
SELECT phone, id, first_name, last_name FROM ins;

-- 3.6 Christina Kitchen
-- (Korrie Silver INSERT removed 2026-05-16 — held out per plan §8; the
-- existing row at phone 647-300-7952 needs row-level reconciliation before
-- any Korrie/Gavi INSERTs can ship.)
WITH ins AS (
  INSERT INTO public.clients (first_name, last_name, phone, alt_contact, notes, created_at, updated_at)
  VALUES (
    'Christina', 'Kitchen', '705-323-6293', NULL,
    'Sam-only entry; part of the five-Kitchen-household cluster. Separate from Jennifer Kitchen (705-330-9119), Krystal Kitchen (705-955-2350), Marina Kitchen (no phone — saved in Sam''s phone), and the no-first-name Kitchen with Ebony.',
    NOW(), NOW()
  )
  RETURNING id, phone, first_name, last_name
)
INSERT INTO _phase3_new_clients (phone, client_id, expected_first_name, expected_last_name)
SELECT phone, id, first_name, last_name FROM ins;


-- =============================================================================
-- SECTION 4 — PET INSERTS (7 rows, FK lookup against _phase3_new_clients)
-- =============================================================================
-- Note: pets has no updated_at column in v1 schema (G6 confirms). created_at
-- only.

-- 4.1 Whiskey (Mary Anca)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT
  'Whiskey',
  'Silver Terrier Yorkie',
  false, NULL,
  'Long hair; spayed/neutered; vaccinations current; no medical issues. Male, ~5 yrs at card creation. Typical fee $50-$60.',
  c.client_id,
  NOW()
FROM _phase3_new_clients c WHERE c.phone = '705-330-1807';

-- 4.2 Ruby (Nancy Cauchi)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT 'Ruby','German Shepherd', false, NULL, 'Female.', c.client_id, NOW()
FROM _phase3_new_clients c WHERE c.phone = '1-416-801-6775';

-- 4.3 Coco (Gardy)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT 'Coco','Pomeranian', false, NULL,
       'Female, ~5 yrs at card creation. Typical fee $50.',
       c.client_id, NOW()
FROM _phase3_new_clients c WHERE c.phone = '705-345-2272';

-- 4.4 Kahlúa (Ashley Nichols)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT 'Kahlúa','Husky/Aussie', false, NULL, NULL, c.client_id, NOW()
FROM _phase3_new_clients c WHERE c.phone = '705-330-1907';

-- 4.5 Merlyn (Mary Nichols)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT 'Merlyn','Pug', false, NULL, NULL, c.client_id, NOW()
FROM _phase3_new_clients c WHERE c.phone = '705-345-2699';

-- 4.6 Vader (Mary Nichols)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT 'Vader','German Shepherd', false, NULL, NULL, c.client_id, NOW()
FROM _phase3_new_clients c WHERE c.phone = '705-345-2699';

-- 4.7 Winston (Christina Kitchen) — breed unknown, see plan §11 question #1
-- (Gavi INSERT removed 2026-05-16 — held out per plan §8 with Korrie Silver.
-- The existing Korrie row has two existing Gavi pet rows that need within-
-- client dedup before allergy detail can be applied.)
INSERT INTO public.pets (name, breed, allergies, allergies_detail, grooming_notes, client_id, created_at)
SELECT 'Winston', NULL, false, NULL, NULL, c.client_id, NOW()
FROM _phase3_new_clients c WHERE c.phone = '705-323-6293';


-- =============================================================================
-- SECTION 5 — POST-WRITE INVARIANTS I1-I7
-- =============================================================================

-- I1 — Clients count grew by exactly 6.
DO $$
DECLARE pre INT; post INT;
BEGIN
  SELECT clients_pre INTO pre FROM _phase3_pre_counts;
  SELECT COUNT(*) INTO post FROM public.clients;
  IF post - pre <> 6 THEN
    RAISE EXCEPTION 'I1 FAIL: clients delta is % (expected +6)', post - pre;
  END IF;
END$$;

-- I2 — Pets count grew by exactly 7.
DO $$
DECLARE pre INT; post INT;
BEGIN
  SELECT pets_pre INTO pre FROM _phase3_pre_counts;
  SELECT COUNT(*) INTO post FROM public.pets;
  IF post - pre <> 7 THEN
    RAISE EXCEPTION 'I2 FAIL: pets delta is % (expected +7)', post - pre;
  END IF;
END$$;

-- I3 — Appointments count unchanged. Phase 3 does not touch public.appointments.
DO $$
DECLARE pre INT; post INT;
BEGIN
  SELECT appointments_pre INTO pre FROM _phase3_pre_counts;
  SELECT COUNT(*) INTO post FROM public.appointments;
  IF post - pre <> 0 THEN
    RAISE EXCEPTION 'I3 FAIL: appointments delta is % (expected exactly 0 — Phase 3 is INSERT-only on clients and pets; appointment backfills are Phase 3.5)', post - pre;
  END IF;
END$$;

-- I4 — Every new client is present at the expected phone.
DO $$
DECLARE missing INT;
BEGIN
  SELECT COUNT(*) INTO missing
  FROM _phase3_new_clients nc
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = nc.client_id
      AND c.phone = nc.phone
  );
  IF missing > 0 THEN
    RAISE EXCEPTION 'I4 FAIL: % new client row(s) are missing post-INSERT or have wrong phone', missing;
  END IF;
END$$;

-- I5 — Every new pet FK-resolves to its new client.
DO $$
DECLARE orphaned INT;
BEGIN
  SELECT COUNT(*) INTO orphaned
  FROM public.pets p
  WHERE p.client_id IN (SELECT client_id FROM _phase3_new_clients)
    AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = p.client_id);
  IF orphaned > 0 THEN
    RAISE EXCEPTION 'I5 FAIL: % pet row(s) inserted with no matching client', orphaned;
  END IF;
END$$;

-- I6 — Zero orphan FKs across appointments.
DO $$
DECLARE orphan_client INT; orphan_pet INT;
BEGIN
  SELECT COUNT(*) INTO orphan_client
  FROM public.appointments a
  WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = a.client_id);
  IF orphan_client > 0 THEN
    RAISE EXCEPTION 'I6 FAIL: % appointment(s) point at a non-existent client_id', orphan_client;
  END IF;

  SELECT COUNT(*) INTO orphan_pet
  FROM public.appointments a
  WHERE a.pet_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.pets p WHERE p.id = a.pet_id);
  IF orphan_pet > 0 THEN
    RAISE EXCEPTION 'I6 FAIL: % appointment(s) point at a non-existent pet_id', orphan_pet;
  END IF;
END$$;

-- I7 — Landry/Laundry still has 4 rows.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM public.clients WHERE phone = '705-796-0620';
  IF n <> 4 THEN
    RAISE EXCEPTION 'I7 FAIL: Landry/Laundry row count is % (expected 4)', n;
  END IF;
END$$;


-- =============================================================================
-- SECTION 6 — FINAL SUMMARY (with explicit deltas)
-- =============================================================================
-- Russell: read before flipping ROLLBACK to COMMIT.
--   - clients_delta MUST be exactly +6  (I1 enforced)
--   - pets_delta    MUST be exactly +7  (I2 enforced)
--   - appointments_delta MUST be exactly 0  (I3 enforced — appointment
--     backfills are Phase 3.5, not Phase 3)
--   - Korrie Silver row at 647-300-7952 is held out and remains untouched
--     (G5b enforced)
SELECT
  c_pre  AS clients_pre,  c_post AS clients_post,  (c_post - c_pre) AS clients_delta,
  p_pre  AS pets_pre,     p_post AS pets_post,     (p_post - p_pre) AS pets_delta,
  a_pre  AS appointments_pre, a_post AS appointments_post, (a_post - a_pre) AS appointments_delta,
  (SELECT COUNT(*) FROM _phase3_new_clients) AS new_clients_count
FROM (
  SELECT
    (SELECT clients_pre      FROM _phase3_pre_counts) AS c_pre,
    (SELECT COUNT(*) FROM public.clients)             AS c_post,
    (SELECT pets_pre         FROM _phase3_pre_counts) AS p_pre,
    (SELECT COUNT(*) FROM public.pets)                AS p_post,
    (SELECT appointments_pre FROM _phase3_pre_counts) AS a_pre,
    (SELECT COUNT(*) FROM public.appointments)        AS a_post
) s;


-- =============================================================================
-- SECTION 7 — ROLLBACK / COMMIT
-- =============================================================================
-- DEFAULT: ROLLBACK. The script as written CANNOT mutate the database.
--
-- To ship: change `ROLLBACK;` to `COMMIT;` ONLY AFTER:
--   (a) Pre-flight (Section 0) results match expected values.
--   (b) Fresh pre-COMMIT backup exists at _private/backups/<phase-3-tag>/.
--   (c) Live pre-flight counts re-verified within the same minute as the backup.
--   (d) Codex verifier checklist signed off
--       (_reports/2026-05-16-phase-3-insert-plan.md §9).
--   (e) Russell consciously edits this line AND supervises the run.
--   (f) All pre-write gates (G1, G2, G3, G4, G5a, G5b, G6) and all 7 post-write
--       invariants (I1-I7) pass without any RAISE EXCEPTION.
--   (g) Final summary in Section 6 shows the deltas: clients +6, pets +7,
--       appointments 0.

ROLLBACK;
-- COMMIT;

-- =============================================================================
-- End of Phase 3 INSERT draft. NO SQL HAS BEEN EXECUTED BY THIS FILE.
-- Appointment backfills (Whiskey×3, Kiwi×2, plus date-ambiguous candidates)
-- live in _reports/2026-05-16-phase-3.5-appointment-backfills-plan.md.
-- =============================================================================
