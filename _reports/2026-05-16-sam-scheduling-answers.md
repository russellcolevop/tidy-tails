---
when: 2026-05-16
who: CC
purpose: Samantha's answers to the Group A scheduling questions, captured as the source artifact behind the Sam Scheduling OS PRD revision. Each answer paired with how the PRD interprets it and what it resolves.
venture: tidy-tails
audience: Russell, and any agent picking up the v2 build
source_question_sheet: _reports/2026-05-16-sam-scheduling-questions.md
feeds: _reports/2026-05-16-sam-scheduling-os-prd.md
---

# Samantha's Group A answers — Sam Scheduling OS

Samantha answered the six-question sheet
(`_reports/2026-05-16-sam-scheduling-questions.md`) on 2026-05-16. Her answers
were relayed by Russell. This file captures each answer, how the PRD reads it,
and what it resolves — so the PRD's §1/§3/§4 changes are traceable to a source,
not invented.

The question sheet's six numbered questions map to PRD §5 Group A as:
Q1 = Q-A4, Q2 = Q-A1, Q3 = Q-A2, Q4 = Q-A3, Q5 = Q-A5, Q6 = Q-A6.

---

## Q1 — Where does your real, up-to-date schedule live? (Q-A4, load-bearing)

**Samantha's answer.** Tidy Tails should be the real source of truth for
upcoming appointments — not just a mirror of a paper or phone calendar.

**Interpretation.** Samantha opted in to v2 *owning* her schedule. This inverts
the prior "scheduling-aware cockpit" stance: v2's `appointments` table becomes
her schedule of record going forward, not a parallel copy.

**Resolves.** Q-A4 — the single load-bearing question. Drives PRD §1 (the scope
change) and §4 (the guided scheduler). It is a **deliberate scope change** beyond
what the locked recon doc imagined (the recon scoped a conservative "lightweight
today list"; Samantha asked for source-of-truth ownership) — flagged for a
`docs/DECISIONS.md` entry (PRD §11).

**Leaves open.** One-time onboarding — getting her current set of upcoming
appointments *into* v2 at cutover (PRD §11). Not a question for Sam; a build
task.

---

## Q2 — Which days do you NOT do Tidy Tails grooming? (Q-A1)

**Samantha's answer.** Her week runs on a recurring pattern: Mondays and
Thursdays are Tidy Tails grooming; every other Friday is Tidy Tails grooming; on
the alternate Fridays she works for Annette; Tuesdays she works for Gina;
Wednesdays she works for Annette; one Saturday a month she works at Ren's hosting
a nail-trim clinic. The pattern must be editable intelligently in the app.

**Interpretation.** Availability is a structured recurring weekly pattern, not ad
hoc — but it is more than a flat weekly rule: it has *alternation* (alternating
Fridays) and an *Nth-weekday-of-month* element (the monthly Saturday at Ren's).
"Editable intelligently" means the app must let Sam adjust the pattern itself,
including these non-weekly cases.

**Resolves.** Q-A1. Drives the PRD §3.1 weekly-pattern table and the §3.6
recurring-availability model (§6.1 — a recurring availability pattern that can
express alternation and Nth-weekday-of-month, plus a date-exceptions table).

**Leaves open.** R3 — the annette/gina rows in Tidy's DB are ambiguous: are they
the grooming Sam does at those spaces on her Tidy Tails days, or do some record
her employee work for Annette/Gina? Affects the schedule and any financial view.

---

## Q3 — Your four service types — still right? (Q-A2)

**Samantha's answer.** Samantha did not re-confirm the service list. Her answer
to this area instead described what makes a groom take longer (see Q4 below).

**Interpretation.** Q-A2 is **not answered.** The four-value `service_type` enum
(`full_groom`, `bath_only`, `nail_trim`, `other`) stands by default — it is the
live schema — but whether it is complete and current, and what `other` covers,
is unconfirmed.

**Resolves.** Nothing fully. Kept honest as an OPEN item.

**Leaves open.** R1 — confirm the four service types are still complete and
current; clarify what `other` covers. Needed before the M5 service-duration
work.

---

## Q4 — Duration and capacity (Q-A2-adjacent; volunteers Q-B1 + Q-B2)

Samantha's answer here covered two things the question sheet had not asked
directly — duration factors and same-day capacity. Both were Group B questions;
she volunteered them early.

**Samantha's answer — duration.** What makes a groom take longer: all of dog
size, coat, behavior, service type, age, and the individual dog's history. Some
dogs/services take longer than the factors alone predict — she named **Milo and
Chloe**.

**Samantha's answer — capacity.** Avoid more than 3 large dogs in a row. At
Annette's there is crate space for only 2 big dogs in at once. Sometimes 3 big
dogs is possible — if she knows their temperament and can keep them out of
crates. Same-day limits depend on crate capacity, dog size, dog temperament,
haircut duration, service type, and her own judgment. She can do up to about 6
dogs a day, depending on size, space, service, and temperament.

**Interpretation — duration.** Duration is genuinely multi-factor and per-dog.
The Milo/Chloe naming confirms a **per-dog duration override** is needed, not
just a service-level estimate. The numeric values (how many minutes a given
groom takes) are *not* specified and must not be invented — they refine by
observation.

**Interpretation — capacity.** Capacity is **contextual, not a fixed number.**
"About 6" is a soft reference that depends on the day's size mix, crate space,
temperament, and durations — not a `max_daily_dogs = 6` rule. v2 computes a
capacity *signal* from those factors and surfaces it as a soft warning, never a
hard cap. This is the source of the PRD §4 "do not over-automate Samantha's
judgment" principle: she said capacity "depends on… my judgment" in as many
words.

**Resolves.** Q-B1 (duration factors — PRD §3.4) and Q-B2 (capacity — PRD §3.8),
answered early. Drives the §6.1 scheduling-rules model: service duration
estimate + per-dog override, crate capacity per location (Annette's = 2 big
dogs), a soft large-dogs-in-a-row limit (~3), a max-daily-dogs reference (~6,
contextual), a "can be out of crate" per-dog flag, and a temperament override.

**Leaves open.** The numeric specifics still refine by observation in the watch
week — they are not surveyed up front.

---

## Q5 — Reminders (Q-A6)

**Samantha's answer.** She wants owner appointment reminder messages, and rebook
reminders after an appointment. For new dogs, capturing allergy information
matters. Her current paper practice: she writes allergy info on a card only if
there is something to worry about.

**Interpretation.** Samantha wants reminders — appointment reminders to owners
and rebook prompts after a groom. The allergy detail is important and feeds the
intake/care-flag design: a blank card means "nothing to flag," not "not asked,"
so v2's `pets.allergies` boolean (`default false`) cannot represent her practice
faithfully — it collapses "checked, clear" and "never asked" into a false
"Allergies: No." v2 needs three states.

**Resolves.** Q-A6. Drives PRD §3.9 (reminders/rebooking), §7 Flow 5 + Flow 6,
and §8.6 / §6.2 (the `pets.allergies` tri-state).

**Leaves open.** R4 — Samantha said she *wants* reminders; she did not say
whether v2 should **auto-send** them or **surface** a list she sends herself.
Default assumed in the PRD: v2 surfaces, Sam sends — automated SMS/email dispatch
stays a separate, later, gated ship. Confirm with Sam before M6.

---

## Q6 — How to talk about editing records (framing, not in the sheet)

This was not one of the six numbered questions — it came through as Samantha's
own framing of the reconciliation/data work.

**Samantha's answer.** She does not think of her cards as "wrong." The real task
was digitizing her paper/card system. Editing in the app should be framed as
keeping the digital book current — not fixing bad records.

**Interpretation.** Operator-facing language must follow Samantha's mental model.
The earlier PRD §8 title "Sam can fix the book herself" and the "data correction"
framing impose a builder's frame she rejects. The card system was never broken;
the reconciliation workstream *digitized* it; ongoing editing *keeps it current.*

**Resolves.** Drives the PRD §8 rewrite — retitled "Keeping the digital book
current," reframed throughout — and the §12 language note. Also captured as a
KoyaOS dogfood lesson (REQ-25).

**Leaves open.** Nothing.

---

## Follow-up correction (2026-05-16) — tighten the immediate wedge

This was not one of the six Group A questions. After the Group A answers were
folded into the PRD, Russell relayed one more product correction from himself
and Samantha.

**The correction.** Keep the decision that v2 is Samantha's digital source of
truth for upcoming appointments — but tighten the *immediate* wedge. The first
product win is **not** complex scheduling automation. It is **fast lookup the
moment a client calls or texts.** Samantha wants to type a client name, a phone
number, a pet name, or a partial clue and instantly pull up the right
household / pet — so she can book without digging through cards or asking repeat
clients questions she should already know.

Example: a client says "Bella," or a text arrives from a phone number. Samantha
needs to see at a glance which Bella / which owner, the phone, the household's
pets, last visit, usual service, usual price / duration if known, allergies and
special notes — enough context to book confidently.

**Interpretation.** The actual job to be done is **retrieval and context**, not
scheduling math. Samantha said scheduling *judgment* itself is not hard — she is
good at deciding what fits a day; the immediate pain is pulling the right record
fast. So the build wedge is **Call/Text → Identify Client/Pet → Book
Confidently**, and M3 delivers it before any advanced scheduling intelligence.
Capacity warnings and the scheduling-rules layer stay in scope but are
**secondary and advisory** — they follow the lookup wedge (M5), they do not lead.

**Resolves.** Drives PRD §1.1 (the immediate wedge), the §9 milestone re-order
(M3 = the lookup / booking wedge; M4 = the schedule-of-record view), §7 Flow 2
(booking starts from the identified household / pet), §4 (guidance is secondary
to retrieval), and two new §10 acceptance criteria (10-second identification;
booking without re-asking known details). Logged in `docs/DECISIONS.md`
(2026-05-16). Also captured as KoyaOS dogfood lesson REQ-26.

**Leaves open.** Nothing new. R1–R4 still stand.

---

## Residual follow-ups — R1–R4 (carried into PRD §5 / §11)

| ID | From | What is still needed | Blocks |
|---|---|---|---|
| R1 | Q-A2 (Q3) | Confirm the four service types are complete/current; what `other` covers. | M5 service-duration work. |
| R2 | Q-A5 (Q5 area) | Samantha's typical start/end hours on a grooming day — days are known, hours are not. | Precise day ordering; can default in the interim. |
| R3 | Q-A1/Q-A3 | Do the annette/gina DB rows record Sam's grooming, or her employee work for Annette/Gina? | M4; any financial view. |
| R4 | Q-A6 (Q5) | Does Sam want v2 to auto-send reminders, or surface a list she sends? Default assumed: surface. | M6. |

None of R1–R4 block starting the build (M1–M3). They attach to the milestones
noted above.

---

*Generated by CC 2026-05-16. Source artifact for the
`_reports/2026-05-16-sam-scheduling-os-prd.md` Group A revision. Answers relayed
by Russell from Samantha, 2026-05-16. No code, no SQL, no Supabase mutation.*
