# Product & UX Design Resources

## Knowledge

- [10 Usability Heuristics for User Interface Design — Jakob Nielsen, NN/G](https://www.nngroup.com/articles/ten-usability-heuristics/)
  The canonical 10 rules of thumb every interface is judged against. **The backbone of this whole course.** Use for: naming *why* a screen feels wrong instead of saying "it feels weird."
- [How to Conduct a Heuristic Evaluation — NN/G](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/)
  The step-by-step method: who evaluates, how to collect one-observation-per-line, how to consolidate. Use for: running an audit pass yourself.
- [Severity Ratings for Usability Problems — Jakob Nielsen, NN/G](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/)
  The 0–4 severity scale (frequency × impact × persistence). Use for: deciding what to fix first so you don't drown in findings.
- [How to Conduct a Heuristic Evaluation (Video) — NN/G](https://www.nngroup.com/videos/conduct-heuristic-evaluation/)
  10-min walkthrough if you'd rather watch than read.
- [Heuristic Evaluation Workbook (PDF) — NN/G](https://media.nngroup.com/media/articles/attachments/Heuristic_Evaluation_Workbook_1_Fillable.pdf)
  A fillable template for capturing findings. Use for: your first real audit pass on the editor.

### The pro frontier (added 2026-06-21 — user research, measurement, product judgment)
- [Steve Krug — *Rocket Surgery Made Easy*](https://sensible.com/rocket-surgery-made-easy/) **START HERE for research.**
  Do-it-yourself usability testing for non-experts and solo founders. A morning a month, 3 users, no lab. The single highest-leverage habit in product design — and the one the course deferred until now.
- [Steve Krug — *Don't Make Me Think*](https://sensible.com/dont-make-me-think/)
  The classic on web/app usability. Short, funny, foundational. Use for: the "self-evident" bar every screen should clear.
- [Rob Fitzpatrick — *The Mom Test*](https://www.momtestbook.com/)
  How to talk to users so they tell you the truth instead of being nice. Essential for a founder who'll interview their own agency customers.
- [Marty Cagan — *Inspired*](https://www.svpg.com/inspired-how-to-create-products-customers-love/)
  How modern product teams decide what to build (and what to kill). Use for: prioritisation — shipping the smallest thing that solves the real pain.
- [Jobs To Be Done — intro (Christensen, "milkshake")](https://www.youtube.com/watch?v=sfGtw2C95Ms)
  The "people hire a product to do a job" lens. Use for: Habit 1 — starting from the user's job, not the UI.
- [Ira Glass — *The Gap*](https://vimeo.com/85040589) **Watch when you feel "I'm not good enough."**
  3 minutes. Beginners have taste that outruns their skill, so their own work disappoints them. The only way through is volume of work. The antidote to "I'm not a designer, I can't get this right." Use for: the confidence reframe — the frustration IS the signal you have taste; close the gap with reps, not by thinking harder.

### Stability under growth (added 2026-06-25 — keeping the core design intact as features pile on)
- [Maintain Consistency and Adhere to Standards (Usability Heuristic #4) — NN/G](https://www.nngroup.com/articles/consistency-and-standards/) **The visible promise.**
  Why a control staying in the same place across versions matters: stable layout = the user reuses muscle memory instead of re-learning. Use for: defending "don't move the Add button" against every redesign.
- [Stewart Brand — *Pace Layering: How Complex Systems Learn and Keep Learning*](https://jods.mitpress.mit.edu/pub/issue3-brand) ([Long Now mirror](https://longnow.org/ideas/pace-layers/)) **The deep "why".**
  A robust system has layers that change at different speeds; the fast layer (fashion/features) must not disturb the slow layer (structure/core). "Fast learns, slow remembers." Use for: the mental model behind "lock the spine, dock the rest" (constitution #15).
- [Open–Closed Principle (Wikipedia)](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle)
  The code-side version of the same idea: software should be *open for extension, closed for modification* — add a feature without re-cutting the core. Use for: briefing the AI so a new feature plugs in rather than rewiring what already works.

### Wireframing (added 2026-06-25 — drawing the structure before the paint)
- [Wireframes — NN/g (Lyndon Cerejo)](https://www.nngroup.com/articles/wireframes/) **The bar for low-fi.**
  What a wireframe is and isn't, fidelity levels, why structure-before-visuals. Use for: keeping a wireframe grey and about *layout*, not colour. Backs Lesson 17.
- [Wireflows: How to Combine Wireframes & Flows — NN/g](https://www.nngroup.com/articles/wireflows-when-and-how-to-use-them/)
  When one screen isn't enough — stitch wireframes into a task flow. Use for: the "walk the wireframe" step (build → publish) before testing.
- [Jobs To Be Done — Christensen ("milkshake")](https://www.youtube.com/watch?v=sfGtw2C95Ms) (also under the pro frontier)
  The "job first" pass: people hire a screen to do a job; the biggest job is the loudest box.

### Agency-tool model + redesign process (added 2026-06-26)
- [Webflow University](https://university.webflow.com/) **The job+module reference.**
  How the class-leading agency builder is structured: top-level = jobs (Designer / CMS / Editor), each holding fixed modules (panels/blocks) that don't move. Use for: grounding the Buildrik editor IA against a product that got job+module right — fills the long-noted "no agency-tool UX teardown" gap. Watch the Designer overview + panels tour.
- [Webflow Designer overview (panels & layout)](https://university.webflow.com/lesson/intro-to-the-designer) 
  The canonical "left rail + canvas + right style panel" agency-editor layout. Use for: comparing Buildrik's rail/inspector/canvas against the incumbent.

### Control placement (added 2026-06-26 — where a control lives, not just how loud)
- [Fitts's Law — NN/g](https://www.nngroup.com/articles/fitts-law/) **The "tools near the work" grounding.**
  Time/effort to hit a target rises with distance and falls with size. Use for: defending "put frequent canvas controls by the canvas, reserve the far topbar for rare/global" (constitution #16).
- [Fitts's Law — Laws of UX](https://lawsofux.com/fittss-law/)
  Short, illustrated restatement. Use for: the quick mental model when placing any button.

### Design → Figma (added 2026-06-29 — exporting the HTML design set into Figma)
- [Figma — Import SVG & files into Figma](https://help.figma.com/hc/en-us/articles/360040028034-Import-files-into-Figma) **The quota-free route.**
  How Figma parses an imported SVG: `<rect>`→Rectangle, `<text>`→editable Text, `<g>`→Group. Use for: getting the HTML wireframes into Figma as native-editable layers without spending any Figma-MCP quota (the Starter plan hard-caps MCP calls — see `reference/editor-wireframe.figma.README.md`). Lesson 24.

## Wisdom (Communities)

- [r/userexperience](https://reddit.com/r/userexperience) and [r/UI_Design](https://reddit.com/r/UI_Design)
  Post a screenshot of a Buildrik screen + your heuristic findings, ask "what did I miss?" Use for: a second set of eyes once you can speak the language.
- [Designer Hangout / Indie Hackers design threads](https://www.indiehackers.com/)
  Founder-designers reviewing each other's SaaS UIs. Use for: agency-tool-specific critique.

## Gaps
- No agency-tool-specific (Webflow/Framer-class) UX teardown source yet. Search later for "Webflow editor UX critique" once the audit skill is solid.
