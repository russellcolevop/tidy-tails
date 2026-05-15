---
when: 2026-05-15
who: CC
purpose: KoyaOS platform lessons surfaced while building the Tidy Tails v2 Ship 2.1 read-only scaffold. Continues the REQ series from the reconciliation-workstream dogfood doc. Evidence-backed gaps, not wishes.
audience: KoyaOS product team / Mission Control
status: captured; relay when Koya feedback is next ingested
continues: _reports/2026-05-15-koyaos-dogfood-requirements-from-tidy-tails.md
related:
  - _reports/2026-05-15-v2-ship-2.1-scaffold-addendum.md
  - _reports/2026-05-15-v2-design-lock-spec.md
  - _reports/2026-05-15-pawfinity-v2-implications.md
---

# KoyaOS dogfood lessons — Tidy Tails v2 scaffold

The reconciliation workstream produced REQ-01 through REQ-10
(`_reports/2026-05-15-koyaos-dogfood-requirements-from-tidy-tails.md`). Building
the v2 read-only scaffold surfaced four more. Each is grounded in something the
session actually hit.

---

## REQ-11 — Ship-addendum artifact type (don't re-spec when a spec exists)

**What happened:** Tidy Tails already had a comprehensive 47KB v2 design-lock
spec. The brainstorming workflow's default terminal artifact is a fresh design
doc — which would have duplicated an existing, better document. The right
artifact was a *thin* "Ship 2.1 scaffold addendum" that references the parent
spec and records only ship-scoped setup decisions and narrowed scope.

**What Koya needs:** A first-class **Ship Addendum** artifact type that links to
a parent spec (`parent_spec:` in frontmatter), carries only delta scope +
decisions for one ship, and is explicitly subordinate ("if this conflicts with
the parent spec, the parent wins"). Multi-ship BUILD ventures should not
re-spec the whole product every ship. The brainstorming/writing-plans flow
should detect an existing spec and offer "addendum" instead of "new spec."

---

## REQ-12 — Read-only-scaffold data pattern for un-hardened live DBs

**What happened:** v2 needed to display real-shaped client/pet/appointment data,
but the live Supabase project has permissive RLS (R-1 — anyone with the anon key
can read/write) and customer data must never land in the repo. Building straight
against live data would have meant a new app carrying a live connection to an
un-hardened DB.

**Pattern that worked:** Anonymized synthetic **fixtures as the committed
default**; a live `SELECT`-only path behind an env flag (`NEXT_PUBLIC_USE_LIVE_DATA`,
default off); the data layer dispatches between them behind one interface so UI
code never knows the difference. The committed default is safe to run anywhere
and contains zero customer data.

**What Koya needs:** Codify this as a recommended pattern for "new surface, live
DB, security not yet hardened." Koya could scaffold the fixtures/live-flag
dispatch layer automatically, and flag any new surface that imports a live DB
client without a fixtures fallback.

---

## REQ-13 — Framework-version-drift guard

**What happened:** `create-next-app` installed Next.js 16, which postdates the
agent's training. Next 16 renamed `middleware` → `proxy`, made route `params`
async, changed file conventions. Writing code from training-era assumptions
would have produced broken files. The scaffold's own generated `AGENTS.md`
flagged this ("This is NOT the Next.js you know") and pointed at bundled docs in
`node_modules/next/dist/docs/`. Reading those first made the build pass clean on
the first try.

**What Koya needs:** The framework-first checklist (`.koya/AGENTS.md`) should
include an explicit step: *before writing framework code, check the installed
version and read its bundled docs / generated `AGENTS.md` for breaking changes.*
The bundled-docs pattern is reliable and worth Koya recommending it as the
default move whenever the installed major version is newer than the agent's
training cutoff.

---

## REQ-14 — App-surface registry with per-surface safety posture

**What happened:** Tidy Tails now has three live surfaces with three different
safety postures: v1 (live static app — production, do-not-touch), v2 scaffold
(read-only internal PWA — no writes, no deploy this ship), and the venture doc
set (freely editable). An agent picking the wrong default for the wrong surface
is a real failure mode — e.g. treating the v2 scaffold as deployable, or editing
v1. The Pawfinity recon already asked for app-surface *classification*
(`pawfinity-v2-implications.md` §7.7); this session shows classification alone
is not enough — each surface needs an attached **posture**.

**What Koya needs:** A per-venture surface registry where each surface carries:
kind (public site / internal app / PWA shell / data room / artifact), lifecycle
stage, and an explicit **safety posture** (production-frozen / read-only /
free-edit / deploy-gated). Agents read the posture to pick the right default.
The v2 PWA shell — manifest, service worker, installability, icons — is itself a
first-class surface artifact; Koya should track it (including an "assets are
placeholders, need finishing before launch" flag, since the v2 icons are
programmatically-generated placeholders).

---

## Summary — requirement priority

| REQ | Name | Priority | Phase |
|---|---|---|---|
| REQ-11 | Ship-addendum artifact type | P1 | Koya platform |
| REQ-12 | Read-only-scaffold data pattern | P1 | Koya platform |
| REQ-13 | Framework-version-drift guard | P2 | Koya platform / checklist |
| REQ-14 | App-surface registry + safety posture | P1 | Koya platform |

---

*Generated by CC 2026-05-15. Derived from the Tidy Tails v2 Ship 2.1 scaffold session. Continues `_reports/2026-05-15-koyaos-dogfood-requirements-from-tidy-tails.md`.*
