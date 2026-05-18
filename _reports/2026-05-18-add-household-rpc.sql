-- ############################################################################
-- ##  ARTIFACT ONLY — DO NOT APPLY TO PRODUCTION.                            ##
-- ##  This is a DRAFT Postgres function for the post-cutover Add Household   ##
-- ##  write flip. It needs its own migration, its own Supabase-branch        ##
-- ##  rehearsal, and its own explicit approval before it reaches the live    ##
-- ##  Tidy Tails database (pgkwovokciaqnbhpttba). It is NOT part of the      ##
-- ##  Ship 2.2b RLS cutover.                                                 ##
-- ############################################################################
--
-- Add Household — transactional client + first-pet RPC          (DRAFT ARTIFACT)
-- ============================================================================
-- Venture:   tidy-tails
-- Authored:  2026-05-18
-- Purpose:   Make the Add Household write atomic. The live path is a `clients`
--            insert plus a dependent `pets` insert (pets.client_id = the new
--            client's id). Those two statements are NOT atomic in PostgREST —
--            a pet-insert failure after a client-insert success orphans a
--            client row (REQ-30). A single Postgres function runs inside one
--            transaction, so either both rows land or neither does.
-- Plan:      _reports/2026-05-18-add-household-rpc-plan.md
-- Depends on: the Ship 2.2b RLS cutover having been applied — this function
--            relies on the groomer_id column + DEFAULT auth.uid() + the
--            groomer_insert policies that the cutover creates.
--
-- WHY SECURITY INVOKER
--   The function runs with the CALLER's privileges and identity, so RLS is
--   enforced normally: inside the function `auth.uid()` is Samantha's UID, the
--   groomer_id column DEFAULT auth.uid() stamps both rows, and the
--   groomer_insert WITH CHECK (groomer_id = auth.uid()) policies pass. It does
--   NOT bypass RLS — a SECURITY DEFINER function would, which is exactly the
--   posture Ship 2.2b removed (the client_overview view). groomer_id is never
--   set explicitly here; the column DEFAULT owns it.
--
-- ATOMICITY
--   A plpgsql function executes within the calling statement's transaction.
--   If the pets INSERT raises (FK, RLS, CHECK, NOT NULL), the exception
--   propagates and the whole function call — including the clients INSERT —
--   is rolled back. No orphan client row can remain.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- FORWARD — create the function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_client_with_first_pet(
  p_first_name            text,
  p_last_name             text,
  p_phone                 text,
  p_email                 text,
  p_address               text,
  p_notes                 text,
  p_pet_name              text,
  p_pet_breed             text,
  p_pet_size              text,
  p_pet_allergies         boolean,
  p_pet_allergies_detail  text,
  p_pet_grooming_notes    text,
  p_pet_standard_fee      numeric
)
RETURNS TABLE (client_id uuid, pet_id uuid)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_pet_id    uuid;
BEGIN
  -- Defense-in-depth guard. The v2 app validates intake first (lib/intake.ts);
  -- this re-checks the required fields so a malformed direct RPC call fails
  -- loudly rather than writing a half-blank household.
  IF coalesce(btrim(p_first_name), '') = ''
     OR coalesce(btrim(p_last_name), '') = ''
     OR coalesce(btrim(p_phone), '') = ''
     OR coalesce(btrim(p_pet_name), '') = '' THEN
    RAISE EXCEPTION
      'create_client_with_first_pet: first name, last name, phone and pet name are required';
  END IF;

  -- Client row. groomer_id is omitted on purpose — the column DEFAULT
  -- auth.uid() stamps it to the authenticated caller, satisfying groomer_insert.
  INSERT INTO public.clients (first_name, last_name, phone, email, address, notes)
  VALUES (p_first_name, p_last_name, p_phone, p_email, p_address, p_notes)
  RETURNING id INTO v_client_id;

  -- First pet, wired to the just-created client. If this raises, the client
  -- INSERT above rolls back with it — that is the whole point of the function.
  INSERT INTO public.pets
    (client_id, name, breed, size, allergies, allergies_detail,
     grooming_notes, standard_fee)
  VALUES
    (v_client_id, p_pet_name, p_pet_breed, p_pet_size, p_pet_allergies,
     p_pet_allergies_detail, p_pet_grooming_notes, p_pet_standard_fee)
  RETURNING id INTO v_pet_id;

  RETURN QUERY SELECT v_client_id, v_pet_id;
END;
$$;

-- Execution grants: PostgREST calls RPCs as the request's role. Only an
-- authenticated operator may create a household — never anon.
REVOKE EXECUTE ON FUNCTION public.create_client_with_first_pet(
  text, text, text, text, text, text, text, text, text, boolean, text, text, numeric
) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_client_with_first_pet(
  text, text, text, text, text, text, text, text, text, boolean, text, text, numeric
) TO authenticated;

-- PostgREST schema-cache reload, so the new RPC is callable immediately.
NOTIFY pgrst, 'reload schema';


-- ---------------------------------------------------------------------------
-- ROLLBACK — drop the function  (commented; for the rehearsal's revert step)
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.create_client_with_first_pet(
--   text, text, text, text, text, text, text, text, text, boolean, text, text, numeric
-- );
-- NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END Add Household transactional RPC — DRAFT ARTIFACT, do not apply.
-- ============================================================================
