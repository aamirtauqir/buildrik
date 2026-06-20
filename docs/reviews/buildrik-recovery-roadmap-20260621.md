# Buildrik Recovery Roadmap — "it's shit" → "it's solid", fast

Date: 2026-06-21. Driven by real user feedback (see `user-feedback-fixplan-20260621.md`).
Audience: solo founder + AI ("vibcoder"). Effort is rough solo+AI calendar time, not promises.

## The principle (read this first)
You do **not** fix a product by fixing everything. You fix it by making the **one core journey
flawless** and **hiding everything half-baked**. A product where the spine works perfectly and
nothing broken is visible *feels finished* — even with ten peripheral features gated off. That
is the fast path. The slow path is "boil the ocean" — fixing 50 things at once, shipping none.

> **Hide before you fix. Spine before periphery. One pattern, applied everywhere.**

You already proved this works: V1 shipped via a "walk-and-fix loop" (walk the flow → hit a
problem → fix → re-walk). Use the same engine here.

---

## Phase 0 — Triage: hide what's broken  ·  effort: S (1–2 days)  ·  **instant credibility**
**Goal:** the "broken features" complaints disappear overnight — because nothing broken is visible.
- **Gate collaboration** behind a flag → OFF. It's demo-only (6 P1 bugs); showing it is the #1 reason the product reads as broken (constitution #3 — don't promote what isn't ready). The presence slot stays designed but hidden.
- Sweep every surface for **half-baked / "coming soon" / placeholder / dead** controls → hide each.
- **Done when:** a user clicking anywhere hits nothing broken, empty, or "coming soon."
- **Why fast:** hiding is a one-line flag, not a rebuild. Biggest perception gain per hour.

## Phase 1 — The feedback layer (UF-1)  ·  effort: M (3–5 days)  ·  **biggest perception fix**
**Goal:** kill "I never know if a process errored or succeeded."
- Define **one** status pattern and reuse it everywhere: every action goes **in-progress → success OR error→recover**. You already have the pieces — the `addToast` toast system + the topbar save-status. Make them the standard, not the exception.
- Apply to **every action**: save · publish · upload · delete · duplicate · AI · invite · settings-save · theme-push · page add/rename · export. Walk the [states checklist](../learning/product-design/reference/states-checklist.html) per action — at minimum loading + success + error.
- **Done when:** you can do any action and *always* know what happened.
- **Why fast:** it's ONE pattern applied many times (AI does the repetitive wiring), not bespoke design per screen.

## Phase 2 — Walk the core loop until flawless  ·  effort: M–L (~1 week, iterative)  ·  **the spine**
**Goal:** the one journey users judge you on works perfectly.
- The core job: **"an agency operator builds + publishes a client's site."** Walk it step-by-step *as a real user*, blank canvas → live URL.
- At each step fix: silent steps (now covered by Phase 1), confusing labels (constitution #2/#11), broken transitions, dead ends, anything that makes you pause.
- **Walk-and-fix loop:** walk → hit one problem → fix it → re-walk from the top → repeat until you reach "published" with zero confusion.
- **Done when:** you, then a fresh test user, go blank-canvas → published with no silent steps and no "wait, what does this do?"
- **Why this order:** ~80% of a user's judgment is formed on ~20% of the product — the spine. Perfect that; defer the rest.

## Phase 3 — Wire or hide the ghost features (UF-2)  ·  effort: L (1–2 weeks, scoped by inventory)
**Goal:** "backend exists but isn't integrated" → every backend capability is either wired to the UI or hidden.
- **Inventory first:** list backend endpoints/services that have no UI path (this is a discovery task — do it before estimating).
- For each: **wire it** (a control + Phase-1 states) **or hide it** until wired. No capability that "exists" but can't be reached.
- **Done when:** there are no ghost features — everything visible works, everything that works is reachable.

## Phase 4 — Re-test with the same users  ·  effort: S (1 day)  ·  **prove the flip**
**Goal:** confirm perception actually changed (don't assume).
- Same ~5 users, same task (publish a site), watched silently.
- **Measure:** before — "1/5 finished, called it shit." After — "N/5 finished unaided." That delta is your proof.
- **Done when:** the spine task succeeds for most users without help.

## Phase 5 — Continue the redesign by pain (UF-4)  ·  effort: ongoing
**Goal:** the broader "too complicated" → coherent, surface by surface.
- Run the five-step loop with the [constitution](../learning/product-design/reference/buildrik-design-principles.html), **ordered by where users stumbled in Phase 4**, not by taste.
- Topbar: done. Next likely: inspector → rail → panels → footer.

---

## The fast-path summary
**Phases 0–2 (~2 focused weeks, solo + AI)** flip the product from "broken/shit" to "the core
works and nothing broken is visible." That is the perception change that matters — and it's
mostly *hiding + one feedback pattern + one flawless flow*, not a rewrite. Phases 3–5 are the
deeper finish.

## What makes it fast (vs a rewrite)
1. **Hide before fix** — Phase 0 is a flag, not a build.
2. **One pattern everywhere** — Phase 1 is repetition (AI's strength), not 30 bespoke designs.
3. **Spine first** — fix the 20% that earns 80% of judgment; gate the rest.
4. **Keep the backend** — a rewrite throws away the expensive, working half. You don't.
5. **You direct, AI types, you verify** — the vibcoder loop, with the [five rungs](../learning/product-design/reference/definition-of-done.html) on every change.

## What it is NOT
Not "make another version." Not fix-everything-at-once. Not rebuild the backend. The product is
half-wired, and the expensive half is done — this roadmap finishes the cheap half in the right order.
