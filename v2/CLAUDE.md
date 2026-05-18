# Tidy Tails v2 — agent context

@AGENTS.md

This is the **v2 app** — Ship 2.2b, production-bound (reads live data; every
write surface is gated). Venture context, the product contract, and the build
plan live in the parent repo:

- `../CLAUDE.md` — Tidy Tails venture operating context
- `../HANDOFF.md` — whose turn / what's next
- `../_reports/2026-05-15-v2-design-lock-spec.md` — the v2 product contract
- `../_reports/2026-05-15-v2-ship-2.1-scaffold-addendum.md` — this ship's scope + locked decisions
- `./README.md` — run, data modes, safety, deploy

**Hard rules for this app (pre-cutover / pre-flip):** no live Supabase writes,
no SQL, no SMS sends, no schema or RLS changes, no v1 production changes. The
live data path is `SELECT`-only; every write surface is gated. Post-cutover
write behavior is governed by `../_reports/2026-05-18-ship-2.2b-write-flip-plan.md`
and `../_reports/2026-05-18-ship-2.2b-write-flips-1-2-code-prep.md` — each
surface flips on individually, behind a flag, with its own explicit approval.
Do not enable a write surface without that approval.
