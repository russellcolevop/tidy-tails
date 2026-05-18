---
when: 2026-05-17
who: CC
purpose: KoyaOS platform lesson surfaced while drafting the Tidy Tails v2 Ship
  2.2b forward + rollback migration rehearsal plan — the first artifact whose
  validity depends on *where* a test runs, not just whether it passes. Continues
  the REQ series. One evidence-backed pattern.
audience: KoyaOS product team / Mission Control
status: captured; relay when Koya feedback is next ingested
continues: _reports/2026-05-17-koyaos-dogfood-v2-ship-cutover-checklist.md
related:
  - _reports/2026-05-17-koyaos-dogfood-v2-ship-cutover-checklist.md
  - _reports/2026-05-17-koyaos-dogfood-v2-ship-reminder-prep.md
  - _reports/2026-05-17-ship-2.2b-branch-rehearsal-plan.md
  - _reports/2026-05-17-ship-2.2b-backup-rollback-rehearsal-checklist.md
---

# KoyaOS dogfood lesson — Tidy Tails v2 Ship 2.2b rehearsal fidelity

REQ-28 through REQ-32 came from building v2's write surfaces and its cutover
tooling. Drafting the Ship 2.2b **migration rehearsal plan** — the artifact that
decides whether the irreversible RLS cutover is safe to run — surfaced one more,
from a new angle: not what a test checks, but *where the test runs*.

---

## REQ-33 — A rehearsal result is only evidence if the rehearsal target reproduces production's full security stack. Classify rehearsal targets by fidelity; a low-fidelity rehearsal can never count as a passed gate

**What happened:** The Ship 2.2b migration's whole job is to close R-1 — make an
anonymous REST request return `[]` instead of every customer's data. The
checklist mandates rehearsing the migration before it ever runs on production.
Choosing the rehearsal target surfaced two facts that look like logistics but
are actually a correctness problem:

1. The checklist assumed a **Supabase branch**. Branching is not available on
   the venture's free tier — the rehearsal plan had to correct a committed
   document.
2. The cheap, always-available fallback — a **local Postgres** — *cannot
   faithfully rehearse this migration at all.* Local Postgres has RLS, so the
   policy SQL parses and evaluates. But R-1 is closed by the *full stack*:
   PostgREST as the API gateway, JWT-based `anon` vs `authenticated` role
   resolution, and `auth.uid()`. Local Postgres has none of those. A migration
   rehearsal that passes on local Postgres proves the policy *syntax* is valid
   and proves **nothing** about whether anon requests are actually rejected —
   the one thing the migration exists to guarantee. A green local rehearsal is
   a *false* green.

**Pattern that worked (in the plan):** rehearsal targets were classified by
**fidelity to the production security stack**, and the choice was made on
fidelity first, cost second. Targets that reproduce Auth + PostgREST + RLS +
`auth.uid()` (a Supabase branch, or a throwaway Supabase project on the same
tier) are admissible. Local Postgres was explicitly **disqualified as the gate**
— allowed only as a throwaway syntax check, never as evidence the migration is
safe. The plan states this as a rule, not a preference.

**Why it matters:** REQ-32 established that a count fed to a cutover verifier
must carry its *provenance* — `exact` vs `estimated` — because an estimate that
looks like a number silently corrupts the gate. REQ-33 is the same failure mode
one level up: a **rehearsal result** that looks like a pass silently corrupts
the gate if the environment it ran in did not reproduce the production security
model. "The migration rehearsed green" is meaningless without "...on a target
that has the same Auth + RLS + API-gateway stack as production." If KoyaOS
orchestrates a venture through an irreversible security migration and treats any
green rehearsal as a passed gate — without knowing whether the rehearsal target
could even exercise the security surface under test — it will eventually clear a
migration to production on the strength of a test that never tested the
dangerous part.

**What Koya needs:** make rehearsal-target fidelity a first-class, typed property.

1. **Classify every rehearsal/test target by fidelity to production.** A target
   either reproduces the production security stack (auth provider, API gateway,
   RLS, identity resolution) or it does not. The classification is a property of
   the target, recorded — not re-judged ad hoc each time.
2. **A rehearsal result carries the fidelity of the target it ran on.** Just as
   a count is `exact|estimated` (REQ-32), a rehearsal outcome is
   `full-fidelity|partial|syntax-only`. The result is never a bare pass/fail
   integer; the fidelity travels with it.
3. **A migration/cutover verifier admits only a full-fidelity rehearsal as a
   passed gate.** A `partial` or `syntax-only` result fails the gate closed,
   loudly — it is not "a pass with an asterisk."
4. **The platform must not assume a rehearsal capability the venture's tier
   lacks.** If a plan says "rehearse on a branch," the platform should know
   whether the venture's hosting tier *has* branches, and propose a faithful
   alternative when it does not — rather than letting an operator stall, or
   silently fall back to a low-fidelity target.

**Relation to prior REQs:** REQ-28–31 harden the surfaces that *change* data.
REQ-32 hardened the surfaces that *measure* data (counts typed by provenance).
REQ-33 hardens the surfaces that *test* a change before it ships: a rehearsal
result must carry, in its type, the fidelity of the environment that produced it
— exactly as REQ-31's dispatch draft carries `requiresExplicitConfirmation` and
REQ-32's count carries `provenance`. A value that authorizes a hard-to-undo
action must make the property that makes it safe to trust *part of the value*.

---

## Summary — requirement priority

| REQ | Name | Priority | Phase |
|---|---|---|---|
| REQ-33 | Classify rehearsal/test targets by fidelity to the production security stack; a rehearsal result carries that fidelity, and a cutover verifier admits only a full-fidelity rehearsal as a passed gate | P1 | Koya platform / cutover tooling |

---

*Generated by CC 2026-05-17. Derived from drafting the Tidy Tails v2 Ship 2.2b
forward + rollback migration rehearsal plan — the first venture artifact whose
validity depends on the fidelity of the environment a test runs in. Continues
`_reports/2026-05-17-koyaos-dogfood-v2-ship-cutover-checklist.md`.*
