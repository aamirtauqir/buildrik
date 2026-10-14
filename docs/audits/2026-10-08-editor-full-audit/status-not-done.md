# NOT-DONE lane — status

Branch `fix/audit-not-done` from main `df60cf9ec`. Lane: the 31 rows waves 4–6 left
NOT-DONE. Each row was triaged as DO (fixed with a test, one commit per ID), REPRO
(reproduced live, then fixed or ruled out), or DECISION (needs a product or design
call; options and a recommended default below, nothing built).

Live checks ran on this worktree's dev server (`localhost:3630`, qa@buildrik.local,
1440×900, `sites.publish` route-aborted before navigating) against throwaway blank
sites, one of them seeded with the editor's Portfolio template markup (the
`importHTMLToActivePage` path a template apply uses). They were deleted afterwards.
For L2-037, `OLLAMA_BASE_URL` pointed at a local mock of the OpenAI-compatible
endpoint (`:3631`), switchable between a valid edit reply and a 500. Screenshots are
in the session scratchpad (`not-done/`), outside the repo.

Status values: FIXED · CANNOT-REPRODUCE · DECISION · WONTFIX-REASON.

## Fixed or ruled out

| ID | Status | Commit | Evidence |
|---|---|---|---|
| L1-009 | FIXED | `37664078d` | **Live repro:** a new blank site opened with `undoStack = [checkpoint "loaded", patch /pages/0/updatedAt]` and Undo enabled. Cause: the page's `updatedAt` arrives as a Date (superjson); `createPatch` treated any Date as changed, so the first change event after load recorded a step. Dates now compare by time (`JsonPatch.date.test.ts`). **After:** stack is only "loaded". The one `sites.saveProject` on first open remains: it is the deliberate DS-migration persist (`useComposerInit.ts:387`, "once; the next load is at the target and skips"), not a phantom edit. Default for that remainder: create sites at the current `dsSchemaVersion` server-side so a new site has nothing to migrate. |
| L1-033 | FIXED (part) | `ef3d690a8` | Added the `add-heading` registry command ("heading" now finds **Add heading**; "Add text" no longer claims the keyword), and the palette's **Reset zoom** row prints ⌘0 once (the registry's chordless copy is folded into it). **Live:** "heading" → `Product Designer` (layer), `Add heading`; "reset zoom" → `Reset zoom ⌘0`. Not changed, by design: "delete" → Permissions (`delete site` keyword, the owner's door to delete, 5905:44701); "Click a command" legend and the lone "Zoom to 50%" VIEW row are board 4418:141220's copy. Insert rows for every catalog element → DECISION below. |
| L2-015 | FIXED | `c34bf7eea` | `syncInstance` keeps each element's id by position (same key as the overrides; a node whose type changed or that the master added gets a fresh id). The old subtree is removed first so its ids are free; a failure rolls the transaction back instead of leaving the instance deleted. `ElementManager.pasteElement` gained a `keepIds` flag used only here. Tests rewritten from "gets a new id" to "keeps every id". **Live:** two instances, edit + Update master → all 14 ids identical before/after, and the second instance received the master change. |
| L2-018 | FIXED | `dcc133d5c` | Unset rows read the rendered value whenever the canvas shows the breakpoint being edited (`activeBreakpoint(composer)`), including in pseudo-states; a device switch re-reads after the sheet re-renders. **Live (h1, own line-height removed):** Tablet and Mobile rows read `90` (canvas: 90px) — previously the type default `1.2`. |
| L2-019 | FIXED | `0850e2874` | The 300 ms trailing debounce became a rate limit: the first write of a burst lands at once, later ones ≤ 50 ms apart, last value always written; history still coalesces the burst into one step (discreteUndo suite unchanged and green). **Live:** typing 28 into Font size → canvas read `28px` at the first sample (30 ms). |
| L2-037 | FIXED | `5358a0b63` | **Live repro with mocked AI:** "Make it more concise" on a site with a full brand token set sent a 16,954-char GET (`scope.tokens` 9.5 KB) and `ai.streamPrompt` answered **431**; the panel said "The AI service didn't respond". `runPromptOnce` now halves the largest recall list until the encoded input fits 7,000 chars (site's own tokens kept longest). **After:** 4,887 chars, 200, mock called, step shows "text: ProductDesigner → Designer · Approve". With the mock at 500 the panel shows the error and `ai.logAdoption` sends `agent.run` with `stepsApplied 0, stepsFailed 1` — a run record the summary excludes from the acceptance rate (`ai-adoption.summary.ts`), pinned on purpose by `useAgentRunner.test.ts` ("Telemetry must see the failure"). Not an adoption; left as is. |
| L2-038 | FIXED | `8ad1841d7` | **Live repro (Tablet):** mousedown 6 px inside the heading's right edge (cursor `grab`, the resize zone is ~4 px), drag 60 px left → heading moved from its section to the page root, index 5. Cause: released over itself, the drop walked up to its own parent, skipped it as "current parent", fell back to root. A drop released over the dragged element (or its subtree) is now no move. **After:** same gesture at 6 and 10 px → parent and index unchanged. The resize path is untouched: before the fix, the same gesture at 1–3 px resized (tablet width override written). |
| L4-030 | CANNOT-REPRODUCE | — | Portfolio "View Work" button (`background:#fff` shorthand only): Fill → Colour reads `fff`, canvas white. Fixed earlier by L2-011 (`useStyleHandlers` drops the type's default `background-color` under an authored shorthand) and `5de463dee`. |

## Decisions (not built)

| ID | Status | Commit | Options · **recommended default** |
|---|---|---|---|
| L1-015 | DECISION | — | Still live (rail pill "Done" on a brand-new site; key `buildrick-onboarding-progress` is global). (a) server onboarding state per user × site, pill and checklist both read it, real events tick it; (b) scope the local key per site only. **Default (a)**; (b) as a stop-gap only if (a) is not scheduled. Needs the per-user vs per-site call. |
| L1-017 | DECISION | — | No board. (a) Image insert stays in Add and selects the new image; the Inspector's existing "Choose image" is the affordance; (b) explicit pick mode with "← Back to Add". **Default (a)** — no panel switch, one less mode. |
| L1-029 | DECISION | — | Still live (Tip 1/4 on first open). **Default:** one tip queue owner, at most one tip per session, shown only when idle (no open popup, no drag), never takes focus; "seen" stored server-side with L1-015's state. |
| L1-033 (rest) | DECISION | — | Insert commands for every element: generate Add rows from `catalog.ts` (searchable only, ~50 rows) vs keep the curated six. **Default:** generate, searchable-only, so the opening list stays the board's. |
| L3-021 | DECISION | — | Conflict banner "theirs": (a) expandable field diff (field · mine · theirs) above Keep mine / Use theirs; (b) "Preview theirs" read-only sheet. **Default (a).** Needs a board. |
| L3-023 | DECISION | — | Re-read: the stepper "✓ Name & Type" and the "Fields for …" title are drawn by 4418:84646 (owner "Figma wins", 2026-09-24), so they stay. "Open affected record" names a record holding data for the field, not a binding — copy, not a bug. Remaining (binding picker shows keys, blank centre with no selection, wrapping empty-state links, Dynamic pages behind "•••") need the G3-067 / G3-072 design pass. **Default:** picker shows `Name · type` with the key muted; centre shows "Pick a collection"; Dynamic pages becomes a visible tab. |
| L4-040 / FG-026 | DECISION | — | One accessibility module. **Default:** new detector kinds in `packages/shared/content/contentIssues.ts` — empty heading, skipped heading level, unnamed button/link, unlabelled form field, missing page title/lang, rendered-colour contrast on text — surfaced under an Issues "Accessibility" category, warnings only (not publish-blocking) for the first release; board 4418:141508 updated to match. |
| L5-026 | DECISION | — | Prerequisite (quota-gated alt text, L5-025) is in. **Default:** Issues › missing alt › "Generate alt text", one undo step per image; schedule as a NEXT item. |
| L5-027 | DECISION | — | **Default:** "✦ Apply with AI" on a located comment runs element scope on its target, then offers Resolve; behind `NEXT_PUBLIC_FEATURE_DS_AI`; after L5-031. |
| L5-031 / L5-032 / L5-033 | DECISION | — | Comment scope. **Default order:** L5-033 first (edit/delete for the author or ADMIN — `comments.update` / `comments.delete` + service + row ⋯, no migration); L5-031 second (`Comment.parentId` migration, `comments.reply`, replies under the pin); L5-032 last (member picker + notification path). |
| FG-004 | DECISION | — | Blocked on FG-001/002 (wave 6 default (a): Review v2 is current). |
| FG-006 | DECISION | — | Client located pins (owner chose C-03). **Default:** same-origin snapshot render with a pin overlay that captures a selector; needs a security review of the snapshot's script surface before build. |
| FG-008 / FG-010 / FG-011 | DECISION | — | All wait on FG-007's container/score decision (wave 6 default (a), drawer with Save). Build in that SEO arc. |
| FG-015h | DECISION | — | **Default:** push results list skipped sites with a per-site "Recapture" (BRP1-M4 `8222:233199`), in the Brand plan's next part. |
| FG-021 | DECISION | — | CMS-conditional visibility. **Default:** start with "hide when the bound field is empty" on collection templates only (engine flag + export evaluator + Inspector row); general conditions later. |
| FG-022 | DECISION | — | Board `7832:194010` folds secondary effects under MORE EFFECTS. Not built: the Figma design-to-code loop (board read + side-by-side) was not run this lane. **Default:** conform to the board (Opacity and Shadow open; Filters, Transform/Motion, Advanced under the expander). |
| FG-041 | DECISION | — | The "09-21 C row" names loading/error rows but no board id was found for them. **Default:** a spinner row while a library component loads and an inline error row with Retry in place of the toast. |
| FG-043 | DECISION | — | Boards `7978:197182` exist; the change is a CMS field-schema extension (`format`, `min`, `max` on date fields in `packages/shared/schemas`) plus publish-time rendering. **Default:** three format presets + optional min/max, stored in the field's `validation`; no migration if it lives in the existing JSON column. |
| FG-044 | DECISION | — | Duplicate of L1-025 (wave 4 default: Start from Scratch opens `/edit/<id>`). |

## Gates

After the merge of `origin/main` (`2e473e5df`):
- editor `tsc` 0 · dashboard `tsc` 0 · `verify:ds` 0 · dashboard DS grep 7/7 · tRPC orphans PASS.
- Full editor vitest: 1348/1350 files; the two failures pass alone (`noChromeTokenWrites` timed out at 120 s under load; `LibraryManager.clone`). Pre-merge full run: 1351/1352, the one failure (`FormAfterSubmitSection`) passes alone.
- Full root vitest: 1520/1520 files, 14,897 tests.
- `test:db` not run: no server or DB behaviour changed (all seven fixes are editor-side).

## Not verified

- AI against a real model: the L2-037 checks used a local mock of the provider.
- L2-019 on a long slider drag on a large page (write cost per 50 ms was not profiled).
- L2-018 "inherited" marker: rows now show the cascaded value; no separate visual marker was added (no board names one).
- L2-038 multi-select drags and drags released over a different element were not re-walked live (unit tests only).
- The publish path (`sites.publish` aborted throughout).
