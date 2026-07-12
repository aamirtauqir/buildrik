# Journey-coverage audit — which jobs/flows have no journey (codex-verified)

**Date:** 2026-06-29
**Method:** Wireframe-based coherence audit (Lesson 23) + codex consult (high effort, 461k tokens, read the actual files). Question: which user JOBS and job-critical FLOWS have no journey? Only `wireflows.html` (5 editor flows, J3·J3·J4·J5·J6) is a journey artifact; `editor-wireframe.html` is a surface appendix; `docs/reviews/wireframes/` is 108 single screens.

## The headline
**Of 6 jobs, only J3 (Build the page) has a correct, complete journey.** Codex's verdict on the rest:
- **J4 doesn't just miss a step — the journey we drew is aimed at the wrong job.** `wireflows` J4 = "consistent across the whole *site*" (single-site). But `ia-tree:222` defines J4's done-state as propagation to "every selected *client site*." The journey journeys single-site consistency; the actual job is cross-client brand propagation (the wedge). Wrong altitude.
- **J5 is partial** — editor/client round-trip drawn, but the dashboard **review queue + status-flip** (the IA's actual success condition, `ia-tree:240`) is never journeyed.
- **J6 is partial** — "Ship" journeyed; "run it"/measure not.
- **J1, J2 have no journey at all** (dashboard jobs).

**The single most important missing journey: the agency wedge end-to-end.** `ia-tree:142` labels it the "first slice" that proves the differentiator — and the only journey artifact never draws it. *"The doc that claims to prove the differentiator never draws the differentiator."*

## Confirmed REAL journey gaps (codex-ranked, agency-first)

| # | Gap | Evidence | Why it matters |
|---|-----|----------|----------------|
| 1 | **Agency wedge end-to-end** | ia-tree:142 (first-slice text path) vs wireflows:71/467 (5 editor flows only) | The differentiator path Clients→…→Live is never drawn as a journey |
| 2 | **J4 cross-site Shared DS push** | wireflows:217 ("whole site") vs ia-tree:222 ("every selected client site"); §36 = the wedge | The J4 journey is the *wrong job* — single-site, not cross-client |
| 3 | **J1 Run the business** | wireflows:71 excludes it; ia-tree:153 gives it its own acceptance bar | Client/team/integration setup is on the proof-path, not optional |
| 4 | **J5 dashboard review queue / status-flip** *(codex added — I missed it)* | ia-tree:240 (done = agency sees status flip), :246/:247 (queue+approval in dashboard) vs wireflows:350–404 (editor/client round-trip only) | Agencies need queue visibility, not just on-page comments |
| 5 | **J2 Start a site** | wireflows:71 excludes it; ia-tree:176 (under-a-minute start path) | The wedge can't start if the start-site motion is only scattered screens |
| 6 | **J6 post-publish run/measure loop** | wireflows:409 ("Ship it"); analytics is dashboard (ia-tree:270) | Publish is journeyed; run/measure is not |
| 7 | **Forms build → submission → leads** | editor-wireframe:566 ("Form banao, fir leads dekho") — never drawn | A real multi-step outcome flow, not one panel |

## Corrections codex made to my baseline
- **§21a was a sloppy citation.** §21a (editor-wireframe:799) is tracker *configuration*, not the analytics *view* (which lives in dashboard). "Run it" lacks a journey, but not because of §21a alone.
- **AI-inside-a-job was overcounted → LEGIT.** AI is cross-cutting, no standalone AI journey needed. If any AI flow is missing, it's J2 "New site — AI," not generic AI.
- **Onboarding/first-run: split.** Dashboard first-run (J2, ia-tree:187) = REAL missing subflow. Editor onboarding (editor-wireframe:1026) = LEGIT cross-cutting, no journey needed.
- **Substrate (auth/save/states) = LEGIT omit** (ia-tree:296 says so explicitly).
- **Double-counting flag:** #1 (wedge end-to-end) and #2 (J4 push) are the *same missing story at two zoom levels*; #1 also overlaps #3/#5. Keep both levels, but they're one product bet, not several.

## Status (2026-06-29)
**Done this session:** the ★ agency-wedge end-to-end journey is drawn (`wireflows.html`, first) — 7 steps, collapses gaps #1, #2, and the J5-queue half of #4 into one artifact. §36 orphan resolved (0→3 journey refs). All counts reconciled to "6 journeys (★ wedge + 5)" across wireflows, editor-wireframe, functionality-map.

## Deferred — do later (the "baqi cheezein")
Real journey gaps still un-drawn, ranked:
1. **J1 Run the business** — full journey (sign-in → workspace → invite team → add client → connect Vercel). Dashboard.
2. **J2 Start a site** — journey (land → pick client → new site → open editor, under a minute) + the dashboard first-run subflow.
3. **J6 post-publish run/measure loop** — operate/measure journey (live site → analytics → iterate → re-publish), distinct from Ship.
4. **Forms** — build form → configure → receive submissions → view leads.

Non-journey deferrals:
- **`wireflows.svg`** is a stale vector export (still 5 flows; can't hand-author the wedge's coordinates) — regenerate from the HTML. Only `NOTES.md` references it; no live doc embeds it, so low urgency.
- **Eng reality (LR-0017):** the wedge's `theme.*` editor wiring is **zero** — the journey is a redesign-target, not buildable as-is. Wiring is a build task, separate from design.
- **Correctness (L23):** every journey here is coherence-validated, not user-validated. The real proof = put the wedge flow in front of 3–5 real agencies.

## The one move that fixes the most
Draw the **agency wedge end-to-end journey** (Clients → new site → build → brand → **Shared DS push to client sites** → preview-as-client → review queue/status-flip → publish → live). It collapses gaps #1, #2, and the J5-queue half of #4 into one artifact, and forces J1/J2's entry to be drawn as the journey's on-ramp. That single journey is the highest-leverage thing missing from the whole design set.
