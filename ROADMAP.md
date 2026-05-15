---
when: 2026-05-13
who: Cowork (Claude) on Russell direction
purpose: Milestone-gated roadmap for Tidy Tails. Now / Next / Later / Done. Anchored on koya_inputs/00_venture_brief.md and v1-final-state-spec.md.
status: living
---

# Roadmap — tidy-tails

Per `.koya/SOUL.md`: milestones, not time. Every entry is a milestone to unlock, not a date to hit.

## Now

Active work this session and the rolling cycle around it.

- **Workstream A — BUILD-venture structure parity.** Populate the canonical BUILD doc set (this file is part of it). Unlocks: structural alignment with Koya. _In flight, this session._
- **Workstream B — Contact-card reconciliation.** Process Samantha's handwritten contact-card batches as Russell uploads them. Cross-reference against live `clients` table, return reconciliation tables, Russell executes the writes. Unlocks: incremental progress toward `clients` being the canonical roster. _Batch-driven; runs whenever cards arrive._
- **Workstream C — Pawfinity logged-in recon.** Read-only deep-dive on the in-app Pawfinity surfaces using Russell's credentials. Screenshots, structured findings doc. Unlocks: V2_DESIGN_LOCK informed by what the incumbent actually does, not just what their marketing says. _Triggers when Russell pastes creds._

## Next

Coming up next sprint or after Workstreams A/B/C wrap.

- **V1_HARDENED.** Close R-1 RLS risk (narrow the permissive INSERT/UPDATE policies, or close them entirely and route writes through an edge function with a server-side role). Resolve `client_overview` SECURITY DEFINER advisor warning. Reconcile the rest of the contact-card archive into `clients`. Unlocks: v2 build can start without v1 footguns hanging over.
- **V2_DESIGN_LOCK.** Convert Russell's design cards to a written spec. Lock the auth model (Supabase Auth vs Clerk vs Better-Auth, per `.koya/AGENTS.md` framework-first checklist). Decide Stripe + Anthropic API integration shape. Fold Pawfinity logged-in recon findings into v2 scope choices. Unlocks: v2 scaffold can ship.
- **Contact-card archive fully reconciled.** When the last batch lands and `clients` is the canonical roster. Unlocks: confidence that v2 starts on a clean foundation.

## Later

Backlog and future milestones.

- **V2_SCAFFOLD.** Next.js app deployed at a staging URL. Schema migrated (or shared with v1). Auth flow working. No production users yet. Unlocks: parallel-run cutover plan. _Read-only portion (Ship 2.1) done 2026-05-15 — see Done. Remaining: real auth, schema/RLS migration, staging deploy._
- **V2_PARALLEL_RUN.** Samantha can use v2 alongside v1 for at least one full week without data divergence. Unlocks: cutover decision.
- **V2_CUTOVER.** v2 is the primary operator surface. v1 archived. Unlocks: pet-owner self-service portal.
- **PET_OWNER_PORTAL_LIVE.** Auth-gated client-facing surface (upcoming appointments, reschedule requests, photo upload). Largest single feature gap vs Pawfinity. Unlocks: licenseability conversation.
- **STORED_PAYMENTS_LIVE.** Stripe Customer + SetupIntent + card-on-file + "Charge $X" button on client page. Not a POS. Bills no-shows without chasing.
- **AUDIENCE_FILTERS_LIVE.** Saved queries on client list (lapsed 90+ days, small breeds, Friday regulars, etc.) plus "send SMS to this audience" button. Practical 80/20 of Pawfinity DTC Marketing using the existing `send-sms` edge function.
- **VAX_TRACKING_LIVE.** Vaccination expiry columns on `pets` plus daily check that surfaces upcoming-expiry pets to Samantha via SMS. Reuses existing infra.
- **REVIEW_BOOSTER_LIVE.** One-tap "send Google review link to client" button after appointment completion. Existing SMS infra; no new framework.
- **PWA_INSTALL_PROMPT.** Manifest + `beforeinstallprompt` handler on `index.html` and `client.html`. Matches Pawfinity's PWA stance without their marketing fluff.
- **LICENSEABLE_READY.** Multi-tenant data model proven. At least one other groomer onboarded as a second design partner. Triggers the commercial-intent conversation.

## Done

Recently completed milestones.

- **2026-04-21 — Repo migrated** from `russellcolevop/tidy-tails` to `russell-labs/tidy-tails`. New GitHub Pages URL live. Samantha notified.
- **2026-04-22 — RLS partial mitigation.** DELETE policies dropped on `clients`, `pets`, `appointments`. Anon role can no longer delete rows. Full R-1 fix still pending v2 auth.
- **2026-04-22 — DB password rotated.** Any service using the old direct-postgres password is broken; anon key unchanged, so HTML modules still work.
- **2026-04-22 — Logical backup taken.** Full schema + data + per-table CSVs dumped to `~/venture-ops/backups/tidy-tails/` on Russell's Mac via `venture-ops/dump_supabase.py`.
- **2026-04 — `send-sms` Supabase edge function shipped.** Twilio-backed. Called from `client.html`. Credentials in Supabase function secrets.
- **2026-04-27 — Public-surface Pawfinity recon.** 33 pages, 40 screenshots, structured findings in `docs/research/competitors/pawfinity-2026-04-26.md`. Identified online booking + pet-owner portal as the two real gaps; ruled out copying POS/payroll/inventory.
- **2026-05-13 — BUILD-venture doc parity populated.** CONTEXT, ROADMAP, GLOSSARY, METRICS, v1-final-state-spec, v1-active-bugs, koya_inputs/00_venture_brief.md created.
- **2026-05-15 — v2 Ship 2.1 read-only scaffold.** Next.js 16 mobile-first PWA grooming cockpit in `v2/`: search, client/pet detail, allergy-first pet safety cards, appointment history, lapsed clients, vaccination status, revenue. Read-only by construction — anonymized fixtures default, live Supabase `SELECT`-only behind a flag, groom-logging + SMS UIs built but gated. No live writes, no SQL, no SMS, no v1 changes. Repo strategy resolved (`v2/` subdir, same repo). Addendum: `_reports/2026-05-15-v2-ship-2.1-scaffold-addendum.md`.
