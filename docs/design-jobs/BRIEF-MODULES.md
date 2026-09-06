# Module audit — the editor as one connected product

You are auditing ONE module of the Buildrik editor. The point of this pass is not
screens — an earlier wave covered those (`findings/W-*.jsonl`, 538 findings) and
the shell (`findings/SHELL-*.jsonl`, 115). **This pass is about RELATIONSHIPS**:
what each module owns, what it emits, who listens, and what should happen next
that currently does not.

## Facts already measured — do not spend effort rediscovering these

The editor's cross-module wiring is the composer event bus. Measured across 891
source files (`findings/EVENT-GRAPH.json` has the full data):

| | |
|---|---|
| events declared in `shared/constants/events.ts` | **304** |
| named anywhere in `src/` | 222 |
| **declared but never named anywhere** | **82** (incl. 16 `AI_*` and the `ASSET_*` set) |
| **emitted, no listener, and named in only the emitting module** | **125** |
| fully isolated modules (emit and receive nothing across module lines) | **6** — collaboration, drag, fonts, forms, interactions, templates |

Two cautions learned building that map, which apply to your own greps:

1. **Optional chaining hides emits.** `composer?.emit?.(EVENTS.X)` is not matched
   by a `.emit(` pattern. It cost me a false "no emitter" on
   `BRAND_DIRTY_CHANGED`, which is emitted at `DesignSystemTab.tsx:371`.
2. **Indirect emits hide too.** `StudioFooter.tsx:249` fires
   `emitZoom(EVENTS.ZOOM_SELECTION)` through a curried helper. A regex on the
   call site finds nothing. **Search for the CONSTANT, not the call.**

## Your eight questions

For your module, answer all eight — briefly, with citations:

1. **What it does** — in one sentence, in the user's words.
2. **Entities it owns** — the data it creates or mutates, and where that data
   LIVES (engine memory · IndexedDB · project snapshot · server). Name the type.
3. **Fields and actions** — what a user can set, and what verbs exist.
4. **Who depends on it** — modules that read its data or listen to its events.
5. **What it depends on** — modules whose data or events it needs.
6. **What should trigger another module and does not** — the heart of this pass.
   For each event your module emits with no listener, say what SHOULD react and
   what the user loses because nothing does.
7. **Missing screens/states** — cite `findings/W-*.jsonl` where it is already
   filed rather than re-filing; add only what that pass missed.
8. **UI/UX issues** — only ones that are about this module's own surface.

## Persistence is the sharpest question

For every entity your module owns, establish **whether it survives a reload**,
and say so explicitly. The known shapes:
- `ProjectData` (`shared/types/project.ts:30`) carries pages, styles, assets,
  metadata, settings — and **nothing else**. An entity not in there and not
  separately synced does not survive.
- CMS mirrors to IndexedDB and to the server (`services/cmsSync.ts`).
- Components, templates and versions have their own sync services.
- `exportProject()` hardcodes `assets: []` (`Composer.ts:608`).

## Rules

- **READ-ONLY.** No source edits, no Figma writes. The coordinator executes.
- **Cite `file.ts:line` for every claim.** A claim without one is a guess.
- Do not run the app.
- **Never stage or edit `AquibraStudio.tsx`** — it is mid-edit in the founder's tree.
- Figma is rate-limited and shared; this pass is mostly CODE, so prefer source.
  If you do read Figma, batch it, and mark anything unfetched "not checked".

## Output — YOUR OWN FILE

Write `docs/design-jobs/findings/MOD-<letter>.jsonl`. Do not append to a shared
file: five agents did that earlier and one whole-file write destroyed 86 of 111
rows.

```json
{"id":"MOD-A-01","module":"cms","kind":"isolated|missing-trigger|data-flow|entity|missing-state|ui",
 "severity":"Critical|Major|Minor","finding":"one sentence",
 "evidence":"file.ts:line + the value you read","fix":"concrete",
 "chain":"Module -> Entity -> Action -> Trigger -> Connected Module -> Result"}
```

The `chain` field is required on every `missing-trigger` row — it is what the
dependency map is built from.

Then reply with: your module's eight answers in brief, your three most important
findings, and anything you could not verify.
