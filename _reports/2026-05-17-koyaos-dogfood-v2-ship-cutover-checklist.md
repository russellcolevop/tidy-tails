---
when: 2026-05-17
who: CC
purpose: KoyaOS platform lesson surfaced while drafting the Tidy Tails v2 Ship
  2.2b backup + rollback-rehearsal checklist — the first artifact whose
  correctness depends on a row count being *exact* rather than *estimated*.
  Continues the REQ series. One evidence-backed pattern.
audience: KoyaOS product team / Mission Control
status: captured; relay when Koya feedback is next ingested
continues: _reports/2026-05-17-koyaos-dogfood-v2-ship-reminder-prep.md
related:
  - _reports/2026-05-17-koyaos-dogfood-v2-ship-reminder-prep.md
  - _reports/2026-05-17-koyaos-dogfood-v2-ship-add-household.md
  - _reports/2026-05-17-koyaos-dogfood-v2-ship-log-groom.md
  - _reports/2026-05-17-koyaos-dogfood-v2-ship-m2-first-write.md
  - _reports/2026-05-17-ship-2.2b-backup-rollback-rehearsal-checklist.md
---

# KoyaOS dogfood lesson — Tidy Tails v2 Ship 2.2b cutover checklist

Earlier sessions produced REQ-01 through REQ-31, all from *building* v2's
dry-run/gated write surfaces. Drafting the Ship 2.2b backup + rollback-rehearsal
checklist — the artifact that gates the irreversible RLS migration — surfaced
one more, from a different angle: not a surface that writes, but a *verifier*
that must decide whether a backup and a migration are trustworthy.

---

## REQ-32 — A row count is not a number; it is either *exact* or *estimated*. Verifiers must consume only exact counts pinned to a machine artifact — never a prose number a human transcribed from a doc

**What happened:** The checklist's whole job is to let Russell prove, before
and after an irreversible migration, that no customer rows were lost. That proof
is a count comparison: backup manifest count vs. live `count(*)` vs.
post-migration `count(*)`. While drafting it, four *different* row counts for
the same three tables were in circulation across the venture's own documents:

- `CLAUDE.md` and the Ship 2.2 plan: `clients` 268 / `pets` 352 / `appointments` 730
- The production-mode plan: 268 / 352 / **737**
- KoyaOS `list_tables` (the platform's own table inspector): `appointments` ≈ **7**
- The verified `select count(*)` taken this session: **137 / 188 / 737**

Every one of those except the last is wrong or stale. The `list_tables`
estimate of 7 is off by a factor of 100 — it returns the Postgres planner's
`reltuples` estimate, not a real count. The doc numbers are human transcriptions
that drifted as the table grew and were never re-synced. If a cutover verifier
had compared live state against *any* of the prose numbers, or against the
platform's own estimate, it would have either passed a lossy migration or
blocked a clean one — and for a one-way RLS cutover, a verifier that lies in
either direction is worse than no verifier.

**Pattern that worked (in the checklist):** the backup manifest's `row_count`
field — written by `dump_supabase.py` at dump time from an exact
`select count(*)` — is declared the **single source of truth**. Every later
gate (pre-migration freeze check, post-migration count check, per-surface flip
mini-verifier) compares against the manifest field, never against a number
typed into a plan. Prose counts in the docs are explicitly marked
"illustrative, not a gate input." The checklist carries an appendix table
naming each stale number and where it appears, so no operator re-imports one by
mistake.

**Why it matters:** REQ-28 through REQ-31 are about *write* surfaces refusing to
act until confirmed. REQ-32 is the mirror image on the *read* side: a verifier
is only as good as the number it trusts. KoyaOS surfaces row counts in at least
two places — `list_tables` (a planner estimate) and any dump/backup tool (an
exact count) — and today nothing in the platform marks which is which. They are
different *kinds* of number. An estimate is fine for "roughly how big is this
table" UI; it is catastrophic as the input to a data-loss gate. The moment a
venture's cutover tooling treats a count as a plain integer, it becomes
possible to wire the planner estimate into a verifier, or to copy a prose
number out of a six-week-old plan — and the venture finds out only after an
irreversible migration.

**What Koya needs:** make count provenance a first-class property.

1. **Type counts by provenance.** Any KoyaOS surface that returns a row count
   must tag it `exact` or `estimated`. `list_tables` returns `estimated`
   (`reltuples`); a `count(*)` query and a dump-tool manifest return `exact`.
   The tag travels with the number — it is not inferable from the call site.
2. **Verifiers accept only `exact`.** A platform-provided migration/cutover
   verifier must refuse an `estimated` count as a gate input, and must refuse a
   bare integer with no provenance tag. A data-loss gate fed an untyped or
   estimated number should fail closed, loudly.
3. **The manifest count is the identity, not the prose.** When a backup tool
   writes a manifest, its per-table `row_count` is a structured, machine-read
   field that downstream verifiers compare against directly. A count a human
   transcribed into a Markdown plan is never a gate input — the platform should
   make it ergonomic to point a verifier at the manifest and effectively
   impossible to point it at a doc.

**Relation to prior REQs:** REQ-28–31 harden the surfaces that *change* data so
they cannot act unconfirmed. REQ-32 hardens the surfaces that *measure* data so
a verifier cannot be fooled into approving (or vetoing) an irreversible change.
Both reduce to the same platform principle: a value that authorizes a
hard-to-undo action must carry, in its type, the property that makes it safe to
trust — `requiresExplicitConfirmation: true` for a dispatch draft (REQ-31),
`provenance: exact` for a count fed to a cutover gate (REQ-32).

---

## Summary — requirement priority

| REQ | Name | Priority | Phase |
|---|---|---|---|
| REQ-32 | Type row counts by provenance (`exact` vs `estimated`); cutover/migration verifiers consume only `exact` counts pinned to a machine-read backup manifest, never a planner estimate or a prose number transcribed by a human | P1 | Koya platform / cutover tooling |

---

*Generated by CC 2026-05-17. Derived from drafting the Tidy Tails v2 Ship 2.2b
backup + rollback-rehearsal checklist — the first venture artifact whose
correctness depends on a row count being exact rather than estimated. Continues
`_reports/2026-05-17-koyaos-dogfood-v2-ship-reminder-prep.md`.*
