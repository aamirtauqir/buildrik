# Archived Inspector: prototype-to-Figma execution

21 October 2026. **PARTIALLY VERIFIED, archival design study.**

[Open the study guide](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=331-306). [Play the Source details / return pair](https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id=329-1218&starting-point-node-id=329%3A1218&scaling=scale-down).

Source: `../inspector-2026-10-16/inspector-design.html`, the existing 16 October standalone HTML design specimen. This fixture simulates Inspector state; it has no project engine or persistence. Its controls and shell precede the currently approved design. Importing it does not supersede the later compact-control contract or the approved F1–F5 journeys.

Method: inspected source and computed controls; rendered Chrome headlessly at 1440×900; captured six selected states with Figma's HTML serializer; cloned the editable captures into page `326:1653`, **10 · Archived Inspector skill study**; replaced matching controls with existing component instances; applied matching color/spacing/radius variables and text styles; added native Interaction and DS Drift annotations. No component masters were created or edited.

## States and scope

| State | Final frame | Source evidence |
|---|---|---|
| Inherited 32 px from Tablet | `329:269` | `prototype-inherited.json` / `.png` |
| Invalid -2 draft; committed value stays 32 | `329:584` | `prototype-invalid.json` / `.png` |
| Returned to Heading / Style with -2 draft retained | `329:901` | `prototype-retained-draft.json` / `.png` |
| Enter committed local 40 px | `329:1218` | `prototype-committed.json` / `.png` |
| Source dialog shows Mobile / Normal / 40 px | `330:321239` | `prototype-source-dialog.json` / `.png` |
| Reset after Style rerender returns to inherited 32 | `330:321576` | `prototype-reset.json` / `.png` |

Frames are arranged in two rows at x80/1600/3120, y300/1340. Guide `331:306` is above them at x80/y40. All product captures are 1440×900.

Only `329:1501` Source details → `330:321239` and `330:321574` Back to font size → `329:1218` are native click reactions. Graph structure was checked; presentation playback is not independently verified. Other controls remain editable captured evidence rather than functioning Figma interactions. The guide states this explicitly. Input validation, typed values, selection switching and reset were executed in the source HTML, not reproduced as a complete interactive Figma editor.

## Component and visual reconciliation

199 captured controls were replaced with existing Button, Text input, Select and Tab masters. The six frames contain 211 instances including nested icons. Exact master mappings and created/replaced IDs are in `figma-reconciliation-1.json` and `figma-reconciliation-2.json`. Existing component instances have deliberate source-specific geometry and typography overrides; those differences are annotated.

Visual comparison exposed grid tab placement, a shrinking font input and collapsed button heights. These were corrected using captured source dimensions. All four tabs now sit on one row; each main font input is 253×32. The serializer omitted the selected-canvas outline and dialog backdrop; both were restored from inspected CSS as absolute editable shapes. Source dialog and inherited state were visually compared against browser screenshots. This is not a pixel-difference certification: browser/Figma text rendering, minor line-height spacing, caret shape and flattened top-bar text differ.

Remaining explicit DS differences:

- Source controls use 32 px inputs/selects; current component masters use 28 px. Source sizes are retained as instance overrides.
- Source shell uses 60 px rail, 340 px sidebar and 40 px canvas toolbar; current semantic dimensions differ.
- No exact published text styles exist for several captured 10/11/32 px text roles. Their original typography remains, with native drift notes; matching 12/14 px styles are applied.
- Source-specific information dialog is an editable captured container. Existing ModalGuard has a different content structure; the dialog's button uses the shared Button component.
- The 13 px browser checkbox is laboratory instrumentation, not proposed product UI; no matching lab-control component exists.
- No Code Connect mappings were found. None were fabricated.

The old specimen only reveals Remove override after the Style panel rerenders following commit. The reset capture includes that real intermediate source step; it does not claim a direct reset action exists on frame 04. This behavior is recorded as a source limitation rather than silently changed.

The original six raw capture roots (`321:3`, `323:3`, `324:3`, `325:3`, `327:3`, `328:3`) were temporary layout references and have now been removed. The exact cleanup ledger is `figma-raw-capture-cleanup.json`. The current approved page `3:10` and its hub `302:3370` were not edited. See [final scoped review](FINAL-REVIEW.md).


## Playback follow-up — 21 October 2026

The archived Source details/Back loop was played in Chromium and returned to the same 40px Mobile override. See [browser verification](BROWSER-PLAYBACK.md) and its two screenshots. This supersedes the earlier unverified-presentation statement only for these two transitions; other archived captures remain static. Desktop, keyboard and service behavior remain unverified.
