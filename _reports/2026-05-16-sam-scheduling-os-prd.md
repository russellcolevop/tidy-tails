---
when: 2026-05-16
who: CC
purpose: Product definition for the Tidy Tails v2 guided scheduler. As of Samantha's 2026-05-16 Group A answers, v2 is scoped as the scheduling source of truth for her upcoming appointments — built in phases, not as a generic full scheduler. Captures her real grooming workflow as a domain model and separates what is known from what is still open.
venture: tidy-tails
status: DRAFT for Russell review. Group A answered by Samantha 2026-05-16 (§5). v2 is now scoped as a phased guided scheduler that owns her upcoming appointments. Residual follow-ups R1–R4 in §5/§11 do not block starting the build. This is a deliberate scope change from the prior "scheduling-aware cockpit" stance — see §1; a docs/DECISIONS.md entry is recommended.
supabase_project: pgkwovokciaqnbhpttba
related:
  - _reports/2026-05-15-v2-design-lock-spec.md
  - _reports/2026-05-15-v2-design-lock-prep.md
  - _reports/2026-05-15-pawfinity-logged-in-recon.md
  - _reports/2026-05-15-pawfinity-v2-implications.md
  - _reports/2026-05-15-v2-ship-2.2-auth-rls-plan.md
  - _reports/2026-05-16-phase-2-execution-report.md
  - _reports/2026-05-16-sam-scheduling-questions.md
  - _reports/2026-05-16-sam-scheduling-answers.md
---

# Sam Scheduling OS PRD — Tidy Tails v2

## §0 — How to use this document

**What this is.** A product definition. It states what "a working app for Sam"
means, models her grooming workflow, and tracks what is known versus still open.
It is the bridge between the read-only v2 scaffold (Ship 2.1) and a guided
scheduler Samantha runs her real workdays from.

**What this is not.** Not an implementation plan, not a migration, not code. No
SQL is written here. §6 describes schema *implications* in prose; actual
migrations are drafted later, per ship, under the Ship 2.2 ratified rule that
feature schema ships separately from the security migration.

**The name and the scope.** "Sam Scheduling OS" is the internal workstream name.
As of 2026-05-16, v2 *is* scoped as a scheduler — see §1 — but a **phased,
guided** one, not a generic calendar built all at once. Keep "Scheduling OS" out
of user-facing copy: to Samantha the app is simply her grooming book and
schedule.

**Schema grounding.** §2, §3, and §6 are grounded in the *actual* live `public`
schema, read read-only via `list_tables` on 2026-05-16 — not assumptions.

> **Live `public` schema (read-only snapshot, 2026-05-16)** — seven tables, RLS
> enabled on all (policies permissive — the R-1 risk).
> - `clients` (131 rows): identity, contact, `preferred_location`
>   (`annette`|`gina`), `preferred_day`, `preferred_frequency_weeks`
>   (`2,3,4,6,7,8,12`), `tier` (`new,regular,loyal,vip`), `notes`, address.
> - `pets` (181 rows): identity, `breed`, `size` (`small,medium,large,xl`),
>   `grooming_style`, `clip_style`, `temperament_notes`, `behavior_flags`,
>   `medical_notes`, `allergies` (bool) + `allergies_detail`,
>   `vaccination_status`, `vet_contact`, `weight_lbs`, `standard_fee`, etc.
> - `appointments` (count 730 per the Phase 2 report; `list_tables` returned a
>   stale `0` estimate — see §11): `date`, `time_slot`, `location`
>   (`annette`|`gina`), `service_type` (`full_groom,bath_only,nail_trim,other`),
>   `fee,tip,rent_paid,net`, `status` (`booked,completed,cancelled,no_show`),
>   `notes`.
> - `automations_log` (0 rows): `type` (`follow_up,reminder,rebook_prompt,no_show`),
>   `channel` (`sms,email`), `status`, `message`.
> - `booking_requests` (0 rows): client-side requests with `requested_date`,
>   `ai_suggested_slot` (jsonb), `status` (`pending,approved,…`).
> - `client_accounts` (0 rows): client-portal accounts with `pin_code`, `phone`.
> - `sam_review_responses` (69 rows): the card-review form table.

**Known vs unknown legend.** §3 tags every subsection:

- **KNOWN** — assertable from the live schema, the Pawfinity recon, venture
  docs, or **Samantha's 2026-05-16 Group A answers**. Source is named.
- **OPEN** — not yet answered. Routed to a residual follow-up (§5) or a Group B
  refinement. Building against an OPEN item means fabricating operator data,
  which the operating model forbids. Do not.

**Discipline.** Samantha's Group A answers (2026-05-16) resolved most of what
earlier drafts of §3 marked unknown. The few items still OPEN are tracked as
residual follow-ups R1–R4 (§5) and are still never guessed. The capacity and
duration rules Sam described are *her judgment expressed as factors* — v2
encodes the factors, not a fabricated formula (see §4's over-automation
principle).

---

## §1 — Scope decision: v2 as the scheduling source of truth (a guided scheduler)

**This is a scope change. State it plainly.** Earlier drafts of this PRD scoped
v2 as a scheduling-*aware* cockpit that would *not* own a calendar — anchored to
four locked documents:

- `v2-design-lock-spec.md` §8 — do not build online booking / calendar /
  scheduling.
- `v2-design-lock-prep.md` — "Samantha does not want Russell to build her
  calendar… Do not build it."
- `pawfinity-logged-in-recon.md` §5 — "Samantha does not need Tidy to own
  scheduling in v2… consider a later **lightweight 'today list'** only after
  Samantha confirms she wants scheduling inside Tidy."
- `pawfinity-v2-implications.md` §4 — v2 should explicitly *not* build a full
  appointment calendar.

**What changed (Samantha, 2026-05-16).** Asked directly whether Tidy's
appointment list is her live schedule or just a mirror of paper/phone, Samantha
answered: **Tidy Tails should be the real source of truth for upcoming
appointments.** She opted in to v2 owning her schedule.

**Be honest about how far this goes.** The locked docs anticipated a *possible*
future opt-in — but the recon scoped that opt-in conservatively, as a
"lightweight today list." Samantha's answer goes **further**: source-of-truth
ownership of her upcoming appointments. So this PRD is not merely "satisfying a
condition the locked docs set" — it is a **deliberate scope change beyond the
conservative version those docs imagined.** It is intentional, driven by the
operator's own request, and should be logged in `docs/DECISIONS.md` as a scope
change so any agent picking this up sees it was decided, not slipped in.

**The new stance.** v2 is the scheduling source of truth for Tidy Tails'
upcoming appointments. But it is built as a **guided scheduler**, in phases — not
a generic calendar app delivered in one shot:

- **First** (milestones M3–M4): v2 holds and shows Sam's today + upcoming
  schedule, and lets her create and edit appointments manually. This is the
  scheduler's spine — v2 *becomes the book*.
- **Then** (M5): v2 adds *guidance* — soft, explained warnings around capacity,
  large-dog runs, crate space, service duration, temperament, and location.
- **Then** (M6): reminders and rebooking surfaces.

The phasing matters: it lets v2 become a trustworthy schedule Sam relies on
*before* any clever rules are layered on, and it keeps each phase shippable and
reversible. §4 defines the guided-scheduler shape, the surviving boundaries, and
the "do not over-automate" principle.

**v2 is a rebuild, not a greenfield.** Samantha already has a working operator
tool: v1 — Supabase-backed HTML modules (`client`, `intake`, `report`, `export`)
she uses daily, writing to the same `public` schema. v2 is a secure,
mobile-first, cockpit-shaped rebuild of that tool *plus* the guided scheduler.

**What v2 IS (this PRD's scope):**

- The **today + upcoming schedule** — v2 owns and shows Sam's appointments.
- **Creating and editing appointments** directly in v2.
- **Client and pet directory** with full appointment history.
- **Logging completed grooms.**
- **Guided scheduling warnings** — soft, explained (§4).
- **Safety and care flags** surfaced when Sam needs them.
- **Reminders and rebooking** surfaces.
- **Keeping the digital book current** — first-class data entry/editing (§8).

**What v2 IS NOT:** see §4 — no online client self-booking, no automated message
dispatch in the first cut, no public booking page.

---

## §2 — Gap analysis: v1 vs v2 scaffold vs "working app for Sam"

v1 is **not** a marketing site. It is Samantha's working operator app — the
Supabase-backed HTML modules she uses daily. v2 must reach parity with v1's
operator function, add the guided scheduler, and close the security gap.

| Capability | v1 (Supabase-backed HTML — Sam's tool today) | v2 scaffold (Ship 2.1, read-only) | Needed for a working v2 app |
|---|---|---|---|
| Operator authentication | none — shared anon key (R-1) | none | **Required** — Ship 2.2a |
| Client / pet directory | yes — `client.html`, with writes | yes — read-only search + detail | rebuild **with edit** |
| Appointment history + financials | yes — `report.html` | yes — read-only | keep |
| New-client / pet intake | yes — `intake.html`, with writes | none | **Required** — write |
| Create / edit an appointment | yes — writes `appointments` | none | **Required** — write; v2 owns the schedule |
| Today + upcoming schedule | no | no | **Required** — new (the guided scheduler) |
| Recurring availability / boss-day pattern | no | no | **Required** — new |
| Log a completed groom | yes — `status` enum exists | UI built, write-disabled | **Required** — write; **no migration** |
| Guided scheduling warnings | no | no | **Required** — new (M5) |
| Reminders / rebooking surface | no | partial — read-only lapsed view | **Required** — extend |
| Revenue / month view | yes — `report.html` | yes — read-only | keep |
| Mobile-first UX | no — desktop HTML | yes | the core v2 reshape |
| RLS / data security | permissive — R-1 open | permissive (inherits live DB) | **Required** — Ship 2.2b cutover |

**Reading the table.** Basic CRUD is not the gap — v1 already does it. The gaps
are four: **security** (the R-1 hole, closed by the Ship 2.2b cutover); **form**
(v1 is desktop HTML; v2 is a mobile-first app Sam uses between dogs); the
**guided scheduler** (today + upcoming schedule, availability pattern, and the
warnings layer — genuinely new); and **reminders/rebooking**.

**Schedule source of truth — resolved.** Earlier drafts flagged an open question:
is Tidy's `appointments` table Sam's live forward schedule, or a record running
parallel to Pawfinity? Samantha's 2026-05-16 answer settles it — **v2's
`appointments` table is now her schedule of record.** The remaining task is
one-time onboarding: getting her current set of upcoming appointments *into* v2
at cutover (§11). The v2 scaffold already reads the 730 historical rows; going
forward, Sam maintains the schedule in v2.

---

## §3 — Scheduling domain model

Each subsection: **Model** (the structure), **Known**, **Open** (→ §5),
**App use** (how v2 uses it).

### 3.1 Locations / work contexts

**Model.** A *location* is where an appointment happens. A *work context* is the
broader arrangement — Tidy Tails grooming vs the days Sam works for someone else.

**Known (Sam, 2026-05-16).** Samantha's week runs on a recurring pattern:

| Day | Context |
|---|---|
| Monday | Tidy Tails grooming |
| Tuesday | Works for Gina (not Tidy Tails) |
| Wednesday | Works for Annette (not Tidy Tails) |
| Thursday | Tidy Tails grooming |
| Friday | Alternates — one week Tidy Tails grooming, the next works for Annette |
| Saturday | Usually off; **one Saturday a month** is a Tidy Tails nail-trim clinic hosted at Ren's |
| Sunday | (not specified — treat as off) |

The schema's `appointments.location` and `clients.preferred_location` are a
two-value enum, `annette` | `gina`. `appointments` also has `rent_paid` — Sam
pays rent per appointment, consistent with grooming out of rented space. Tidy
Tails is a solo venture; Samantha is the only groomer; Barrie / Simcoe County,
Ontario.

**Open.** Two things: (a) **Ren's** is a third location the `annette|gina` enum
cannot represent (§6 — model location flexibly). (b) The annette/gina rows in
Tidy's DB are ambiguous — are they the grooming *Sam does at those spaces* on her
Tidy Tails days, or do some rows record her employee work for Annette/Gina? →
**residual follow-up R3.** Do not assume; it affects the schedule and any
financial reporting.

**App use.** The recurring weekly pattern is the backbone of the schedule (§3.6,
§4). The app must let Sam edit the pattern intelligently — alternating Fridays
and the monthly Saturday are not simple weekly rules.

### 3.2 Service types

**Model.** A *service* is a named grooming offering, with a price and a typical
duration.

**Known.** `appointments.service_type` is a check-constrained enum:
`full_groom` | `bath_only` | `nail_trim` | `other`. Pricing is captured:
`appointments.fee` / `tip` / `net` and `pets.standard_fee`. The monthly Ren's
event is a nail-trim clinic — consistent with `nail_trim`.

**Open.** Samantha did **not** re-confirm the service list in her Group A
answers. The four-value enum stands by default, but whether it is complete and
current, and what `other` covers, is unconfirmed → **residual follow-up R1.**

**App use.** Service type is shown on every appointment and feeds the duration
estimate (§3.4) and the guided warnings (§4).

### 3.3 Dog size / coat / handling profile

**Model.** Per-pet attributes that shape how long and how carefully a groom
takes: size, coat, behavior/handling, age.

**Known.** The `pets` table is richly structured. `size` is a check-constrained
enum (`small` | `medium` | `large` | `xl`). Handling is captured via
`temperament_notes` and `behavior_flags`. Safety data is structured: `allergies`
(boolean) + `allergies_detail`, plus `medical_notes`, `vaccination_status`,
`vet_contact`. `breed`, `grooming_style`, `clip_style`, `weight_lbs`, `age` all
exist. Samantha confirmed (2026-05-16) that size, coat, behavior, and age all
matter to how a groom goes.

**Open.** There is no dedicated `coat_type` column — coat is implied by `breed` /
`grooming_style` / `clip_style`. Whether a structured coat field helps →
**Q-B3** (watch-week refinement).

**App use.** Size and temperament feed the capacity warnings (§3.8, §4); size,
coat, behavior, and age feed the duration estimate (§3.4); allergies and behavior
flags drive the safety surfacing (§7 Flow 5).

### 3.4 Appointment duration

**Model.** Estimated duration is a function of **service type, dog size, coat,
behavior, and age** — plus a **per-dog override** for individual history.

**Known (Sam, 2026-05-16).** All of those factors matter; duration is genuinely
multi-factor and per-dog. Samantha named **Milo and Chloe** as dogs/services
that take longer than the factors alone would predict — confirming the need for
a per-dog override, not just a service-level estimate. The schema does not yet
support duration: `appointments.time_slot` is free text, not start/end times.

**Open.** The numeric duration values — how many minutes a `full_groom` on a
`large` double-coated dog actually takes — are not specified. These are refined
by observation (**Q-B1**), not surveyed up front.

**App use.** v2 carries a **service-level duration estimate** and a **per-dog
duration override** (§6). It must **not** invent a duration formula; until the
estimate is validated by real logged grooms, duration is a reference Sam sees and
adjusts, never a hard scheduling constraint.

### 3.5 Working days and hours

**Model.** The days Samantha grooms for Tidy Tails, and the hours within a
grooming day.

**Known.** The **days** are known — the §3.1 weekly pattern. `clients.preferred_day`
and `clients.preferred_frequency_weeks` capture *client* preferences.

**Open.** Samantha's **hours within a grooming day** (typical start / end) were
not specified → **residual follow-up R2.** Not blocking — the schedule view can
default to a sensible day window until R2 lands.

**App use.** Working days drive which dates the schedule offers; hours order the
day. v2 does not hard-enforce hours — a late appointment is a soft note, not a
block (§4).

### 3.6 Recurring availability and blocked days

**Model.** Samantha's availability is a **recurring weekly pattern** (§3.1) plus
**date-specific exceptions** — holidays, vacation, a swapped day, a one-off.

**Known (Sam, 2026-05-16).** The recurring pattern is explicit and not ad hoc:
Tidy Tails on Mon / Thu / alternating Fri; not-Tidy-Tails on Tue / Wed /
alternating Fri; a monthly Saturday at Ren's. The alternating Friday and the
monthly Saturday make this more than a flat weekly rule — the model needs to
express alternation and "Nth weekday of the month."

**Open.** Date-specific exceptions are inherently ongoing — Sam adds them as they
arise. No follow-up needed; the model just has to support them.

**App use.** The schedule (§4) knows, for any date, whether it is a Tidy Tails
grooming day, a day Sam works elsewhere, or off. Days Sam works elsewhere are a
**hard** unavailable signal — booking a Tidy Tails appointment on a Gina/Annette
day makes no sense — and are one of the few places v2 blocks rather than warns
(§4). **Data-minimization:** v2 stores only that a date is unavailable and a
coarse label; it does not model what Sam does on a boss day.

### 3.7 Location model and drop-off

**Model.** Where grooming physically happens, and whether clients drop off.

**Known.** Fixed-location, drop-off grooming: Samantha confirmed crate space (at
Annette's) — crates mean dogs stay on site, i.e. drop-off, not a mobile route.
Samantha herself works across locations on the §3.1 weekly rotation, and travels
to Ren's for the monthly nail clinic.

**Open.** Whether any client-facing mobile / at-home grooming exists — not
mentioned by Sam; treat as not offered unless she says otherwise (low-priority,
fold into R3 if it comes up).

**App use.** Each appointment carries a location (§6 — must support Ren's, not
just annette/gina). The schedule groups by location.

### 3.8 Capacity and crate constraints

**Model.** How much Samantha can take in a day — and it is **contextual, not a
fixed number.**

**Known (Sam, 2026-05-16) — verbatim shape of her rules:**

- Avoid more than **3 large dogs in a row**.
- At **Annette's**, crate space holds only **2 big dogs** in at once.
- **3 big dogs is sometimes possible** — if Sam knows their temperament and can
  keep them out of crates.
- Same-day limits depend on crate capacity, dog size, dog temperament, haircut
  duration, service type, and **Samantha's judgment**.
- Some dogs/services take longer (Milo, Chloe — §3.4).
- Sam can do **up to about 6 dogs a day**, depending on size, space, service,
  and temperament.

**This is not a `max_daily_dogs = 6` rule.** "About 6" is a soft reference that
*depends on* the size mix, crate space, temperament, and durations of that
specific day. The capacity signal v2 computes is a *function of those factors*,
surfaced as a soft warning — never a hard cap (§4).

**Open.** The exact numbers (how a 3-XL day actually feels) refine by observation
— **Q-B2**.

**App use.** v2 carries: a per-location **crate capacity** (Annette's = 2 big
dogs); a soft **large-dogs-in-a-row** limit (~3); a **max daily dogs** reference
(~6, contextual); and a per-dog **"can be out of crate"** flag that relaxes the
crate count for dogs Sam trusts. All of these produce **soft, explained
warnings** (§4) — they inform Sam's judgment, they never make the decision.

### 3.9 Reminders, rebooking, and lapsed clients

**Model.** (a) **Appointment reminders** — reminding owners of an upcoming
appointment; (b) **rebook reminders** — prompting a rebook after a groom; (c)
**lapsed-client detection** — clients overdue past their cadence.

**Known (Sam, 2026-05-16).** Samantha wants **owner appointment reminder
messages** and **rebook reminders after an appointment**. For **new dogs,
capturing allergy information matters** — and Samantha's current paper practice
is to write allergy info on a card *only if there is something to worry about*
(a blank card means "nothing to flag" — see §8.6). `clients.preferred_frequency_weeks`
(enum `2,3,4,6,7,8,12`) holds the intended rebooking cadence. The
`automations_log` table already models `reminder` / `follow_up` / `rebook_prompt`
events over `sms` / `email` (empty — unbuilt). v1 has a Twilio `send-sms` edge
function for manual sends.

**Open — R4: dispatch vs surface.** Samantha said she *wants* reminders; she did
not say whether v2 should **auto-send** them or **surface** a "these owners need
a reminder / these clients are due to rebook" list that she sends herself.
**Default assumed:** v2 *surfaces*, Sam sends — automated SMS/email dispatch
stays a separate, later, gated ship (consistent with design-lock's treatment of
SMS). Confirm with Sam → **residual follow-up R4.**

**App use.** v2 computes due/overdue from `preferred_frequency_weeks` and the
appointment history, and surfaces reminder and rebook lists (§7 Flow 6). New-dog
intake prompts for allergies (§8.6).

---

## §4 — A phased guided scheduler

v2 is now the scheduling source of truth (§1) — but a **guided** scheduler,
delivered in phases. This section defines its shape, the principle that governs
it, and the boundaries that still hold.

### The phasing

- **M3–M4 — the spine.** v2 holds Sam's today + upcoming schedule and lets her
  create and edit appointments manually, against her recurring availability
  pattern. No clever rules yet — just a schedule she can trust.
- **M5 — the guidance.** v2 adds soft, explained warnings: large-dog runs, crate
  capacity, daily load, service duration, temperament, location.
- **M6 — reminders and rebooking.**

Building the spine first means v2 earns trust as a plain, reliable schedule
before any rule can get in Sam's way. See §9 for the milestone detail.

### Principle: do not over-automate Samantha's judgment

Samantha's scheduling is judgment-heavy — she said so directly: capacity "depends
on… Sam's judgment," and "3 big dogs is sometimes possible if she knows their
temperament." v2 must respect that:

- **The app warns and explains. It does not silently block.** When something is
  tight — a fourth large dog in a row, a third big dog past Annette's crate
  space, a heavy-duration day — v2 shows a clear, specific, *explained* warning
  ("That's 3 large dogs in a row" / "Annette's crates hold 2 big dogs; this is
  the 3rd") and lets Samantha proceed anyway. She knows the dogs; the app does
  not.
- **The only hard blocks are genuine impossibilities** — booking a Tidy Tails
  appointment on a day Sam works for Gina or Annette, or at a location that
  isn't open. Hard-unavailable days and locations (§3.6) are the narrow
  exception where v2 stops rather than warns.
- **Never fabricate a number to enforce.** Capacity and duration are factors v2
  surfaces, not a formula it imposes. A warning that cites a real factor ("2 XL
  dogs already today") helps; a warning from an invented threshold erodes trust.

This principle is the test for every rule added in M5: if it would *block* Sam
on anything short of a real impossibility, it is wrong.

### What v2 still does NOT build (the surviving boundary)

The scope change in §1 is specifically about Samantha's *own* scheduling. It does
**not** open these:

- **No online client self-booking.** Clients do not touch v2. The empty
  `booking_requests` and `client_accounts` tables stay empty — they were modeled
  ahead of any product and are not a mandate to build a client portal.
- **No automated message dispatch in the first cut.** v2 *surfaces* reminders;
  Samantha sends them. Automated SMS/email dispatch is a separate, later, gated
  ship (R4, design-lock).
- **No public-facing booking page.**
- **No conflict/double-booking *enforcement*.** v2 can warn that a slot looks
  full; per the principle above, it does not hard-block.

### The graduation gate is retired

Earlier drafts carried a "graduation gate" — criteria, a review cadence, and an
owner — for *if* v2 should ever become a real scheduler. That gate did its job:
it forced the question to be asked instead of assumed. Samantha was asked
plainly (the §5 question sheet) and answered. The gate is now **retired, not
repurposed** — there is no reverse gate for rolling back to cockpit-only. If the
source-of-truth approach fails in real use, that shows up as a §10 lived-adoption
failure, which is the honest signal, not a gate event.

---

## §5 — Questions for Sam — Group A answered 2026-05-16

Samantha answered the Group A question sheet
(`_reports/2026-05-16-sam-scheduling-questions.md`) on 2026-05-16; her answers
were relayed by Russell. Each answer, the interpretation, and what it resolves
are captured in `_reports/2026-05-16-sam-scheduling-answers.md`.

### Group A — resolution

| # | Question | Resolution |
|---|---|---|
| Q-A1 | Boss-work / blocked days | **ANSWERED** — recurring weekly pattern (§3.1, §3.6). |
| Q-A2 | Service list | **NOT ANSWERED** — Sam did not re-confirm the list; four-value enum stands by default → **R1**. |
| Q-A3 | Locations / drop-off vs mobile | **ANSWERED (partial)** — fixed-location drop-off (§3.7); residual on annette/gina row meaning → **R3**. |
| Q-A4 | Scheduling source of truth | **ANSWERED — load-bearing.** v2 owns upcoming appointments; drives §1 and §4. |
| Q-A5 | Working days / hours | **ANSWERED (partial)** — days known (§3.1); daily *hours* not specified → **R2**. |
| Q-A6 | Reminders | **ANSWERED** — owner appointment + rebook reminders wanted (§3.9); dispatch vs surface → **R4**. |

Samantha also volunteered answers to two Group B questions early: **Q-B1**
(duration factors — §3.4) and **Q-B2** (capacity — §3.8).

### Residual follow-ups — R1–R4 (small; do not block starting the build)

- **R1 (Q-A2) — service list.** Confirm the four service types are still
  complete and current; clarify what `other` covers. Needed before the M5
  service-duration work.
- **R2 (Q-A5) — daily hours.** Sam's typical start/end on a grooming day. Needed
  before the schedule orders the day precisely; can default in the interim.
- **R3 — annette/gina row meaning.** Are the Tidy DB rows at location
  `annette`/`gina` the grooming Sam does at those spaces, or do some record her
  employee work for Annette/Gina? Affects the schedule and any financial view.
- **R4 — reminder dispatch vs surface.** Does Sam want v2 to auto-send reminders,
  or surface a list she sends herself? Default assumed: surface. Confirm before
  M6.

### Group B — refinements during the watch week

Q-B1 (duration factors) and Q-B2 (capacity) — **answered early** by Sam; the
numeric specifics still refine by observation. Q-B3 (structured coat field),
Q-B4 (cadence accuracy per client), Q-B5 (which care flags matter most) remain
watch-week refinements — observed in real use, not surveyed up front.

---

## §6 — Database schema implications (no migrations)

This section describes what the guided scheduler needs. **No SQL is written
here.** Per the ratified Ship 2.2 scope, feature schema ships as separate
migrations inside the ships that build those features, never bundled with the
security migration.

**Much of the cockpit needs no new schema.** The §0 snapshot shows the existing
tables already support the core writes:

- **Logging a completed groom** is an `UPDATE` of `appointments.status` to
  `completed` — the enum value exists. **No migration.**
- **Creating an appointment** is an `INSERT` into `appointments` — `date`,
  `time_slot`, `location`, `service_type`, `fee`, `status` all exist. **No
  migration** for the appointment record itself.
- **Care flags, size, allergies, behavior** exist as structured `pets` columns.
- **Rebooking cadence** exists as `clients.preferred_frequency_weeks`.

**The one required schema change is security:** the Ship 2.2 migration adds
`groomer_id` to the core tables and rewrites RLS against `auth.uid()`. Every new
table or column below must carry that scoping from the start — feature schema
must not reintroduce the permissive R-1 pattern.

### 6.1 The scheduling-rules model (new feature schema)

The guided scheduler (§4) needs a small set of new structures. Described in
prose; drafted as migrations later, gated where noted.

- **Work context / availability.** A **recurring weekly availability pattern**
  per weekday (Tidy Tails grooming / works elsewhere / off), able to express
  *alternation* (alternating Fridays) and *Nth-weekday-of-month* (the monthly
  Ren's Saturday); plus a **date-exceptions** table for holidays, vacation, and
  swaps. This supersedes the simple `blocked_dates` table earlier drafts
  proposed.
- **Locations.** The `annette|gina` enum cannot represent **Ren's**. Model
  location flexibly — a small `locations` reference table (or an equivalent) so
  a third (and future) location is data, not a schema change. Per-location
  attributes include **crate capacity** (Annette's = 2 big dogs).
- **Capacity rules.** A soft **large-dogs-in-a-row** limit (~3) and a **max daily
  dogs** reference (~6) — stored as *reference values feeding contextual
  warnings*, never as hard caps. The real signal is computed from the day's size
  mix × crate capacity × temperament × durations (§3.8, §4).
- **Service duration estimate.** A typical-duration value per service type
  (pairs with a possible `services` reference table — R1).
- **Per-dog duration override** on `pets` — for dogs like Milo and Chloe whose
  real time differs from the service estimate.
- **Temperament override** — a structured signal (beyond free-text
  `temperament_notes`) that a dog is easy or difficult, feeding the warnings.
- **"Can be out of crate" flag** on `pets` — relaxes a location's crate-capacity
  warning for dogs Sam trusts loose.
- **Warning model.** Every rule resolves to **hard** or **soft**. *Hard* =
  genuine impossibility (a non-Tidy-Tails day, a closed location) → v2 blocks.
  *Soft* = capacity, large-dog run, crate, duration, load → v2 warns and
  explains, never blocks (§4).

### 6.2 Other feature additions (each gated on a §5 item)

- **Per-appointment `duration`** on `appointments` — `time_slot` is free text and
  cannot carry it. Gated on Q-B1.
- **`pets.allergies` tri-state.** The column is `boolean default false`, so it
  cannot tell "no known allergies" from "not yet asked." Samantha's paper
  practice — note allergies *only if there's something to worry about* — maps to
  exactly three states: **flagged**, **checked-and-clear**, **not yet asked**. A
  third state (or an `allergies_confirmed` companion flag) is needed so v2 does
  not show a false "Allergies: No" (§8.6). Safety-relevant.
- **Structured `coat_type`** on `pets` — only if Q-B3 says it helps.
- **`services` reference table** — only if R1 reveals the four-value enum is too
  coarse.
- **Edit-history / `audit_events` table** — for §8.5. Design-lock §3.6 floated
  it as optional; §8 makes it recommended.
- **Archived flag** on `clients` / `pets` — for §8.3 archiving.

**Explicitly not needed:** a stored per-pet "typical interval" column — the
intended cadence is `preferred_frequency_weeks`, and the observed interval is
cheap to compute on read.

**Confirm before drafting any migration.** Re-read the live schema
(`list_tables`, read-only) at migration-draft time; this PRD's snapshot is dated
2026-05-16 and the schema is actively used by v1.

---

## §7 — UX flows

Six flows. Each: **trigger**, **steps**, **what v2 shows**, **out of scope**.

### Flow 1 — Morning schedule review (today + upcoming)

- **Trigger.** Sam opens v2 at the start of her workday.
- **Steps.** Land on today's schedule → see today's appointments in time order →
  swipe/scroll to upcoming days → tap an appointment for the dog's profile,
  history, and care flags.
- **v2 shows.** The day's appointments grouped by location, each row showing dog,
  client, service, and any care flag; a clear marker on non-Tidy-Tails days
  (Gina/Annette) and the monthly Ren's clinic. This is Sam's schedule of record.
- **Out of scope.** No editing of the recurring availability pattern here (that
  is its own surface).

### Flow 2 — Scheduling an appointment (guided)

- **Trigger.** Sam is booking an appointment with a client.
- **Steps.** From a client/pet, choose "Add appointment" → pick date, time,
  location, service → v2 shows any **soft warnings** (large-dog run, crate space,
  load, duration) with the reason → Sam confirms or adjusts → save.
- **v2 shows.** A lightweight form; guided warnings that explain themselves; a
  **hard stop only** if the date is a non-Tidy-Tails day or a closed location
  (§4).
- **Out of scope.** No client self-booking; no automatic slot assignment — Sam
  chooses, v2 advises.

### Flow 3 — Rebooking after a groom

- **Trigger.** A groom just finished and the client wants to rebook.
- **Steps.** From the completed appointment, "Rebook" → v2 suggests a return date
  from `preferred_frequency_weeks`, landing on a Tidy Tails day near the client's
  `preferred_day` → Sam adjusts and confirms → it becomes a scheduled
  appointment (Flow 2, including its warnings).
- **v2 shows.** A suggested date with its reasoning ("every 6 weeks, prefers
  Thursdays"), as a starting point Sam overrides freely.
- **Out of scope.** No automatic booking — Sam confirms every rebook.

### Flow 4 — Logging a completed groom

> The core write that turns v2 into a daily tool. An `UPDATE` of an existing row
> — no schema change.

- **Trigger.** Sam finishes grooming a dog.
- **Steps.** Open the appointment → mark complete (`status='completed'`) →
  optionally record `fee`/`tip` and a groom note.
- **v2 shows.** The appointment flips to "completed"; the note joins the pet's
  history and informs the next visit and its duration estimate.
- **Out of scope.** No invoicing/payment processing.

### Flow 5 — Care flags and new-dog allergy capture

- **Trigger.** Sam opens a dog's profile or appointment; or adds a new dog.
- **Steps.** Care flags — `allergies`/`allergies_detail`, `vaccination_status`,
  `medical_notes`, `behavior_flags`, `temperament_notes` — show prominently. For
  a **new dog**, intake **prompts for allergies** and lets Sam pick **"no known
  allergies"** as a real, affirmative answer (her paper "checked, nothing to
  flag") — distinct from leaving it unanswered (§8.6).
- **v2 shows.** Structured flags surfaced at appointment time, so an allergy or
  muzzle-required fact cannot be missed.
- **Out of scope.** v2 does not verify vaccine records or contact a vet.

### Flow 6 — Reminders and lapsed clients

- **Trigger.** Sam wants to send appointment reminders, prompt rebookings, or win
  back lapsed clients.
- **Steps.** Open the reminders surface → see owners with an upcoming appointment
  to remind, clients due to rebook after a recent groom, and clients lapsed past
  their cadence → tap through to reach out via her normal channel.
- **v2 shows.** Ranked lists with the relevant date and cadence for each.
- **Out of scope.** v2 *surfaces*; Samantha sends. Automated dispatch is a later
  gated ship (R4, §4).

---

## §8 — Keeping the digital book current

**Why this is a first-class workflow.** Samantha's client and pet records have
always lived on paper cards. The reconciliation workstream — Phase 1/2 cleanup,
79 digitized contact cards, ~215 triage decisions, her own card-review answers —
was the one-time job of getting that paper system into the database. Samantha
does not think of her cards as "wrong"; the task was **digitizing**, not fixing.
Going forward, the digital book only stays useful if Samantha can **keep it
current herself** — a new client, a new dog, a changed phone number, a new
appointment — entered in the app, in the moment, without Russell, without SQL,
without an agent. If she cannot, the digital book drifts and she falls back to
paper, and v2 fails the §10 lived-adoption bar. Keeping the book current is
designed in from the first write milestone (M2) onward.

**Scope note.** This section covers Samantha updating records **one at a time**.
Bulk operations — CSV import, and especially *merging duplicate records* — are
**out of scope** for v2's first cut. A merge re-points foreign keys (the
operation Phase 2 performed via guarded SQL) and is too destructive for an
unassisted in-app action. v2 may *surface* a suspected duplicate as a warning
(§8.2); performing the merge stays an assisted operation until a safe in-app
merge flow is separately designed.

### 8.1 Inline editing from every detail surface

Every field on a client, pet, or appointment detail screen — and every editable
value on a schedule row — is editable in place. Tap the field, change it, save.
There is no separate "admin" area: the place Sam *sees* a value is the place she
*updates* it.

Editable field inventory (all already in the live schema):

- **Client:** first/last name, phone, home_phone, email, address, alt_contact,
  referral_source, preferred_location, preferred_day, preferred_frequency_weeks,
  tier, notes.
- **Pet:** name, breed, size, sex, color, age, weight_lbs, spayed_neutered,
  grooming_style, clip_style, allergies + allergies_detail, vaccination_status,
  medical_notes, temperament_notes, behavior_flags, grooming_notes, vet_contact,
  standard_fee.
- **Appointment:** date, time_slot, location, service_type, fee, tip, status,
  notes.
- **Schedule row:** quick-edit of an appointment's time, location, service, and
  status without leaving the schedule.

Editing rules:

- Enum-backed fields (size, location, service_type, status, tier,
  preferred_frequency_weeks) edit through a **picker constrained to the schema's
  allowed values** — Sam cannot enter a value the database would reject.
- Free-text fields use a plain text input; booleans use a toggle.
- Saving is explicit; light-touch validation runs at the boundary.
- Edits are scoped — a field or a card at a time.

### 8.2 Add-missing flows

When a record does not exist, Samantha creates it without leaving her flow:

- **Add a client.** An empty search result offers "Add new client" directly.
- **Add a pet.** From a client's detail screen, "+ Add pet."
- **Add an appointment.** From a client/pet or the schedule — this is §7 Flow 2.

New records are created with **only the fields Samantha has**. Minimum to create:
a client needs a name or a phone; a pet needs a name and a client; an appointment
needs a client, a pet, and a date. Everything else is "unknown for now" (§8.6),
filled in as she learns it.

### 8.3 Archive / inactive — not hard delete

The default way to remove a record from view is to **archive** it, never to
hard-delete it.

- Hard delete is irreversible and foreign-key-dangerous — deleting a client
  orphans its pets and appointments, the failure class Phase 2's invariants
  guarded against.
- The live DB already blocks anon hard-deletes (the DELETE policies on
  `clients`/`pets`/`appointments` were dropped 2026-04-22; no v1 module calls
  `.delete()`). v2 should formalize archiving, not reintroduce delete.

Behavior: archived records are hidden from default lists, reachable behind an
"include archived" toggle, and fully preserved as history. A cancelled
appointment (`status='cancelled'`) is its own archive state; clients and pets
need an explicit archived flag (§6). Un-archiving is one tap. Hard delete is not
a Samantha-facing action.

### 8.4 Confirmation rules for high-risk changes

Confirmation friction scales with reversibility and blast radius.

- **Low-risk** (a note, a fee, a spelling): saves directly, no confirmation —
  the common case, kept fast.
- **Medium-risk** (a phone number, a name, an appointment date; archiving a
  pet): a lightweight one-tap confirm.
- **High-risk** — a confirmation that **names the downstream effect**: archiving
  a client with dependents ("…also hides 3 pets and 12 appointments"); editing a
  safety field (allergies, vaccination_status, medical_notes — a wrong safety
  edit is a dog-safety risk); reverting a completed appointment to booked.
- No hard-delete confirmation because there is no hard delete.

### 8.5 Edit history for important updates

Important updates are recorded: **who, when, old value → new value.** "Important"
means safety fields, identity/contact fields, financial fields, appointment
status and date, and archive/un-archive. Routine note edits need not be logged.

Why: a history lets Samantha undo a mistaken update, and — once v2 is
multi-groomer (§8.7) — makes "who changed this" answerable. Schema: an
edit-history / `audit_events` table (§6). First cut = capture the data plus a
simple per-record "recent changes" list; a rich diff timeline can come later.

### 8.6 "Unknown for now" handling

Most schema columns are nullable — good, because Samantha often will not have
every field yet. v2 treats missing data as a **normal state, not an error**:

- An empty field shows as "Not set" — never a fabricated default.
- **`pets.allergies` — three real states.** Samantha's paper practice (note
  allergies only if there's something to worry about) maps to: **flagged** /
  **checked, nothing to flag** / **not yet asked**. The schema's
  `boolean default false` collapses the last two, so a dog nobody asked about
  reads as a confident "Allergies: No" — a safety trap. v2 must distinguish them
  (§6.2). New-dog intake (§7 Flow 5) **prompts** for allergies and offers "no
  known allergies" as an explicit, pickable answer.
- New records save with only known fields; the rest stay "unknown for now."
- v2 may gently surface a missing field that matters (a soft prompt on a pet with
  unknown vaccination status) — it never blocks a save.

This is the no-fabrication discipline in the UI: the app does not invent a value
to fill a gap, and does not pressure Samantha to.

### 8.7 Role and auth assumptions

- Samantha authenticates via real Supabase Auth (Ship 2.2a / M1) and can view and
  edit **every record in her own book**.
- The data model is single-groomer today. The Ship 2.2 migration adds
  `groomer_id` and scopes RLS to `auth.uid()`.
- **Future multi-groomer** (the CLAUDE.md licensing possibility — far out): a
  groomer edits only their own book, enforced by `auth.uid()` RLS at the
  database, not just the UI. No shared-edit, no admin-edits-everyone, unless a
  real multi-tenant admin role is separately designed.
- Inline editing is built on real auth — not enabled pre-auth. Edit history
  (§8.5) records `edited_by` as the authenticated user.

### 8.8 Acceptance criteria — Sam keeps the digital book current herself

The bar: Samantha can keep her digital book current end-to-end inside v2, with
**no Russell, no SQL, no agent**.

1. From a client, pet, or appointment screen, she can change any displayed field
   and save it, in under a minute, without leaving the screen.
2. She can add a new client, a new pet, and a new appointment, supplying only the
   fields she knows.
3. She can archive a record she no longer needs to see; its history is preserved
   and the record is recoverable in one tap.
4. She never encounters a hard-delete action; nothing in the edit flow is
   irreversible without a clear, effect-naming confirmation.
5. A high-risk change shows a confirmation that names the consequence before it
   commits.
6. An important update is recorded in history with old → new values and can be
   reverted.
7. A field she has no data for can be left, or marked "unknown," without blocking
   the save.
8. Concretely: a dog moved, a client has a new phone, a new puppy joined a
   household — Samantha enters or updates it in v2 herself, in the moment.
   (Merge-class changes — two records that are really one — remain assisted; see
   the §8 scope note.)

---

## §9 — Milestone plan: scaffold → working guided scheduler

| Milestone | Delivers | Gate / dependency |
|---|---|---|
| **M0 — Read-only scaffold** | Done. Directory, history, lapsed view, revenue — read-only. | Shipped (Ship 2.1, commit `2e9a5cb`). |
| **M1 — Operator auth** | Real Supabase Auth login; v2 is a private operator tool. | Ship 2.2a (buildable now against the permissive DB). |
| **M2 — Log a completed groom + inline editing foundation** | Flow 4 and the §8 "keep the book current" base (inline edit, add-missing). **No migration** for the core writes. | M1. Working backup path (§11). |
| **M3 — Today + upcoming schedule** | Flow 1 — v2 holds and shows Sam's schedule of record. **No migration** for the appointment record. | Group A answered ✓ (R2 daily-hours can default). |
| **M4 — Manual appointment create/edit + recurring availability + care flags** | Flows 2 and 5; the recurring weekly pattern + date-exceptions. v2 is now the scheduling source of truth. | Availability/locations schema (§6.1); R3 clarified. |
| **M5 — Guided scheduling warnings** | The soft warnings layer — capacity, large-dog runs, crate, duration, temperament, location (§4). | M4; capacity/duration schema (§6.1); R1. |
| **M6 — Reminders + rebooking** | Flows 3 and 6; due/overdue + rebook + lapsed surfaces. | R4 (dispatch vs surface). |
| **M7 — RLS security cutover** | Ship 2.2b flag-day cutover; R-1 closed; v2 is the live, secured source of truth. | All feature ships landed; fresh backup; per the Ship 2.2 plan. |

**Sequencing notes.** M1 can start now. M2 proves the write path and starts the
"keep the book current" workflow. M3–M4 are the guided scheduler's spine — v2
*becomes the book*. M5 layers guidance on top, governed by the §4
over-automation principle. M7 is deliberately last, per the ratified flag-day
decision: the security migration runs only after v2 is a complete tool. The
residual follow-ups R1–R4 attach to specific milestones (noted above) but do not
block starting M1–M3.

**One-time onboarding.** At or before M3, Samantha's current set of *upcoming*
appointments must be loaded into v2's `appointments` table so the schedule is
complete on day one (§11).

---

## §10 — Acceptance criteria: "Sam can run a real day from v2"

**Functional — v2 must let Sam, in one place:**

1. Log in as herself; no one else can see her data (post-M7: RLS-enforced).
2. Open the app and see today's schedule, and her upcoming schedule, in order by
   location — this is her schedule of record, not a mirror.
3. **Create and edit upcoming appointments in Tidy Tails** — booking, moving, and
   cancelling appointments in v2, with guided warnings that explain and never
   silently block (§4).
4. Open a dog and immediately see its care flags — allergies, vaccine status,
   behavior — without searching.
5. Mark a groom complete and leave a note that shows up next visit.
6. Rebook a dog with a sensible suggested return date.
7. See which owners need an appointment reminder, which clients to prompt for a
   rebook, and which have lapsed.
8. Never encounter a fabricated number — every duration, capacity signal, or
   interval shown is read from real data or entered/confirmed by Sam.

**Lived-adoption — the criterion that actually proves it (mirrors design-lock
§7.4):**

9. Across a defined window (the post-cutover watch week, minimum five working
   days), Samantha **runs both her day and her upcoming schedule from v2** —
   opening it each morning, scheduling and logging in it — **without falling back
   to v1's HTML modules, a paper book, or any other calendar.** A feature-complete
   app Sam does not actually reach for has not met acceptance.

Criterion 9 is the real bar. Criteria 1–8 are necessary; 9 is sufficient.

Keeping the digital book current has its own acceptance criteria in §8.8. v2 is
not "a working app for Sam" unless both this section's criteria and §8.8's pass.

---

## §11 — Open items and dependencies

- **Residual follow-ups R1–R4 (§5).** Service list, daily hours, annette/gina
  row meaning, reminder dispatch-vs-surface. Small; attach to M4–M6; do not block
  starting the build.
- **One-time appointment onboarding.** v2 is now the schedule of record — at/before
  M3, Sam's current *upcoming* appointments must be loaded into v2's
  `appointments` table. Decide the mechanism (manual entry by Sam, a one-time
  import) when M3 is scoped.
- **`appointments` row count.** `list_tables` returned a stale `0` estimate
  (clients/pets/sam_review estimates were accurate). Authoritative count is
  **730** per the Phase 2 execution report's explicit `count(*)` (2026-05-16).
  An exact recount, plus a count of future-dated rows, is a one-query read-only
  step worth running before M3 scoping.
- **`venture-ops/dump_supabase.py` still missing.** The documented backup script
  does not exist on disk (REQ-17). Every write milestone (from M2) needs a
  working backup path; close this before M2.
- **Phase 4 enrichment overlap.** Structured pet fields (§3.3, §6) overlap with
  the queued Codex enrichment work — coordinate so the two do not collide.
- **Landry/Laundry data question.** 4 rows at 705-796-0620 pending Sam's
  Cash-vs-Charlotte answer (`v1-active-bugs.md` B4) — unrelated to scheduling but
  affects directory correctness.
- **docs/DECISIONS.md entry recommended.** The §1 scope change (v2 as scheduling
  source of truth) is a real decision that supersedes design-lock §8's "do not
  build scheduling." It should be logged in `docs/DECISIONS.md`. Not done in this
  pass — flagged for Russell.

---

## §12 — PRD review notes (2026-05-16 — Group A checkpoint)

This revision incorporates Samantha's 2026-05-16 Group A answers. Standing notes
for anyone picking up the v2 build:

- **Scope changed.** v2 is no longer a scheduling-*aware* cockpit — it is the
  **scheduling source of truth** for Sam's upcoming appointments, built as a
  **phased guided scheduler** (§1, §4). This supersedes design-lock §8 and is a
  deliberate, operator-driven scope change; a `docs/DECISIONS.md` entry is
  recommended (§11).
- **Not a generic full scheduler.** The phasing (M3–M4 spine, M5 guidance, M6
  reminders) and the "do not over-automate Sam's judgment" principle (§4) are
  load-bearing. v2 warns and explains; it hard-blocks only genuine
  impossibilities. Online client self-booking and automated dispatch stay out.
- **Group A is answered; R1–R4 remain.** The residual follow-ups are small and do
  not block starting M1–M3, but should be cleared before the milestones that
  depend on them.
- **The schema already supports the core writes** (logging, scheduling, editing
  — §6); the new feature schema is the scheduling-rules model (§6.1). The live
  row count should still be verified before M3 (§11).
- **Language.** Sam's framing, not the builder's: "digital book," "keep current,"
  "schedule," "reminder/rebook." Not "bad records" or "data correction" — Sam
  does not see her cards as wrong; v2 digitized a paper system and now keeps it
  current.

---

*Generated by CC 2026-05-16. PRD/spec work only — no code written, no Supabase
mutated (the schema was read read-only via `list_tables`). Updated from
Samantha's 2026-05-16 Group A answers (relayed by Russell); her answers and the
interpretation are in `_reports/2026-05-16-sam-scheduling-answers.md`. KoyaOS dogfood lessons are in
`_reports/2026-05-16-koyaos-dogfood-sam-scheduling-os-prd.md`.*
