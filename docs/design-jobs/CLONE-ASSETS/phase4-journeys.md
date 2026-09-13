# Assets · Clone Phase 4 — Typed video and SVG insertion — walk log

Source: section `3724:43814` "Media QA · Typed video and SVG insertion" (4 canvas
screens + a QA reference). Graph: `reactions-p4` (in the session scratch — the
four frames carry one edge each: `Manage selected Video` → 3696:20326 /
3696:21142, `Manage selected SVG image` → 3696:20734 / 3696:21346). Shots:
`shots/3724-*.png`. Figma calls this phase: 1 graph + 4 shots (≈129 today).

Done inline (no agents — one component, one flag, one mapping).

## Live env

Same as Phase 3 (`phase3-journeys.md` § Live env).

## Drift table

| screen | verdict | note |
|---|---|---|
| 3724:43815 New Video inserted · chef-intro.mp4 | drift-fixed | Insert with nothing selected → Video element, selected; inspector opens with `Video source · chef-intro.mp4 · [Manage video]` above SIZE (new `MediaSourceRow`; the source used to sit inside Element Properties as `Image URL · Browse`); Manage video → the library with chef-intro.mp4 selected (engine media selection + `ui:switch-tab {tab:"assets", fullPage:true}`); live-3724-43815 |
| 3724:44077 New Video inserted · grand-opening.mp4 | drift-fixed | with the Video selected, Insert of grand-opening.mp4 replaces its source (same element id, row reads grand-opening.mp4) — the QA's "chef → grand-opening" round trip; live-3724-44077 |
| 3724:44339 New SVG image inserted · logo-mark.svg | drift-fixed | svg element inserted; `SVG image source · logo-mark.svg · [Manage SVG]` → library selected; live-3724-44339 |
| 3724:44601 New SVG image inserted · star-icon.svg | drift-fixed | with the SVG selected, Insert of star-icon.svg swaps its source (typed replacement extended from video to svg); live-3724-44601 |
| 3721:45178 (Phase 3) Image | match now | `Image source · <file> · [Choose image]` → picker → applied, row updates; the P3 walk had left the source inside Element Properties |
| 3724:44922 QA · Typed asset routes | out-of-scope | reference text |

## Notes

- **Not conformed (recorded on the rows):** layer names `New Video · Home` / `New SVG image · Home` — custom layer names live in the Layers panel's own map (localStorage per page), not the engine; the topbar breadcrumb (Topbar family); the canvas placeholder copy (`sample poster · playback not simulated`) is the prototype's stand-in — a real `<video>` renders.
- Tests: `MediaSourceRow.test.tsx` (5), `useMediaState.localOnlyInsert` (+1 typed-replacement case); inspector + shell + media hooks suites green (181 files / 1606 tests); `tsc --noEmit` clean; `verify:ds` exit 0.
