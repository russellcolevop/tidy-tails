---
when: 2026-05-18
who: CC
purpose: KoyaOS platform lessons surfaced while taking Tidy Tails v2 Ship 2.2b
  from "rehearsed" to "production-cutover-ready" — capturing the production UID,
  producing production migration SQL, writing the cutover runbook and the
  write-flip plan. Continues the REQ series (REQ-34 through REQ-38).
audience: KoyaOS product team / Mission Control
status: captured; relay when Koya feedback is next ingested
continues: _reports/2026-05-17-koyaos-dogfood-v2-ship-rehearsal-fidelity.md
related:
  - _reports/2026-05-18-ship-2.2b-branch-rehearsal-execution-report.md
  - _reports/2026-05-18-ship-2.2b-production-cutover-runbook.md
  - _reports/2026-05-18-ship-2.2b-production-forward-migration.sql
  - _reports/2026-05-18-ship-2.2b-write-flip-plan.md
---

# KoyaOS dogfood lessons — Tidy Tails v2 Ship 2.2b production readiness

REQ-33 came from drafting the rehearsal plan — the fidelity of the environment a
test runs in. Actually *running* the rehearsal, then turning the green rehearsal
into production-ready cutover artifacts, surfaced five more. They are all
variations on one theme: **the steps around an irreversible production change
are themselves dangerous, and the danger lives in things a platform tends to
treat as logistics** — an environment's lifecycle, a literal in a SQL file, the
gap between "secure" and "live", which exact number is *the* number.

---

## REQ-34 — A rehearsal environment is a typed, billable, time-bounded resource with a lifecycle; the platform must own that lifecycle, not the operator's memory

**What happened:** the Ship 2.2b rehearsal ran on a Supabase **branch** created
off production. A branch is not free — it bills ~$0.01344/hr for as long as it
exists — and it is not inert: it holds a full copy of production data and its
own service_role key. The correct lifecycle is **create → verify → rehearse →
capture artifacts → delete**, and every stage has a failure mode: delete too
early and the rehearsal evidence is lost; delete too late (or never) and it
quietly bills and leaves a live data copy and a live key sitting around. In this
session the branch lifecycle was driven entirely by operator discipline and
explicit user instructions ("do not delete the branch until the report is
complete"; then, a message later, "delete it").

**Pattern that worked:** the branch was treated as a tracked resource with an
explicit lifecycle — its ref, its cost, its keys, and its deletion were each a
named, separately-approved step, and a cleanup pass afterward hunted down every
derived transient artifact (the env file with the key, restore reports, scratch
scripts) and deleted them too.

**Why it matters:** if KoyaOS orchestrates a venture through a rehearsal, it will
create environments like this routinely. An environment that is "just a test
copy" is in fact a billing line item, a second copy of customer data, and a
second secret. A platform that creates rehearsal environments but does not model
their lifecycle will leak money and data-bearing environments — the failure is
silent and compounding.

**What Koya needs:** make a rehearsal/preview environment a **first-class typed
resource** with: a lifecycle state machine (`created → verified → rehearsed →
captured → deleted`); an attached cost meter; an inventory of every secret and
derived artifact it spawned; and a teardown step that is *required* to close the
rehearsal — a rehearsal is not "done" until its environment and every transient
it produced are deleted. The platform tracks this, not the operator's memory.

**Relation to prior REQs:** REQ-33 typed the rehearsal *target* by fidelity.
REQ-34 types the rehearsal *environment* by lifecycle — the same object, the
other axis: fidelity makes the result trustworthy; lifecycle keeps it from
becoming a liability after the result is captured.

---

## REQ-35 — Promoting a rehearsal artifact to production is a typed substitution of every environment-bound literal; the platform must block a promotion that still carries a rehearsal identity

**What happened:** the rehearsed forward-migration SQL contained a literal — the
rehearsal user's UID (`a49e3c18-…`) — backfilled into `groomer_id` on every row.
Producing the production migration was **not** "copy the file"; it was: capture
Samantha's *production* `auth.users` UID (`88413167-…`) with a read-only query,
then substitute that one literal everywhere it appeared, and re-header the file.
The two UIDs are environment-bound: the rehearsal UID does not exist in
production, the production UID did not exist on the branch. A copy-paste that
missed the substitution would either fail loudly (FK violation) or — worse —
succeed against a UID that is wrong, silently assigning every customer row to the
wrong owner.

**Pattern that worked:** the production UID was captured into its own dated
artifact that states the value, how it was obtained (read-only SELECT, no
mutation), and **exactly where it is used** (every Step-A backfill statement, by
table). The production SQL's header explicitly says "UID already substituted —
this is Samantha's verified production UID, not the rehearsal UID."

**Why it matters:** a rehearsal artifact and its production counterpart look
almost identical — the dangerous difference is a handful of literals. If KoyaOS
promotes rehearsed SQL/config to production, the riskiest moment is the one that
looks like a no-op copy. An un-substituted environment literal is the single
most likely way a "rehearsed green" migration still corrupts production.

**What Koya needs:** model **environment-bound literals** as a typed class. A
rehearsal artifact declares which of its values are environment-specific
(identities, refs, URLs, keys). "Promote to production" is then a typed
operation that *requires* each such literal to be re-bound to a verified
production value, and **fails closed** if any rehearsal-environment value
survives into a production artifact. The substitution is checked, not trusted.

**Relation to prior REQs:** REQ-32 typed a *count* by provenance; REQ-35 types a
*literal* by which environment it belongs to. Both stop a value that looks
correct from being trusted across a boundary it was never valid across.

---

## REQ-36 — An irreversible cutover is its own action class: approved in the moment, never pre-authorized, and never the last line of a runbook the agent executes

**What happened:** the Ship 2.2b cutover is one `apply_migration` call. The
instant it commits, v1 goes dark — v1's anon key loses read and write access to
the entire business. There is no half-state, no preview, no graceful degrade:
one atomic action flips a live business onto new software. The runbook for it
was written to **end at that action** — every step before it is read-only or
operates on a disposable backup, and the apply step is explicitly gated on
"Russell's explicit final approval, in the moment." The agent doing this work
was instructed to stop before that command, and the runbook itself is written so
it cannot be executed straight through.

**Pattern that worked:** the cutover command was treated as a distinct class of
action — not "the next step", but a **named, single, human-only gate**. The
runbook leads with "this document does not authorize the cutover", the apply
step carries a stop marker, and every artifact (the SQL header, the runbook, the
flip plan) ends at a human approval rather than a ready-to-run instruction.

**Why it matters:** an autonomous agent's natural mode is to finish the runbook.
A runbook that *contains* the irreversible command, with the agent authorized to
"keep going until done", is one obedient step away from running it. The safety
cannot live only in the agent's judgment in the moment — it must be built into
the artifact: the dangerous action is structurally outside what the agent will
execute.

**What Koya needs:** a typed **irreversible-action** class. An action whose blast
radius is total and whose undo is non-trivial (a production security migration, a
DNS cutover, a data deletion) is marked as such, and the platform enforces: (a)
approval is captured *at execution time*, not inherited from an earlier "proceed
autonomously" instruction; (b) an autonomous run **halts** at the boundary and
hands back; (c) generated runbooks place the irreversible action as a terminal
human gate, never as an interior step. "Keep going until done" must have a hard
stop the platform owns.

**Relation to prior REQs:** REQ-31 said an SMS send needs per-message
confirmation — the capability is never the authorization. REQ-36 is that rule
scaled to the cutover: the single most dangerous action in the whole ship gets
the strongest version of the same treatment — confirmation in the moment, by a
human, structurally un-runnable by the agent.

---

## REQ-37 — "The database is secure" and "the app may write" are two independent gates; a platform must never let one imply the other

**What happened:** the Ship 2.2b migration makes writes **safe** (RLS scopes
every row to its owner). It does not make writes **active** — all four v2 write
surfaces stay gated after the cutover and are enabled later, one at a time,
across a watch week, each its own code change and its own approval. It would be
very easy — and very wrong — to read "the security migration committed" as "the
app is now live for writes." The cutover runbook makes the post-migration
verifier explicitly check that all four write surfaces *still return their gated
result*, and the write-flip plan is a separate document precisely so the two
gates cannot be conflated.

**Pattern that worked:** the database-safety gate (the RLS migration) and the
write-enablement gate (each surface flip) were kept as **physically separate
artifacts with separate approvals**. "Migration committed" is a verified state;
"writes enabled" is a different verified state reached by different, later,
individually-approved steps. The runbook even lists "writes still gated" as a
*pass* criterion of the cutover.

**Why it matters:** collapsing the two gates is the most natural optimization a
platform or an operator will reach for — "the migration's done, turn it all on."
It is also how a watch week becomes a big-bang: every write surface goes live
the same minute, on day one, with no isolation between them. The whole value of
a staged rollout is that the gates are independent.

**What Koya needs:** model **safety** and **activation** as two distinct gate
types that the platform refuses to merge. Completing a safety/security change
must never auto-satisfy an activation gate. Each activation (each write surface,
each integration) is its own gate with its own approval and its own verifier,
and the platform tracks them as a sequence with an explicit "one at a time"
constraint — a flip whose verifier shows another surface also went live is a
failed flip (the no-cascade rule, REQ-29).

**Relation to prior REQs:** REQ-29 said a flip must not cascade to other
surfaces. REQ-37 is the level above it: not only must surfaces not cascade into
each other, the *security layer* must not cascade into the *activation layer* at
all. Two layers, two gates, never wired together.

---

## REQ-38 — A verifier baseline is a single pinned artifact, not any correct-looking number; "exact" is necessary but not sufficient — it must also be canonical

**What happened:** the cutover verifier compares post-migration row counts to a
baseline. Several "correct" counts were available: counts in planning docs,
counts in `CLAUDE.md`, the rehearsal backup's manifest, observed counts from this
session. They mostly agree — and that is the trap. The rule enforced in every
cutover artifact is sharper than "use an exact count": the baseline is the exact
`count(*)` captured into **the fresh backup `MANIFEST.json` taken minutes before
the migration** — that *specific artifact*, not any other exact count. An exact
count from last week is exact and wrong, because the data drifted under it.

**Pattern that worked:** every cutover doc names one baseline — "the
`MANIFEST.json` from the cutover backup" — and explicitly disqualifies every
other source, *including correct-looking ones in the same docs*. The backup
manifest is treated as the single source of truth; the verifier is defined as a
comparison against that file, by reference, never against a transcribed number.

**Why it matters:** REQ-32 made the platform distrust an *estimate* dressed as a
number. REQ-38 is the subtler successor: even a genuinely **exact** count is not
a baseline unless it is *the* baseline — the canonical, pinned, freshly-captured
one. A platform that treats "exact" as sufficient will happily verify a cutover
against an exact count that is simply stale, and a destructive migration can
"pass" against a number that was true yesterday.

**What Koya needs:** make a verifier baseline a **reference to a single immutable
artifact**, not a value. A cutover/verifier definition points at "the manifest
produced by backup run X"; the platform resolves the numbers from that artifact
at check time. A baseline expressed as a literal number — however exact — is
rejected. Freshness is part of canonicity: the baseline artifact must have been
captured within the cutover window, or the verifier fails closed.

**Relation to prior REQs:** REQ-32 typed a count by provenance (`exact` vs
`estimated`). REQ-38 adds the second required property: **canonicity** — *which*
exact count, captured *when*, from *which artifact*. A number is admissible as a
baseline only when both hold: exact, and the pinned one.

---

## Summary — requirement priority

| REQ | Name | Priority | Phase |
|---|---|---|---|
| REQ-34 | Rehearsal/preview environments are typed resources with a tracked lifecycle (create→verify→rehearse→capture→delete), a cost meter, and a required teardown | P1 | Koya platform / environment mgmt |
| REQ-35 | Promoting a rehearsal artifact to production is a typed re-binding of every environment-bound literal; a promotion carrying a rehearsal identity fails closed | P1 | Koya platform / cutover tooling |
| REQ-36 | Irreversible cutovers are their own action class: approved in the moment, halting an autonomous run, placed as a terminal human gate — never an interior runbook step | P0 | Koya platform / orchestration safety |
| REQ-37 | "Secure" and "active" are two independent gates; completing a security change never auto-enables writes; each activation is separately gated and verified | P1 | Koya platform / rollout |
| REQ-38 | A verifier baseline is a reference to a single pinned, freshly-captured artifact; "exact" is necessary but not sufficient — it must also be canonical | P1 | Koya platform / cutover tooling |

---

*Generated by CC 2026-05-18. Derived from taking Tidy Tails v2 Ship 2.2b from a
green rehearsal to production-cutover readiness — the production UID capture, the
production migration SQL, the cutover runbook, and the write-flip plan. Continues
`_reports/2026-05-17-koyaos-dogfood-v2-ship-rehearsal-fidelity.md` (REQ-33).*
