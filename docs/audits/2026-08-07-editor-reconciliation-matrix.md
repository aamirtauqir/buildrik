# Editor reconciliation matrix — code ↔ Figma — 2026-08-07

Phase 0 of `docs/plans/2026-08-07-editor-figma-completion.md`.
Sources: `scripts/conformance/boards.json` (300 active / 33 families, regenerated
today) · `docs/audits/2026-08-07-editor-code-inventory.md` (83-call read-only
sweep, 30-item dead ledger) · live page-`1:3` census (368 boards, 368/368
reachable) · the 08-06 review record.

**Classes:** 1 consistent-both · 2 both-but-inconsistent · 3 code-only ·
4 Figma-only extension · 5 duplicated-in-Figma · 6 duplicated-in-code ·
7 incomplete/broken · 8 unreachable/potentially-obsolete · 9 unclear-verify.

## A. Family rows (300 manifested active boards)

| Family (boards) | Class | Verdict + deltas |
|---|---|---|
| **Insert** (13) | 1 + 2×2 | Core states match BuildTab. **Class 2:** `loading` + `load-error` boards exist; code counterparts (`InsertStateBlocks.tsx`) are built but **unmounted** (ledger D2) — board asserts a state code never renders. 4 `*-expanded` boards = accordion expansion, consistent. |
| **Pages** (10) | 1 | Rebuilt to boards this week (commits `8550c700`..`539d48d9`), incl. PageTabBar + S3.7 modal. Verified during rebuild. |
| **Layers** (17) | 1 + 5×9 | 11 rebuilt-verified. 6 boards drawn post-rebuild: `context-menu` ✓ code (D28: TWO LayerContextMenu files = class 6 dup), `expanded`/`scroll-overflow`/`component-instance` inherent tree behaviours ✓. **Class 9:** `renaming` (inline rename in layers — unverified), `list-view` (view-mode toggle not in code inventory — likely class 4 extension). |
| **Media** (17→24) | ~~1~~ **was 3-partial — CORRECTED 2026-08-08 (founder catch)** | The DRAWER was fully boarded; the matrix missed that code ships a second, bigger surface with zero boards: the **fullpage Library** (`LibraryManager.tsx` — 3-column FolderTree/AssetGrid/AssetDetailsPanel, smart folders, tags, view modes, sort, Fonts pill, AI alt-text, versions, replace-across, quota bar) + **picker modal** + **replace-across dialog** + context menu + drag-over upload + video/font assets. **Fixed same day: 7 boards drawn** (fullpage library/empty/list-bulk/unused-ctx-menu/drag-over + picker & replace-across modals), wired from Media·grid and Inspector·MEDIA, 386/386 reachable. Lesson: presence-level classification hid a whole surface — the founder's eyes caught what the matrix's family-level row did not. |
| **Content** (11) | 1 | All 7 code views + hydration states map. Note: presence-consistent; VISUAL conformance pending (code rebuild paused before Content). |
| **Brand** (26) | 1 + 1×2 | 14 token + 11 preset registries, lint, starters, migration, export — rich both sides. **Class 2:** `pro-locked` board asserts a plan gate; code design-system has NO plan gate (only Settings `integrations` locks). Behaviour → code truth: board is aspirational until a gate ships. `empty` board missing (Phase 1 list). |
| **Review panel** (12) | 1 + 2×7 | 10 states match ReviewTab. **Class 7:** `re-send-confirm` + `re-sending` boards — code "Re-send" button is a **visible no-op** (D3: `onResendReview` never passed). Board fine, wire broken. `loading` board missing (Phase 1 list). |
| **History** (15) | 1 | Saves + Published + milestone banner all map. `loading` board missing (Phase 1 list). Backups ×5 = design-ahead, correct. |
| **Components** (5) | 1 | Library/detail/create/loading/load-error map to legacy ComponentsTab. Code HAS an empty state ("No components yet") — board missing (Phase 1 list). V2 panel = flag-dark, not a board concern. |
| **Templates** (6) | 1 + 3-list | Core 6 map. **Class 3 (small):** CreatePage confirm/success/error modals + ProModal + UsageDrawer exist in code with no boards. `empty` board missing (Phase 1 list). |
| **Publish** (10+1) | 1 + **5** | All 10 active boards have code counterparts (Confirm modal shipped `e8a7dccd` today). **Class 5 — the known OPEN consolidation:** publish surfaces spread across Publish family + S5.4 gate ×3 + S6 deploy-progress + `[design-ahead]` Options + pre-checks ×2. One canonical flow needed (Phase 1.2). **Class 3:** StaleApprovalModal + topbar publish-anyway confirm have no boards. `needs-approval` block has no override UI in code — documented, matches gate boards. |
| **AI** (11) | 1 | All 11 chat/agent states map. Model picker removed from code = removed from boards ✓. |
| **CmdK** (6) | 1 + 1×9 + 1×7 | 5 map. **Class 9:** `ai-offer` — no AI-offer row in code palette groups. **Class 7 (code-side):** ⌘K "open panel" silent no-op for ai/components/publish/review/content (D4) — boards imply navigation code can't do. |
| **Inspector** (7) | 1 | Exactly 7 profiles both sides (CONTAINER fallback + TEXT/FLEX/GRID/MEDIA/BUTTON/INPUT). Tab-strip removed both sides ✓ (flat scroll board 824:5095 documents it). |
| **Notifications** (6) | 1 + 1×9 | 5 map. **Class 9:** `jump-target-deleted` — code behaviour for deleted jump targets unverified. |
| **Compare** (8) | 1 + 1×7 | 7 map (split/overlay/semantic + restore). `resend-confirm` inherits the D3 dead re-send wire = class 7. |
| **Preview** (3+3) | **4** | `share link`, `interaction test`, `accessibility checker` — **no code counterparts found.** Figma-only extensions: preserve, document as unimplemented. (Perf audit ×3 already design-ahead.) |
| **Onboarding** (2) | 1 | AchievementPrompt ✓. |
| **Orphan comments** (3) | 1 | CommentLayer detect/reattach/dismiss ✓. |
| **Exit** (1) | 1 | Exit guard (dirty/risky variants) ✓. |
| **Canvas** (2) | 1 | Footer toolbar + zoom ✓. |
| **Shell** (1) + **S1** (1) | 1 | 1280 overlay + assembled master ✓. |
| **Shell states** (12+1) | 1 | All 12 map (Loading=StudioSkeleton, Saving→conflict=ConflictModal, Comment mode=CommentLayer, AI run, Offline, Preview, Review active…). Presence = design-ahead ✓ (collab flag). |
| **S1 flows** (24) | 1 + 2×9 + 1×4 | Boot/first-run/onboarding/session-expired/crash-recovery/save-indicator-5-states/viewer-chrome/new-page all map. **Class 9:** `S1.2e offline-restored syncing banner`, `S1.2g force-refresh new-version` — not in code inventory. Likely class 4 until verified. |
| **S2 flows** (11) | **9** | AI site-draft flow (brief→generating→result→reject). Editor AITab is edit-AI; site-gen lives in dashboard onboarding + ai-generate-worker. These boards likely document the DASHBOARD path drawn on the editor page — cross-package. Verify before any action; do NOT draw more here. |
| **S3 flows** (17) | 1 + 1×2 | 15 map to canvas/page-settings/media (incl. `image-editor` shipped today). **Class 2:** `media · optimise` (1124:4562) — board ahead of code, the rebuild arc's open item. `keyboard-shortcuts-overlay`: code has TWO overlays on `?` (D29, class 6 dup). |
| **S5 flows** (23) | 1 | Compose ×4, status ×6 (matches the 6-state review-pill map EXACTLY), threads ×5, gates ×3, S5.6 ×3, reviewer-view, activity-log — the strongest family. |
| **S6 flows** (3+3) | 1×1 + 2×4 | `DNS-verification` ≈ Settings·Domains ✓. **Class 4:** `publish-changelog diff-summary`, `deploy-progress-pipeline` (code has a % bar, not a pipeline UI) — extensions, document. |
| **S7 Settings** (14) | 1 + 1×2 | 14 boards = 14 code screens, exact. **Class 2 + code bug:** `Headers · locked (Pro)` board vs code plan-gate `{advanced, integrations}` — `advanced` matches NO screen (D11 dead key), so code locks ONLY integrations and the Headers lock the board asserts doesn't exist. Founder decision: which screens are Pro? Then fix code key + board together. |
| **B9.1 Animation** (1) | 2 | Board is a full editor (Entrance·Attention·Exit); code has an inspector `animation` section. Depth mismatch — board ahead of code. Document as extension-depth. |
| **B9.5 Migration** (1) | 1 | MigrationProgressModal ✓. |
| **Media drill-ins map** (1) | 1 | Reference board for the 5 destinations ✓. |

## B. Finding: ~40 section-child boards are NOT in the manifest

`boards.json` (top-level scan) never included boards living inside sections.
Live census 368 vs manifest 324 = **44 unmanifested**, and they are not all
reference material — several are product families with direct code counterparts:

| Unmanifested group | Boards | Code side | Class |
|---|---|---|---|
| Inspector states (159:x, 160:x, 189:2) | 11 | ProInspector body states (empty/multi-select/AI-run/whole-site/loading…) — match | 1, add to manifest |
| Issues (164:x) | 5 | IssuesPanel (all/filtered/empty/fixing/fix-failed) — match; D26 jump-only-closes = 7 | 1 + 1×7 |
| Modal generic states (183:x) | 5 | Shell modal framework (open/dirty/submitting/error/success) | 1 |
| **Commerce (304:x)** | 3 | **NO editor code** — marketplace memory: Commerce explicitly out of scope | **4** — preserve + document |
| Content·data (303:x) | 2 | data-sources watching states | 1/9 |
| S3.14 cmdk·recent | 1 | Recent group ✓ | 1 |
| Site menu (642:3401) | 1 | SiteMenu ✓ | 1 |
| S5.9 share-permissions-modal | 1 | not in code inventory | 4/9 |
| C6 Recovery banner | 1 | RecoveryBanner ✓ | 1 |
| S1.2d conflict-review-both | 1 | ConflictModal → Compare ✓ | 1 |
| Permissions ×2, Empty-states, Keyboard legend, Modal instances ×2, Device frames, Brand sub-screens, Orphan+AI, J1–J3 proofs, SPEC slots, UX audit | ~15 | reference/spec material | out-of-scope, mark as such |

**Action (Phase 1.3 extension):** append the ~25 product boards to the manifest
with correct family; mark the ~15 reference boards out-of-scope explicitly.

## C. Reverse pass — code with no boards (class 3) and dead code (class 8)

**Class 3 — active code, no board (draw only if founder wants them contracted):**
StaleApprovalModal · topbar publish-anyway confirm · ExportModal (HTML) ·
SaveTemplateModal · MediaLibraryPanel (picker) · CMS CollectionSetup/Records
modals · Templates CreatePage ×3 + ProModal + UsageDrawer · pages panel ⌘K ·
UpgradeModal. All small modals; none breaks a job flow undrawn.

**Class 8 — the 30-item dead ledger** (full table in the code inventory §7):
dead subsystems (D1 useBuildTab favorites, D2 InsertStateBlocks-unmounted),
broken wires (D3 Re-send no-op, D4 ⌘K ×5, D11 pro-lock key, D13 replay-tour,
D14 help-?), unreachable-by-mode (D8 StructurePopover, D9 Ask-AI, D20/D21
e3+legacy rails), barrel-only dead files (D16–D19), duplicates (D28 ×2
LayerContextMenu, D29 ×2 shortcut overlays, D30 ×3 palettes). **Per prompt
rule 6: documented, nothing deleted, founder approval required for any
archive/removal — these are also the top candidates when the code arc resumes.**

## D. Tripwire verdict

Row basis: 33 family rows expanded to state-level where deltas exist + 44
unmanifested + 30 dead-ledger reverse rows ≈ **340 rows**.

| Class | Rows | Notes |
|---|---|---|
| 2 (inconsistent) | 8 | Insert ×2, Brand pro-lock, S7 Headers-lock, S3.6 optimise, B9.1 depth, CmdK ai-offer-ish, Issues jump |
| 7 (broken wire) | 6 | Re-send ×2, resend-confirm, ⌘K nav, D26, D3-adjacent |
| 8 (dead/obsolete) | 30 | dead ledger — code-side, not board-side |
| 9 (verify) | 12 | Layers ×2, S2 family, S1.2e/g, jump-target, S5.9, Content·data, misc |
| **Problem total** | **56 / ~340 = 16.5%** | **UNDER the 20% tripwire → PROCEED to Phase 1** |

Caveats stated, not rounded away: the 16.5% counts the S2 family as one row
(11 boards); the dead ledger is code-debt that the paused code arc owns, not
board work. Board-side-only problem rate ≈ 26/340 ≈ 8%.

## E. What Phase 1 does with this (today)

1. Draw 5 missing state boards (Review·loading, History·loading,
   Components·empty, Brand·empty, Templates·empty) — §5.7 copy.
2. Publish-cluster consolidation (the one class-5).
3. Dispositions: 2 `[superseded]` boards + 2 `🔍 REVIEW` sections + manifest
   append for ~25 unmanifested product boards + out-of-scope marks for ~15.
4. Class 4 items get a `[not-implemented]` note on the board (Commerce ×3,
   Preview ×3, S6 ×2, S5.9) — preserved per founder prompt rule 4.
5. Class 2/7/9 items → decision list for the founder (below), no silent fixes.

**Founder decisions needed (5, can answer inline):**
| # | Question | Default if no answer |
|---|---|---|
| 1 | Which Settings screens are Pro-locked? (board says Headers; code locks only Integrations via a half-dead map) | Board+code both set to Integrations-only; Headers·locked board archived |
| 2 | Insert loading/load-error: mount the built blocks when code resumes, or archive the 2 boards? | Keep boards; file to code-arc backlog |
| 3 | S2 flow family (11 boards) — dashboard AI-draft on the editor page: keep here or move to a dashboard page later? | Keep, mark `[dashboard-flow]` |
| 4 | Commerce ×3 boards — keep as `[not-implemented]` extension? | Keep + mark |
| 5 | Re-send wire (D3) — file to code backlog (1-line fix) or leave? | File to backlog |
