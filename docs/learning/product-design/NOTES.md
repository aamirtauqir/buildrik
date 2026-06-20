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
- L3 (next): rated list → fix sequence + the "two findings = one root cause" trap (de-dup before sequencing).
- Later: consistency/IA coherence ("features have no relation"), the anti-AI-slop checklist (density, hierarchy, decoration).

## Open loops
- L2 assignment out: run "expected result in one line" on 3 controls of one panel → 3 rated findings → drives L3.
- Learning record written (0001) — the teaching METHOD for this learner: worked examples on the real app, not homework-gated lessons (drive-don't-quiz).
