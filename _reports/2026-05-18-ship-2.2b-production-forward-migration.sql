-- ############################################################################
-- ##  PRODUCTION — DO NOT RUN WITHOUT RUSSELL'S EXPLICIT FINAL APPROVAL.      ##
-- ##  This is the Ship 2.2b RLS-hardening migration for the LIVE Tidy Tails  ##
-- ##  database (pgkwovokciaqnbhpttba). It is one-way and reaches Samantha's   ##
-- ##  live business the moment it commits.                                   ##
-- ############################################################################
--
-- Ship 2.2b — RLS-hardening FORWARD migration            (PRODUCTION COPY)
-- ============================================================================
-- Venture:      tidy-tails
-- Authored:     2026-05-18
-- Target:       PRODUCTION project pgkwovokciaqnbhpttba (Tidy Tails, live)
-- Source plan:  _reports/2026-05-15-v2-ship-2.2-auth-rls-plan.md  §4 (Steps A->B->C)
-- Derived from: _reports/2026-05-18-ship-2.2b-forward-migration.sql — the SQL
--               rehearsed green (forward + rollback) on a Supabase branch on
--               2026-05-18; see _reports/2026-05-18-ship-2.2b-branch-rehearsal-execution-report.md.
-- Apply as:     ONE named Supabase migration "ship_2_2b_forward_rls_hardening"
--               via apply_migration — only at the cutover, per the runbook
--               _reports/2026-05-18-ship-2.2b-production-cutover-runbook.md.
-- Rollback:     _reports/2026-05-18-ship-2.2b-production-rollback-migration.sql
--
-- ⚠ WHAT THIS DOES — AND WHAT BREAKS
--   Closes R-1: adds groomer_id to the 6 in-scope public tables, backfills it
--   to Samantha, enforces NOT NULL, replaces every permissive ("qual = true")
--   policy with auth.uid()-scoped policies, and drops the client_overview
--   SECURITY DEFINER view.
--
--   ⚠ v1 GOES DARK THE MOMENT THIS COMMITS. v1 is static HTML using the public
--   anon key. After this migration the anon role's auth.uid() is NULL, so
--   `groomer_id = auth.uid()` is false for every row — v1 can no longer READ
--   or WRITE Tidy Tails data. There is no anon bridge (parent plan §1, a
--   deliberate decision). v1 stops being a live data client at COMMIT; v2 must
--   already be Samantha's working tool. This is the cutover, not a preview.
--
-- ⚠ PRODUCTION UID — already substituted, do not change
--   The UID below — 88413167-0799-49a7-ba4c-c1c29403e038 — is Samantha's
--   VERIFIED PRODUCTION auth.users UID (sammclennan143@gmail.com), captured
--   read-only from production on 2026-05-18 and recorded in
--   _reports/2026-05-18-ship-2.2b-production-uid.md. It is NOT the rehearsal
--   UID. No further substitution is needed; this file is production-ready.
--
-- SCOPE — 6 in-scope tables
--   clients, pets, appointments, booking_requests, client_accounts,
--   automations_log.
--   sam_review_responses is OUT of scope — left exactly as-is (its INSERT-only
--   anon policy "sam_review_anon_insert" is a Workstream-B artifact; parent
--   plan §4). This file does not touch it.
--
-- ATOMICITY
--   apply_migration wraps this whole file in one BEGIN/COMMIT — Steps A, B, C
--   (and the final NOTIFY) land together or not at all. There is no
--   half-migrated state v1 can observe.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP A — add groomer_id, backfill to Samantha's UID, enforce NOT NULL
-- ---------------------------------------------------------------------------
-- DEFAULT auth.uid() auto-stamps the caller's UID on future authenticated
-- inserts. During this migration there is no JWT, so the DEFAULT evaluates to
-- NULL for existing rows; the explicit UPDATE backfills them before SET NOT NULL.

ALTER TABLE public.clients
  ADD COLUMN groomer_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
UPDATE public.clients
  SET groomer_id = '88413167-0799-49a7-ba4c-c1c29403e038' WHERE groomer_id IS NULL;
ALTER TABLE public.clients ALTER COLUMN groomer_id SET NOT NULL;

ALTER TABLE public.pets
  ADD COLUMN groomer_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
UPDATE public.pets
  SET groomer_id = '88413167-0799-49a7-ba4c-c1c29403e038' WHERE groomer_id IS NULL;
ALTER TABLE public.pets ALTER COLUMN groomer_id SET NOT NULL;

ALTER TABLE public.appointments
  ADD COLUMN groomer_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
UPDATE public.appointments
  SET groomer_id = '88413167-0799-49a7-ba4c-c1c29403e038' WHERE groomer_id IS NULL;
ALTER TABLE public.appointments ALTER COLUMN groomer_id SET NOT NULL;

ALTER TABLE public.booking_requests
  ADD COLUMN groomer_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
UPDATE public.booking_requests
  SET groomer_id = '88413167-0799-49a7-ba4c-c1c29403e038' WHERE groomer_id IS NULL;
ALTER TABLE public.booking_requests ALTER COLUMN groomer_id SET NOT NULL;

ALTER TABLE public.client_accounts
  ADD COLUMN groomer_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
UPDATE public.client_accounts
  SET groomer_id = '88413167-0799-49a7-ba4c-c1c29403e038' WHERE groomer_id IS NULL;
ALTER TABLE public.client_accounts ALTER COLUMN groomer_id SET NOT NULL;

ALTER TABLE public.automations_log
  ADD COLUMN groomer_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
UPDATE public.automations_log
  SET groomer_id = '88413167-0799-49a7-ba4c-c1c29403e038' WHERE groomer_id IS NULL;
ALTER TABLE public.automations_log ALTER COLUMN groomer_id SET NOT NULL;


-- ---------------------------------------------------------------------------
-- STEP B — replace permissive policies with auth.uid()-scoped policies
-- ---------------------------------------------------------------------------
-- Per table: drop every captured permissive policy (names verbatim from
-- _reports/2026-05-17-prod-preflight-policies.json; IF EXISTS keeps the
-- migration idempotent), then create the four groomer_* scoped policies.
-- ENABLE ROW LEVEL SECURITY is already on in production — re-stated for
-- self-containment; it is idempotent.

-- clients
DROP POLICY IF EXISTS "Anon can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anon can select clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can select all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can update clients" ON public.clients;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groomer_select" ON public.clients
  FOR SELECT USING (groomer_id = auth.uid());
CREATE POLICY "groomer_insert" ON public.clients
  FOR INSERT WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_update" ON public.clients
  FOR UPDATE USING (groomer_id = auth.uid()) WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_delete" ON public.clients
  FOR DELETE USING (groomer_id = auth.uid());

-- pets
DROP POLICY IF EXISTS "Anon can insert pets" ON public.pets;
DROP POLICY IF EXISTS "Anon can select pets" ON public.pets;
DROP POLICY IF EXISTS "Authenticated can select all pets" ON public.pets;
DROP POLICY IF EXISTS "Authenticated can update pets" ON public.pets;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groomer_select" ON public.pets
  FOR SELECT USING (groomer_id = auth.uid());
CREATE POLICY "groomer_insert" ON public.pets
  FOR INSERT WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_update" ON public.pets
  FOR UPDATE USING (groomer_id = auth.uid()) WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_delete" ON public.pets
  FOR DELETE USING (groomer_id = auth.uid());

-- appointments
DROP POLICY IF EXISTS "Authenticated can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can select appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can update appointments" ON public.appointments;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groomer_select" ON public.appointments
  FOR SELECT USING (groomer_id = auth.uid());
CREATE POLICY "groomer_insert" ON public.appointments
  FOR INSERT WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_update" ON public.appointments
  FOR UPDATE USING (groomer_id = auth.uid()) WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_delete" ON public.appointments
  FOR DELETE USING (groomer_id = auth.uid());

-- booking_requests
DROP POLICY IF EXISTS "Anon can insert booking_requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Anon can select booking_requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Anon can update booking_requests" ON public.booking_requests;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groomer_select" ON public.booking_requests
  FOR SELECT USING (groomer_id = auth.uid());
CREATE POLICY "groomer_insert" ON public.booking_requests
  FOR INSERT WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_update" ON public.booking_requests
  FOR UPDATE USING (groomer_id = auth.uid()) WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_delete" ON public.booking_requests
  FOR DELETE USING (groomer_id = auth.uid());

-- client_accounts
DROP POLICY IF EXISTS "Anon can insert client_accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Anon can select client_accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Anon can update client_accounts" ON public.client_accounts;
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groomer_select" ON public.client_accounts
  FOR SELECT USING (groomer_id = auth.uid());
CREATE POLICY "groomer_insert" ON public.client_accounts
  FOR INSERT WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_update" ON public.client_accounts
  FOR UPDATE USING (groomer_id = auth.uid()) WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_delete" ON public.client_accounts
  FOR DELETE USING (groomer_id = auth.uid());

-- automations_log
DROP POLICY IF EXISTS "Authenticated can insert automations" ON public.automations_log;
DROP POLICY IF EXISTS "Authenticated can select automations" ON public.automations_log;
DROP POLICY IF EXISTS "Authenticated can update automations" ON public.automations_log;
ALTER TABLE public.automations_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groomer_select" ON public.automations_log
  FOR SELECT USING (groomer_id = auth.uid());
CREATE POLICY "groomer_insert" ON public.automations_log
  FOR INSERT WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_update" ON public.automations_log
  FOR UPDATE USING (groomer_id = auth.uid()) WITH CHECK (groomer_id = auth.uid());
CREATE POLICY "groomer_delete" ON public.automations_log
  FOR DELETE USING (groomer_id = auth.uid());


-- ---------------------------------------------------------------------------
-- STEP C — drop the SECURITY DEFINER view (closes B2 / R-5)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.client_overview;


-- ---------------------------------------------------------------------------
-- POST — refresh the PostgREST schema cache
-- ---------------------------------------------------------------------------
-- Rehearsal finding: after the DDL above, PostgREST served a stale schema until
-- a reload was issued. Included here as the final statement so it fires at
-- COMMIT, atomically with the migration — v2's REST calls see the new schema
-- immediately. The runbook also lists this as an explicit verification point.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END Ship 2.2b production forward migration
-- ============================================================================
