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
- **TOPBAR BUILD COMPLETE** (`bda5fddd`, 2026-06-21): real editor topbar now matches `topbar-final.html` — 3 labelled zones (Navigate · View · Status+Ship), breadcrumb removed from topbar, Ask AI icon, Preview + Publish(/Export/Send-for-review) hero, and a ⋯ overflow holding Invite/⌘K/Preview-as-client/Help/Account (handlers untouched). CSS grid → `auto 1fr auto` + `.bd-topbar__zone` rules. All 4 rungs verified live (tsc, shell tests, design match, ⋯ opens + Command-palette fires). Dev diffs vs the mock: no presence (collab gated), "Export" not "Publish" (VITE_FEATURE_PUBLISH=false locally). Follow-up: the breadcrumb's bottom-bar home (StudioFooter) is a separate surface; status/publish state styles already exist (bd-topbar__status--saving/warn/error).
- L9 / earlier slice 1 (`a10bd63c`): Ask AI labelled Button → IconButton (constitution #5). **All 4 rungs ✓** — tsc, shell tests, icon renders (32px icon-only, DOM + screenshot), and click opens the AI bar (`✨ Content|Layout Write a headline…` appears bottom-center). Verified live 2026-06-21 after the browser extension recovered + a fresh saqib magic-link re-auth (dev server had died again → restarted). Next: slice 2 = 3-zone grid regroup + ⋯ overflow (Invite/⌘K/Help/Account) + Preview-as-client dropdown; slice 3 = wire status/publish states. Topbar.tsx uses a CSS-grid `VibcoderTopbar`; the 3-zone regroup touches that grid CSS too. (Publish button is feature-flagged off in dev — VITE_FEATURE_PUBLISH=false — so it won't show locally.)
- **Honesty win to reinforce:** held the line — did NOT claim "done/100%" with rungs 3–4 unrun. "Safe ≠ verified." Good teaching moment (definition-of-done in practice).

## Course structure now
- **Constitution** (`reference/buildrik-design-principles.html`, 13 principles) = the spine. **States checklist** (`reference/states-checklist.html`) = the completeness companion. Lessons 1–7 build to these. Method = principle-driven design; deliverable per surface = a complete prototype (all states) built via the 5-step loop.

## Mission status
- **MISSION UPDATED 2026-06-21** (learning-record 0004): now "become a pro product builder & designer (vibcoder)" — user research + measurement + prioritisation moved INTO scope (the "pro frontier"). Capstone L9 (`lessons/0009-becoming-a-pro.html`) + roadmap (`reference/the-path.html`) written. Confirm wording with the learner if they push back; otherwise proceed.
- **L10 / NEXT (highest leverage):** run the learner's FIRST 5-user usability test on the core job ("an agency operator publishes a client's site") — script the task, pick 5 watchers, observe silently, turn stumbles into rated findings. This activates Habit 2 (research), the biggest lever. Steve Krug "Rocket Surgery Made Easy" is the method.
- Course now: 9 lessons + 6 references (constitution, states-checklist, definition-of-done, heuristics-cheatsheet, the-path) + 4 learning records.

## Product facts surfaced (for honesty in lessons)
- Real-time collaboration is DEMO-ONLY / not shippable (6 P1 distributed-systems bugs, prior codex review 2026-06-12). Do not promote it to prime UI. Design the presence spot but gate the feature.

## Open loops
- A live UX audit is in progress in the project root: `ux-audit-20260621.md` (Sections A–D done; E/F/G/H pending). The redesign work feeds the lessons.
- The learner now critiques designs first (caught a real error in my mockup — see learning-record 0002). Shift to: show a design → learner critiques → compare → lesson from their critique.
- Records: 0001 (worked-examples method) + 0002 (learner reached applied judgment — milestone).
