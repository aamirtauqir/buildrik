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
- L4 (done): "From design to build — the handoff." The 4-part spec (WHAT / WHERE / DON'T-BREAK / DONE) + the loop (inventory → decide → handoff → build → next). Driven by the learner's own workflow question ("design each thing then build — what do I tell the coder?"). `lessons/0004-design-to-build-handoff.html`. Real artifact produced: `docs/reviews/audit-mockups/topbar-build-spec.md`.
- L5 (done): "The topbar is a bouncer — default no." The earns-its-way-in test (ready? · global? · always/at-a-glance?) + subtraction > addition. Driven by the learner asking "what else can we add to the topbar?" (collaboration). Taught the inverse instinct + flagged collab is demo-only (don't promote a broken feature). `lessons/0005-the-topbar-is-a-bouncer.html`.
- L6 (done): "Name it, write it down" — design principles vs taste; the upgrade = one shared page; why a shared rule-set is what makes a whole product consistent. Driven by the learner's meta-question (name it / improve it / scale it). `lessons/0006-name-it-write-it-down.html`.
- **KEY ARTIFACT born:** `reference/buildrik-design-principles.html` — the **Buildrik Design Constitution** (12 numbered principles from L1–L5, each with rule + use + test). This is now the course spine + the SSOT every decision/builder cites. Living doc — revise with the learner.
- L7 (done): "Design every state" — the happy path is ~10%; design empty/loading/error/edge + app states. Plus the system hierarchy (Principles → Patterns → Components → Tokens) — situational rules are PATTERNS, not new principles. Driven by the learner's two observations (we didn't design all states / 12 won't be enough, rules are situational). `lessons/0007-design-every-state.html`.
- Constitution grew: added **#13 Design every state** + a "Principles vs Patterns" note. New reference: `reference/states-checklist.html` (full state list + 3-question completeness test).
- L8 (done): "Build without breaking" — re-lay-out not re-wire (presentation ≠ logic; "move the boxes, keep the wires") + the 5-rung verification ladder (types → tests → walk states → click actions → acceptance). Driven by the learner's 3 build questions (how to implement / without breaking logic / how to know it's 100% right). `lessons/0008-build-without-breaking.html`. New reference: `reference/definition-of-done.html`.
- Topbar design is now COMPLETE: resting + spec + all 9 states (`docs/reviews/audit-mockups/topbar-states.html`). Ready to build.
- L9 / BUILD IN PROGRESS: topbar build, sliced (re-layout not re-wire). **Slice 1 DONE** (`a10bd63c`): Ask AI labelled Button → IconButton (constitution #5). Rungs 1–2 (tsc + shell tests) ✓; **rungs 3–4 (browser walk + click) PENDING** — Chrome automation was malfunctioning (nav not applying, screenshots timing out), NOT a code issue. Finish rungs 3–4 next session (confirm icon renders + Ask AI still opens). Then slice 2 = 3-zone grid regroup + ⋯ overflow (Invite/⌘K/Help/Account) + Preview-as-client dropdown; slice 3 = wire the status/publish states. Topbar.tsx uses a CSS-grid `VibcoderTopbar`; the 3-zone regroup touches that grid CSS too.
- **Honesty win to reinforce:** held the line — did NOT claim "done/100%" with rungs 3–4 unrun. "Safe ≠ verified." Good teaching moment (definition-of-done in practice).

## Course structure now
- **Constitution** (`reference/buildrik-design-principles.html`, 13 principles) = the spine. **States checklist** (`reference/states-checklist.html`) = the completeness companion. Lessons 1–7 build to these. Method = principle-driven design; deliverable per surface = a complete prototype (all states) built via the 5-step loop.

## Mission status
- Mission has likely SHARPENED (learning-record 0003): "learn product design to fix incoherence" → "build + apply a living design language (the constitution) to make the whole editor coherent." **Confirm with the learner before editing MISSION.md.**

## Product facts surfaced (for honesty in lessons)
- Real-time collaboration is DEMO-ONLY / not shippable (6 P1 distributed-systems bugs, prior codex review 2026-06-12). Do not promote it to prime UI. Design the presence spot but gate the feature.

## Open loops
- A live UX audit is in progress in the project root: `ux-audit-20260621.md` (Sections A–D done; E/F/G/H pending). The redesign work feeds the lessons.
- The learner now critiques designs first (caught a real error in my mockup — see learning-record 0002). Shift to: show a design → learner critiques → compare → lesson from their critique.
- Records: 0001 (worked-examples method) + 0002 (learner reached applied judgment — milestone).
