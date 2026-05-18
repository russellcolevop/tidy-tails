---
title: Ship 2.2b — production pre-migration snapshot report
venture: tidy-tails
date: 2026-05-17
status: complete
type: rehearsal-artifact
ship: 2.2b
plan-task: Task 1 of 2026-05-17-ship-2.2b-throwaway-project-setup-plan.md
project-ref: pgkwovokciaqnbhpttba
---

# Ship 2.2b — production pre-migration snapshot report

This is Task 1 of the Ship 2.2b throwaway-project setup plan: a durable, read-only
capture of Tidy Tails production **schema + RLS policies + view/function definitions +
security-advisor baseline**, taken *before* the `groomer_id` RLS-hardening migration.
It exists so the throwaway rehearsal target can be stood up to true production fidelity
and so the post-migration diff has something honest to compare against.

**No production mutation occurred.** Every capture was a `SELECT` against system
catalogs or a read-only advisor call. No rows, no customer data, no DDL, no writes.

---

## Key findings

Read these before trusting any parent-doc assumption about the policy set.

1. **There are 21 RLS policies, not the simpler set the parent docs imply.** The
   Ship 2.2b branch-rehearsal plan and the older RLS audit in `tidy-tails/CLAUDE.md`
   describe RLS in round terms ("every SELECT/INSERT/UPDATE policy has `qual = true`").
   The real catalog has **21 distinct policies** with **inconsistent names** — and the
   rollback migration must recreate *those exact names*, not a tidied-up version.

2. **`clients` and `pets` carry 4 policies each — including a redundant SELECT pair.**
   Both tables have *two* SELECT policies (`Anon can select …` **and**
   `Authenticated can select all …`) that do the same thing. The other five tables
   have 3 policies or fewer. Any rollback that recreates "3 policies per table" is
   wrong for `clients` and `pets`.

3. **Policy names lie about roles.** Names mix `Anon can …` / `Authenticated can …` /
   snake_case (`sam_review_anon_insert`), but **all 21 policies have `roles = {public}`**.
   The name prefix is cosmetic — it does not scope the policy to a role. Don't read
   intent from the names.

4. **No DELETE policy exists on any table.** The three DELETE policies on
   `clients`/`pets`/`appointments` were dropped 2026-04-22. The rehearsal should not
   recreate them.

5. **`client_overview` is a SECURITY DEFINER view — a hard advisor ERROR.** The view
   has no `security_invoker` option, so it runs with its owner's (`postgres`)
   privileges and bypasses the caller's RLS. This is the single ERROR-level advisor
   lint. Captured verbatim; **out of scope for Ship 2.2b** unless the migration
   explicitly chooses to fix it.

6. **`rls_auto_enable()` is a publicly-callable SECURITY DEFINER function.** It is the
   event-trigger function behind the `ensure_rls` event trigger, and the advisor flags
   it **twice** (anon + authenticated can call it via `/rest/v1/rpc/rls_auto_enable`).
   Recreating the `ensure_rls` event trigger requires the **`postgres` role** — if the
   rehearsal apply path lacks that privilege, skip the event trigger; it only affects
   *future* `CREATE TABLE`, not the RLS migration rehearsal itself.

7. **Foreign-key `ON DELETE` behavior is NOT uniform.** `booking_requests`' three FKs
   are plain `NO ACTION`; every other FK in the schema is `ON DELETE CASCADE`. This is
   deliberate and must be preserved exactly — the schema SQL captures it verbatim.

8. **`uuid-ossp` is a hard dependency.** Every table's `id` default is
   `extensions.uuid_generate_v4()`. A fresh Supabase project normally has the extension
   pre-installed, but the schema file declares it `IF NOT EXISTS` so the rehearsal
   apply does not silently fail on a stripped project.

9. **Migration history is nearly empty — do not trust it as the schema source.** Only
   4 migrations are tracked (all `sam_review_responses`-related, 2026-05-13). The 6
   core tables predate migration tracking entirely. The schema SQL in this snapshot —
   *not* the Supabase migration list — is the authoritative pre-migration definition.

10. **⚠ Planner row estimates are not a baseline.** A `list_tables` run during this
    capture reported `appointments` ≈ **7 rows** against a true count of **737** — a
    100× error. **Never** use a `list_tables` / planner estimate as a Ship 2.2b cutover
    verifier. The only valid baseline is the exact `count(*)` captured into the backup
    manifest at cutover time (this is also stated in `tidy-tails/CLAUDE.md` and the
    backup-rollback checklist). No row counts were captured into these schema/policy
    artifacts at all — by design.

---

## Artifacts produced

All four files live in `tidy-tails/_reports/` and contain **schema / metadata only —
no customer rows**.

| File | What it is |
|------|------------|
| `2026-05-17-prod-preflight-schema.sql` | Runnable DDL: 2 extensions, 2 functions, 7 tables, all PK/UNIQUE/CHECK/FK constraints, 16 secondary indexes, 1 trigger, RLS-enable ×7, 21 `CREATE POLICY`, the `client_overview` view, the `ensure_rls` event trigger. **Reconstructed from read-only introspection — NOT a `pg_dump`** (see caveat below). |
| `2026-05-17-prod-preflight-policies.json` | The 21 RLS policies verbatim from `pg_policies`, plus a metadata header. Authoritative machine-readable copy; the Task 8 fidelity byte-compare runs against this. |
| `2026-05-17-prod-preflight-advisors.json` | The 19 security-advisor lints verbatim (1 ERROR, 18 WARN), plus a metadata header. The post-migration advisor baseline. |
| `2026-05-17-prod-preflight-snapshot-report.md` | This file — the human-readable summary. |

### Schema coverage — all 7 public tables represented

`clients`, `pets`, `appointments`, `automations_log`, `client_accounts`,
`booking_requests`, `sam_review_responses` — each has a `CREATE TABLE`, its
constraints, its indexes, RLS enabled, and its policies in the schema SQL.

### RLS policy coverage — 21 policies

| Table | Policies | Commands |
|-------|----------|----------|
| `clients` | 4 | INSERT, SELECT ×2, UPDATE |
| `pets` | 4 | INSERT, SELECT ×2, UPDATE |
| `appointments` | 3 | INSERT, SELECT, UPDATE |
| `automations_log` | 3 | INSERT, SELECT, UPDATE |
| `booking_requests` | 3 | INSERT, SELECT, UPDATE |
| `client_accounts` | 3 | INSERT, SELECT, UPDATE |
| `sam_review_responses` | 1 | INSERT only |

RLS is **enabled** on all 7 tables; `relforcerowsecurity` is **false** everywhere
(enabled, not forced).

### `client_overview` view — captured

The full view definition is captured verbatim in the schema SQL (a `clients` ⋈ `pets`
⋈ `appointments` aggregate with pet-name `string_agg`, pet/visit counts, and
last-appointment date). It is **present, not absent**. Its SECURITY DEFINER status is
flagged in the advisor JSON (the lone ERROR).

### Security-advisor baseline — 19 lints

1 ERROR (`security_definer_view` on `client_overview`) and 18 WARN: 13×
`rls_policy_always_true` (one per INSERT/UPDATE policy + the `sam_review_responses`
INSERT), `function_search_path_mutable` on `update_updated_at_column`,
`public_bucket_allows_listing` on the `sam-review` storage bucket, the two
`rls_auto_enable` SECURITY DEFINER lints, and `auth_leaked_password_protection`.

---

## Method and caveats

- **Capture method:** read-only Supabase MCP. The Supabase CLI is **not installed** on
  the capture machine, and `supabase link` would require the production DB password
  (rotated 2026-04-22, not available to this session). The preferred CLI path
  (`supabase db dump -s public`) was therefore not used; the plan explicitly permits a
  read-only SQL/MCP introspection path as the fallback, and that is what was done.
- **The schema `.sql` is reconstructed, not a `pg_dump`.** Constraint, index, policy,
  view, and function bodies are verbatim from `pg_get_constraintdef` /
  `pg_indexes.indexdef` / `pg_get_viewdef` / `pg_get_functiondef`. The `CREATE TABLE`
  column lists are reconstructed — **column order may differ cosmetically** from
  production. This is immaterial for the rehearsal: `restore_supabase.py` inserts by
  column name. For a true `pg_dump`-fidelity capture, install the Supabase CLI and run
  `supabase db dump --linked -s public` with the production DB password.
- **No row data anywhere.** None of the four artifacts contains a single customer row.
  Row counts were deliberately *not* captured into these files — see Key Finding 10.
- **Out of scope, recorded for completeness:** `auth_leaked_password_protection` and
  the `sam-review` bucket listing WARN are pre-existing and unrelated to Ship 2.2b.
  They are in the advisor JSON only so the post-migration advisor diff is clean — the
  Ship 2.2b migration should not be expected to clear them.

## Gaps / known limitations

- **No `pg_dump` byte-fidelity.** As above — column ordering and any non-introspectable
  storage attributes are not guaranteed. Acceptable for an RLS-policy rehearsal;
  flagged here so nobody mistakes this for a disaster-recovery-grade dump.
- **No Supabase Auth / `auth` schema, no Storage, no edge-function capture.** This
  snapshot is `public`-schema database state only. The `send-sms` edge function and
  the `sam-review` storage bucket are not reproduced — the rehearsal does not exercise
  them.
- **`ensure_rls` event trigger may not apply.** Creating it needs the `postgres` role.
  If the rehearsal apply path lacks that, the event trigger is skipped — non-blocking.

## Verification — all checks pass

- ✅ Artifacts contain **no row/customer data** — schema, policy metadata, and advisor
  lints only.
- ✅ **All 7 public tables represented** in the schema SQL and the policy table.
- ✅ **Policy names and definitions captured** — 21 policies verbatim in
  `…-policies.json` and as `CREATE POLICY` statements in the schema SQL.
- ✅ **`client_overview` definition captured** — full `CREATE VIEW` body in the schema
  SQL; not absent.
- ✅ **No production mutation** — read-only catalog `SELECT`s and one read-only advisor
  call; zero DDL, zero writes.

## Next step

Task 2 of the setup plan (`restore_supabase.py`) is already done. The remaining gated
steps stand up the throwaway Supabase project and then apply
`2026-05-17-prod-preflight-schema.sql` to it (the apply is Task 5 of the setup plan) —
none of that is part of this task, and none of it has been started.
