# Tidy Tails v2 — agent context

@AGENTS.md

This is the **v2 app** — Ship 2.1 read-only scaffold. Venture context, the
product contract, and the build plan live in the parent repo:

- `../CLAUDE.md` — Tidy Tails venture operating context
- `../HANDOFF.md` — whose turn / what's next
- `../_reports/2026-05-15-v2-design-lock-spec.md` — the v2 product contract
- `../_reports/2026-05-15-v2-ship-2.1-scaffold-addendum.md` — this ship's scope + locked decisions
- `./README.md` — run, data modes, safety, deploy

**Hard rules for this app (Ship 2.1):** read-only. No live Supabase writes, no
SQL, no SMS sends, no schema or RLS changes, no v1 production changes. The live
data path is `SELECT`-only and off by default. Writes are gated until auth + the
RLS migration are designed, backed up, and approved.
