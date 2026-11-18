# Editor v3 · IA prototype verification
Date: 2026-09-26
Status: **FOUR FIXES APPLIED — focused playback verified; whole-prototype completion is not established.**

Follow-up: the user authorized applying the findings. See [applied fixes and verification](fixes/README.md). The finding descriptions below preserve the original audit observations.

## Result

The updated task launcher works: **22/22 entry links reached the expected screen in actual Figma playback**. Focused checks also passed for selecting a visibility condition, AI page review/apply/undo/Done, and Brand AI generate/review/add-styles.

The initial audit found four gaps: incorrect submission identity in delete confirmation, an inconsistent Escape return, loss of the AI-applied heading when selected, and nine state boards without any incoming prototype action or flow start. These four findings have now been addressed in Figma and checked in focused playback.

This is a Figma prototype assessment and follow-up repair. It does not establish application/backend functionality. The initial audit was read-only; the authorized follow-up changed Figma interactions and state bindings. Application source was not changed by this task.

## Source and method

- File: [Buildrick — Product](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=4418-45431).
- Page: `4418:45431`, Editor v3 · IA.
- Entry: [Updated functional ownership prototype](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?page-id=4418%3A45431&node-id=7901-196729&starting-point-node-id=7901%3A196729&scaling=contain).
- Structural scan: 1,195 non-archive/reference/library/proposed frame roots, 207,379 descendant nodes, 30,637 NODE actions from visible sources. Every referenced destination was resolved; **zero missing destination IDs**.
- Follow-up entry scan: **287,187 nodes across the entire page**, including hidden and reference/archive areas, checked for incoming actions into selected recovery/limit states.
- Conditional actions were expanded structurally; this does not prove a branch is achievable with runtime variable values.
- Playback: installed Chromium headless shell 1228, viewport 1440×1000. Figma rendered 1440×900 boards at 1344×840 with origin (48,80). Browser screenshots show the actual prototype.
- Restart used Figma's R shortcut. Five entry checks were retried after allowing restart to settle; all then reached the intended node. Those initial timing misses are not product defects.

## Confirmed findings

### P1 · F-01 · Contact/Catering deletion targets Reservation's confirmation

**Steps:** updated task launcher → Forms → Delete on the Contact submission.

**Observed:** the confirmation says it will delete the **Reservation** submission. All three Delete actions (`7889:196332`, `7889:196340`, `7889:196348`) navigate to `4418:131840` without setting a selected-submission variable. Its confirmation copy is hardcoded to the first row.

**Expected:** the confirmation and outcome identify the clicked submission. A single sample confirmation is insufficient when multiple independently actionable rows are displayed.

**Evidence:** [Forms inbox](02-forms.png), [Contact Delete showing Reservation confirmation](03-forms-contact-delete.png), [exact reactions](focused-reactions.json).

**Fix target:** use selected-record variables for identity and outcome, or separate correctly named confirmation/outcome boards for each sample row. Recheck all three rows and both success/failure outcomes.

### P2 · F-02 · Escape leaves the delete dialog for Settings

**Steps:** Forms → Delete → press Escape.

**Observed:** navigates to `4418:128507`, the Settings “Visitors / Form settings” screen. Clicking Cancel instead correctly returns to Forms submissions `7889:196284`.

**Expected:** Escape and Cancel dismiss the same pending operation and return to the submissions inbox.

**Evidence:** [Cancel returns to Forms](04-forms-cancel.png), [Escape opens Settings](05-forms-escape.png). The confirmation frame's key reaction directly names `4418:128507`.

**Fix target:** align the confirmation frame's Escape destination with Cancel and verify it from every submission.

### P2 · F-03 · Selecting the AI-edited heading restores the old text

**Steps:** launcher → AI assistant → Plan changes → Apply changes → Done → click the edited heading.

**Observed:** the applied result and Done canvas display “Wood-fired, five minutes from home”. Clicking that heading navigates from `7906:196898` to `4418:107674`, which displays the original “Wood-fired pizza, five minutes from home”. No Undo was invoked between Done and selecting the heading in this reproduction.

**Expected:** selection changes the Inspector/selection state while preserving the applied draft text.

**Evidence:** [Applied result](09-ai-page-applied.png), [Done canvas with edited heading](11-ai-done-canvas.png), [selecting heading restores old copy](12-ai-heading-selected.png). The text node `7906:196916` has a direct navigation action to the old selection board.

**Fix target:** preserve draft state across selection/page navigation through shared variables or matching applied-draft state boards. Retest the page and site variants.

### P2 · F-04 · Nine designed states have no prototype entry

The all-page scan found **no incoming NODE action at all**, including conditional branches, hidden nodes and archived/reference areas, for the following nine boards. None is a registered flow start.

| State | Node |
|---|---|
| AI assistant · Page · unlimited | `7851:194888` |
| AI assistant · Page · daily limit reached | `7851:194982` |
| Add · Generate a block · unlimited | `7851:195076` |
| Add · Generate a block · daily limit reached | `7851:195167` |
| Media · Loading | `6289:147175` |
| Media · Empty | `6289:147437` |
| Media · Permission | `6289:148485` |
| Activity · Loading | `6278:147177` |
| Activity · Error | `6278:147511` |

**Impact:** reviewers cannot reach these designed scenarios through the prototype's links. Opening their node URLs manually does not establish a complete scenario journey.

**Evidence:** [all-page incoming-action audit](recovery-entry-audit.json). The same scan found seven links to Issues “Scan failed”, all currently hidden. That is a follow-up concern, not included in the nine confirmed missing-entry boards because conditional visibility requires separate testing.

**Fix target:** provide visible named scenario entries in the recovery/state launcher or wire the states into their intended conditional journeys, with appropriate retry/back paths.

## Playback coverage

The [entry results](module-entry-results.json) record all 22 launcher destinations and screenshot filenames. Entries covered Add, Layers, Pages, Templates, Components, Inspector, Assets, Full Media, CMS, Brand, Forms, Settings, global AI, Review, Issues, History, Activity, Publish, selected-element AI, AI block generation, visibility and published versions.

| Focused journey | Result | Evidence |
|---|---|---|
| Forms inbox opens | PASS | `02-forms.png` |
| Contact Delete identifies the clicked row | FAIL F-01 | `03-forms-contact-delete.png` |
| Forms delete Cancel → inbox | PASS | `04-forms-cancel.png` |
| Forms delete Escape → inbox | FAIL F-02 | `05-forms-escape.png` |
| Visibility menu → During happy hour → updated field | PASS | `06-visibility-menu.png`, `07-visibility-selected.png` |
| AI page → Review plan → Apply | PASS | `08-ai-page-review.png`, `09-ai-page-applied.png` |
| AI Undo all → review with original text | PASS | `10-ai-undo.png` |
| AI Apply → Done → edited canvas | PASS | `11-ai-done-canvas.png` |
| Edited canvas → select heading preserves text | FAIL F-03 | `12-ai-heading-selected.png` |
| Brand shared styles → Generate → Review → Add styles | PASS | `13-brand-ai-generate.png`, `14-brand-ai-review.png`, `15-brand-ai-added.png` |

## Limits and next verification

A valid destination ID is not a working-flow guarantee. The initial structural scan excludes archive/reference/library/proposed roots and does not model all clipping, conditional visibility, variable values, overlay stacks, or component-variant runtime behavior. Its broad reachability candidates were not promoted to confirmed defects without follow-up.

Every action/state combination on the roughly thousand live-labelled boards was **not** individually played. Site-wide AI, every destructive success/failure branch, each permission role, every recovery path and all overlay/keyboard permutations still require their own complete regression walk. The observed failures are already sufficient to reject a “100% complete” claim.

Repair F-01 through F-04, rerun their exact reproductions, then complete the remaining state/branch walk. Keep graph coverage and playback coverage separate.

## Evidence files

- `module-entry-results.json`: expected and observed entry destinations.
- `focused-reactions.json`: exact focused node actions and visible labels.
- `recovery-entry-audit.json`: full-page targeted incoming-edge check.
- `figma-graph-audit.js`: original read-only structural audit script.
- `graph-initial-raw.txt`: initial tool output, **truncated by Figma's 20 KB return cap**; the summary at its start is intact, but it must not be parsed as complete JSON.
- PNGs: actual browser playback screenshots. `hub-01-add.png` captured an early loading screen and is not a passing test; `hub-01.png` is the successful check.
