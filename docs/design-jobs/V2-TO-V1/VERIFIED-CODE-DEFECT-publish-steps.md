# Verified live defect — the publish pipeline's step list renders blank

Found while cross-checking a Figma board's claim against the code, 2026-09-07.
Board `817:5220` (`S6.4 · deploy-progress-pipeline`) asserts one mismatch. There
are **three**, and the board states only the first.

## What the worker emits

`packages/dashboard/app/api/workers/publish/[jobId]/route.ts`, `buildSteps()`:

| step position | status emitted |
|---|---|
| the current step | `"active"` (or `"failed"`) |
| steps after it | `"pending"` |
| steps before it | `"done"`, or `"skipped"` for indices in `SKIPPED_STEPS` (1 = Optimizing images, 4 = Performance check) |

## What the editor looks for

`packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx`

1. **`:251`** — `steps.findIndex((s) => s.status === "running")`. The worker never
   emits `running`. `runningStep` is therefore always `null`, and the meta line
   at `:527` — `"<name> · step N of M"` — never renders. It silently falls back
   to the percentage. This is the mismatch the board names.
2. **`STEP_WORD` (`:862`)** maps `pending | running | done | failed`. It has no
   `active` key, so the step actually in flight renders with **no word at all**.
3. **`STEP_WORD` has no `skipped` key either.** The worker goes out of its way
   to emit `skipped` rather than `done` — its own comment says "a green
   checkmark for work that didn't happen is a false signal" — and the editor
   then renders that step as blank. The guard works and its payload is dropped.

`grep '"active"'` across the publish tab returns nothing: no editor file
anticipates the status the worker actually sends.

## Why it went unseen

Both sides are internally consistent and separately tested. The vocabulary is
shared only by convention — no shared type, no shared constant. This is the same
shape as the Stripe payload drift recorded in the root `CLAUDE.md`: hand-built
test fixtures agree with the code that builds them and prove nothing about the
producer.

## Status

**Not fixed.** This arc's scope is the Figma page, not product code, and a
three-line vocabulary change to a publish path deserves its own review. The
board amendment (statements 2 and 3, which board `817:5220` does not carry) is
queued as a Figma edit.

The durable fix is a shared step-status union exported once and imported by both
the worker and the tab, so the next divergence is a type error rather than a
blank line.
