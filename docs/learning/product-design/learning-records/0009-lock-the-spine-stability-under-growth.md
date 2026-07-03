# 0009 — Lock the spine: how the core design survives feature growth

**Date:** 2026-06-25
**Status:** active

## What happened
The learner asked (Roman Urdu) for the *name* of an approach: a product whose **core editor design doesn't break as new features are added** — concretely, "the Add button stays in the same position in every version," core features stay central/close, helper features stay outside. This is a vocabulary + principle question, arriving right on top of the live rail-lock work ([[0008-craft-on-guesses-hits-the-wall-converge-and-test]]).

## The teachable thing
What they described has **three names on three layers** — one idea seen from three altitudes:
1. **Spatial stability / "consistency"** (Nielsen heuristic #4) — the *visible promise*. Fixed positions across versions preserve muscle memory; users don't re-learn.
2. **Stable core + periphery** — the *structure*. Core fixed & central; rare/helper features at the edge or one click deep. This is the macro of constitution #9 (progressive disclosure).
3. **Pace layering** (Stewart Brand) — the *deep why*. A system's layers change at different speeds; the fast layer (features) must never move the slow layer (core layout). "Fast learns, slow remembers."

Code analog for directing AI: the **Open–Closed Principle** — open for extension, closed for modification (add a feature without re-cutting the core).

One handle taught: **"lock the spine, dock the rest."** Spine = the few positions users memorise (rail slots, topbar zones, hero button, inspector frame). New features *dock* into an existing home (panel / sub-tab / ⋯ overflow); they never reorder the spine.

## Consequence for the work
This directly arms the current decision: **locking the rail (Insert · Media · Pages · Design) IS locking the spine.** The real risk is the next 6 months — CMS, reviews, comments, animations, SEO all arriving. Without the rule, each demands a new rail icon and the rail reverts to the 11-tab grab-bag the learner just fixed. The rule converts "fear of breaking the design" into a repeatable **spine test** run before any feature lands (move-anything? → which home? → common/rare? → new slot only for a new user-job).

## Constitution
- Added **#15 — "Lock the spine; dock additions to the edge"** (group: Structure, alongside #14). Pure structural principle; pairs with #9 + #14 + #8. Taught in `lessons/0016-lock-the-spine-dock-the-rest.html`.

## Teaching note
Good "naming muscle" moment (the course's founding method, [[0001-worked-examples-not-homework]]): the learner already had the instinct fully formed and only lacked the word. Lead was a clean answer + the worked Buildrik example (Insert slot #1), not a quiz.
