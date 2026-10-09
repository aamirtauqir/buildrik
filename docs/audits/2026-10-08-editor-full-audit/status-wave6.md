# Wave 6 status — L5 Medium + Low, and the FG code items

Branch `fix/editor-audit-wave6` from main `e8df3945b`. Lane: every L5 Medium and Low
row, every FG row (all severities). FG rows that are Figma-only are recorded here and
left for the design lane: this lane made no Figma writes.

Live checks ran against this worktree's dev server (`localhost:3580`, qa@buildrik.local,
1440×900, `sites.publish` route-aborted) on two throwaway sites, a blank one and one
from the Local Business template. Both were deleted afterwards. Screenshots are in the
session scratchpad (`wave6/`), outside the repo.

**AI.** Ollama is not running in dev (`:11434` answers nothing), so no AI call was made
live. The AI fixes are checked by unit tests with mocked providers. The live checks
covered only the non-model parts: the field prefill, the quota request count, copy and
tooltips.

Status values: FIXED · ALREADY-FIXED · DECISION · WONTFIX-REASON · NOT-DONE.

## After merging main (`35d3b9883`, merge `3d8a57ac1`)

The live checks were re-run on fresh throwaway sites (load ~6; both deleted
afterwards). All results held:
- L5-014 prefill; L5-024: 1 quota request.
- L5-060 block and re-enable; L5-073 no toast left; L5-071 no banner; L5-078 notice in both tabs.
- L5-051: page menu and `/contact` link.
- L5-040/042/043/044/045: history.
- L5-034/035: review copy. L5-034's banner reads "1 open" once a comment exists.
- L5-019 tooltip; L5-011 copy; FG-017 clean. L5-077 also passed (see its row).

L5-050 still reproduces: preview rgb(0,0,0) with no font link; canvas rgb(51,65,85) in Inter.

Three rows were fixed by main too; at the merge, main's version was kept and wave 6's
duplicate was dropped: L5-073, L5-076, FG-027.

## L5 — Medium

| ID | Status | Commit | Evidence |
|---|---|---|---|
| L5-005 | ALREADY-FIXED | `3915996bd` | `useAgentRunner.ts` marks a step `nochange` when the edit has no rows or records no history entry (`undo` null). Undo all uses only the run's own handles. |
| L5-006 | ALREADY-FIXED | `675830d02` | `runPromptOnce` takes an `AbortSignal` and unsubscribes on abort. `stop()` and `reset()` call `abortRef.current?.abort()`. |
| L5-008 | ALREADY-FIXED | `0764e514c` | `GenerateBlockScreen` sends `activePageElements`, with the root and its top-level sections first so the 200 cap cannot drop the target. |
| L5-009 | FIXED | `1d9c746c7` | A reply with no rows now shows "Nothing to insert." with Try again, instead of the timeout card. Covered by a unit test. |
| L5-010 | FIXED | `f8d04bf5b` | `gatherTokens` reads the saved tokens merged over the seed (`mergeProjectTokens`), with the site's own tokens first so the 120 cap never drops them. Unit test: a site with no saved tokens now sends the seed tokens, not 0. |
| L5-011 | FIXED (decision default) | `6abfebff5` | The idle copy no longer promises a review step. It now reads "The block goes straight onto the page, and one Undo takes it back…". **Live:** the copy is on screen. See the memo for the Approve-gate option. |
| L5-016 | DECISION | — | One-click rewrite actions are not built. See the memo. |
| L5-017 | FIXED | `3adb54050` | The prompt now carries the site name, page name, description, and the page's first heading and body text, with no "headline" template wrapper. Unit test. No live OpenAI call. |
| L5-019 | FIXED | `c339df0e6` | **Live:** the tooltip reads "Coming soon: AI component styles aren't available yet". The result still has no destination (`onAccept`), which must be built before the flag is turned on. |
| L5-021 | FIXED | `0836dc9ce` (+ `cbd25db61`) | The summary prompt now counts `other` changes and carries the comparison direction ("Current draft → v1"). The rows name elements, not ids. Server unit test with a mocked OpenAI client. |
| L5-025 | ALREADY-FIXED | `6883950e8` | Alt text reserves an AI unit (`alt-text.service.ts:175`) and the router rate-limits it (`media.ts` `alt-text:` bucket). Auto-run on upload is unchanged; it is now quota-gated. |
| L5-031 | NOT-DONE | — | Threaded replies need `Comment.parentId` (a migration), `comments.reply`, and a reply UI under the pin. That is feature scope, not a fix. |
| L5-034 | FIXED | `69f28edb3` | **Live:** an internal round now reads "Internal round — no client invited" and "0 open · 0 resolved · Internal round". The topbar pill ("Waiting ›") and the publish confirm are not changed: the status read has no invited-email field. |
| L5-040 | FIXED | `20e3920a7` | Compare with current now uses the new `compareWithDraft`. **Live:** after saving a version and adding a Text, the compare shows "− Text “Lorem ipsum…”". |
| L5-042 | FIXED | `cbd25db61` | **Live:** compare row "− Text “Lorem ipsum dolor sit amet…”" and Session row "+ Text". No ids appear, and `updatedAt` is dropped. |
| L5-043 | FIXED | `3de7b10f9` | `importProject` points the selection at the restored elements by id, or clears it when they are gone. **Live:** a Text was selected, then restored away: "Nothing selected". |
| L5-044 | FIXED | `3248bee81` | The Saves panel keeps a "Restored to … · Undo restore · Dismiss" notice. **Live:** the notice was still there after 20 s. Restore still resets the undo stack (it goes through `importProject`). |
| L5-050 | DECISION | — | **Live, re-measured:** preview text is rgb(0,0,0) with no font link loaded, and the canvas is rgb(51,65,85) in Inter. Cause: the export emits font and text colour only for saved slots (`siteFontsFromSettings`). See the memo. |
| L5-051 | FIXED | `ea915ccc0` | The preview now has a page menu and handles link clicks itself. The sandbox is `allow-same-origin` with no scripts. **Live:** clicking `/contact` shows "Get in touch" and moves the menu to Contact; picking Home from the menu goes back. |
| L5-060 | FIXED | `c31c8345a` | **Live:** with saves returning 500, Publish is disabled with "Save your changes before publishing — the last save failed". It is re-enabled after the retry saves. Flushing autosave before export (01 P2-6) is not done. |
| L5-071 | FIXED | `fd0c48732` | **Live:** offline in the editor, no "Auto-retrying in Ns" banner appears. Unit test for `/edit/*`. |
| L5-076 | ALREADY-FIXED (main) | main EDT-018; wave-6 `5ab08c625` superseded at merge `3d8a57ac1` | Main's `onOffScreenSettled` dismisses the recovery toast when the copy is handed over or discarded; wave 6's duplicate tracker was dropped at the merge. Kept from wave 6: the loadFlow assertion that Restore dismisses the toast (passes on main's code). Earlier note: | The recovery toast is dismissed on Restore and is registered with the toasts that a successful save takes down. Unit test. The cross-tab marker is cleared on every successful save (waves 2 and 3); a marker for off-screen edits is kept on purpose. |

## L5 — Low

| ID | Status | Commit | Evidence |
|---|---|---|---|
| L5-012 | FIXED | `98cf79cda` | After a failed suggestion run, the field holds the prompt that was sent. Unit test. Not checked live (needs an AI "other" failure). |
| L5-013 | FIXED | `6f599c967` | `withBeforeValues` fills in `from` for text, style and attribute rows, and the card reads "field: from → to". Unit tests (mocked). |
| L5-014 | FIXED | `de2051c7c` | **Live:** right-click → Improve with AI fills the field with "Improve this element's copy and spacing" and does not run it. |
| L5-015 | DECISION | — | ✦ AI on the selection toolbar. See the memo. |
| L5-018 | FIXED | `4463d263d` | The title is trimmed at a word boundary, the button stays as "Regenerate", and a failure shows an inline alert. Unit tests. |
| L5-020 | FIXED | `46b4b6f8a` | **Live:** with nothing changed, Get AI Summary is disabled. Unit test: no cooldown starts without a request. |
| L5-022 | FIXED | `f1fbc6319` | History label is "AI: <step title>". Undo telemetry uses `isAiEditLabel`. Unit tests. |
| L5-023 | WONTFIX-REASON | — | Merging the three AI transports is the "AI Ops v2" refactor (README §). The user-facing symptoms in this lane (L5-017, L5-021) are fixed. |
| L5-024 | FIXED | `f3d0c159f` | **Live:** opening AI makes 1 `ai.quota` request (was 2). It is re-read once per finished run. |
| L5-026 | NOT-DONE | — | Issues → "Generate alt text" is a NEXT-tier feature. Its prerequisite, quota-gated alt text, is now in place (L5-025). |
| L5-027 | NOT-DONE | — | "Apply with AI" on a comment is a NEXT-tier feature. |
| L5-032 | NOT-DONE | — | @mentions need a member picker and a notification path. Backlog. |
| L5-033 | NOT-DONE | — | Editing and deleting comments needs `comments.update` / `comments.delete` (author or ADMIN), a service, and a row menu. Not built this wave. |
| L5-035 | FIXED | `4c2fa911a` | **Live:** the meta line reads "You · Home · 1m". |
| L5-041 | FIXED | `9d8c6641a` | An open compare is recomputed when the version list changes. Unit test. Ran live; the result text matched because the draft had not changed. |
| L5-045 | FIXED | `f2e13db09` | **Live:** clicking a row opens Saved version details. "N changes" opens the compare (unit test). |
| L5-061 | DECISION | — | Publish opens the confirm over the checks panel. See the memo. |
| L5-072 | DECISION | — | Partly reduced: the dashboard banner is gone (L5-071) and failure toasts close on success (L5-073). See the memo. |
| L5-073 | ALREADY-FIXED (main) | main L3-006; wave-6 `56a5aa958` superseded at merge `3d8a57ac1` | Main's `SAVE_FAILED_TOAST_KEY` is dismissed on every landed save. **Live after merge:** 500 → Retry save → 200, no toast left. | **Live:** after 500 → Retry save → 200, no "Save failed" toast is left. |
| L5-077 | FIXED | `d6056e93a` | **Live after merge:** two tabs, both edited; tab 2 got the conflict modal; Reload latest raised no native dialog (0 `dialog` events). |
| L5-078 | FIXED | `aea5b9d78` + `92717c0c6` | **Live:** both tabs show "This site is open in another tab". The first version was replaced by "Project loaded" in the new tab, so the notice is now persistent. |
| L5-079 | WONTFIX-REASON | — | Seen once in the audit and not reproduced (the audit's dev overlay read "stale" HMR). Re-test on a production build. |

## FG

| ID | Status | Commit | Evidence |
|---|---|---|---|
| FG-001 | DECISION | — | Blocked on FG-002. See the memo. |
| FG-002 | DECISION | — | Figma-only. See the memo. |
| FG-003 | WONTFIX-REASON | — | Figma-only: needs a v2 board variant for approval-optional workspaces. Code already keeps Publish enabled there (`lifecycle.ts`). |
| FG-004 | NOT-DONE | — | The v2 panel states depend on the FG-001/002 decision. |
| FG-006 | NOT-DONE | — | Client located pins need a same-origin pin overlay over the snapshot plus selector capture. Feature scope. |
| FG-007 | DECISION | — | See the memo (container and save verbs, SEO arc). |
| FG-008 | NOT-DONE | — | The Pages SEO dot depends on FG-007's score model. A dot built on the current points score would be redrawn. |
| FG-009 | DECISION | — | See the memo (schedule with FG-007). |
| FG-010 | NOT-DONE | — | SEO arc; depends on FG-007's problem list. |
| FG-011 | NOT-DONE | — | SEO arc. |
| FG-012 | DECISION | — | See the FG-007 memo. Not implemented: Cancel/Done is owner decision #20 (`PageSettingsDrawer.tsx:7`), and the 10-04 SEO-M1 board contradicts it. |
| FG-013 | WONTFIX-REASON | — | Figma-only (prototype wiring). |
| FG-014 | WONTFIX-REASON | — | Figma-only (prototype wiring). |
| FG-015a | ALREADY-FIXED | `786b1ee43`, `d7ff9f2fe` | Theme-toggle block is in Add, canvas and export (Brand 1c). |
| FG-015b | ALREADY-FIXED | `4f5ad5a80` | Brand from a logo or website. |
| FG-015c | ALREADY-FIXED | `068bf133c` | Colour scale generator. |
| FG-015d | ALREADY-FIXED | `aff46ebe3` | Restore points list. **Live:** "Restore points" is in the Brand header. |
| FG-015e | ALREADY-FIXED | `cbd7e7b74` | Connect to tokens check. |
| FG-015f | ALREADY-FIXED | `105ac434e` | Dark mode Off/Auto with the missing-dark preview flow. |
| FG-015g | ALREADY-FIXED | `8fd2f3404` | Safe delete: a known 0 confirms, a used token asks for a replacement, and "unknown" refuses (`TokenDetailView.tsx:287-296`). |
| FG-015h | NOT-DONE | — | The push preview lists skipped sites (`theme-manager.tsx:203-204`). The BRP1-M4 "recapture" action is not built (Brand plan scope). |
| FG-015i | ALREADY-FIXED | Brand 1b | Review changes is drawn at 0 ("No changes to review yet.", `SessionEditsPopover.tsx:113`). Token usage has an "unknown" state (`TokenDetailView.tsx:290`). **Live:** "Review changes · 0". |
| FG-016 | DECISION | — | See the memo. |
| FG-017 | ALREADY-FIXED | `c6063ed14` | **Live** on a new blank site: the Brand checks nav shows no count, and the token detail reads "Brand checks pass · 5.9:1 contrast". |
| FG-018 | DECISION | — | See the memo. |
| FG-019 | WONTFIX-REASON | — | Figma-only (archive board `7842:194805`). |
| FG-020 | WONTFIX-REASON | — | Figma-only (inspector tab component). |
| FG-021 | NOT-DONE | — | CMS-conditional visibility needs an owner scope call, then engine, export evaluator and inspector work. |
| FG-022 | NOT-DONE | — | The MORE EFFECTS expander must be conformed in the Figma design-to-code loop (board read plus side-by-side check). Not attempted without the board. |
| FG-023 | FIXED | `ac9df1753` | Applied AI edits flash the elements they touched (`AI_SUGGESTION_APPLIED` → `useElementFlash`). Unit tests. Not checked live (no AI). |
| FG-024 | WONTFIX-REASON | — | Figma-only (stale board). |
| FG-025 | WONTFIX-REASON | — | Figma-only (archive board). |
| FG-026 | NOT-DONE | — | A single accessibility report needs a design (Issues "Accessibility" category) and scanner work. |
| FG-027 | ALREADY-FIXED (main) | main L4-042; wave-6 `5c1f8d1a2` superseded at merge | Main ships "No issues." (board 6158:51949, newer than 4418:47609); main's copy is kept. | The clean state reads "No issues. This page is ready to publish." (board copy). Unit test. |
| FG-028 | FIXED | `b15fdd423` | A successful auto-fix shows "Issue fixed" with Undo, bound to the fix's own history entry. Checked in code only; no fixable contrast issue was set up live. |
| FG-029 | DECISION | — | See the memo. |
| FG-030 | DECISION | — | See the memo. |
| FG-031 | WONTFIX-REASON | — | Figma-only (one home for submissions). |
| FG-032 | WONTFIX-REASON | — | Figma-only (Security headers board). |
| FG-032b | FIXED (code half) | `8b25300b2` | The dashboard inbox now has an error state with Retry instead of the false empty state (unit test). The form build and submit failure boards are still missing on the Figma side. |
| FG-033 | WONTFIX-REASON | — | Figma-only. |
| FG-034 | WONTFIX-REASON | — | Figma-only (DNS-M paused by the owner). |
| FG-035 | WONTFIX-REASON | — | Figma-only. |
| FG-036 | WONTFIX-REASON | — | Figma-only (onboarding boards). |
| FG-037 | DECISION | — | See the memo. |
| FG-038 | WONTFIX-REASON | — | Figma-only (the code's backup option wins). |
| FG-040 | WONTFIX-REASON | — | Figma-only. |
| FG-041 | NOT-DONE | — | Loading and error rows in the Add panel are not built (a toast only). |
| FG-042 | WONTFIX-REASON | — | Figma-only (board for the invalid-drop state). |
| FG-043 | NOT-DONE | — | Date field configuration (format, min/max) needs a CMS field schema change. Not built. |
| FG-044 | NOT-DONE | — | Duplicate of L1-025 (Start from Scratch lands on the dashboard), owned by the wave 4 L1 lane. |
| FG-045 | FIXED (merged with main) | `a3881498d` + merge | Main's wording ("The site moves to Recently deleted, where you can restore it for N days") is kept; the number comes from `SITE_RESTORE_WINDOW_DAYS`. | The confirm now names the 30-day restore window. The success toast already did. Unit test. |
| FG-005, FG-039 | — | — | Withdrawn or not filed by the audit. |

## Decision memos

**L5-011 Generate a block: review step.**
- Options:
  - (a) honest copy;
  - (b) an Insert/Discard card before applying, reusing AgentPlan's awaiting card.
- **Default (a), shipped.** It is reversible copy, and one Undo already takes the block back.
- Choose (b) if a review step is wanted; that needs a board.

**L5-015 / L5-016 Rewrite actions and toolbar ✦ AI.**
- Options:
  - (a) a "Rewrite ▸ Shorter / Friendlier / More professional / Fix grammar" submenu in the canvas menu and ⋯ More. Each item is a one-step element run through the AI column (the L5-014 `ui:switch-tab {prompt}` plumbing plus auto-send).
  - (b) (a) plus ✦ on the selection toolbar;
  - (c) nothing.
- **Default (a)**, built after the L5-002 element context (wave 4).
- Toolbar ✦ only once there is a board for it. Not built this wave.

**L5-050 Preview ≠ canvas (and the published site).**
- Source of truth = export. The export emits body font and text colour only for slots the site has saved (`siteFontsFromSettings`). So a default site previews, and publishes, black text in the reset family with no font link, while the canvas paints the seed (slate-700, Inter).
- Options:
  - (a) export and preview emit the seed font and colour, plus the Google font link, for every site;
  - (b) the canvas root stops inheriting chrome and seed styles, so it matches the bare export.
- **Default (a).** But it changes how every default-token site looks the next time it publishes, so it needs an owner sign-off. Not done.

**L5-061 Publish opens the confirm over the checks panel.**
- Options:
  - (a) panel first, with the confirm from "Publish to production";
  - (b) keep one step.
- **Default (a)**, so warnings are read before confirming. Needs a board check. Not done.

**L5-072 Save-failure surfaces.**
- The topbar chip, the canvas banner (`4418:124938`) and the toast (`7574:194162`, "Retry now") come from two boards.
- **Default:** chip + banner only. Keep the toast only for causes the banner cannot state (offline, not-loaded, site gone).
- Not done: about 6 test files pin the toasts, and the boards disagree.

**FG-001 / FG-002 Review v2.**
- Options:
  - (a) declare Review v2 (`8165:219385`) the only current design, ARCHIVE the old family, retarget the shells' `chip/review` through per-board overrides, then rebuild `ReviewTab` from the v2 boards;
  - (b) keep the old family and archive v2.
- **Default (a)**: it is the owner's latest design (03 Oct).
- The code rebuild (FG-001, FG-004) waits on the Figma step. No safe copy-only change applies, because the panel structure differs, not its copy.

**FG-007 / FG-009 / FG-012 Page SEO container and save verbs.**
- Options:
  - (a) board: a right-docked drawer over the inspector column with "Unsaved changes · Discard · Save", the same as Settings;
  - (b) keep the centred modal with Cancel/Done (owner decision #20, boards `6887:73809/73848/73882`);
  - (c) a drawer with autosave.
- **Default (a).** The 10-04 SEO-M1 boards supersede decision #20. The drawer keeps the canvas visible, which SEO-M6's Fix hand-off (FG-010) needs.
- Not implemented: it reverses a recorded owner decision, so the owner confirms first.
- Schedule FG-009 (structured data, sitemap, pages overview, previews) in the same SEO arc.

**FG-016 Brand AI shared-style proposals.**
- **Default:** mark the boards PLANNED (behind `NEXT_PUBLIC_FEATURE_DS_AI`), and build them with the AIPromptModal `onAccept` destination (L5-019).

**FG-018 Brand token-kind pages.**
- Options:
  - (a) kinds become first-class nav items, per the 11 loose boards;
  - (b) keep the "more kinds" disclosure and file the boards into the Brand section.
- **Default (b).** The 11 primary kinds already fill the nav.
- `BrandWorkspace.tsx`'s comment ("no workspace board draws") is stale either way. Update it with the decision.

**FG-029 Wide breakpoint.**
- Options:
  - (a) add Wide (≥1440) to the breakpoint menu, with override authoring and export media queries;
  - (b) archive the Wide boards and drop `wide` from `DEVICE_PREVIEW_SIZES` once its readers are checked.
- **Default (b)** until the engine's breakpoint order carries a desktop-up tier.

**FG-030 Preview custom width.**
- **Default:** reuse the canvas Custom width (`CustomWidthModal`) as a fourth preview device. Low effort; not built this wave.

**FG-037 Commerce.**
- Options:
  - (a) ship the full flow;
  - (b) mark it PLANNED in both and hide the setup modal's door.
- **Default (b).** There is no server router behind it.

## Not verified

- Every model-dependent AI path (Ollama down; no OpenAI calls made): L5-012, 013, 017, 018 (the call itself), 021, FG-023 live flash.
- FG-028: a live auto-fix was not run.
- L5-041 live: the compare re-ran, but the draft had not changed, so the text was the same.
- The publish path past the gate (`sites.publish` was aborted throughout).
