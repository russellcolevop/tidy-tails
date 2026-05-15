# tidy-tails — Context

## What this is

A business management platform built for one named operator. Samantha runs a solo professional dog-grooming business. Tidy Tails v1 is a static-HTML + Supabase hybrid she uses every working day. v2 is the planned Next.js rebuild that closes the auth and self-service gaps without copying Pawfinity's feature warehouse.

The wedge is not features. The wedge is fit. Pawfinity charges $55 to $100 per month plus per-message SMS surcharges and wraps it in a 22-field signup designed for multi-employee salons. Tidy Tails is shaped around a single real groomer's actual day.

## Why it exists

Solo and small-salon groomers sit in a gap between heavy mature platforms and spreadsheets-plus-notebooks. Mature platforms over-serve and over-charge a one-person operation. Spreadsheets lose history. Tidy Tails started as Russell building the tool Samantha actually needed; it stays that way because Samantha keeps using it.

Longer-term commercial possibility (license to other groomers) exists but is deferred until LICENSEABLE_READY. Internal-tool-first is the rule.

## Current state

v1 is shipped and in daily use at `https://russell-labs.github.io/tidy-tails/home.html`. Five HTML modules (`home`, `index`, `intake`, `client`, `report`, `export`) backed by direct browser-to-Supabase calls plus a Twilio-backed `send-sms` edge function. Live database holds 268 clients, 352 pets, 730 appointments as of 2026-05-13.

v2 is in early build. The Ship 2.1 read-only scaffold exists in the `v2/` subdirectory — a Next.js 16 mobile-first PWA grooming cockpit (search, client/pet detail, pet safety cards, appointment history, lapsed clients, vaccination status, revenue). It is read-only by construction: anonymized fixtures by default, live Supabase `SELECT`-only behind `NEXT_PUBLIC_USE_LIVE_DATA`, write flows built but gated. Real auth, the RLS migration, and any write path are later ships, gated on V1_HARDENED and the design-lock open questions. See `_reports/2026-05-15-v2-ship-2.1-scaffold-addendum.md`.

In flight this session: Workstream A doc parity (this file is part of it), customer database reconciliation from handwritten contact cards (Workstream B, batch-driven), Pawfinity logged-in recon (Workstream C, informs V2_DESIGN_LOCK).

Largest open risk: R-1. RLS is enabled on all six public tables, but every SELECT/INSERT/UPDATE policy is permissive (`qual = true`, `roles = {public}`). The anon key in v1's HTML is the public client key, but the policies do not narrow it. Partial mitigation in place: DELETE policies dropped 2026-04-22, so anon role can no longer delete rows. Full fix requires v2 auth.

## Key constraints

- **v1 is load-bearing for Samantha's real business.** Any change to query shape, table names, or RLS ships to her on next merge to `main` (GitHub Pages auto-deploys). Default is read-only on v1.
- **No automated backups.** Supabase free tier. Manual logical dump at `~/venture-ops/backups/tidy-tails/` on Russell's Mac. Not in repo.
- **Single-operator workflow.** Samantha is the only user. v2 keeps single-operator-default; multi-tenant is post-LICENSEABLE_READY.
- **Customer data is real.** Per CLAUDE.md hard boundaries and `.koya/AGENTS.md` credential rules: do not commit data to any public-readable place; do not write to live DB without per-row operator confirmation.
- **No commercial relationship with Samantha yet.** Internal tool, founder-built. Legal structure deferred to LICENSEABLE_READY.
- **Milestone-gated, not time-gated.** Per `.koya/SOUL.md`. No date estimates anywhere.

## Where the rest of the context lives

- Canonical brief: `koya_inputs/00_venture_brief.md`
- Operating instructions for sessions: `CLAUDE.md`
- Current state of play (whose turn, what's next): `HANDOFF.md`
- Vocabulary: `GLOSSARY.md`
- Phase plan and v1 contract: `v1-final-state-spec.md`
- Open findings: `v1-active-bugs.md`
- Decisions log: `docs/DECISIONS.md`
- Competitive recon: `docs/research/competitors/`
- Reconciliation history per card batch: `_reports/`
