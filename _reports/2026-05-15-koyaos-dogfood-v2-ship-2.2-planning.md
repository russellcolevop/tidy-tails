---
when: 2026-05-15
who: CC
purpose: KoyaOS platform lessons surfaced while planning Tidy Tails v2 Ship 2.2 (real Supabase Auth + RLS hardening). Continues the REQ series. Evidence-backed gaps from the planning session, not wishes.
audience: KoyaOS product team / Mission Control
status: captured; relay when Koya feedback is next ingested
continues: _reports/2026-05-15-koyaos-dogfood-v2-scaffold.md
related:
  - _reports/2026-05-15-v2-ship-2.2-auth-rls-plan.md
  - _reports/2026-05-15-v2-design-lock-spec.md
---

# KoyaOS dogfood lessons — Tidy Tails v2 Ship 2.2 planning

The v2 scaffold session produced REQ-11 through REQ-14
(`_reports/2026-05-15-koyaos-dogfood-v2-scaffold.md`). Planning Ship 2.2 — the
real-auth + RLS-hardening ship — surfaced four more. Each is grounded in
something the planning session actually hit.

---

## REQ-15 — Security-cutover decision gate (surface it, never silently pick it)

**What happened:** Ship 2.2 planning hit a structural fork the design-lock spec
itself flagged "Russell must decide" (§10): when hardening RLS on a live,
anon-keyed surface, do you (a) run the migration as a flag-day cutover, or (b)
keep a temporary permissive bridge so the old surface survives? The agent
surfaced this as an explicit decision gate — with the R-1 exposure-window
tradeoff spelled out — instead of choosing for the user. Russell picked flag-day.

Critically, his choice then **restructured the ship sequence**. The spec's §10
placed the RLS migration early (Ship 2.2, second in line). Flag-day cutover
pushes the migration to the very *end*, after every feature ship, because the
migration decommissions v1 and v2 must be a complete tool first. A decision
captured in one artifact silently invalidated an ordering written in another.

**What Koya needs:** A first-class **security-cutover decision template** for any
venture hardening the security model of a live surface — flag-day vs bridge, with
the exposure-window tradeoff made explicit and required to be answered by the
human, not the agent. And: **ship sequences should be treated as derived, not
frozen prose.** When a cutover or sequencing decision lands, Koya should
re-derive and re-validate the ship order rather than leaving a stale sequence in
the spec to mislead the next agent.

---

## REQ-16 — Split security migrations from feature migrations by default

**What happened:** The design-lock spec §3.6 bundled *all* schema changes —
security (`groomer_id`, RLS policy rewrite, drop a SECURITY DEFINER view) and
feature (a new `vaccinations` table, enrichment columns on `clients`/`pets`) —
into "a single Supabase migration." The Ship 2.2 plan deliberately narrowed to
security only: a small, well-understood migration has a far simpler and safer
rollback than one also carrying feature columns and a new table. Because the spec
declared itself authoritative, the deviation had to be explicitly flagged for
ratification and logged in the decisions file.

**What Koya needs:** The writing-plans / migration-planning flow should **split
security/RLS migrations from feature-schema migrations by default**, and treat
"one big migration" in a spec as a smell to challenge. Smaller migration =
smaller rollback surface = safer cutover. Koya could also make a spec's "single
migration" phrasing a prompt to the planning agent: "should this be split?"

---

## REQ-17 — Phantom-tooling check (referenced scripts that do not exist)

**What happened:** `venture-ops/dump_supabase.py` is named in CLAUDE.md and is
the designated backup mechanism across multiple venture docs — but it **does not
exist on disk**. The last backup was a hand-done REST-API workaround. A backup
script that exists only in documentation is a latent failure: the plan step that
depends on it ("take a fresh backup before the migration") is not actually
executable until the gap is closed — and the gap tends to surface at the worst
possible moment, right before a destructive operation.

**What Koya needs:** Koya should **verify that tools, scripts, and commands
referenced in venture docs** (CLAUDE.md, runbooks, plans) actually exist on disk,
and flag phantom references. A documented-but-missing backup script, deploy
script, or migration runner is exactly the kind of gap that an agent assumes is
real and only discovers under pressure.

---

## REQ-18 — "Old system as fallback" honesty check

**What happened:** Russell's cutover instruction said to "move v1 to
archived/read-only fallback" while *also* forbidding any anon bridge policy. Those
two are in tension: without the bridge, v1's hard-coded anon key is locked out of
**reads** too once policies are scoped to `auth.uid()` — so v1 cannot serve live
data after the migration. The plan had to surface this rather than quietly accept
"v1 is the fallback." The honest position: the real fallback is the *rollback
migration* (which restores the permissive state and revives v1), not a running
read-only v1; an archived v1 is a UI reference with no live data unless a
one-time static data snapshot is rendered into it.

**What Koya needs:** When a plan or instruction names an "old system" as a
fallback, Koya should **force the question: can the old system actually function
under the new state?** A decommissioned surface is frequently *not* a live
fallback — its credentials, schema assumptions, or access path may not survive
the cutover. The true recovery path (here, a rehearsed rollback migration) must
be named explicitly, and any wishful "we can always fall back to the old thing"
must be pressure-tested against the post-cutover reality.

---

## Summary — requirement priority

| REQ | Name | Priority | Phase |
|---|---|---|---|
| REQ-15 | Security-cutover decision gate + derived ship sequence | P1 | Koya platform |
| REQ-16 | Split security vs feature migrations | P2 | Koya platform / planning |
| REQ-17 | Phantom-tooling check | P2 | Koya platform / checklist |
| REQ-18 | "Old system as fallback" honesty check | P2 | Koya platform / planning |

---

*Generated by CC 2026-05-15. Derived from the Tidy Tails v2 Ship 2.2 planning
session. Continues `_reports/2026-05-15-koyaos-dogfood-v2-scaffold.md` (REQ-11–14)
and the earlier reconciliation-workstream REQ series.*
