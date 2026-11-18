# Figma prototype audit — Resources

Ranked by trust. Method from NN/g; Figma mechanics from Figma's own help
center; the file's own verified behaviour outranks both where they conflict.

## Knowledge

- [Article: "Evaluate Interface Learnability with Cognitive Walkthroughs" — NN/g](https://www.nngroup.com/articles/cognitive-walkthroughs/)
  The 4 questions per step, persona + task + action sequence prep, Pass/Fail
  recording. Use for: every flow audit (Lesson 01).
- [Article: "How to Conduct a Cognitive Walkthrough Workshop" — NN/g](https://www.nngroup.com/articles/cognitive-walkthrough-workshop/)
  Running it with a team, recorder role, summarising failure stories. Use for:
  when a designer/dev joins the audit.
- [Article: "10 Usability Heuristics for User Interface Design" — NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/)
  The vocabulary for naming WHY a step fails (visibility of status, recognition
  vs recall, user control…). Use for: the "Fix" column of the issue table.
- [Help: "Play your prototypes" — Figma](https://help.figma.com/hc/en-us/articles/360040318013-Play-your-prototypes)
  Presentation view, "Show hints on click" (blue box on clickable areas), R to
  restart, Hide UI (`&hide-ui=1`). Use for: the "does it work?" lens.
- [Help: "Create and manage prototype flows" — Figma](https://help.figma.com/hc/en-us/articles/360039823894-Create-and-manage-prototype-flows)
  Flow starting points, naming flows, flow descriptions as test prompts. Use
  for: turning a job into a named flow before auditing it.
- Repo: `packages/editor/docs/plans/2026-09-14-editor-v3-ia.md` §0, §6
  Evidence-backed root causes found in this file and the verified playback
  rules (Close-first abort, SWAP only from overlays). Use for: known traps.

## Wisdom (Communities)

- [Figma Community Forum — Prototyping](https://forum.figma.com/)
  Maintainer-answered; good for "is this prototype behaviour a bug or by
  design". Use for: playback oddities you cannot explain from the docs.
- [r/UXDesign](https://reddit.com/r/UXDesign)
  Practitioner critique of walkthrough findings and issue-ranking calls. Use
  for: sanity-checking a P0 before you spend a sprint on it.

## Gaps
- No trusted source yet on auditing variable-driven (conditional) Figma
  prototypes at scale; this file's own scanner scripts are the only reference.
