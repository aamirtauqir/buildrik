# Teaching notes — preferences & working state

## How this learner wants to be taught
- **Roman-Urdu-friendly** explanation; one clear recommendation, not a menu. Surface cost/effort.
- **Drive, don't quiz** with abstract Q&A — give a clear lead + confirm.
- **Learn by auditing the REAL app** (Buildrik editor `/edit/:id`, dashboard). Abstract examples feel too far away.
- Solo builder, ships fast to `main`. Lessons must be short + immediately applicable.

## Context
- Building Buildrik: agency-first web builder, Webflow/Framer competitor. Editor (Vite, mounted in Next at `/edit/:id`) + dashboard (Next). Brand locked in DESIGN.md (cobalt #2D6DFF, no purple).
- Just shipped a big editor redesign (inspector → "You are editing" + 3-reach + plain labels; topbar → Exit/breadcrumb/Client view) after a codex review. The learner felt the product was still incoherent — that frustration is what triggered this course.

## Course shape
- Spine = NN/g 10 heuristics + severity + the audit loop. Reference: `reference/heuristics-cheatsheet.html`.
- L1 (done): teach the naming muscle via a quiz on the learner's own complaints. Assignment = write 3 findings on one editor task.
- L2 (done): rate + prioritise. Built as a WORKED example — 3 real, fresh editor findings (breadcrumb no agency›client #2 sev2 · +Invite first-class #8 sev1 · "0/7 done" pill unlabelled #6 sev2), each rated with the why (freq×impact×persistence), then ranked (severity sets order, effort breaks ties). Introduced "expected result in one line". `lessons/0002-rate-and-prioritise.html`.
- L3 (done): "What goes where" — prominence = frequency × importance + the loudest button = the product's purpose. Built from the learner's OWN two objections to a topbar mockup (breadcrumb depth + Publish vs Ask AI as hero). `lessons/0003-what-goes-where.html`.
- L4 (next): consistency / the shared "panel shell" idea — why one skeleton across surfaces beats four bespoke panels (ties to the live audit's root cause). Keep grounding in the learner's own critiques.
- Later: the anti-AI-slop checklist (density, hierarchy, decoration); IA coherence.

## Open loops
- A live UX audit is in progress in the project root: `ux-audit-20260621.md` (Sections A–D done; E/F/G/H pending). The redesign work feeds the lessons.
- The learner now critiques designs first (caught a real error in my mockup — see learning-record 0002). Shift to: show a design → learner critiques → compare → lesson from their critique.
- Records: 0001 (worked-examples method) + 0002 (learner reached applied judgment — milestone).
