# Job-first shape-check — the 4 design artifacts vs the 6 jobs

**Date:** 2026-06-29
**Method:** Lesson 21 (the design spine). Read each artifact's *top-level structure* and ask: is it organized by the **6 user jobs**, or did it drift back to backend modules? The 6 jobs are the SSOT in `ia-home-map.html` + `ia-tree.html`.

**The 6 jobs (canonical vocabulary):**
`J1 Run the business` · `J2 Start a site` · `J3 Build the page` · `J4 Make it on-brand` · `J5 Get sign-off` · `J6 Ship & run it`
(J1–J2 = dashboard · J3–J6 = editor.)

---

## Verdict table

| # | Artifact | Top-level structure | Job-first? | Drift |
|---|----------|--------------------|:---------:|-------|
| 1 | `ia-home-map.html` | 6 jobs (J1–J6), every feature one home + verdict | **✓ PASS** | none |
| 2 | `ia-tree.html` | 6 jobs (J1–J6) build board | **✓ PASS** (jobs) | **D4** — editor *rail* skeleton drifted |
| 3 | `wireflows.html` | 5 left→right journeys | **✓ PASS** (journeys) | **D1** numbering collision · **D2** no scope note |
| 4 | `editor-wireframe.html` | surface appendix, correctly subordinate to the journeys | **✓ PASS** (demoted) | **D3** appendix index has no job-first view |

**Headline:** the IA layer (ia-home-map, ia-tree) and the wireframe layer are job-first. **wireflows is the one artifact that drifted on numbering**, and ia-tree carries one stale rail. No artifact is module-shaped at the top level — the LR-0018 fix held. The drifts are *consistency* drifts (the same job vocabulary not spoken across all four), not structure drifts.

---

## D1 — wireflows flow-numbers collide with the IA job-numbers `[HIGH · LR-0014 class]`

**What:** `wireflows.html` numbers its 5 flows `J1…J5`, but those numbers mean *different jobs* than the IA's `J1…J6`:

| wireflows says | …but the IA's J# is | wireflows flow is really IA |
|---|---|---|
| **J1** Make a page | J1 = Run the business | **J3** Build the page |
| **J2** Make it on-brand | J2 = Start a site | **J4** Make it on-brand |
| **J3** Structure content (CMS) | J3 = Build the page | **J3** (a 2nd Build journey) |
| **J4** Get sign-off | J4 = Make it on-brand | **J5** Get sign-off |
| **J5** Ship it | J5 = Get sign-off | **J6** Ship & run it |

A reader who learned "J1 = Run the business" from `ia-tree` opens `wireflows` and sees "J1 = Make a page." Same key, opposite meaning. The names are the stable truth; the numbers lie. `editor-wireframe.html` already speaks the correct vocab (its section tags read `J3` CMS, `J4` Brand, `J5` Preview, `J6` Publish; its scope note says "Jobs 3-6") — so **wireflows is the single outlier.**

**Fix:** renumber the wireflows flows to the IA vocabulary → `J3 · J3 · J4 · J5 · J6`. CMS stays J3 (it's a Build-the-page journey, data-driven). Touch all three copies: `wireflows.html`, `wireflows.standalone.html`, `wireflows.svg`. Also fix the one back-reference in `editor-wireframe.html` (`"J4/J5 in wireflows"` → `"J5"`).

## D2 — wireflows never states its scope `[MED]`

**What:** `wireflows` opens straight at "J1 Make a page" with no note that it covers only the **editor** jobs and that the **dashboard** jobs (Run the business, Start a site) are drawn elsewhere. A reader of wireflows alone can't tell whether 2 jobs are missing or deliberately out of scope. `editor-wireframe.html` has exactly this note (line 46, "Jobs 3-6 … dashboard jobs … live in `docs/reviews/wireframes/`"); wireflows lacks the parallel.

**Fix:** add a scope line to wireflows: "6 jobs total; this file = the 4 editor jobs (J3 Build · J4 Brand · J5 Sign-off · J6 Ship, with J3 drawn as two journeys); the 2 dashboard jobs (J1 Run-business · J2 Start-site) live in the dashboard wireframe set."

## D3 — editor-wireframe appendix index is pure module order `[LOW]`

**What:** the appendix is correctly framed as subordinate ("start with the journeys, not this list"), but its index is a flat module/surface list (`0 shell · 1 Insert · 2 Media · 3 Pages · 4 Design …`). A reader dropping into the appendix gets no job-first view of which surfaces belong to which journey — the lookup is fine, but the organizing principle isn't visible.

**Fix:** add a compact **"By journey (job-first)"** index *above* the module index, mapping each of the 5 journeys → the §N sections it passes through. Keep the module index as the secondary A-Z lookup.

## D4 — ia-tree's editor rail is stale + lists AI as a "place" `[MED · reversible design call]`

**What:** `ia-tree`'s editor nav skeleton reads `Build · Design · AI · Settings`. Two problems:
1. **Stale vs the locked spine.** `editor-wireframe.html` (code-reconciled 2026-06-28) + the lock-the-spine principle (#15) say the live, locked 4-slot rail is **`Insert · Pages · Styles · Site`** (Media/Templates/Components fold under Insert; CMS rides Pages as a Content view). ia-tree shows a different 4 — a regroup that the code and wireframe didn't adopt. The two docs hand a reader two different "editor top-level nav."
2. **AI as a rail slot contradicts "AI is not a place."** Both `ia-home-map` and `ia-tree`'s own AI strips say *"AI — a cross-cutting capability, not a cluster; AI is not a place — it shows up inside jobs."* Yet the rail skeleton lists `AI` as a top-level slot. The wireframe accesses AI via the topbar ✨ (cross-cutting), not a rail slot — the correct model.

**Why this is a design call, not just a typo:** the deeper question is whether the editor rail should be **job-named** (`Build · Brand …`) or **object/tool-named** (`Insert · Pages · Styles · Site`). Webflow — the stated model — uses an object/tool rail (Add · Pages · Navigator · CMS · Assets) and lets the **journeys** carry the job-first structure. That's exactly the post-LR-0018 split: rail = tool/object (locked spine), job-first = the journeys (wireflows). So the object/tool rail is *consistent* with job-first as long as the journeys hold the jobs.

**Fix (applied):** align ia-tree's editor skeleton to the locked spine `Insert · Pages · Styles · Site`; drop AI from the rail (it's the topbar ✨, cross-cutting); add a one-line note that job-grouping lives in the journeys (`wireflows`), not the rail labels — per #15 + LR-0018. **✓ CONFIRMED by founder 2026-06-29:** object-named rail stands (matches shipped code + Webflow model); job-named (`Build · Brand`) rejected as a bigger real redesign. Decision settled, not reversible-pending.

---

## Fix log (what changed)

- **D1** — renumbered `wireflows.html`, `wireflows.standalone.html`, `wireflows.svg` flow badges to `J3·J3·J4·J5·J6`; updated intro + footer to map flows→jobs; fixed the `editor-wireframe.html` "(J4/J5 in wireflows)" back-ref to "(J5)".
- **D2** — added scope note to `wireflows.html` + `.standalone.html`.
- **D3** — added "By journey (job-first)" index block to `editor-wireframe.html`.
- **D4** — aligned `ia-tree.html` editor rail to `Insert·Pages·Styles·Site`, removed AI rail slot, added job-grouping-lives-in-journeys note.

## Verification

- Cross-doc job vocabulary: every `J#` in all 4 artifacts now means the same job. (checked)
- All `→ §N` wireflow refs still resolve to existing appendix ids (renumber touched flow *badges*, not the §N refs). (checked)
- Tag balance + no broken inter-doc links across the 5 docs. (checked)
