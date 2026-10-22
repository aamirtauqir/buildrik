# Design 2L9 — local dump

Canonical design: Figma `2L9OTGzBrL6kYmU18yA1c7` (owner decision 2026-10-22). Produced by `scripts/design-2l9/dump.mjs` on 2026-10-22; 95 Figma calls (`use_figma`). Only nodes visible through their whole ancestor chain are recorded, so hidden `Legacy ·` shells are absent.

| Page | Id | Frames | Expected (flow-audit, 2026-10-22) | Note |
|---|---|---|---|---|
| 03 · Editor | `3:4` | 363 | 360 | +3 = the three `Shell/PageSwitcherMenu` overlays added after the count (558:448976, 558:449032, 558:449088) |
| 04 · Inspector | `3:5` | 313 | 313 | match |
| 05 · Resources | `3:6` | 562 | 562 | match |
| 06 · Site delivery | `3:7` | 688 | 687 | +1 = Publish note 558:418334 added after the count |
| 07 · Recovery and access | `3:8` | 94 | 94 | match |
| 09 · Play journeys | `3:10` | 236 | 236 | match |
| ✦ Improved — 2026-10-22 | `497:99417` | 18 | — |  |

Format: `{fileKey, pageId, count, scrubbed, D, rows}`; each row is `{id, name, w, h, texts[], instances[], boxes[]}` with `texts`/`instances` as indexes into `D`. Shell chrome texts are one joined string per `Shell/*` child. Read with `decode()` from `scripts/design-2l9/dump.mjs`.

Re-run after the owner's Legacy cleanup (~2026-10-29): delete `.cursor.json`, run the dump, commit the diff. Frame counts must not change.

Live comparison: seeded QA site id — record here when Task 0.0 Step 3 is first run by a lane.

## Regression-net status (2026-10-23)

All 17 pins in `e2e/visual-pins.spec.ts` FAIL on `main` itself (diff ratio 0.01–0.09,
baselines last updated 2026-09-24). The largest diffs are real layout changes, not
font noise (e.g. `media-drawer-grid`: the asset grid now renders full width). They are
not caused by design-2l9 work and are not re-baselined blind: each needs a look at the
diff to decide "intended change → re-baseline" or "regression → fix". Until then, new
design-2l9 pins are judged on their own and the old 17 are tracked here.
