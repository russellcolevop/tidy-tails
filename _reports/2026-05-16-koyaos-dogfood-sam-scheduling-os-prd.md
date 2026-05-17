---
when: 2026-05-16
who: CC
purpose: KoyaOS platform lessons surfaced while producing the Tidy Tails v2 "Sam Scheduling OS" PRD. Continues the REQ series. Evidence-backed gaps from the PRD session, not wishes.
audience: KoyaOS product team / Mission Control
status: captured; relay when Koya feedback is next ingested
continues: _reports/2026-05-15-koyaos-dogfood-v2-ship-2.2-planning.md
related:
  - _reports/2026-05-16-sam-scheduling-os-prd.md
  - _reports/2026-05-15-v2-design-lock-spec.md
---

# KoyaOS dogfood lessons — Tidy Tails v2 Sam Scheduling OS PRD

The Ship 2.2 planning session produced REQ-15 through REQ-18
(`_reports/2026-05-15-koyaos-dogfood-v2-ship-2.2-planning.md`). Producing the
"Sam Scheduling OS" PRD — an operator-workflow product definition — and then
revising it from the operator's own answers surfaced seven more (REQ-19 through
REQ-25). REQ-19–23 came from writing the PRD; REQ-24–25 came from updating it
once Samantha answered the Group A questions. Each is grounded in something the
PRD work actually hit.

---

## REQ-19 — Kickoff-name vs locked-spec contradiction check

**What happened:** The kickoff named the workstream "Sam Scheduling OS" and asked
for scheduling logic, service rules, duration logic, and reminders. But four
*already-locked* v2 documents — the design-lock spec (§8), the design-lock prep,
the Pawfinity logged-in recon (§5), and the Pawfinity v2-implications report (§4)
— each explicitly say **do not build a calendar / booking / scheduling system**.
The kickoff title and the locked corpus were in direct contradiction.

The agent did not silently comply (building a forbidden scheduler) and did not
silently refuse (ignoring the kickoff). It surfaced the contradiction as a
decision gate via AskUserQuestion. Russell resolved it: build a scheduling-*aware*
cockpit, not a scheduler, with an explicit "Not Yet" boundary and a graduation
gate. A whole PRD was then framed around a reconciliation the kickoff title alone
would have steamrolled.

**What Koya needs:** When a new task's **name or framing** contradicts an
existing locked spec or decision in the venture corpus, Koya should **detect the
contradiction and surface it before work starts** — not let the freshest
instruction silently win. Task titles are *proposals*, not authority; a locked
spec outranks a kickoff phrase. Koya could cross-check kickoff language against
the venture's `DECISIONS.md` and locked specs and flag terms that name something
those documents forbid ("Scheduling OS" vs a spec section titled "do not build
scheduling"). The resolution belongs to the human, but the *catch* should be
automatic.

---

## REQ-20 — Known/unknown discipline for operator-knowledge PRDs

**What happened:** The PRD had to model Samantha's grooming workflow in depth —
service types, dog-size and coat logic, appointment durations, working hours,
boss-work days, daily caps, travel model, rebooking cadence. Almost none of that
is recorded anywhere. A grep of Sam's 49 prior review answers
(`_reports/2026-05-13-sam-answers-batch-1.md`) confirmed they hold only data
corrections — zero scheduling data. The honest move was to model the *structure*
of each domain area while tagging every parameter **KNOWN** (assertable, with a
named source) or **UNKNOWN** (only Sam can answer, routed to a numbered
question). The easy, wrong move would have been to fill the duration matrix and
daily caps with plausible-looking numbers.

**What Koya needs:** A **known/unknown discipline (or template) for
operator-knowledge PRDs**. When a venture asks an agent to capture a real
person's workflow, Koya should require each modeled parameter to be explicitly
tagged: *asserted (with source)* vs *unknown (routed to a question for the
operator)*. Plausible-but-fabricated operator parameters are among the most
dangerous outputs an agent can produce — they look like research and get built
against. The template makes fabrication visibly absent rather than silently
present, and turns "what we don't know" into a structured deliverable (a
question batch) instead of a gap.

---

## REQ-21 — Integration-gap / double-entry honesty check

**What happened:** The PRD's headline feature is a "today view" of Sam's
appointments. But Pawfinity owns the booking calendar, and v2 has no integration
with it. So v2's today view can only ever show appointments **Sam manually
transcribes into Tidy**. That transcription dependency is not a detail — it
decides whether the feature has any data at all. The PRD had to (a) name it as
the single load-bearing open question, (b) bake honesty into the product itself
(label the surface "Appointments I've logged in Tidy," never "My schedule"), and
(c) flag that whether the feature even ships depends on Sam accepting
double-entry.

**What Koya needs:** When a product **reads or displays data that lives in an
external system of record it does not integrate with**, Koya should force the
question: *where does this data actually come from, and who keeps it in sync?* A
mirror of an un-integrated system runs entirely on manual re-entry — and "the
operator will just keep both in sync" is wishful until tested. Koya should make
the data-origin and sync-owner explicit for every displayed entity, and treat an
un-owned sync path as a first-class adoption risk in the plan, not an
implementation footnote.

---

## REQ-22 — Decision gates need cadence and an owner, not just criteria

**What happened:** Russell asked for "a decision gate for when/if Tidy Tails
graduates from scheduling-aware cockpit to full scheduling system." A first draft
of such a gate is naturally a *list of criteria*. But criteria alone are inert —
nobody is scheduled to check them, so the gate is never actually evaluated and
the product drifts by default. The PRD's §4 gate was written with three parts:
**criteria** (the signals), **a review cadence** (end of watch week, then every
90 days or on Sam's unprompted request), and **a named owner** (Russell, with
Sam's explicit ask as a required input), with each evaluation logged as a
decision.

**What Koya needs:** Koya's **decision-gate / graduation-gate template should
require three fields, not one**: criteria, review cadence (a scheduled trigger),
and owner. A gate with only criteria is a latent no-op. This generalizes beyond
this PRD — any "revisit later" or "graduate when X" decision Koya helps capture
should be made actually evaluable: it must say *when it gets checked* and *who
checks it*, or it will quietly never happen.

---

## REQ-23 — Ground current-state gap analysis in the live system, not doc summaries

**What happened:** The PRD's §2 gap analysis, in its first draft, described Tidy
Tails v1 as a "public marketing site" that contributes nothing to the operator
workflow — a conclusion drawn from venture-doc summaries. A 30-second read-only
`list_tables` introspection of the live Supabase schema showed the opposite: v1
is a Supabase-backed *operator app*, and the `public` schema is already richly
built — an `appointments` table with `status` / `service_type` / `location`
enums, a `pets` table with structured `size` / `allergies` / `behavior` fields, a
`clients.preferred_frequency_weeks` rebooking-cadence column, plus empty
`booking_requests` / `client_accounts` / `automations_log` tables. Once the real
schema was in view, the gap analysis, the domain model's KNOWN/UNKNOWN tags, the
schema-implications section, and the milestone plan **all had to be rewritten** —
roughly half the PRD changed. Root cause: writing a current-state assessment from
documentation *about* the system instead of from the system itself.

**What Koya needs:** When a PRD or plan contains a current-state or gap analysis,
Koya should require the agent to **inspect the live system read-only** — database
schema, deployed surfaces, actual config — *before* asserting what exists.
Documentation drifts; a doc summary is a claim about the past. A read-only
schema/state introspection is cheap, safe, and authoritative, and it belongs
before the gap analysis is written, not after a reviewer catches the error.
Relatedly, the empty `booking_requests` / `client_accounts` tables are themselves
a finding — schema built well ahead of any product — which extends the
phantom-tooling check (REQ-17): schema that anticipates unbuilt features is as
misleading to a fresh agent as scripts that do not exist.

---

## REQ-24 — A deferral gate should be paired with asking the operator the question

**What happened:** The first PRD carried a "graduation gate" — criteria, a review
cadence, and an owner (the REQ-22 improvement) — for deciding *if* v2 should ever
become a real scheduler. But the gate's whole subject was a question that could
simply be **asked of the operator**. It was. The §5 Group A question sheet asked
Samantha plainly — "if you want to know what you're doing next Tuesday, where do
you look?" — and she answered in one sentence: Tidy Tails should be the source of
truth. The entire gate — criteria, cadence, owner — collapsed to a no-op the
moment the operator was asked the underlying question directly. Real design
effort had gone into instrumenting a deferred decision process for something a
single direct question resolved in a day.

**What Koya needs:** When an agent builds a deferral or graduation gate around a
decision, Koya should force one check first: **can this just be asked?** A gate
is the right tool when the decision genuinely depends on signal that does not
exist yet — real usage data, market response, a future cost. It is the wrong
tool, overhead dressed as rigor, when the decision depends on a fact a human
stakeholder already holds and would state if asked. Before instrumenting a
deferred decision, Koya should prompt: *would a direct question to the operator
resolve this now?* Gates should defer decisions that need time; they should not
defer decisions that only need a conversation. This refines REQ-22 — a gate
needs criteria, cadence, and an owner, **and** a prior check that a gate is even
the right instrument.

---

## REQ-25 — Operator-facing product language must be elicited, not imposed

**What happened:** An earlier PRD section was titled "Sam can fix the book
herself" and framed the editing workflow as "data correction" — fixing "bad
records." That framing was the builder's. It was drawn from the reconciliation
workstream (dedup, ghost rows, ~215 triage decisions), which genuinely was a
cleanup job. But asked directly, Samantha **rejected the frame**: she does not
think of her cards as wrong. The cards were a working paper system; the
reconciliation *digitized* it; ongoing editing *keeps the digital book current.*
The PRD's §8 had to be retitled and reframed throughout, and a standing language
note added to §12. The builder's mental model ("the data was bad, we are fixing
it") and the operator's ("my system was always fine, we put it on a screen")
were different — and the operator's is the one that ships in the UI copy.

**What Koya needs:** When a PRD names a user-facing workflow — especially one the
operator performs daily — Koya should treat the **language** of that workflow as
something to *elicit from the operator*, not derive from the build history.
Words like "fix," "correct," "clean up," "bad data" carry a judgment; if the
operator does not share that judgment, the product's copy will feel wrong to the
person who lives in it. The fix is cheap and belongs in the same operator
question batch that already captures workflow facts (REQ-20): add "what do you
call this / how do you think about it?" for each named workflow. Operator-facing
copy is a spec input, not a writing-time detail.

---

## Summary — requirement priority

| REQ | Name | Priority | Phase |
|---|---|---|---|
| REQ-19 | Kickoff-name vs locked-spec contradiction check | P1 | Koya platform |
| REQ-20 | Known/unknown discipline for operator-knowledge PRDs | P1 | Koya platform / planning |
| REQ-21 | Integration-gap / double-entry honesty check | P2 | Koya platform / planning |
| REQ-22 | Decision gates need cadence + owner, not just criteria | P2 | Koya platform / templates |
| REQ-23 | Ground gap analysis in live system, not doc summaries | P1 | Koya platform / checklist |
| REQ-24 | Pair a deferral gate with asking the operator the question | P2 | Koya platform / templates |
| REQ-25 | Elicit operator-facing language, do not impose it | P2 | Koya platform / planning |

---

*Generated by CC 2026-05-16. Derived from producing — and then revising from
Samantha's Group A answers — the Tidy Tails v2 Sam Scheduling OS PRD
(`_reports/2026-05-16-sam-scheduling-os-prd.md`). Continues
`_reports/2026-05-15-koyaos-dogfood-v2-ship-2.2-planning.md` (REQ-15–18) and the
earlier scaffold and reconciliation REQ series.*
