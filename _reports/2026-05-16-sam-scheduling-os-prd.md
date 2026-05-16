---
when: 2026-05-16
who: CC
purpose: Product definition for the scheduling-aware grooming cockpit ("Sam Scheduling OS"). Defines what a working v2 app for Samantha means beyond the read-only scaffold, captures her real grooming workflow as a domain model, and separates what is known from what only Sam can answer.
venture: tidy-tails
status: DRAFT for Russell review. The scheduling domain (§3) carries open questions for Sam (§5) — nothing marked UNKNOWN may be built against until answered.
supabase_project: pgkwovokciaqnbhpttba
related:
  - _reports/2026-05-15-v2-design-lock-spec.md
  - _reports/2026-05-15-v2-design-lock-prep.md
  - _reports/2026-05-15-pawfinity-logged-in-recon.md
  - _reports/2026-05-15-pawfinity-v2-implications.md
  - _reports/2026-05-15-v2-ship-2.2-auth-rls-plan.md
  - _reports/2026-05-16-phase-2-execution-report.md
  - _reports/2026-05-13-sam-answers-batch-1.md
---

# Sam Scheduling OS PRD — Tidy Tails v2

## §0 — How to use this document

**What this is.** A product definition. It states what "a working app for Sam"
means, models her grooming workflow, and lists what must be learned before
building. It is the bridge between the read-only v2 scaffold (Ship 2.1) and a
cockpit Samantha runs a real workday from.

**What this is not.** Not an implementation plan, not a migration, not code. No
SQL is written here. §6 describes schema *implications* in prose; actual
migrations are drafted later, per ship, under the Ship 2.2 ratified rule that
feature schema ships separately from the security migration.

**The name.** "Sam Scheduling OS" is the kickoff name for this workstream. This
PRD deliberately reinterprets it (see §1): v2 is a scheduling-*aware* cockpit,
not a scheduling *system*. The phrase "Scheduling OS" must stay out of any
user-facing copy — Samantha should never get the impression Tidy Tails has
replaced her booking calendar. Internally, call the workstream what it is: the
v2 grooming cockpit.

**Schema grounding.** §2, §3, and §6 are grounded in the *actual* live `public`
schema, read read-only via `list_tables` on 2026-05-16 — not assumptions. The
live schema is already substantially built (see the reference box below). Where
the schema answers a question, this PRD says so and marks it KNOWN.

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

**Known vs unknown legend.** The domain model in §3 mixes established fact with
genuine gaps. Every subsection is tagged:

- **KNOWN** — assertable from the live schema, the Pawfinity recon, or venture
  docs. Source is named.
- **UNKNOWN** — only Samantha can answer. Routed to a numbered question in §5.
  Building against an UNKNOWN means fabricating operator data, which the
  operating model forbids. Do not.

**Discipline.** This PRD models Samantha's scheduling rules in depth *without
inventing her actual parameters*. The schema tells us a lot about *structure*;
it does not tell us her durations, working hours, boss-work days, daily caps, or
travel model — those are UNKNOWN. The grep of
`_reports/2026-05-13-sam-answers-batch-1.md` confirmed her 49 prior review
answers contain only data corrections — zero scheduling data. The unknowns are
genuinely unknown. They are captured as questions, never guessed.

---

## §1 — Scope decision: a scheduling-aware cockpit

**The conflict this PRD had to resolve.** The kickoff asked for a "Scheduling
OS." Four locked v2 documents say the opposite:

- `v2-design-lock-spec.md` §8 — do not build online booking / calendar /
  scheduling.
- `v2-design-lock-prep.md` — "Samantha does not want Russell to build her
  calendar… Do not build it."
- `pawfinity-logged-in-recon.md` §5 — "Samantha does not need Tidy to own
  scheduling in v2… consider a later lightweight 'today list' only after
  Samantha confirms she wants scheduling inside Tidy."
- `pawfinity-v2-implications.md` §4 — v2 should explicitly *not* build a full
  appointment calendar.

**Resolution (Russell, 2026-05-16).** Option A: treat scheduling as operator
intelligence, not a calendar replacement. v2 remains a scheduling-aware grooming
cockpit. It captures Sam's scheduling rules deeply so it can be *smart* about
the day, but it does not become the source-of-truth booking calendar unless
Samantha explicitly asks for that later.

**This PRD does not override design-lock §8.** A scheduling-aware cockpit is
*consistent* with §8: it surfaces and references scheduling information; it does
not own, generate, or publish it. §4 defines the formal gate by which §8 could
one day be revisited — that gate, not this PRD, is the mechanism for any future
scope change.

**v2 is a rebuild, not a greenfield.** Samantha already has a working operator
tool: v1 — a set of Supabase-backed HTML modules (`client`, `intake`, `report`,
`export`) she uses daily, writing to the same `public` schema above. v2 is a
*secure, mobile-first, cockpit-shaped rebuild* of that tool, plus a genuinely new
intelligence layer. The basic CRUD already exists; the "scheduling-aware" part —
the today view and the smart warnings — is what is actually new.

**What v2 IS (this PRD's scope):**

- A **today view** of the day's appointments.
- **Client and pet directory** with full appointment history (the scaffold
  already does the read-only version of this).
- **Recording** appointments Sam has agreed to (not slot-picking them).
- **Logging completed grooms** — the core write that makes v2 a daily tool.
- **Safety and care flags** surfaced at the moment Sam needs them.
- **Rebooking and lapsed-client intelligence** built on the data Sam already has.

**What v2 IS NOT (yet):** the source-of-truth booking calendar, an availability
engine, or anything that sends messages on its own. See §4 for the full
anti-list and the graduation gate.

---

## §2 — Gap analysis: v1 vs v2 scaffold vs "working app for Sam"

v1 is **not** a marketing site. It is Samantha's working operator app — the
Supabase-backed HTML modules she uses daily. v2 must reach feature parity with
v1's operator function *and then* add what v1 lacks.

| Capability | v1 (Supabase-backed HTML — Sam's tool today) | v2 scaffold (Ship 2.1, read-only) | Needed for a working v2 app |
|---|---|---|---|
| Operator authentication | none — shared anon key (R-1) | none | **Required** — Ship 2.2a |
| Client / pet directory | yes — `client.html`, with writes | yes — read-only search + detail | rebuild **with edit** |
| Appointment history + financials | yes — `report.html` | yes — read-only | keep |
| New-client / pet intake | yes — `intake.html`, with writes | none | **Required** — write |
| Record / edit an appointment | yes — writes `appointments` | none | **Required** — write |
| Log a completed groom | yes — `status` enum already exists | UI built, write-disabled | **Required** — write; **no migration** |
| Today view (cockpit framing) | no | no | **Required** — new |
| Lapsed-client surface | no | yes — read-only | keep |
| Revenue / month view | yes — `report.html` | yes — read-only | keep |
| Smart warnings (load, allergy, overdue) | no | no | **Required** — new intelligence layer |
| Mobile-first UX | no — desktop HTML | yes | the core v2 reshape |
| RLS / data security | permissive — R-1 open | permissive (inherits live DB) | **Required** — Ship 2.2b cutover |

**Reading the table.** The basic CRUD is not the gap — v1 already does it. The
real gaps are three: **security** (the permissive-RLS R-1 hole, closed by the
Ship 2.2b flag-day cutover); **form** (v1 is desktop HTML, v2 is a mobile-first
cockpit Sam can use between dogs); and the **intelligence layer** (a today view
and smart warnings — the genuinely new product surface). The v2 scaffold has
already rebuilt the *read* half; every *write* path and the today view are
unbuilt.

**The data-origin question.** v1 and v2 read and write the **same**
`appointments` table — 730 rows today. So v2's today view is not starting from
empty; it inherits whatever v1 has recorded. The open question is the
relationship between that table and Pawfinity: is Tidy's `appointments` table
Samantha's *live forward schedule*, kept current through v1, or a historical
record running parallel to a Pawfinity calendar that is the real source of
truth? That relationship — not a generic "transcription" assumption — is the
load-bearing unknown. Routed to **Q-A4**.

---

## §3 — Scheduling domain model

Each subsection: **Model** (the structure), **Known**, **Unknown** (→ §5),
**Cockpit use** (how v2 surfaces it without owning it).

### 3.1 Locations / work contexts

**Model.** A *location* is where a given appointment happens. A *work context* is
the broader arrangement — Tidy Tails grooming vs "boss-work days."

**Known.** The data model encodes **exactly two locations**: both
`appointments.location` and `clients.preferred_location` carry a check
constraint of `annette` | `gina`. `appointments` also has a `rent_paid` column —
Samantha pays rent per appointment, consistent with renting space rather than
owning a shop. Tidy Tails is a solo venture; Samantha is the only groomer;
Barrie / Simcoe County, Ontario.

**Unknown.** What `annette` and `gina` actually are (street locations? two shops
she rents booth space in? a person's shop?); how the two locations relate to the
"boss-work days" concept in venture docs; whether a location is ever effectively
a boss arrangement. → **Q-A1, Q-A3.**

**Cockpit use.** v2 inherits the two-location vocabulary from the schema — the
today view groups and labels appointments by location. v2 does **not** model the
boss job; by data-minimization it needs only which *dates* are unavailable for
Tidy Tails grooming (§3.6).

### 3.2 Service types

**Model.** A *service* is a named grooming offering, with a price and a typical
duration.

**Known.** `appointments.service_type` is a check-constrained enum:
`full_groom` | `bath_only` | `nail_trim` | `other`. So the service taxonomy v1
uses today is known. Pricing is captured: `appointments.fee` / `tip` / `net`
and `pets.standard_fee`.

**Unknown.** Whether the four-value enum is still complete and current; what
`other` usually covers in practice; whether service-to-duration is fixed; add-on
handling. → **Q-A2.**

**Cockpit use.** Service type is shown on every appointment and feeds the
duration reference (§3.4). v2 displays services; it does not price or sell them.

### 3.3 Dog size / coat / handling profile

**Model.** Per-pet attributes that shape how long and how carefully a groom
takes: size, coat, handling difficulty.

**Known.** The `pets` table is already richly structured. `size` is a
check-constrained enum: `small` | `medium` | `large` | `xl`. Handling is
captured via `temperament_notes` and `behavior_flags` (free text). Safety data
is structured: `allergies` (boolean) + `allergies_detail`, plus `medical_notes`,
`vaccination_status`, `vet_contact`. `breed`, `grooming_style`, `clip_style`,
`weight_lbs` all exist.

**Unknown.** There is **no dedicated `coat_type` column** — coat is only implied
by `breed` / `grooming_style` / `clip_style`. Whether Sam wants a structured
coat field; which specific dogs she treats as difficult (the text fields exist
but their fill-rate and consistency are unconfirmed). → **Q-B3.**

**Cockpit use.** Size drives the large-dog daily soft-cap (§3.8); allergies and
behavior flags drive the safety warnings shown when Sam opens an appointment (§7
flow 5). v2 reads the existing structured fields rather than inventing them.

### 3.4 Appointment duration rules

**Model.** Estimated duration as a function of service type, size, coat, and
handling difficulty.

**Known.** The schema does **not** support duration. `appointments.time_slot` is
free text, not start/end timestamps — duration is not derivable from existing
data. The batch-1 answer grep confirmed zero duration data from Sam.

**Unknown.** Samantha's entire duration matrix. → **Q-B1.**

**Cockpit use.** v2 must **not** compute durations from a fabricated matrix.
Until Sam validates a model, the honest path is a per-appointment duration Sam
enters or confirms (this needs a new column — §6). v2 treats duration as a
reference field, never a hard scheduling input.

### 3.5 Allowed scheduling windows

**Model.** Samantha's normal working hours and working days for Tidy Tails
grooming.

**Known.** `clients.preferred_day` (text) and `clients.preferred_frequency_weeks`
exist — but these are *client* preferences, not Sam's own availability.

**Unknown.** Samantha's own working hours, working days per week, and any
seasonal variation. → **Q-A5.**

**Cockpit use.** Windows order the today view and give "is this a working day"
context for rebooking suggestions. v2 does **not** enforce windows — there is no
slot logic. Client `preferred_day` informs rebooking suggestions (§3.9).

### 3.6 Blocked days / boss-work days

**Model.** A set of dates on which Tidy Tails grooming does not happen:
boss-work days, days off, holidays, vacation.

**Known.** The "boss-work days" concept is established in venture docs. The
schema has **no** representation for it — there is no availability or
blocked-dates table.

**Unknown.** How frequent boss-work days are; which days; whether recurring
(e.g., every Monday) or ad hoc. → **Q-A1.**

**Cockpit use.** Blocked dates are excluded from rebooking suggestions and shown
plainly in the today view. **Data-minimization:** v2 stores only the date and a
coarse reason ("unavailable") — never what Samantha does on a boss day. A new
`blocked_dates` table is needed (§6).

### 3.7 Travel / pickup / drop-off constraints

**Model.** Whether an appointment involves Samantha traveling to the dog, or the
client dropping off and picking up.

**Known.** The schema leans toward **fixed-location drop-off**: two named
locations (`annette` / `gina`) plus per-appointment `rent_paid` describe working
out of rented spaces, not a mobile route. This is suggestive, not conclusive.

**Unknown.** Whether all grooming is drop-off at those two locations, or whether
any mobile / at-home service exists; whether pickup-window timing constrains the
day. → **Q-A3.**

**Cockpit use.** If drop-off only, v2 does not model travel at all — it shows
location per appointment and stops there. If any mobile service exists, travel
affects today-view ordering. v2 cannot resolve this without Sam; it is a Group A
question because it shapes the appointment record itself.

### 3.8 Daily load limits / large-dog cap

**Model.** A maximum number of dogs per day, possibly with a sub-cap on
large/XL or difficult dogs.

**Known.** Nothing — the schema has no capacity field.

**Unknown.** Whether Samantha works to explicit caps, and what they are.
→ **Q-B2.**

**Cockpit use.** v2 surfaces a **soft warning** only — e.g., "6 dogs today, 2 are
XL" (size is already a structured enum, so this count is computable). Never a
hard block. Until Q-B2 is answered, v2 shows the counts without a threshold.

### 3.9 Reminder / rebooking / lapsed-client rules

**Model.** Three related things: (a) **rebooking cadence** — how often a dog
should return; (b) **reminders** — surfacing upcoming or due dogs; (c)
**lapsed-client detection** — clients overdue past their cadence.

**Known.** This is the best-supported area. `clients.preferred_frequency_weeks`
is a structured enum (`2,3,4,6,7,8,12` weeks) — the *intended* rebooking cadence
already exists in the schema, per client. The `automations_log` table already
models `reminder` / `follow_up` / `rebook_prompt` / `no_show` events over
`sms` / `email` — though it is empty (the automation feature is unbuilt). v1 has
a Twilio `send-sms` edge function for manual sends.

**Unknown.** Whether `preferred_frequency_weeks` is reliably populated across the
131 clients; Samantha's working definition of "lapsed"; whether she wants
reminders surfaced inside Tidy at all. Note `preferred_frequency_weeks` is
per-*client*, not per-pet — a multi-dog household has one cadence. → **Q-A6,
Q-B4.**

**Cockpit use.** Lapsed = a client whose last appointment is older than
`preferred_frequency_weeks × 7` days; v2 reads the existing column rather than
inventing one. The observed interval from appointment history is a useful
cross-check and can be computed on read (§6 — no stored column required). v2
**surfaces** due/overdue dogs and lists lapsed clients (§7 flow 6); it does
**not** auto-send reminders (§4 anti-list).

---

## §4 — Not Yet: Full Scheduler

v2 is a scheduling-aware cockpit. It is **not** a scheduler. This section draws
the line so a future agent does not drift across it.

### What v2 explicitly does NOT build (anti-list)

- **No calendar grid widget** — no month/week/day grid as a primary surface.
- **No time-slot picker** — Sam does not pick an open slot inside v2.
- **No booking-conflict / double-booking detection** — v2 has no authoritative
  view of availability, so it cannot and must not claim to detect conflicts.
- **No availability / open-slot engine** — no computing "free" times.
- **No automated reminder or message dispatch** — v2 does not send SMS or email
  on its own. (SMS is a separate, later, gated ship per design-lock.)
- **No online client self-booking** — clients do not touch v2.

### The schema already over-anticipates this — heed it as a warning

The live schema contains three **empty** tables built ahead of any product:
`booking_requests` (with an `ai_suggested_slot` jsonb column), `client_accounts`
(a client portal with `pin_code`), and `automations_log`. Someone modeled a full
self-service booking-and-automation product before Samantha asked for one. v2
leaves these tables empty and unused. They are **not** evidence that v2 should
build those features now — they are a concrete example of the exact build-ahead
drift this section guards against.

### Why

Samantha's calendar source of truth is settled outside v2 (Pawfinity, pending
Q-A4). Design-lock §8 forbids a v2 scheduler. Samantha has not asked for one. And
a half-built scheduler is actively harmful: it creates a *second* authoritative
calendar and an ongoing sync problem. A cockpit that *references* the schedule
has no such failure mode.

### Graduation decision gate

v2 graduates from scheduling-aware cockpit to a real scheduling system only
through this gate. A gate is criteria **plus** a review cadence **plus** an
owner — criteria alone never get evaluated.

**Owner.** Russell decides. Samantha's explicit, unprompted request is a
*required input* — the gate cannot open without it.

**Criteria — graduation is on the table when several of these hold:**

1. Samantha explicitly asks Tidy Tails to own her scheduling.
2. Samantha has effectively stopped using her external calendar day to day.
3. Keeping Tidy's `appointments` data current has become the daily bottleneck
   (Q-A4) and the fix is for v2 to own the calendar rather than mirror it.
4. v2 has sustained lived adoption (the §10 lived-adoption criterion) for at
   least one full review cycle — a cockpit Sam abandoned should not graduate.

**Review cadence.** The gate is evaluated, not left dormant:

- First evaluation: at the end of the post-cutover watch week.
- Then every 90 days, or immediately whenever Samantha raises scheduling
  unprompted — whichever comes first.
- Each evaluation is a logged decision (in `docs/DECISIONS.md`): open the gate,
  keep it closed, or revise the criteria.

**If the gate never opens, that is a success, not a stall.** A cockpit that
makes Sam's day easier without owning her calendar is the intended end state.

---

## §5 — Questions for Sam

Tagged to the §3 subsection each unblocks. **Group A** must be answered before
the corresponding build starts. **Group B** can be learned during the parallel
run / watch week by observing real use.

### Group A — must answer before build

| # | Question | Unblocks |
|---|---|---|
| Q-A1 | Which days are boss-work days, or otherwise blocked for Tidy Tails grooming? Is there a recurring pattern (e.g., every Mon/Tue) or is it ad hoc week to week? | §3.1, §3.6 — today view, rebooking |
| Q-A2 | Your records use four service types — full groom, bath only, nail trim, and "other." Is that still your real service list? What does "other" usually mean? | §3.2 — service modeling |
| Q-A3 | Your data uses two locations, "annette" and "gina," and records rent per appointment. What are those two places? Do clients drop dogs off at fixed locations, or is there any mobile / at-home grooming? | §3.7, §3.1 — appointment record shape, UX |
| Q-A4 | What is the relationship between the appointment list in Tidy's database and your Pawfinity calendar? Do you keep Tidy's appointments current yourself, or is Pawfinity where your live, forward schedule actually lives? | §2, §3, all of M3 |
| Q-A5 | What are your normal working hours and working days for Tidy Tails grooming? | §3.5 — today view, rebooking |
| Q-A6 | Do you want Tidy to remind you about upcoming or due-for-groom dogs, or does your current setup handle reminders well enough? | §3.9 — milestone M5 |

**Q-A4 is the load-bearing question.** v1 and v2 share Tidy's `appointments`
table (730 rows). If Samantha keeps that table current, v2's today view has live
data and the cockpit works as designed. If Pawfinity is her live calendar and
Tidy's table is a parallel or historical record, the today view shows a stale or
partial picture — and the milestone must be re-scoped (e.g., a periodic
Pawfinity export/import, if Pawfinity offers one — itself unconfirmed, see §11).
Either way the today view must be **honestly labeled**: it shows the
appointments *in Tidy*, and the label should say so rather than imply a complete
schedule.

### Group B — can learn during the parallel run / watch week

| # | Question | Refines |
|---|---|---|
| Q-B1 | How long does each service actually take, by dog size and coat? | §3.4 — duration reference |
| Q-B2 | How many dogs is a full day? Is there a cap on large/XL or difficult dogs in one day? | §3.8 — daily-load warning threshold |
| Q-B3 | Coat type isn't recorded separately today — would a coat field help? And which dogs need special handling beyond what's already noted? | §3.3 — coat field, handling flags |
| Q-B4 | Is the "rebook every N weeks" value we have for each client accurate? (We'll show it; you confirm or correct.) | §3.9 — rebooking cadence |
| Q-B5 | Which care flags (allergies, vaccine status, behavior) matter most to you in the moment? | §3.3, §7 flow 5 |

Group B answers are *observed*, not surveyed up front — the watch week exists to
let real use teach these without blocking the build.

---

## §6 — Database schema implications (no migrations)

This section describes what the cockpit needs. **No SQL is written here.** Per
the ratified Ship 2.2 scope, feature schema ships as separate migrations inside
the ships that build those features (2.3+), never bundled with the security
migration. Nothing below is built until the relevant §5 Group A question is
answered.

**Most of the cockpit needs no new schema.** The §0 schema snapshot shows the
existing tables already support the core writes:

- **Logging a completed groom** is an `UPDATE` of `appointments.status` to
  `completed` — the enum value already exists. **No migration.**
- **Recording a new appointment** is an `INSERT` into `appointments` with
  `status = 'booked'` — every needed column (`date`, `time_slot`, `location`,
  `service_type`, `fee`) already exists. **No migration.**
- **Care flags, size, allergies, behavior** already exist as structured columns
  on `pets`. **No migration** to surface them.
- **Rebooking cadence** already exists as `clients.preferred_frequency_weeks`.
  Lapsed status is computed on read. **No migration.**

**The one required schema change is security:** the Ship 2.2 migration adds
`groomer_id` to the core tables and rewrites RLS against `auth.uid()`. Every
table below must be created or altered with that scoping from the start — feature
schema must not reintroduce the permissive R-1 pattern.

**Genuinely missing — feature additions, each gated on a §5 answer:**

- **`blocked_dates` table** (date, coarse reason) — for boss-work days and time
  off (§3.6). No equivalent exists today. Gated on **Q-A1**. Stores dates only,
  never boss-job detail.
- **Per-appointment `duration`** column on `appointments` — only if Sam wants
  duration tracked; `time_slot` is free text and cannot carry it. Gated on
  **Q-B1**.
- **Structured `coat_type`** on `pets` — only if Q-B3 says a coat field helps.
- **`pets.allergies` tri-state** — the column is `boolean default false`, so it
  cannot tell "no known allergies" apart from "unknown / not yet asked." A third
  state, or a companion `allergies_confirmed` flag, is needed so v2 does not
  display a false "Allergies: No" (§8.6). Safety-relevant — confirm with Sam.
- **`services` reference table** (name, typical duration, active flag) — only if
  Q-A2 reveals the four-value `service_type` enum is too coarse. Otherwise the
  existing enum stands.

**Explicitly not needed:** a stored per-pet "typical interval" column — the
intended cadence is `preferred_frequency_weeks`, and the observed interval is
cheap to compute on read from appointment history.

**Confirm before drafting any migration.** Re-read the live schema
(`list_tables`, read-only) at migration-draft time; this PRD's snapshot is dated
2026-05-16 and the schema is actively used by v1.

---

## §7 — UX flows

Six flows. Each: **trigger**, **steps**, **what v2 shows**, **out of scope**.

### Flow 1 — Morning schedule review (today view)

- **Trigger.** Sam opens v2 at the start of her workday.
- **Steps.** Land on the today view → see today's appointments (from
  `appointments` where `date` is today) in `time_slot` order → tap one for the
  dog's profile, history, and care flags.
- **v2 shows.** The day's appointments grouped by location (`annette` / `gina`),
  each row showing dog, client, service, and any care flag; a clear note if
  today is a blocked / boss-work day. The surface is labeled honestly per Q-A4 —
  it shows the appointments recorded in Tidy.
- **Out of scope.** No calendar grid; no editing of *availability* here.

### Flow 2 — Recording a new appointment

> Reframed from the kickoff's "booking a new appointment." v2 does not *book* —
> Sam agrees an appointment, then records it (`INSERT` with `status='booked'`).

- **Trigger.** Sam has agreed an appointment with a client.
- **Steps.** From a client/pet, choose "Record appointment" → pick date, time
  slot, location, and service type → save.
- **v2 shows.** A lightweight form over existing `appointments` columns; the
  appointment then appears in the today view on its date and in the pet's
  history.
- **Out of scope.** No slot picker; no availability check; no conflict detection
  (§4 anti-list).

### Flow 3 — Rebooking after a groom

- **Trigger.** A groom just finished and the client wants to rebook.
- **Steps.** From the completed appointment, choose "Rebook" → v2 suggests a
  return date from `clients.preferred_frequency_weeks`, landing on the client's
  `preferred_day` and skipping blocked dates → Sam adjusts and confirms → it
  becomes a recorded appointment (Flow 2).
- **v2 shows.** A suggested date with its reasoning ("every 6 weeks, prefers
  Tuesdays"), presented as a starting point Sam overrides freely.
- **Out of scope.** v2 does not push the booking into any external calendar.

### Flow 4 — Logging a completed groom

> The core write that turns v2 from a viewer into a daily tool. It is an
> `UPDATE` of an existing row — no schema change.

- **Trigger.** Sam finishes grooming a dog.
- **Steps.** Open the appointment → mark complete (`status='completed'`) →
  optionally record `fee`/`tip` and a groom note in `notes`.
- **v2 shows.** The appointment flips to "completed"; the note joins the pet's
  history and informs the next visit.
- **Out of scope.** No invoicing/payment processing; no automated client message.

### Flow 5 — Allergy / vaccine / special-care flags

- **Trigger.** Sam opens a dog's profile or an appointment for that dog.
- **Steps.** Care flags are visible without hunting — `allergies` /
  `allergies_detail`, `vaccination_status`, `medical_notes`, `behavior_flags`,
  `temperament_notes` shown prominently at the top of the dog's context.
- **v2 shows.** The existing structured fields surfaced at appointment time, so
  a muzzle-required or allergy fact cannot be missed.
- **Out of scope.** v2 does not verify vaccine records or contact a vet.

### Flow 6 — Finding lapsed clients

- **Trigger.** Sam wants to fill quiet days or win back clients.
- **Steps.** Open the lapsed-clients surface (the scaffold already has a
  read-only version) → see clients whose last appointment is older than their
  `preferred_frequency_weeks` cadence, sorted by how overdue → tap through to
  reach out via her normal channel.
- **v2 shows.** A ranked list with each client's last visit and cadence.
- **Out of scope.** v2 does not send the outreach message (§4 anti-list).

---

## §8 — Sam can fix the book herself: data correction as a first-class workflow

**Why this is a first-class workflow, not an admin afterthought.** Tidy Tails'
data has been wrong, and fixing it has been a project of its own. Phase 1 and
Phase 2 dedup, 79 reconciled contact cards, ~215 open data decisions logged for
triage, Samantha's card-review responses — that entire workstream exists because
the book had errors and only Russell and agents could correct them. v2 must
close that loop. If Samantha finds a wrong phone number, a misspelled dog name,
or a missing appointment, she must be able to fix it **herself, inside the app,
without Russell, without SQL, without an agent**. A cockpit she cannot correct is
a cockpit she will not trust — she will keep a paper book as the "real" record,
and v2 fails the §10 lived-adoption bar. Data correction is therefore designed in
from the first write milestone (M2) onward, not bolted on later.

**Scope note.** This section covers Samantha correcting records **one at a
time**. Bulk operations — CSV import, and especially *merging duplicate records*
— are explicitly **out of scope** for v2's first cut. A merge re-points foreign
keys (the exact operation Phase 2 performed via guarded SQL) and is too
destructive for an unassisted in-app action. v2 may *surface* a suspected
duplicate as a warning (§8.2), but performing the merge stays an assisted
operation (Russell / agent) until a safe in-app merge flow is separately
designed.

### 8.1 Inline editing from every detail surface

Every field shown on a client, pet, or appointment detail screen — and every
editable value on a daily-schedule row — is editable in place. Tap the field,
change it, save. There is no separate "admin" or "settings" area for data
correction: the place Sam *sees* a value is the place she *fixes* it.

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
- **Daily schedule row:** quick-edit of an appointment's time_slot, location,
  service_type, and status without leaving the today view.

Editing rules:

- Enum-backed fields (size, location, service_type, status, tier,
  preferred_frequency_weeks) edit through a **picker constrained to the schema's
  allowed values** — Sam cannot enter a value the database would reject.
- Free-text fields use a plain text input; booleans use a toggle.
- Saving is explicit, and light-touch validation runs at the boundary (an
  obviously malformed phone number is flagged, not silently stored).
- Edits are scoped — a field or a card at a time, not a whole-record form Sam
  must re-fill.

### 8.2 Add-missing flows

When a record does not exist, Samantha creates it without leaving her flow:

- **Add a missing client.** If a search returns nothing, the empty result offers
  "Add new client" directly.
- **Add a missing pet.** From a client's detail screen, "+ Add pet."
- **Add a missing appointment.** From a client or pet, or from the daily
  schedule, "+ Add appointment" — this is §7 Flow 2.

New records are created with **only the fields Samantha has**. Minimum to
create: a client needs at least a name or a phone number; a pet needs a name and
a client; an appointment needs a client, a pet, and a date. Everything else is
"unknown for now" (§8.6), filled in as she learns it.

### 8.3 Archive / inactive — not hard delete

The default way to remove a record from view is to **archive** it (mark it
inactive), never to hard-delete it.

Why archive, not delete:

- Hard delete is irreversible and foreign-key-dangerous. Deleting a client
  orphans its pets and appointments — the exact orphan-FK failure class Phase 2's
  invariants were written to prevent.
- The live database already blocks anon hard-deletes: the DELETE RLS policies on
  `clients`, `pets`, and `appointments` were dropped 2026-04-22, and no v1 module
  calls `.delete()`. v2 should not reintroduce hard delete; it should formalize
  archiving.

Behavior:

- Archived records are hidden from default search and lists, reachable behind an
  "include archived" toggle, and fully preserved — an archived client's past
  appointments stay valid history.
- A cancelled appointment (`status = 'cancelled'`) is effectively its own archive
  state; clients and pets need an explicit archived flag (§6).
- Un-archiving is a one-tap reversal.
- Hard delete is **not a Samantha-facing action at all.** If a record genuinely
  must be destroyed (true test data, a record created entirely in error), that
  remains an assisted operation.

### 8.4 Confirmation rules for destructive or high-risk changes

Confirmation friction scales with reversibility and blast radius. Do not make
Samantha confirm a typo fix; do make her confirm an allergy change.

- **Low-risk** (fixing a note, correcting a fee, a spelling fix): saves directly,
  no confirmation. This is the common case and must stay fast.
- **Medium-risk** (changing a phone number, a client or pet name, an
  appointment's date; archiving a pet): a lightweight inline confirm — one tap.
- **High-risk** — an explicit confirmation that **names the downstream effect**:
  - Archiving a client that has pets/appointments: "Archiving Jane Donaldson also
    hides 3 pets and 12 appointments from your lists. They stay in history.
    Continue?"
  - Editing a safety field (allergies, allergies_detail, vaccination_status,
    medical_notes) — a wrong safety edit is a dog-safety risk.
  - Reverting a completed appointment's status back to booked.
- There is no hard-delete confirmation because there is no hard delete (§8.3).

### 8.5 Audit / edit history for important edits

Important edits are recorded: **who, when, old value → new value.** "Important"
means safety fields (allergies, allergies_detail, vaccination_status,
medical_notes), identity and contact fields (names, phone), financial fields
(fee, tip, standard_fee), appointment status and date, and archive / un-archive
actions. Routine note edits need not be audited.

Why: a correction trail catches mistakes, lets Samantha undo a bad edit (revert
to the prior value), and — once v2 is multi-groomer (§8.7) — makes "who changed
this" answerable.

Schema implication (§6): an edit-history / `audit_events` table — entity type,
entity id, field, old value, new value, `edited_by` (= `auth.uid()`),
`edited_at`. Design-lock spec §3.6 floated an *optional* `audit_events` table;
this section makes it **recommended, not optional**, for the edit workflow. It is
feature schema and ships as its own migration, separate from the Ship 2.2
security migration, per the ratified scope.

First cut vs later: v1 of audit is *capturing* the data plus a simple per-record
"recent changes" list. A rich visual diff timeline can come later.

### 8.6 "Unknown for now" handling for incomplete fields

Most schema columns are nullable — good, because Samantha often will not have
every field. v2 must treat missing data as a **normal state, not an error**:

- An empty field shows as "Not set" / "Unknown" — never a fabricated default,
  never a blank that reads like a zero.
- **Sharp case: `pets.allergies` is a boolean defaulting to `false`.** Today
  "false" means "no allergies recorded" — which is *not* the same as "nobody has
  checked." Surfacing "Allergies: No" for a dog nobody asked about is a safety
  trap. v2 needs to let Samantha distinguish "no known allergies" from "unknown /
  not yet asked." This needs a schema decision — a third state or a companion
  "allergies confirmed" flag — flagged in §6.
- New records (§8.2) save with only known fields; the rest stay "unknown for
  now."
- v2 may *gently* surface a missing field that matters (a soft prompt on a pet
  whose vaccination_status is unknown) — but it never blocks a save.

This is the no-fabrication discipline applied to the UI: the app must not invent
a value to fill a gap, and must not pressure Samantha to.

### 8.7 Role and auth assumptions

- Samantha authenticates via real Supabase Auth (Ship 2.2a / milestone M1) and
  can view and edit **every record in her own book**.
- The data model is single-groomer today. The Ship 2.2 security migration adds
  `groomer_id` to the core tables and scopes RLS to `auth.uid()`.
- **Future multi-groomer** (the licensing possibility in CLAUDE.md — far out, not
  now): the edit model is *a groomer can edit only their own book* — their own
  clients, pets, and appointments. This is enforced at the database by the
  `auth.uid()` RLS scoping, not merely in the UI. No groomer edits another's
  records; there is no shared-edit and no admin-edits-everyone role unless a real
  multi-tenant admin role is separately designed.
- Inline editing is built on top of real auth — it is **not** enabled in any
  pre-auth state. Edit history (§8.5) records `edited_by` as the authenticated
  user, which is what makes the multi-groomer "only your own book" model
  auditable.

### 8.8 Acceptance criteria — Sam fixes a bad record herself

The bar: Samantha can correct a wrong record end-to-end inside v2, with **no
Russell, no SQL, no agent**.

1. From a client, pet, or appointment detail screen, Samantha can change any
   displayed field and save it, in under a minute, without leaving the screen.
2. She can add a missing client, a missing pet, and a missing appointment,
   supplying only the fields she knows.
3. She can archive a record she should no longer see; its history is preserved
   and the record is recoverable in one tap.
4. She never encounters a hard-delete action; nothing in the edit flow is
   irreversible without a clear, effect-naming confirmation.
5. A high-risk change — a safety field, archiving a client with dependents,
   contact info — shows a confirmation that names the consequence before it
   commits.
6. An important edit (safety, identity, financial, status) is recorded in
   history with old → new values and can be reverted.
7. A field she has no data for can be left, or marked "unknown," without blocking
   the save.
8. Concretely: given a real known-bad record — a misspelled pet name, a wrong
   phone number, a fee typo from the contact-card reconciliation — Samantha fixes
   it in v2 herself, and future corrections of this kind no longer need an agent.
   (Merge-class corrections — two records that are really one — remain assisted;
   see the §8 scope note.)

---

## §9 — Milestone plan: scaffold → usable daily app

| Milestone | Delivers | Gate / dependency |
|---|---|---|
| **M0 — Read-only scaffold** | Done. Directory, history, lapsed view, revenue — read-only. | Shipped (Ship 2.1, commit `2e9a5cb`). |
| **M1 — Operator auth** | Real Supabase Auth login; v2 is a private operator tool. | Ship 2.2a (app-side auth, buildable now against permissive DB). |
| **M2 — Log a completed groom** | Flow 4. First write path. **No migration** — `status` enum exists. | M1. Working backup path (see §11). |
| **M3 — Today view + record/edit appointment** | Flows 1 and 2. **No migration** for the appointment record itself. | **Q-A1, Q-A3, Q-A4, Q-A5 answered.** `blocked_dates` table (Q-A1). |
| **M4 — Care flags surfaced** | Flow 5. Surfaces existing `pets` fields. **No migration.** | Q-B5. |
| **M5 — Rebooking + lapsed clients** | Flows 3 and 6. Uses `preferred_frequency_weeks`. **No migration.** | Q-A6, Q-B4. |
| **M6 — RLS security cutover** | Ship 2.2b flag-day cutover; R-1 closed; v2 is live source of truth. | All feature ships landed; fresh backup; per Ship 2.2 plan. |

**Sequencing notes.** Most milestones need **no schema migration** — the
existing tables already carry the columns. M1 can start now. M2 is the smallest
write and proves the write path. M3 is the first milestone *gated on Sam's
answers* (Q-A1/A3/A4/A5) and the only feature milestone that adds a table
(`blocked_dates`). M6 is deliberately last, per the ratified flag-day decision:
the security migration runs only after v2 is a complete tool.

---

## §10 — Acceptance criteria: "Sam can run a real day from v2"

**Functional — v2 must let Sam, in one place:**

1. Log in as herself; no one else can see her data (post-M6: RLS-enforced).
2. Open the app in the morning and see the day's appointments in order, by
   location.
3. Record a new appointment she has agreed to, in under a minute.
4. Open a dog and immediately see its care flags — allergies, vaccine status,
   behavior — without searching.
5. Mark a groom complete and leave a note that shows up next visit.
6. Rebook a dog with a sensible suggested return date.
7. See which clients have lapsed and reach out.
8. Never encounter a fabricated number — every duration, interval, or cap shown
   is either read from real data or entered/confirmed by Sam.

**Lived-adoption — the criterion that actually proves it (mirrors design-lock
§7.4):**

9. Across a defined window (the post-cutover watch week, minimum five working
   days), Samantha chose v2 to run those days — opening it each morning, logging
   her grooms in it — **without falling back to v1's HTML modules, a paper book,
   or Pawfinity for the cockpit functions** (today view, groom logging, care
   flags). A feature-complete app Sam does not actually reach for has not met
   acceptance.

Criterion 9 is the real bar. Criteria 1–8 are necessary; 9 is sufficient.

Data correction has its own acceptance criteria in §8.8 — Samantha fixing a bad
record herself, with no Russell, SQL, or agent. v2 is not "a working app for
Sam" unless both this section's criteria and §8.8's pass.

---

## §11 — Open items and dependencies

- **Q-A1–A6 unanswered.** M3 and beyond are blocked until Sam answers Group A.
  These should go to Samantha as one short batch, framed as her workflow.
- **Q-A4 — appointments-vs-Pawfinity relationship.** The single biggest unknown.
  Until answered, the today-view milestone (M3) cannot be safely scoped.
- **Pawfinity export path unconfirmed.** This PRD does **not** establish that
  Pawfinity lacks a machine-readable export (CSV / ICS / API) — the recon docs
  speak to scheduling *ownership*, not export *availability*. If Q-A4 reveals
  Pawfinity holds the live schedule, whether it can export to feed Tidy is a
  separate item worth a short Codex check before M3.
- **`appointments` row count.** `list_tables` returned a stale `0` estimate for
  `appointments` (clients/pets/sam_review estimates were accurate). The
  authoritative count is **730**, per the Phase 2 execution report's explicit
  `count(*)` on 2026-05-16. An exact recount — and a check of how many rows are
  future-dated — is a one-query read-only step worth running before M3 scoping.
- **`venture-ops/dump_supabase.py` still missing.** The documented backup script
  does not exist on disk (REQ-17). Every write milestone (from M2) needs a
  working backup path; close this before M2.
- **Phase 4 enrichment overlap.** Structured pet fields (§3.3) overlap with the
  queued Codex enrichment work — coordinate so the two do not collide.
- **Landry/Laundry data question.** 4 rows at 705-796-0620 still pending Sam's
  Cash-vs-Charlotte answer (`v1-active-bugs.md` B4) — unrelated to scheduling but
  affects directory correctness.
- **§4 graduation gate** has its first scheduled evaluation at the end of the
  post-cutover watch week; log the outcome in `docs/DECISIONS.md`.

---

## §12 — PRD review notes (2026-05-16 checkpoint)

A checkpoint pass on this PRD. Standing guardrails for anyone picking up the v2
build:

- **v2 remains a scheduling-*aware* cockpit, not a full scheduler.** §1 and §4
  hold. The "Not Yet: Full Scheduler" boundary and the graduation gate (§4) are
  the only route to a wider scope, and only Russell can open that gate.
- **No code starts past the current read-only scaffold until §5 Group A is
  answered — or Russell explicitly chooses defaults in Samantha's place.** The
  app-side auth work (M1 / Ship 2.2a) and read-only polish are the only build
  activity safe to proceed on now; M3 onward is gated on Sam's answers. A
  Samantha-facing question sheet for Group A is at
  `_reports/2026-05-16-sam-scheduling-questions.md`.
- **The existing schema already supports most cockpit writes** — logging a
  groom, recording an appointment, editing records (§6, §8) — **but the live row
  count and table statistics should be verified before M3 is scoped.**
  `list_tables` returned a stale `0` estimate for `appointments`; the
  authoritative count is 730 (§11). Re-confirm with an exact `count(*)` and a
  future-dated-rows check before committing M3 scope.
- **Added at this checkpoint:** §8 (data correction as a first-class workflow)
  and these review notes. The original §8/§9/§10 were renumbered to §9/§10/§11.

---

*Generated by CC 2026-05-16. PRD/spec work only — no code written, no Supabase
mutated (the schema was read read-only via `list_tables`). The scheduling domain
(§3) is grounded in the live schema and tagged KNOWN/UNKNOWN; §5 routes every gap
to a question for Samantha. Nothing marked UNKNOWN may be built against until she
answers. KoyaOS dogfood lessons from producing this PRD are captured separately
in `_reports/2026-05-16-koyaos-dogfood-sam-scheduling-os-prd.md`.*
