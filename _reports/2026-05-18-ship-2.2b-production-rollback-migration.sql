-- ############################################################################
-- ##  PRODUCTION ROLLBACK — DO NOT RUN WITHOUT RUSSELL'S EXPLICIT APPROVAL.   ##
-- ##  Apply this ONLY if the Ship 2.2b forward migration must be reverted on  ##
-- ##  the LIVE Tidy Tails database (pgkwovokciaqnbhpttba) during the watch    ##
-- ##  week. It restores v1's working state.                                   ##
-- ############################################################################
--
-- Ship 2.2b — RLS-hardening ROLLBACK migration           (PRODUCTION COPY)
-- ============================================================================
-- Venture:      tidy-tails
-- Authored:     2026-05-18
-- Target:       PRODUCTION project pgkwovokciaqnbhpttba (Tidy Tails, live)
-- Source plan:  _reports/2026-05-15-v2-ship-2.2-auth-rls-plan.md  §5
--               (inverse of §4: Steps C^-1 -> B^-1 -> A^-1)
-- Derived from: _reports/2026-05-18-ship-2.2b-rollback-migration.sql — the SQL
--               rehearsed green on a Supabase branch on 2026-05-18 (forward ->
--               rollback; see the branch rehearsal execution report).
-- Apply as:     ONE named Supabase migration "ship_2_2b_rollback_rls_hardening"
--               via apply_migration. Rollback trigger criteria and the exact
--               process are in the cutover runbook
--               _reports/2026-05-18-ship-2.2b-production-cutover-runbook.md.
--
-- WHAT THIS DOES
--   The exact inverse of 2026-05-18-ship-2.2b-production-forward-migration.sql.
--   It restores Tidy Tails' pre-migration permissive RLS posture: recreates the
--   client_overview view, drops the auth.uid()-scoped groomer_* policies and
--   restores the original permissive ("qual = true") policies, and drops the
--   groomer_id column. After it commits, an anon REST request returns rows
--   again — i.e. v1 works again. This is the real "v1 fallback" (parent §5).
--
-- ⚠ DATA SAFETY — drops a COLUMN, never a ROW
--   This drops the groomer_id column, not any row. Every row v2 created while
--   the forward migration was live is PRESERVED — only the column disappears.
--   v1 reads all other columns fine. No customer data is lost by a rollback.
--   (Verified in the branch rehearsal: a probe row inserted between forward and
--   rollback survived the rollback intact.)
--
-- ⚠ SECOND SAFETY NET
--   If a rollback somehow cannot be applied, the fresh service_role logical
--   backup taken minutes before the cutover (runbook step 1) is the full-restore
--   path. The rollback migration is the fast in-place path; the backup is the
--   independent fallback.
--
-- SOURCE OF TRUTH for the restored objects
--   - The 20 permissive policies are recreated verbatim from
--     _reports/2026-05-17-prod-preflight-policies.json (captured from
--     production pg_policies before the migration). DELETE policies are NOT
--     recreated — they were dropped 2026-04-22 and the snapshot has none.
--   - The client_overview body is the verbatim pg_get_viewdef capture from
--     _reports/2026-05-17-prod-preflight-schema.sql. A plain CREATE VIEW (no
--     WITH (security_invoker)) restores the SECURITY DEFINER property — this is
--     intended: it returns the database to its exact pre-migration state. In
--     the branch rehearsal the post-rollback security advisors matched the
--     pre-migration set exactly (19 lints, identical cache_keys).
--
-- SCOPE — same 6 in-scope tables as the forward migration. sam_review_responses
--   is untouched (never in scope).
--
-- ATOMICITY
--   apply_migration wraps this whole file in one BEGIN/COMMIT — Steps C^-1,
--   B^-1, A^-1 (and the final NOTIFY) land together or not at all.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP C^-1 — recreate the client_overview view
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.client_overview;

CREATE VIEW public.client_overview AS
 SELECT c.id,
    c.first_name,
    c.last_name,
    c.phone,
    c.email,
    c.tier,
    c.preferred_location,
    c.preferred_day,
    c.preferred_frequency_weeks,
    string_agg(p.name, ', '::text ORDER BY p.name) AS pet_names,
    count(DISTINCT p.id) AS total_pets,
    max(a.date) AS last_appointment_date,
    count(DISTINCT a.id) FILTER (WHERE a.status = 'completed'::text) AS total_visits,
    c.created_at,
    c.updated_at
   FROM clients c
     LEFT JOIN pets p ON c.id = p.client_id
     LEFT JOIN appointments a ON c.id = a.client_id
  GROUP BY c.id, c.first_name, c.last_name, c.phone, c.email, c.tier, c.preferred_location, c.preferred_day, c.preferred_frequency_weeks, c.created_at, c.updated_at;


-- ---------------------------------------------------------------------------
-- STEP B^-1 — drop the groomer_* scoped policies, restore permissive policies
-- ---------------------------------------------------------------------------
-- Per table: drop the four groomer_* policies, then recreate the captured
-- permissive policies verbatim. The extra DROP POLICY IF EXISTS lines on the
-- permissive names keep the rollback re-runnable. No DELETE policy is created
-- (matching the 2026-04-22 production state).

-- clients
DROP POLICY IF EXISTS "groomer_select" ON public.clients;
DROP POLICY IF EXISTS "groomer_insert" ON public.clients;
DROP POLICY IF EXISTS "groomer_update" ON public.clients;
DROP POLICY IF EXISTS "groomer_delete" ON public.clients;
DROP POLICY IF EXISTS "Anon can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anon can select clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can select all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can update clients" ON public.clients;
CREATE POLICY "Anon can insert clients" ON public.clients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anon can select clients" ON public.clients FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can select all clients" ON public.clients FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can update clients" ON public.clients FOR UPDATE TO public USING (true);

-- pets
DROP POLICY IF EXISTS "groomer_select" ON public.pets;
DROP POLICY IF EXISTS "groomer_insert" ON public.pets;
DROP POLICY IF EXISTS "groomer_update" ON public.pets;
DROP POLICY IF EXISTS "groomer_delete" ON public.pets;
DROP POLICY IF EXISTS "Anon can insert pets" ON public.pets;
DROP POLICY IF EXISTS "Anon can select pets" ON public.pets;
DROP POLICY IF EXISTS "Authenticated can select all pets" ON public.pets;
DROP POLICY IF EXISTS "Authenticated can update pets" ON public.pets;
CREATE POLICY "Anon can insert pets" ON public.pets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anon can select pets" ON public.pets FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can select all pets" ON public.pets FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can update pets" ON public.pets FOR UPDATE TO public USING (true);

-- appointments
DROP POLICY IF EXISTS "groomer_select" ON public.appointments;
DROP POLICY IF EXISTS "groomer_insert" ON public.appointments;
DROP POLICY IF EXISTS "groomer_update" ON public.appointments;
DROP POLICY IF EXISTS "groomer_delete" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can select appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can update appointments" ON public.appointments;
CREATE POLICY "Authenticated can insert appointments" ON public.appointments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Authenticated can select appointments" ON public.appointments FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can update appointments" ON public.appointments FOR UPDATE TO public USING (true);

-- automations_log
DROP POLICY IF EXISTS "groomer_select" ON public.automations_log;
DROP POLICY IF EXISTS "groomer_insert" ON public.automations_log;
DROP POLICY IF EXISTS "groomer_update" ON public.automations_log;
DROP POLICY IF EXISTS "groomer_delete" ON public.automations_log;
DROP POLICY IF EXISTS "Authenticated can insert automations" ON public.automations_log;
DROP POLICY IF EXISTS "Authenticated can select automations" ON public.automations_log;
DROP POLICY IF EXISTS "Authenticated can update automations" ON public.automations_log;
CREATE POLICY "Authenticated can insert automations" ON public.automations_log FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Authenticated can select automations" ON public.automations_log FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can update automations" ON public.automations_log FOR UPDATE TO public USING (true);

-- booking_requests
DROP POLICY IF EXISTS "groomer_select" ON public.booking_requests;
DROP POLICY IF EXISTS "groomer_insert" ON public.booking_requests;
DROP POLICY IF EXISTS "groomer_update" ON public.booking_requests;
DROP POLICY IF EXISTS "groomer_delete" ON public.booking_requests;
DROP POLICY IF EXISTS "Anon can insert booking_requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Anon can select booking_requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Anon can update booking_requests" ON public.booking_requests;
CREATE POLICY "Anon can insert booking_requests" ON public.booking_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anon can select booking_requests" ON public.booking_requests FOR SELECT TO public USING (true);
CREATE POLICY "Anon can update booking_requests" ON public.booking_requests FOR UPDATE TO public USING (true);

-- client_accounts
DROP POLICY IF EXISTS "groomer_select" ON public.client_accounts;
DROP POLICY IF EXISTS "groomer_insert" ON public.client_accounts;
DROP POLICY IF EXISTS "groomer_update" ON public.client_accounts;
DROP POLICY IF EXISTS "groomer_delete" ON public.client_accounts;
DROP POLICY IF EXISTS "Anon can insert client_accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Anon can select client_accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Anon can update client_accounts" ON public.client_accounts;
CREATE POLICY "Anon can insert client_accounts" ON public.client_accounts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anon can select client_accounts" ON public.client_accounts FOR SELECT TO public USING (true);
CREATE POLICY "Anon can update client_accounts" ON public.client_accounts FOR UPDATE TO public USING (true);


-- ---------------------------------------------------------------------------
-- STEP A^-1 — drop the groomer_id column on all 6 in-scope tables
-- ---------------------------------------------------------------------------
-- DROP COLUMN cascades to the column's FK constraint and DEFAULT. Rows are
-- untouched. Safe after B^-1 because no surviving policy references groomer_id.

ALTER TABLE public.clients          DROP COLUMN IF EXISTS groomer_id;
ALTER TABLE public.pets             DROP COLUMN IF EXISTS groomer_id;
ALTER TABLE public.appointments     DROP COLUMN IF EXISTS groomer_id;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS groomer_id;
ALTER TABLE public.client_accounts  DROP COLUMN IF EXISTS groomer_id;
ALTER TABLE public.automations_log  DROP COLUMN IF EXISTS groomer_id;


-- ---------------------------------------------------------------------------
-- POST — refresh the PostgREST schema cache
-- ---------------------------------------------------------------------------
-- Same rehearsal finding as the forward migration: reload PostgREST so it
-- serves the rolled-back schema immediately. Fires at COMMIT.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END Ship 2.2b production rollback migration
-- ============================================================================
