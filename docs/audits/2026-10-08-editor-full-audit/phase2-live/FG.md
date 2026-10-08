# FG — Figma ↔ Code ↔ Product-logic audit of the Editor (2026-10-08)

Agent FG. Audit only: no repo was edited, staged or stashed, and no Figma node was written. All Figma calls were read-only `use_figma` / `get_screenshot`.

## Scope and method

- **Code:** `/Users/shahg/Desktop/buildrik-worktrees/editor-live-audit` at `f9f79bc66`. Main is `2a53ed703`, but the commits after `f9f79bc66` are docs only. Paths below are relative to `packages/editor/src/editor/` unless written in full.
- **Figma:** file `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431` (Editor v3 · IA). **11 Figma calls used** (cap was 60); the ledger is `work-FG/calls.log`.
  - **Calls 1–3:** listed the sections, then every top-level board whose id prefix is ≥ 7594. That prefix marks boards created after the 2026-09-21 dump: the dump's newest boards are 7563–7593. Result: **223 new boards** (`work-FG/new-boards.txt`). The page now has 4 pages (a new empty "Page 4" `7712:192948`) and 126 top-level nodes on page 4418:45431.
  - **Call 4:** a reaction graph across all 2,110 top-level frames, giving inbound and outbound prototype links for each new board (`work-FG/r3.txt`).
  - **Calls 5–7:** read the flow-rule texts of Review v2, Brand Part 1 and the Forms START HERE board; the topbar and rail destinations of the two base shells; and the inspector tab labels against Inspector v4.
  - **Calls 8–11:** four board screenshots (Review v2 not-sent and changes-requested, SEO-M1, SEO-M7), compared side by side with live screenshots.
- **Reused:** the 2026-09-21 audit (`packages/editor/docs/audit-2026-09-21/`: 02 inventory, 03 gap matrix, 05 build log, REPORT, `dump/live-all.json` = 1,098 boards), the 2026-10-04 design-blockers handoff, the code-figma-alignment-2026-09-27 folder, and the phase-1 audits in `scratchpad/audit/`.
- **Code re-verification:** three read-only code sweeps covered every 09-21 P0/P1 gap and every new board family (about 150 items). Their verdicts are cited by `file:line`.
- **Walked live** at http://localhost:3300 as qa@buildrik.local, on my own site **`cmuyn3mh6001u2qi79gdaf2r2` "Live audit 2026-10-08 · FG"**, created through the dashboard's Create a site → Start from Scratch. Covered:
  - editor chrome: rail, topbar and footer inventory
  - Review panel (empty)
  - Pages panel and page ⋯ menu, Page settings dialog
  - Layers, including Select mode
  - Site menu
  - Settings: sidebar, search for "sitemap", SEO screen
  - Brand workspace

  Screenshots are in `scratchpad/audit2/work-FG/` (`e2-*`, `e3-*`, `e4-*`, `d*`; Figma boards in `fig-*`).
- **Code only (not walked):** AI, CMS, Media library, Components, Inspector sections, Publish, History, Activity, Notifications, Issues, Templates, Commands, Forms, Domains, Commerce, onboarding.
- **Not verified, and why:**
  - **Publish beyond the button:** the workspace has a real Vercel connection.
  - **AI flows:** they cost money; zero AI calls were made.
  - **Flag-on collaboration:** no flag-on build exists.
  - **Client `/review/<token>` page:** needs a real review round.
  - **Prototype playback in Figma:** checked statically from the reaction graph only.
  - **Pixels of the remaining ~1,300 boards:** only 4 were screenshotted.
  - **Lazy instance children:** reaction reads inside lazily-loaded instance children can undercount (memory note `figma-build-traps`), so "0 inbound" means 0 found by `findAll` over the board subtree.
- **Site cleanup:** my site was **deleted (soft delete = trash, 30-day restore)** at the end through the dashboard Sites row ⋯ › Delete. It was confirmed gone from the list.

**Label convention used below.** "FIGMA ONLY ISSUE" = only Figma needs correcting. "CODE ONLY ISSUE" = only code needs correcting. "FIGMA + CODE ISSUE" = both do. The precedence rule from `packages/editor/CLAUDE.md` is applied throughout: **behaviour follows the code contract; visuals, layout and copy follow the board; board sample data is never literal.**

---

## 1. What changed in Figma since the 2026-09-21 dump (223 new boards)

| Section | New boards | What | Wired? (inbound = links from anywhere on the page) |
|---|---|---|---|
| Configure site and workspace · Settings `4418:127312` | 84 | Full-screen Settings states (General scope, read-only, slug, Languages, SEO, Domains, Redirects CSV, Access, Form submissions, Overview, Danger zone, Integrations door) · CMS conflict / deleted / publish-blocked · **SEO-M1…M12 (33)** · Settings search mode (4) · Layers select mode (3) · handoff `8214:229015` | **51 of 84 have 0 inbound**. Settings state boards each have one navigational destination (the unsaved-settings overlay `4418:165478`) plus 13–17 non-navigating interactions. |
| Brand · Part 1 `8220:229015` | 48 | BRP1-M1…M12 (read-only notice, review changes, header without Save, theme push, token usage, safe delete, connect to tokens, dark mode, colour-scale generator, restore points, brand from logo/website, theme-toggle block) | **12 of 48 have 0 inbound** |
| Review · Panel redesign & flow · 03 Oct `8165:219385` | 28 | Review v2: 25 states + START HERE rules + library | Wired inside the section (3 have 0 inbound). **No shell links to it** (see FG-002). |
| Functional ownership · Forms & global `7889:196283` | 14 | Forms workspace · Submissions, AI assistant Review plan / Applied (Page / Site), Visibility condition ×5, Brand AI ×2, Applied draft · Canvas | Wired |
| Loose (no section) | 17 | Configure Long text / Date field; **Brand workspace · Radius / Shadow / Motion / Border / Opacity / Z-index / Breakpoint / Grid / Sizing / Icon / Imagery**; CODE BASELINE Inspector settings inventory; **Inspector v4 · approved 2026-09-27** `8021:206877` (36 states); Inspector control refinement | Mostly wired |
| OVERLAYS sections | 14 | History ⋯, Brand spacing ⋯ / token-kind menu, Commands Jump to property, Templates replace confirm, CMS source/variable rename, delete and re-sync, CMS new collection, Assets pick filter popover | Wired |
| v3 · Phase 2/3/4/6, Canvas, Insert, AI | 13 | Inspector Effects (Opacity jump, MORE EFFECTS), Brand presets buttons ×3 + Colours dirty, Add RECENT / FAVOURITES, AI daily-limit counters, CMS variables / fields, Canvas View ▸ Grid | Wired |
| v3 · Code-only features | 2 | Toast · Link copied, Toast · Styles reset · Undo | Wired |

The nine stacked rows below the table were not captured. Name-based state coverage per module is in `work-FG/cov.py`; the output is summarised in §3.

---

## 2. Re-verification of the 2026-09-21 gaps against today's main

Most P0/P1 gaps from `03-gap-matrix.md` are **CLOSED**: the Figma side was built on 09-21 (05 build log, section `7563:197895`) and the code side has landed since.

| 09-21 gap | Status today | Evidence |
|---|---|---|
| G1-003 Exit "stranded mirrors" | CLOSED: board `7563:242038` + code | `shell/StudioHeader.tsx:447,947-980` |
| G1-007 Review chip 5 states | CLOSED: board `7569:190283` + code | `StudioHeader.tsx:166-194`, `shell/hooks/useLifecycle.ts:180-196` |
| G1-009 Comments toggle | CLOSED: topbar `btn/comments` → `7566:186558` (re-read in call 5) + code | `StudioHeader.tsx:742`, `useEditorShortcuts.ts:115-124` |
| G1-011 Presence Offline pill | CLOSED (code fixed) | `StudioHeader.tsx:803-822`, `chrome-ui/Presence.tsx:45` |
| G1-013 CTA verbs | CLOSED | `shell/lifecycle.ts:252-417` |
| G1-019 / G1-032 Activity leaves the editor | CLOSED: in-editor Activity panel | `sidebar/tabs/activity/ActivityTab.tsx`, `ActivityLogView.tsx:194-231` |
| G1-024 Start collaboration row | CLOSED: live, "Start collaboration · PLANNED" in Site menu (`e2-sitemenu.png`) | `SiteMenu.tsx:218-232` |
| G1-029 ReviewBar duplicate | CLOSED: bar retired, its "Next ›" moved into the panel | `ReviewTab.tsx:818-885` |
| G1-030 per-row Locate › | CLOSED | `ReviewTab.tsx:483-500` |
| G1-035 pin → draft popover → toasts | CLOSED (boards B2-01…03 + code) | `canvas/comments/CommentLayer.tsx:425-441` |
| G1-036 / 037 orphan + re-pin | CLOSED | `CommentLayer.tsx:561-640`, `ReattachModal.tsx` |
| G1-043 two publish confirms | CLOSED: one confirm | `shell/modals/PublishConfirmModal.tsx` |
| G1-044 pre-publish checks inline | CLOSED: inline, wizard retired | `sidebar/tabs/publish/PrePublishChecks.tsx` |
| G1-045 third gate + stale approval | CLOSED (board `7563:269384` + code) | `PublishGateModal.tsx:54-73`, `StaleApprovalModal.tsx` |
| G1-046 publish with N errors | CLOSED (board `7563:269418` + code) | `PublishErrorsConfirmModal.tsx:58` |
| G1-057 Reopen | CLOSED in code | `ReviewTab.tsx:306-321` |
| G1-076/077/078/080/082/083 recovery family | CLOSED: boards B1-01…08 + code. Crash sentinel is now read back (`consumeLastCrash`). | `useComposerInit.ts:309-330`, `RecoveryBanner.tsx`, `LoadErrorBanner.tsx`, `ConflictModal.tsx`, `useCmsSync.ts:83-87` |
| G3-039 delete folder | CLOSED | `media/LibraryManager.tsx:878-893`, `ConfirmFolderDeleteModal.tsx` |
| G3-064 media view-only role | CLOSED (code gates on role) | `sidebar/tabs/media/hooks/useMediaWriteAccess.ts:36-37` |
| G3-153 migration modal Restore / Retry | CLOSED | `design-system/ui/MigrationProgressMount.tsx:15-33,291-292` |
| Two ⌘K palettes / two shortcut sheets | CLOSED: ⌘⇧P aliases ⌘K; one sheet plus a small legend card | `shell/modals/CommandPalette.tsx`, `canvas/controls/KeyboardCheatSheet.tsx` |
| ⌘K JUMP TO | CLOSED: Pages / Layers / Properties | `CommandPalette.tsx:326-379` |
| Form settings section unmounted | CLOSED: "After submit" mounted | `inspector/sections/registry/behaviour.tsx:111-118` |
| Issues auto-fix unreachable | CLOSED (DS-lint only) | `shell/AquibraStudio.tsx:611-614` |
| Guides not persisted | CLOSED | `canvas/hooks/useCanvasGuides.ts:44` |
| G1-066 viewer located pins | **OPEN**: Figma C-03 `7593:193511` built; code has no pin | FG-006 |
| G1-033 notifications scope | **OPEN (Figma)**: code = this site (owner decision 09-21) | FG-035 |
| Custom preview width (Figma-only) | **OPEN**: Preview fixed 1320/768/375 | FG-030 |
| a11y checker (Figma-only) | **OPEN** | FG-026 |
| Backups tab (Figma-only) | **OPEN (Figma stale)**: owner put Backups into Saves | FG-033 |
| Google Sheets source (Figma-only) | Consistent: code shows "Coming soon"; annotated in Figma | — |

---

## 3. Per-module three-way table

Legend for **Figma states**: E = empty, L = loading, X = error, S = success, D = disabled / permission, H = hover, Sel = selected. A ✓ means at least one board exists for that state, by name scan of 1,098 + 223 boards.

| Module | Figma boards (exist? states) | Code (implemented? where) | Logical product need | Gap class | Side to correct |
|---|---|---|---|---|---|
| Add | Yes. Add / Insert ≈42; E ✓ L ✓ X ✓ S ✓ D ✓ (quota) H ✓; RECENT / FAVOURITES, AI generate block with counter, Paste HTML, first-use tip | Yes: `sidebar/tabs/build/BuildTab.tsx`, `catalog/groups.ts:52-57`, `GenerateBlockScreen.tsx`, `PasteHtmlModal.tsx`, `FirstUseTip.tsx`. Loading / error **rows** missing (toast only). | Insert any element, block or component fast; recent / favourites; AI | CODE (minor) | Code: add loading / error rows (FG-041) |
| Layers | Yes, 67; E ✓ D ✓ Sel ✓; select-mode ×3 new; filtered; ctx menu; drag | Yes: `sidebar/tabs/layers/LayersTab.tsx:76,303-312`, `panels/layers/*`. LIVE: empty state + Select → Done ✓ (`e3-layers-select.png`) | Tree, reorder, multi-select, lock / hide | Aligned | — (code extras with no board: Layer display settings, Move to page) |
| Pages | Yes, 77; E ✓ X ✓ Sel ✓; SEO dot (SEO-M11); duplicate Add page removed 10-04 | Yes: `sidebar/tabs/pages/*`. **No SEO dot**; "From template" + Add page (LIVE `e3-pages.png`) | Page CRUD, folders, SEO health at a glance | FIGMA + CODE | Code: SEO dot (FG-008). Figma: "From template" button has no board (code-only). |
| Page settings / SEO (page) | Yes: SEO-M1…M6b (15): drawer with SEO / Readability / Social / Advanced, keyphrase, problems / improvements, Fix hand-off, Discard / Save | Partial: `pages/page-settings/PageSettingsDrawer.tsx:32-34` is a **centred modal**, SEO (score) / Social / Advanced, Cancel / Done (LIVE `e4-pagesettings.png` vs `fig-8197-224150.png`) | Yoast-level page SEO (owner 10-04: all 4) | CODE (large) | Code (FG-007, FG-010, FG-011, FG-012) |
| Assets / Media drawer | Yes, ≈225 incl. overlays; E ✓ L ✓ X ✓ S ✓ D ✓ Sel ✓ | Yes: `sidebar/tabs/media/*`. Role gating, replace-across, delete with usage, bulk, versions, stock, image editor | Upload, pick, organise, reuse | Aligned (09-21 gaps closed) | — |
| Full Media Library | Yes: Media fullpage ×42 (library, list, bulk, unused) | Yes: `media/LibraryManager.tsx`, `AssetGrid.tsx` | Bulk management | Aligned | Figma: code-only extras (quota bar, import URL, site fonts modal) have no boards. Low. |
| CMS | Yes, ≈117; E ✓ L ✓ X ✓ S ✓; conflict / deleted / publish-blocked (new); sources, variables, fields, Long text / Date config | Yes: `cms/*`, `sidebar/tabs/content/*`, `useCmsSync.ts`. Date field has no type-specific config; Google Sheets "Coming soon" | Collections, records, sources, bindings, dynamic pages | Mostly aligned | Code minor (FG-043). Figma: the 4 CMS conflict boards are orphaned (FG-013). |
| Components | Yes, 24; S ✓; create, delete-confirm, detach, manage master, properties / usage | Yes: `component-library/ComponentDetailScreen.tsx`, `inspector/sections/ComponentRow.tsx`. No general component-properties editor. | Reusable masters with overrides | Partial both | Neither urgent. Properties editor = missing in code; Figma has 1 STATE board only (no E / L / X). Low. |
| Brand | Yes, ≈108: workspace `7315:80955` (rail target), presets, 11 kind boards (loose), Part 1 ×48 (12 orphaned) | Yes: `design-system/ui/BrandWorkspace.tsx`. 11 kinds behind a "more kinds" disclosure; autosave; Part 1a merged, **1b/1c not built** | Brand tokens that bind, preview, dark mode, safe edits | FIGMA + CODE | Code: Part 1b/1c features (FG-015a…i). Figma: Colours "dirty" board contradicts autosave (FG-019); orphans (FG-014). LIVE: new site opens with 8 Brand-check warnings (FG-017). |
| Inspector | Yes, 95 + Inspector v4 (36 approved states, S / B / E) | Yes: tabs Style · Behaviour · Effects (`inspector/sections/registry/_shared.tsx:47-49`) | Edit any element's style, behaviour, effects | FIGMA (shells stale) + CODE (gaps) | Figma: ~500 shells show Style / **Settings** / Effects (FG-020). Code: Visibility condition (FG-021), MORE EFFECTS (FG-022). |
| Selected-element controls (canvas toolbar, handles, ⋯) | Yes: Canvas · selected · Hero `5936:44788`, S3.1 dragging / inline-edit, Canvas delete confirm | Yes: `canvas/controls/UnifiedSelectionToolbar.tsx`, `DeleteSelectionConfirm.tsx` (1 = instant + Undo, >1 = confirm) | Direct manipulation | Aligned | — (X-Ray / Badges overlays: code with no dedicated board; Low) |
| AI | Yes, 54; L ✓ X ✓ S ✓ D ✓ (quota); Review plan, Applied, Applied draft · Canvas, Connect AI provider | Yes: `sidebar/tabs/ai/*` (scope chip, AgentPlan per-step apply, Undo all). **"Applied draft · Canvas" missing**; Connect provider replaced by "AI isn't available · View workspace owner" | AI edits with review and undo | FIGMA + CODE | Code: FG-023. Figma: FG-024, FG-025. |
| Forms | Thin: 12 boards. Inspector Settings tab · Form, Forms · Submission deleted, Settings › Form submissions inbox (new), **Forms workspace · Submissions** (new) | Yes: `blocks/Forms/*`, `inspector/sections/FormAfterSubmitSection.tsx`, `settings/screens/FormsScreen.tsx`, `server/trpc/routers/forms.ts`. No "Forms workspace". | Build a form, set where it goes, see submissions, handle spam | FIGMA + CODE | Figma: two homes for submissions (FG-031). Both: form-building states (validation error, submit failed, empty inbox) not designed and not checked in code (FG-032b). |
| Review | Old Review family (≈18 + panel 5, still CURRENT and still linked from shells) **and** Review v2 (28, 03 Oct, unlinked) | `sidebar/tabs/review/ReviewTab.tsx` = pre-v2 layout; **no v2 commit** (`git log --since=2026-10-01` empty) | Clear client-review loop | FIGMA + CODE | Figma: pick one, wire it (FG-002, FG-003, FG-040). Code: build v2 (FG-001, FG-004). |
| Comments | Yes: mode on / draft popover / post failed / re-pin / element deleted (built 09-21) | Yes: `canvas/comments/*` | Pin feedback on elements | Aligned | Client side: FG-006 |
| Issues | Yes, 14; E ✓ X ✓; filtered, resolved toast | Yes: `shell/IssuesPanel.tsx` (DS-lint + alt-text / broken-link scanner + publish bridge). Empty copy "No brand issues."; no resolved toast | One list of everything blocking quality | CODE (minor) | Code: FG-027, FG-028 |
| History | Yes, 61; E ✓ L ✓ X ✓ S ✓; Panel ⋯ (new); Backups tab drawn | Yes: `sidebar/tabs/history/*`, ⋯ "History actions" `HistoryTab.tsx:177-193`; Backups deliberately absent (`types.ts:20`) | Restore any version safely | FIGMA (stale) | Figma: FG-033 |
| Activity | Yes, 5: list / empty / loading / error | Yes: in-editor panel with loading / empty / error / permission (`ActivityLogView.tsx`) | Who did what | Aligned | Figma: permission state undrawn (Low, part of FG-035) |
| Notifications | 2 + launcher; "all sites" scope | This site only (`shell/NotificationPanel.tsx:112`), loading / error / empty / mark all read | Know what needs me | FIGMA (stale) | FG-035 |
| Publish | Yes, 31: confirm, gates ×3, errors confirm, log, reconnect Vercel | Yes: `sidebar/tabs/publish/*`, `shell/modals/Publish*` | Safe deploy | Aligned (deploy itself UNVERIFIED) | — |
| Settings | Yes, ≈123: 84 new state boards + search mode | Yes: `sidebar/tabs/settings/*`; Security headers screen has no board | Site config | FIGMA (orphans) + CODE (SEO) | Figma: FG-013. Code-only screen: FG-032. |
| Templates | Yes, 39; L ✓ X ✓; replace confirm (new) | Yes: `sidebar/tabs/templates/*`; confirm adds backup checkbox | Start or replace a page from a template | FIGMA (minor) | FG-038 |
| Search / Command palette | Yes: Commands ×7 (jump to property / layer, no results, legend) | Yes: `CommandPalette.tsx`. LIVE: topbar search removed (matches 10-04 Figma) | Find any action / element | Aligned | — |
| Responsive | Yes, 19: Tablet / Mobile / **Wide** boards, breakpoint menu, custom width | Partial: Wide defined but not in the breakpoint menu (`canvas/CanvasFooterToolbar.tsx:153-157`) | Per-device styling | FIGMA + CODE (decide) | FG-029 |
| Canvas / Zoom / View | Yes, 48: View ▸ Grid (new), zoom popover, empty page | Yes: `CanvasFooterToolbar.tsx` (6 overlay toggles, grid sizes, zoom). LIVE: docked footer, empty-page CTA | Navigate and inspect canvas | Aligned | FG-040 (Figma footer drift on v2 boards) |
| Drag & Drop | Yes: S3.1 dragging, Layers dragging | Yes: `canvas/overlays/DropFeedbackOverlay.tsx` (invalid-drop red outline + reason), `useLayerDrag.ts` | Insert / reorder with feedback | Partial (Figma has no **invalid drop** board) | Figma: Low, folded into FG-042 |
| Domains | Settings Domains ×5 incl. set-primary; **DNS-M1…M12 paused** | Yes: `settings/screens/DomainsScreen.tsx` (DNS records card, Check DNS, Force HTTPS, remove) | Connect and verify a domain | CODE with no board | FG-034 |
| SEO (site) | Yes: SEO-M7…M12 (defaults with previews, structured data, sitemap, overview, canonical) | Partial: `settings/screens/SeoScreen.tsx` (defaults, social profiles, indexing, robots). **No structured data, sitemap, overview, previews** (LIVE `e4-settings-seo.png` vs `fig-8200-229488.png`) | Yoast-level | CODE (large) | FG-009 |
| Accessibility | 3 boards (Preview a11y checker = Figma-only; contrast in Issues) | Alt-text / broken-link scanner in Issues; contrast in Brand checks; **no a11y checker**; a11y.css focus / reduced motion | One a11y report before publish | FIGMA + CODE | FG-026 |
| Onboarding / tips | Add first-use tip, rail tooltip, START HERE (designer-facing) | Checklist, AchievementPrompt, RailCoach, "Getting started" replay (`onboarding/*`, mounted `AquibraStudio.tsx:828`) | First-run guidance | CODE with no board | FG-036 |
| Commerce | 4 STATE boards (setup / sample-added / bound) | Partial: setup modal only (`ecommerce/CollectionSetupModal.tsx`); no server router | Product catalogue + checkout | Missing in both beyond setup | FG-037 |
| Compare / Time travel | Compare ×5 (side by side / overlay / list) | Yes: `shell/CompareHost.tsx`, `TimeTravelHost.tsx` | Diff versions | Aligned | — |

---

## 4. Explicit lists

### 4a. Boards with no code (designed, not built)
- **SEO-M2a, M3–M3d (Readability), M5–M5d (schema type, canonical validation, hidden-from-search under Advanced), M6 / M6b (Fix hand-off with dirty guard)**: 12 boards. FG-007 / FG-010.
- **SEO-M8–M8d structured data, M9–M9d sitemap, M10–M10d pages overview**: 12 boards. FG-009. **SEO-M11 Pages SEO dot**: FG-008.
- **Review v2** (28 boards): the panel layout and states are not built. FG-001 / FG-004.
- **Brand Part 1 M4, M7, M9, M10 (UI), M11, M12** and parts of M2 / M5 / M6 / M8: 1b/1c are planned but not merged. FG-015a…i.
- **Brand AI** `7904:196849`, `7904:196860`. FG-016.
- **Inspector · Visibility condition** ×5 `7897:196560…196752`. FG-021.
- **AI assistant · Applied draft · Canvas** `7906:196898`. FG-023.
- **Forms workspace · Submissions** `7889:196284`. FG-031.
- **Client sign-off · pin on snapshot** C-03 `7593:193511`. FG-006.
- **Preview · accessibility checker** `4418:141508`. FG-026.
- **Commerce · sample-added / bound** `4418:145403`, `4418:145614`. FG-037.
- **Theme-toggle block** ×6 `8228:*` / `8230:232749`. FG-015a.

### 4b. Code features with no board
- **Settings:** Security headers screen (`settings/screens/*`; 0 boards). FG-032.
- **Domains:** DNS records card, Check DNS, Force HTTPS (DNS-M paused). FG-034.
- **Onboarding:** Checklist, AchievementPrompt, RailCoach, "Getting started" replay. FG-036.
- **Review panel extras:** per-row Copy link, `unchecked` publish gate ("Couldn't check this site's review settings" + Retry, `lifecycle.ts:308-317`), "Withdraw request" wording. Part of FG-004.
- **Pages:** "From template" next to Add page (LIVE `e3-pages.png`).
- **Layers:** Layer display settings, Move to page dialog (`panels/layers/components/*`).
- **Media:** storage quota bar, import from URL, Site fonts modal, move-failed modal.
- **Canvas:** X-Ray and Badges overlays (`CanvasFooterToolbar.tsx:143-150`); invalid-drop feedback (`DropFeedbackOverlay.tsx:20-23`).
- **Activity:** permission state.
- **Templates:** "Replace without a backup" + backup checkbox (`templates/TemplatesTabModals.tsx:78-85`). FG-038.

### 4c. Boards that are incomplete or logically wrong
- **Two CURRENT Review designs.** The shells link only the old one (FG-002). The v2 not-sent board dims Publish even for approval-optional workspaces (FG-003).
- **51 / 84 new Settings + SEO boards are unreachable**, and the new Settings state boards cannot navigate between Settings screens (FG-013).
- **Brand Part 1 error branches are unreachable:** Brand-from-logo no-colours / timeout / address-refused; Read-only upgrade-paused / rolled-back; Restore points empty; Dark mode preview-disabled; Review changes stale (FG-014). The flow starts but cannot reach its failures.
- **Brand Colours "unsaved change (dirty)"** `7842:194805` contradicts Part 1 "Header without Save" `8222:232627` and the code's autosave (FG-019).
- **~500 shells' inspector tab strip says "Settings"**; Inspector v4 and code say "Behaviour" (FG-020).
- **Review v2 boards draw the floating canvas footer**, which the 10-04 change docked (FG-040).
- **History still draws a Backups tab** after the owner folded it into Saves (FG-033).
- **Notifications board is "all sites"** after the owner scoped it to the site (FG-035).
- **Connect AI provider** board vs the shipped owner-managed AI model (FG-024); **AI pending · Hero Inspector** superseded by Inspector v4 #35 "AI column" (FG-025).
- **Brand kind boards** (`7979:*`, 11) sit loose outside any section (FG-018).

### 4d. Screens / states missing in both
- Form building and submission failure states: field validation error, submit failed on a published site, spam / empty inbox (FG-032b).
- A single accessibility report (contrast, alt text, heading order, focus) as a publish input (FG-026).
- Commerce beyond setup: product list, checkout / Stripe states (FG-037).
- Invalid drop / not-allowed drag state as a board (code has it; Figma none) and **wide-breakpoint editing rules** (FG-029, FG-042).
- Domain verification lifecycle (verifying / failed / SSL pending): DNS-M paused and code states not checked here (FG-034).

---

## 5. Issues

### FG-001 Review panel v2 redesign (03 Oct) is not implemented
- Module / Screen-location / Feature: Review / right-column Review panel / whole panel
- Labels: CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Design
- Severity: High
- Problem: Figma's 28-board Review v2 has a different structure from the shipped panel:
  - a status card (title + round · who · when + explanation)
  - one primary CTA ("Invite a client" / "Send new review")
  - an Open N / Resolved N segmented switch, with a "N open comments · Next →" row
  - comment cards with Locate / Resolve
  - a docked team composer ("Home · Page comment · Team only … Send")

  The code still renders the pre-v2 panel.
- Expected behavior: the panel matches the v2 boards visually (board wins on visuals); behaviour stays on the code contract.
- Current behavior: LIVE, observed `work-FG/e2-review.png`. The empty state is a centred icon + "No review yet / Send this site to a client…" with the "Send for review" button at the panel foot. There is no Open/Resolved switch and no team composer in this state. Compare `work-FG/fig-review-v2-not-sent.png` and `fig-review-v2-changes-requested.png`.
- Figma status: `8165:219395` not-sent, `8165:220437` changes-requested, plus 23 more in section `8165:219385`
- Code status: `sidebar/tabs/review/ReviewTab.tsx` (last commit to the folder 2026-09-26; nothing since 10-01)
- Integration impact: none on data; reviews.* contracts unchanged
- Probable root cause: redesign drawn after the last implementation pass; never scheduled
- Dependencies: FG-002 (Figma must declare v2 the one design)
- Recommended next action: confirm v2 supersedes the old Review family, then rebuild `ReviewTab` per board (the figma-design-to-code loop)
- Evidence: LIVE-VERIFIED (empty state) + CODE-ONLY (other states)

### FG-002 Two "CURRENT DESIGN" Review designs; shells link only the old one
- Module / Screen-location / Feature: Review / topbar `chip/review` / prototype routing
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Design
- Severity: High
- Problem: base shells `4418:123573` and `4418:81300` route `chip/review` to `4418:116906` / `4418:115784` (the old Review family). The 28 v2 boards have no inbound link from any shell. Both families carry the `CURRENT DESIGN ·` prefix, so the source of truth for Review is ambiguous.
- Expected behavior: one current Review design. The other is ARCHIVE-stamped and shell doors are retargeted.
- Current behavior: Figma call 5 (`work-FG/r5.txt`). The reaction graph shows Review v2 boards are reachable only inside their own section and from START HERE `8167:227951`.
- Figma status: old `4418:115784` / `4418:116906` / `4418:120342`…; new section `8165:219385`
- Code status: n/a
- Integration impact: an implementer cannot tell which board to build to
- Probable root cause: redesign drawn as a separate section; retargeting skipped
- Dependencies: owner confirmation
- Recommended next action: archive old Review boards, retarget the chip on the topbar master / per-board overrides (trap: master reactions are refused — use per-board overrides)
- Evidence: LIVE-VERIFIED (Figma read)

### FG-003 Review v2 "not-sent" dims Publish regardless of approval policy
- Module / Screen-location / Feature: Review / topbar Publish / gating
- Labels: FIGMA ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Medium
- Problem: the board draws Publish dimmed whenever no review was sent. The code contract distinguishes the two workspace policies:
  - **Approval required:** CTA "Send for review", publish gated.
  - **Approval optional:** CTA "Publish", enabled.
- Expected behavior: v2 has a board for the approval-optional case (Publish enabled; the review is something you *may* send).
- Current behavior: LIVE, observed `e2-review.png`: Publish enabled on a not-sent site in this workspace. CODE: `shell/lifecycle.ts:334-360` (approval-optional keeps the publish verb).
- Figma status: `8165:219395`, `8165:219754` (workspace-pending)
- Code status: `shell/lifecycle.ts:338-360`
- Integration impact: none
- Probable root cause: board drawn for the approval-required policy only
- Dependencies: FG-002
- Recommended next action: add a v2 variant for approval-optional workspaces
- Evidence: LIVE-VERIFIED

### FG-004 Review v2 states with no code state
- Module / Screen-location / Feature: Review / panel states
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Missing State
- Severity: Medium
- Problem: several v2 states have no panel equivalent in code:
  - **Missing:** stale-approval (`8165:221853`) and publish-gate (`8167:226212`). Code shows these only in the topbar chip, the modal and the Publish panel.
  - **Partial:** approved (`8165:221512`, status-line tail only); send-failed (`8165:222536`, modal only); feedback-addressed / awaiting-new-round (`8167:225291`, `8170:223589`, banner line only); comment-sent (`8167:227374`, draft just clears); comment-reopened (`8170:223872`, no feedback).
  - **Code-only with no board:** per-row Copy link, the `unchecked` gate (`lifecycle.ts:308-317`), "Withdraw request".
- Expected behavior: every v2 state has a code state; every code state has a board.
- Current behavior: CODE: `ReviewTab.tsx` (state map from code sweep: `:621` not-sent, `:811` resolved, `:797` revoked, `:595` load-error, `:892` located, `:383-463` ⋯ menu)
- Figma status: section `8165:219385`
- Code status: `sidebar/tabs/review/ReviewTab.tsx`
- Integration impact: users get no confirmation for comment send/reopen
- Probable root cause: v2 not built (FG-001)
- Dependencies: FG-001
- Recommended next action: build with FG-001; add boards for the three code-only states
- Evidence: CODE-ONLY

### FG-005 (withdrawn: the v2 "email failed → keep round + Copy link" rule is already met by `shell/modals/ReviewSentModal.tsx:61-100`)

### FG-006 Client viewer cannot place located pins (owner decision C-03)
- Module / Screen-location / Feature: Review / dashboard `/review/<token>` / client feedback
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Medium
- Problem: on 09-21 the owner chose located pins for client feedback, and board C-03 `7593:193511` was built. The client page still sends text only.
- Expected behavior: the client clicks on the snapshot → pin + draft popover → comment arrives located (as the designer panel already expects).
- Current behavior: CODE: `packages/dashboard/app/review/[token]/review-client.tsx:300-345` sends `{token, body}` only; the snapshot iframe has no script access.
- Figma status: `7593:193511` (C-03)
- Code status: `review-client.tsx:300-345`
- Integration impact: the designer's Review panel groups by page/element, but client comments arrive unlocated
- Probable root cause: owner decision recorded as a Tier-3 code row, never built
- Dependencies: snapshot rendering with selector capture
- Recommended next action: implement the pin layer over the snapshot (same-origin overlay, not iframe script)
- Evidence: CODE-ONLY

### FG-007 Page SEO drawer: no Readability, focus keyphrase, schema type or canonical validation
- Module / Screen-location / Feature: SEO (page) / Pages ⋯ → Page settings / analysis
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: High
- Problem: SEO-M1…M5d design a Yoast-level page drawer:
  - focus keyphrase
  - Desktop/Mobile Google preview
  - Problems / Improvements / Good results with Fix
  - a Readability tab with unsupported-language / empty-page / CMS-template states
  - Social tab with linked / independent X / site-default image
  - Advanced tab with web-page / article schema, invalid canonical, hidden-from-search

  The owner decided 2026-10-04 to build "Yoast-level SEO (all 4)".
- Expected behavior: per boards.
- Current behavior: LIVE, observed `work-FG/e4-pagesettings.png`. A centred **modal** "Page settings — Home" with tabs SEO (40) / Social / Advanced. Fields: slug, meta title, meta description, indexing select, plus a points checklist ("Page title +30, Meta description +40…"), with Cancel / Done. There is no keyphrase, no Readability tab, no problems/improvements list and no mobile preview. Board: `work-FG/fig-8197-224150.png`, a right-docked drawer with Discard / Save.
- Figma status: `8197:224150`, `8197:224590`, `8197:225020`, `8198:225605`…`8198:229662`
- Code status: `sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx:32-34`, `SeoTab.tsx`, `AdvancedTab.tsx:5` ("canonical URL comes later")
- Integration impact: publish-check "SEO" row and page score use a different model (points) from the board (problems list)
- Probable root cause: boards delivered 10-04; implementation not started
- Dependencies: decision on container (drawer vs modal) and on the save model (Discard/Save vs Cancel/Done)
- Recommended next action: plan the SEO arc from SEO-M1…M6; first reconcile container and save verbs
- Evidence: LIVE-VERIFIED

### FG-008 Pages panel SEO dot missing
- Module / Screen-location / Feature: Pages / page row / SEO health indicator
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: UX
- Severity: Low
- Problem: SEO-M11 shows a per-row SEO status dot; code rows carry only the unsaved dot.
- Expected behavior: dot per row coloured by page SEO state, opening SEO-M1.
- Current behavior: LIVE `e3-pages.png` (single Home row, no SEO dot). CODE: `sidebar/tabs/pages/components/PageRow.tsx:51,365`; the warning dot exists only on the drawer tab (`PageSettingsDrawer.tsx:147`).
- Figma status: `8202:231195`
- Code status: `PageRow.tsx:51,365`
- Integration impact: none
- Probable root cause: not built
- Dependencies: FG-007 (score source)
- Recommended next action: build with FG-007
- Evidence: LIVE-VERIFIED

### FG-009 Site SEO: no structured data, sitemap, pages overview or search/social previews
- Module / Screen-location / Feature: SEO (site) / Settings › SEO
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: High
- Problem: the boards define four things the code lacks:
  - **SEO-M7:** Google + Facebook/X previews on defaults.
  - **M8–M8d:** Organization / Local business / Person structured data, with a field error state.
  - **M9–M9d:** sitemap card in published / not-published / indexing-off / manage states.
  - **M10–M10d:** a pages overview (default / loading / empty / worst-first).

  M12 has canonical with a verified primary domain; code has free text only.
- Expected behavior: per boards.
- Current behavior: LIVE `e4-settings-seo.png`: Defaults (title, description, OG image URL), Social profiles card, Indexing ›, with no previews. LIVE `e4-settings-search.png`: Settings search for "sitemap" → "No settings match". CODE: `settings/screens/SeoScreen.tsx:64,123,169,390`; JSON-LD only automatic (`engine/export/SEOInjector.ts:207-221`).
- Figma status: `8200:229488`…`8200:232687`, `8202:231596`
- Code status: `SeoScreen.tsx`
- Integration impact: published sites lack sitemap UI control and business schema
- Probable root cause: not started
- Dependencies: domain verification for the M12 canonical
- Recommended next action: schedule with FG-007; the Social profiles card (code-only) should be placed on a board
- Evidence: LIVE-VERIFIED

### FG-010 SEO "Fix" hand-off to the element (with dirty guard) missing
- Module / Screen-location / Feature: SEO / page drawer → canvas
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Integration
- Severity: Medium
- Problem: SEO-M6 / M6b: Fix on "Add alt text to the dining-room image" closes the drawer and highlights the image. If the drawer has unsaved edits, a guard asks first.
- Expected behavior: per boards.
- Current behavior: CODE: Fix › exists only in pre-publish checks (`sidebar/tabs/publish/PrePublishChecks.tsx:73-84`). The drawer guard covers only "Site SEO defaults ›" (`PageSettingsDrawer.tsx:101-104`).
- Figma status: `8200:228777`, `8200:229123`
- Code status: as above
- Integration impact: SEO problems cannot be fixed from where they are reported
- Probable root cause: depends on FG-007's problem list
- Dependencies: FG-007
- Recommended next action: build with FG-007
- Evidence: CODE-ONLY

### FG-011 Social tab: no explicit linked vs independent X switch
- Module / Screen-location / Feature: SEO (page) / Social tab
- Labels: CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: UX
- Severity: Low
- Problem: SEO-M4b designs an explicit "X uses its own values" switch; code inherits implicitly.
- Expected behavior: per board.
- Current behavior: CODE `page-settings/SocialTab.tsx:2,43,80`
- Figma status: `8198:227181`, `8198:227594`, `8198:228023`
- Code status: `SocialTab.tsx`
- Integration impact: none
- Probable root cause: not built
- Dependencies: FG-007
- Recommended next action: include in the SEO arc
- Evidence: CODE-ONLY

### FG-012 Page settings container and save verbs differ from the board
- Module / Screen-location / Feature: Pages / Page settings
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Medium
- Problem: the board is a right-docked drawer covering the inspector column, with a footer "Unsaved changes · Discard · Save" and the canvas still visible. Code is a centred modal with Cancel / Done that blocks the canvas. Visuals and layout follow the board. The verbs also differ from Settings (Discard / Save).
- Expected behavior: drawer per SEO-M1, Discard / Save as in Settings.
- Current behavior: LIVE `e4-pagesettings.png` vs `fig-8197-224150.png`
- Figma status: `8197:224150`
- Code status: `sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx` (named "Drawer", renders as a dialog)
- Integration impact: SEO-M6 hand-off needs the canvas visible, which needs the drawer
- Probable root cause: earlier design
- Dependencies: FG-007
- Recommended next action: change the container while building FG-007
- Evidence: LIVE-VERIFIED

### FG-013 51 of 84 new Settings/SEO boards are unreachable; new Settings states cannot navigate
- Module / Screen-location / Feature: Settings, SEO, CMS / prototype
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Design
- Severity: Medium
- Problem: these boards have **0 inbound links** anywhere on the page:
  - 26 Settings state boards (General scope/read-only/saved/default/slug ×3, Languages remove, SEO default/indexing-off, Domains scope/set-primary, Redirects import ×3, Access pro-locked, Form submissions inbox, Overview pending-deletion, Danger zone ×7, Integrations door)
  - 4 CMS boards (record conflict, record deleted, collection deleted, publish blocked)
  - 10 SEO drawer variants and 8 SEO settings variants
  - the SEO checks library, the three-selected Layers state and the handoff board itself

  The Settings state boards each link to exactly one destination (the unsaved-settings overlay `4418:165478`); their sidebar items do not navigate.
- Expected behavior: every CURRENT state is reachable from its trigger (e.g. slug-taken from General › slug edit) and sidebar nav works.
- Current behavior: Figma call 4, `work-FG/r3.txt` (in/out counts per board)
- Figma status: e.g. `8135:213221` slug-taken, `8137:217905` delete-confirm, `8139:218055` CMS publish blocked
- Code status: n/a
- Integration impact: prototype reviews and designer walk-throughs miss these states
- Probable root cause: boards cloned as static states for the 10-04 handoff; the handoff doc itself says interactions are "representative paths"
- Dependencies: none
- Recommended next action: wire triggers (one batched `use_figma` per screen); retarget sidebar items in the new state boards
- Evidence: LIVE-VERIFIED (Figma read; caveat on lazy instance children)

### FG-014 Brand Part 1 error and edge branches are unreachable
- Module / Screen-location / Feature: Brand / Part 1 flows
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Medium
- Problem: 12 of 48 boards have 0 inbound:
  - Brand from logo/website: `8224:247700` preview, `8224:248332` no-colours, `8224:248970` timeout, `8224:249604` address-refused
  - Read-only: `8222:229636` upgrade-paused, `8222:230245` rolled-back
  - `8222:232022` Review changes stale
  - `8224:236852` Connect nothing-to-connect
  - `8224:241285` Dark preview-disabled
  - `8224:245178` Restore points empty
  - `8228:233827` Theme-toggle off-hidden-on-publish
  - handoff `8230:233164`

  The happy path goes source → loading → confirmed while preview and every failure are unreachable. The flow starts and cannot show how it fails.
- Expected behavior: loading branches to preview / failures; each failure returns to source.
- Current behavior: Figma call 4
- Figma status: section `8220:229015`
- Code status: features not built (FG-015)
- Integration impact: implementers will build happy paths only
- Probable root cause: states drawn, conditional branches not wired
- Dependencies: none
- Recommended next action: wire before Part 1b implementation starts
- Evidence: LIVE-VERIFIED (Figma read)

### FG-015a Theme-toggle block not built
- Module / Screen-location / Feature: Brand / Add panel + published site
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Medium
- Problem: BRP1-M12 (6 boards) adds a light/dark toggle block that works on the published site and hides on publish when dark mode is off.
- Expected behavior: per boards.
- Current behavior: CODE: no catalog entry (`sidebar/tabs/build/catalog/catalog.ts`). Only an editor-side `design-system/ui/ColorModeToggle.tsx` exists.
- Figma status: `8228:232784`, `8228:233132`, `8228:233404`, `8228:233676`, `8228:233827`, `8230:232749`
- Code status: missing
- Integration impact: dark mode tokens have no visitor-facing switch
- Probable root cause: Part 1b/1c not merged (`docs/superpowers/plans/2026-10-08-brand-part1b-binding.md` on an unmerged branch)
- Dependencies: FG-015f
- Recommended next action: per Part 1 plan
- Evidence: CODE-ONLY

### FG-015b Brand from logo or website not built
- Module / Screen-location / Feature: Brand / generators
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Medium
- Problem: BRP1-M11 (7 boards) is not built.
- Expected behavior: per boards.
- Current behavior: CODE: none
- Figma status: `8224:246458`…`8224:250233`
- Code status: missing
- Integration impact: needs a server fetch with SSRF guard ("address-refused" board implies it)
- Probable root cause: Part 1c
- Dependencies: FG-014 wiring
- Recommended next action: plan with an explicit SSRF/timeout contract
- Evidence: CODE-ONLY

### FG-015c Colour scale generator not built
- Module / Screen-location / Feature: Brand / Colours
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Low
- Problem: BRP1-M9 (4 boards) is not built.
- Expected behavior: per boards.
- Current behavior: CODE: none
- Figma status: `8224:241925`…`8224:243869`
- Code status: missing
- Integration impact: none
- Probable root cause: Part 1c
- Dependencies: none
- Recommended next action: per plan
- Evidence: CODE-ONLY

### FG-015d Restore points have server support but no UI
- Module / Screen-location / Feature: Brand / Restore points
- Labels: CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Functional
- Severity: Medium
- Problem: BRP1-M10 (list / empty / restored) is designed. The server has `brandRestorePoints` (`server/trpc/routers/theme.ts:162`, `server/services/theme.service.ts:556`) but the editor has no UI. The Part 1 handoff says every Confirm/Apply creates a restore point.
- Expected behavior: per boards.
- Current behavior: CODE: server only
- Figma status: `8224:244521`, `8224:245178`, `8224:245787`
- Code status: as above
- Integration impact: a backend capability with no door
- Probable root cause: Part 1b
- Dependencies: none
- Recommended next action: build UI over the existing procedure
- Evidence: CODE-ONLY

### FG-015e Connect to tokens not built
- Module / Screen-location / Feature: Brand / binding
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Medium
- Problem: BRP1-M7 (5 boards) is not built.
- Expected behavior: per boards.
- Current behavior: CODE: none
- Figma status: `8224:234362`…`8224:236852`
- Code status: missing (Part 1b plan unmerged)
- Integration impact: raw values stay unbound
- Probable root cause: Part 1b
- Dependencies: Part 1b plan
- Recommended next action: per plan
- Evidence: CODE-ONLY

### FG-015f Dark mode controls (off / auto / generated aliases / preview-disabled) partial
- Module / Screen-location / Feature: Brand / Colour mode
- Labels: CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Functional
- Severity: Medium
- Problem: the engine supports `darkMode` off/auto and a Light/Dark preview toggle exists. There is no UI to set `darkMode` and no generated aliases.
- Expected behavior: BRP1-M8 boards.
- Current behavior: CODE: `design-system/ui/ProjectTokensApplier.tsx:31-42`, `ColorModeToggle.tsx:49`, `sections/ColourModeSection.tsx:64`. LIVE `e3-brand.png`: tokens show "No dark value · Set" and the per-token warning "missing darkValue".
- Figma status: `8224:238726`…`8230:232622`
- Code status: partial
- Integration impact: published dark mode depends on per-token manual values
- Probable root cause: Part 1b
- Dependencies: none
- Recommended next action: per plan
- Evidence: LIVE-VERIFIED (partial) + CODE-ONLY

### FG-015g Safe delete states partial
- Module / Screen-location / Feature: Brand / token delete
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Medium
- Problem: replacement-required exists. Unused tokens delete with **no confirm**, and there are no usage-unknown or replaced states.
- Expected behavior: BRP1-M6 boards.
- Current behavior: CODE `design-system/ui/sections/TokenReplaceModal.tsx:1-13`
- Figma status: `8224:231573`, `8224:232280`, `8224:232979`, `8224:233678`
- Code status: partial
- Integration impact: deleting a token whose usage cannot be computed is unguarded
- Probable root cause: Part 1b
- Dependencies: token usage (FG-015i)
- Recommended next action: per plan
- Evidence: CODE-ONLY

### FG-015h Theme push results not built
- Module / Screen-location / Feature: Brand / theme push
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Missing State
- Severity: Low
- Problem: BRP1-M4 (skipped-and-recapture) is not built.
- Expected behavior: per board.
- Current behavior: CODE: none
- Figma status: `8222:233199`
- Code status: missing
- Integration impact: users are not told which sites skipped a theme push
- Probable root cause: Part 1b
- Dependencies: none
- Recommended next action: per plan
- Evidence: CODE-ONLY

### FG-015i Review-changes empty state and token-usage "unknown" missing
- Module / Screen-location / Feature: Brand / header + token detail
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Low
- Problem: the Review changes button is hidden at 0 edits, but the board draws an empty state. Token usage has counts and highlight but no "unknown".
- Expected behavior: BRP1-M2 empty, BRP1-M5 unknown.
- Current behavior: CODE `design-system/ui/SessionEditsPopover.tsx:86-117`, `BrandWorkspace.tsx:799`, `sections/TokenDetailView.tsx:158-169`
- Figma status: `8222:230854`, `8224:230173`
- Code status: partial
- Integration impact: none
- Probable root cause: Part 1a scope
- Dependencies: none
- Recommended next action: decide whether to hide or show an empty state; update board or code
- Evidence: CODE-ONLY

### FG-016 Brand AI shared-style proposal boards have no code
- Module / Screen-location / Feature: Brand / AI
- Labels: CODE ONLY ISSUE, AI ISSUE, MISSING FUNCTIONALITY
- Category: Nice-to-have enhancement
- Type: AI
- Severity: Low
- Problem: "Brand AI · Review shared style proposal" and "Brand · Shared styles · AI styles added" are designed. The only Brand AI surface in code generates a component schema.
- Expected behavior: per boards (or archive them).
- Current behavior: CODE `design-system/ui/AIPromptModal.tsx:1-20`
- Figma status: `7904:196849`, `7904:196860`
- Code status: missing
- Integration impact: none
- Probable root cause: not scheduled
- Dependencies: NEXT_PUBLIC_FEATURE_DS_AI
- Recommended next action: owner decision: plan or mark PLANNED
- Evidence: CODE-ONLY

### FG-017 A brand-new site opens Brand with 8 Brand-check warnings from its own default tokens
- Module / Screen-location / Feature: Brand / Brand checks
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: UX
- Severity: Low
- Problem: a freshly created blank site shows "Brand checks 8". The first token detail shows "Color token 'color-action' missing darkValue. Will fall back to light value in dark mode." Defaults that fail their own lint teach users to ignore warnings.
- Expected behavior: a new site's default token set is lint-clean (seed dark values, or don't lint the missing-dark rule while dark mode is off).
- Current behavior: LIVE, observed `work-FG/e3-brand.png` (site created minutes earlier, no edits)
- Figma status: not checked (no Brand-checks-on-new-site board found by name)
- Code status: `design-system/state/useDSLint` (rule source not traced)
- Integration impact: the Issues panel count also inflates (DS-lint feeds it)
- Probable root cause: default token seed lacks darkValue on 8 tokens
- Dependencies: FG-015f
- Recommended next action: seed dark values or gate the rule on dark mode ≠ off
- Evidence: LIVE-VERIFIED

### FG-018 Brand token-kind pages: Figma draws 11 loose boards, code hides them behind a disclosure with a stale comment
- Module / Screen-location / Feature: Brand / Radius, Shadow, Motion, … Imagery
- Labels: FIGMA + CODE ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: since 09-21 Figma has 11 "Brand workspace · <kind>" boards (`7979:197331`…`7979:202451`). They sit outside any section, so they are not part of a navigable section. Code says "token kinds no workspace board draws (03 G3-130)" and puts them behind a "more kinds" disclosure; live nav shows 11 items without them.
- Expected behavior: one IA. Either kinds are first-class nav items (board) or a disclosure (code). Boards are filed in the Brand section.
- Current behavior: CODE `design-system/ui/BrandWorkspace.tsx:107-137`; LIVE `e3-brand.png`
- Figma status: `7979:*` loose
- Code status: as above
- Integration impact: none
- Probable root cause: boards drawn after the code comment
- Dependencies: none
- Recommended next action: owner picks; update the code comment or the boards
- Evidence: LIVE-VERIFIED (nav) + Figma read

### FG-019 Brand Colours "unsaved change (dirty)" board contradicts autosave and Part 1 "Header without Save"
- Module / Screen-location / Feature: Brand / Colours
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Medium
- Problem: `7842:194805` designs a dirty/unsaved state. BRP1-M3 `8222:232627` and the Part 1 handoff ("No Save / Apply on ordinary token edits") and code (autosave + one undo stack) all say no save step. Figma contradicts itself.
- Expected behavior: archive or relabel `7842:194805`.
- Current behavior: CODE `BrandWorkspace.tsx:31-35`; LIVE: no Save in header (`e3-brand.png`)
- Figma status: `7842:194805` vs `8222:232627`
- Code status: autosave
- Integration impact: an implementer could add a Save button back
- Probable root cause: board predates the Part 1 decision
- Dependencies: none
- Recommended next action: ARCHIVE-stamp `7842:194805`
- Evidence: LIVE-VERIFIED

### FG-020 ~500 shells label the inspector's middle tab "Settings"; Inspector v4 and code say "Behaviour"
- Module / Screen-location / Feature: Inspector / tab strip
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Medium
- Problem: the base shell `4418:123573` (and its clones) has tabs Style / **Settings** / Effects, with `tab/Settings` → `4428:141642` "Inspector · Settings tab". Approved Inspector v4 `8021:206877` (36 boards) uses S / **B** / E, and code ships Style · Behaviour · Effects.
- Expected behavior: shells use the v4 tab strip; the "Settings tab" boards are archived or renamed.
- Current behavior: Figma call 7 (`work-FG/r6.txt`); CODE `inspector/sections/registry/_shared.tsx:47-49`
- Figma status: `4418:123573` tabs; `4428:141642`, `4428:141878` (Settings tab · Form)
- Code status: Behaviour
- Integration impact: designers keep drawing against a superseded IA
- Probable root cause: v4 approved as a standalone sheet; shells not propagated
- Dependencies: the tab-strip component on the inspector master
- Recommended next action: update the inspector tab component once (instances propagate); archive Settings-tab boards
- Evidence: LIVE-VERIFIED (Figma read)

### FG-021 Inspector "Visibility condition" (CMS-conditional visibility) has no code
- Module / Screen-location / Feature: Inspector / Behaviour / visibility
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Medium
- Problem: 5 boards (Hero / Heading / Image / Button / Price) design a visibility rule per element, implying CMS field conditions. Code has only Desktop / Tablet / Mobile checkboxes.
- Expected behavior: conditional visibility on CMS-bound templates (e.g. hide Price when empty). It is logically needed for collection templates.
- Current behavior: CODE `inspector/sections/VisibilitySection.tsx:1-25`
- Figma status: `7897:196560`, `7897:196608`, `7897:196656`, `7897:196704`, `7897:196752`
- Code status: missing
- Integration impact: needs a publish-time evaluator in CMS export
- Probable root cause: designed 09-2x, not scheduled
- Dependencies: CMS binding, export
- Recommended next action: owner scope decision; then engine + export + inspector
- Evidence: CODE-ONLY

### FG-022 Effects "MORE EFFECTS" expander vs code's flat section split
- Module / Screen-location / Feature: Inspector / Effects
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: the board `7832:194010` folds secondary effects behind "MORE EFFECTS". Code lists Opacity · Shadow · Filters · Transform/Motion · Advanced as separate sections without an expander. Layout follows the board.
- Expected behavior: per board.
- Current behavior: CODE `inspector/config/sectionOrder.ts:42-48`, `sections/effects/EffectsAdvancedSection.tsx:4`
- Figma status: `7832:194010`, `7831:193140`
- Code status: CHANGED
- Integration impact: none
- Probable root cause: board drawn after the code
- Dependencies: none
- Recommended next action: conform to board
- Evidence: CODE-ONLY

### FG-023 AI "Applied draft · Canvas" state missing
- Module / Screen-location / Feature: AI / assistant → canvas
- Labels: CODE ONLY ISSUE, AI ISSUE, MISSING FUNCTIONALITY
- Category: Incomplete existing feature
- Type: AI
- Severity: Medium
- Problem: the board shows the canvas state after an AI draft is applied (what changed is visible on the canvas). Code shows "N changes applied · Undo all · Done" in the panel only. "Review plan" is also labelled differently: code uses "Edit plan · Run N steps" plus per-step "Apply step".
- Expected behavior: per boards `7906:196898`, `7891:195908` / `7891:196180` (Review plan), `7891:196451` / `7891:196729` (Applied).
- Current behavior: CODE `sidebar/tabs/ai/AgentPlan.tsx:300-320,450-475`
- Figma status: as above
- Code status: partial
- Integration impact: users can't see which elements AI touched
- Probable root cause: board newer than code
- Dependencies: none
- Recommended next action: add a canvas highlight of changed elements after apply
- Evidence: CODE-ONLY (no live AI call made, by budget)

### FG-024 "Connect AI provider" boards contradict the shipped owner-managed AI model
- Module / Screen-location / Feature: AI / unavailable state
- Labels: FIGMA ONLY ISSUE, AI ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: Figma shows users connecting their own provider (`4418:106796`, `6881:76122`). Code shows "AI isn't available on this workspace · View workspace owner ↗". Behaviour follows the code contract.
- Expected behavior: the board matches the code's state.
- Current behavior: CODE `sidebar/tabs/ai/AITab.tsx:298-318`
- Figma status: `4418:106796`, `6881:76122`, `4418:106919` (provider unavailable)
- Code status: shipped
- Integration impact: none
- Probable root cause: stale board
- Dependencies: none
- Recommended next action: redraw or archive
- Evidence: CODE-ONLY

### FG-025 "AI pending · Hero Inspector" board superseded by Inspector v4 "AI column"
- Module / Screen-location / Feature: AI / inspector
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: `4418:172567` shows an AI pending state inside the Inspector. Code swaps the AI panel into the inspector column (`shell/StudioPanels.tsx:329,471`), matching v4 #35 "AI column".
- Expected behavior: archive `4418:172567`.
- Current behavior: CODE as cited
- Figma status: `4418:172567`; v4 sheet `8021:206877` #35
- Code status: shipped
- Integration impact: none
- Probable root cause: stale board
- Dependencies: none
- Recommended next action: ARCHIVE-stamp
- Evidence: CODE-ONLY

### FG-026 No accessibility checker in either Figma or code as a coherent module
- Module / Screen-location / Feature: Accessibility / Preview + Issues
- Labels: FIGMA + CODE ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Functional
- Severity: Medium
- Problem: Figma has one design-only board, "Preview · accessibility checker" `4418:141508`, annotated NOT IMPLEMENTED on 09-21. Code spreads a11y across three places: alt-text and broken-link scanning in Issues, contrast in Brand checks, and focus / reduced-motion CSS. There is no single report (heading order, contrast on real elements, form labels, link names) and none is a publish input.
- Expected behavior: one a11y report reachable from Preview/Issues; severity feeds the publish errors gate.
- Current behavior: CODE `shell/IssuesPanel.tsx:1-70` (sources); `shell/PreviewOverlay.tsx` (no checker)
- Figma status: `4418:141508` only
- Code status: partial / missing
- Integration impact: WCAG regressions ship unseen
- Probable root cause: never scoped
- Dependencies: Issues pipeline
- Recommended next action: design one Issues "Accessibility" category (board) + extend the scanner
- Evidence: CODE-ONLY

### FG-027 Issues empty state says "No brand issues." while the panel also carries content issues
- Module / Screen-location / Feature: Issues / empty state
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: UX
- Severity: Low
- Problem: the panel aggregates DS-lint, alt text, broken links and the publish-check bridge, but its empty copy is "No brand issues.". The board says "No issues. This page is ready to publish."
- Expected behavior: board copy.
- Current behavior: CODE `shell/IssuesPanel.tsx:239`
- Figma status: `4418:47609`
- Code status: as above
- Integration impact: none
- Probable root cause: copy predates the content scanner
- Dependencies: none
- Recommended next action: change copy
- Evidence: CODE-ONLY

### FG-028 Issue-resolved toast missing
- Module / Screen-location / Feature: Issues / fix success
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Low
- Problem: the board `6749:58662` confirms a fix. In code the issue silently drops off the list; only a failed fix shows a message.
- Expected behavior: toast (with Undo, since auto-fix is one undo step).
- Current behavior: CODE `shell/IssuesPanel.tsx:160-174`
- Figma status: `6749:58662`
- Code status: missing
- Integration impact: none
- Probable root cause: not built
- Dependencies: none
- Recommended next action: add toast
- Evidence: CODE-ONLY

### FG-029 Wide breakpoint drawn in Figma, absent from the code's breakpoint menu
- Module / Screen-location / Feature: Responsive / breakpoint menu
- Labels: FIGMA + CODE ISSUE
- Category: Incomplete existing feature
- Type: Functional
- Severity: Medium
- Problem: Figma draws editing at Wide (`4418:166009` Home Heading · Wide, plus Contact Heading · Wide). Code defines `wide` (1920) in `DEVICE_PREVIEW_SIZES` but the menu lists Desktop / Tablet / Mobile only. Wide overrides cannot be authored, yet the label can appear. The product needs a decision: is Wide a styling breakpoint (≥1440) or not?
- Expected behavior: consistent. Either Wide is in the menu and supports overrides, or the boards and the constant are removed.
- Current behavior: CODE `canvas/CanvasFooterToolbar.tsx:153-157`, `shared/constants/breakpoints.ts:104`
- Figma status: `4418:166009`, `4418:110422`
- Code status: partial
- Integration impact: export CSS media queries
- Probable root cause: half-retired breakpoint
- Dependencies: engine breakpoint order
- Recommended next action: owner decision
- Evidence: CODE-ONLY

### FG-030 Preview has fixed device widths; no custom width
- Module / Screen-location / Feature: Preview
- Labels: FIGMA + CODE ISSUE
- Category: Nice-to-have enhancement
- Type: UX
- Severity: Low
- Problem: Figma (09-21 C row) drew a custom preview width. Canvas has Custom width (`canvas/controls/CustomWidthModal.tsx`) but Preview is fixed at 1320 / 768 / 375.
- Expected behavior: Preview reuses the canvas custom width, or the board is archived.
- Current behavior: CODE `shell/PreviewOverlay.tsx:70,129-148`
- Figma status: 09-21 C row (annotated)
- Code status: missing
- Integration impact: none
- Probable root cause: not scheduled
- Dependencies: none
- Recommended next action: decide; low effort to reuse canvas custom width
- Evidence: CODE-ONLY

### FG-031 Forms submissions have two homes in Figma; code has one
- Module / Screen-location / Feature: Forms / submissions
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Medium
- Problem: "Forms workspace · Submissions" `7889:196284` (new, in the functional-ownership section) and "Full-screen Settings · Form submissions · inbox" `8136:216977` (new, 10-04, 0 inbound) both design the inbox. Code ships only Settings › Form submissions (delete, spam, archive, CSV, "Configure in Inspector").
- Expected behavior: one home. Settings matches code and the 10-04 handoff.
- Current behavior: CODE `sidebar/tabs/settings/screens/FormsScreen.tsx:1-20`; LIVE: Settings nav has "Form submissions" (`e4-settings.png`)
- Figma status: both ids above
- Code status: Settings only
- Integration impact: none
- Probable root cause: two design passes in parallel
- Dependencies: none
- Recommended next action: archive one (likely the workspace board) or define the workspace as cross-site
- Evidence: LIVE-VERIFIED (nav)

### FG-032 Settings › Security headers has no board
- Module / Screen-location / Feature: Settings / Advanced
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Design
- Severity: Low
- Problem: code ships a Security headers screen; there are 0 boards (name scan of 1,321 boards).
- Expected behavior: a board.
- Current behavior: LIVE `e4-settings.png` (nav item present)
- Figma status: no board
- Code status: `sidebar/tabs/settings/screens/*` (Security headers)
- Integration impact: none
- Probable root cause: code-only
- Dependencies: none
- Recommended next action: draw the board
- Evidence: LIVE-VERIFIED

### FG-032b Form build / submit failure states are missing in both
- Module / Screen-location / Feature: Forms / element + published form
- Labels: FIGMA + CODE ISSUE, MISSING FUNCTIONALITY
- Category: Missing required feature
- Type: Missing State
- Severity: Medium
- Problem: no boards exist for field validation errors, a failed submission on the published site, or an empty / spam-only inbox. Only Inspector v4 #19 "Form · B" and the after-submit settings are drawn. Code paths exist (`lib/publish-forms.ts`, `FormAfterSubmitSection.tsx`), but their failure states were not verified here. Phase-1 05 also notes the dashboard `submissions-panel.tsx:205-229` has no `isError` branch (false empty state).
- Expected behavior: designed and implemented error/empty states end to end.
- Current behavior: UNVERIFIED in code; Figma none
- Figma status: no board
- Code status: `blocks/Forms/*`, `FormsScreen.tsx`
- Integration impact: submissions can fail silently for site visitors
- Probable root cause: forms treated as an element, not a flow
- Dependencies: publish form wiring
- Recommended next action: design the form flow family; verify in code
- Evidence: UNVERIFIED (no submission made)

### FG-033 History still draws a Backups tab after the owner folded it into Saves
- Module / Screen-location / Feature: History
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: the code comment records the owner decision "Saves holds the board's Backups slot". The 09-21 Backups boards remain CURRENT.
- Expected behavior: board shows Session · Saves · Published.
- Current behavior: CODE `sidebar/tabs/history/types.ts:20`, `styles/history.css:43`
- Figma status: History Backups boards (09-21 C row "Backups tab")
- Code status: by design
- Integration impact: none
- Probable root cause: stale board
- Dependencies: none
- Recommended next action: update board
- Evidence: CODE-ONLY

### FG-034 Domain DNS management ships with no boards (DNS-M1…M12 paused)
- Module / Screen-location / Feature: Domains / DNS
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Design
- Severity: Medium
- Problem: code has a DNS records card, Check DNS, Force HTTPS and Remove. The owner paused the DNS boards on 10-04, so the verifying / failed / SSL-pending states are undesigned while live. The code's own state coverage was not checked here.
- Expected behavior: boards for the domain verification lifecycle.
- Current behavior: CODE `sidebar/tabs/settings/screens/DomainsScreen.tsx:346-501`
- Figma status: DNS-M paused; Settings Domains ×5 cover list / set-primary only
- Code status: shipped
- Integration impact: domain connect is a publish dependency (pre-publish "Domain" check)
- Probable root cause: owner pause
- Dependencies: owner
- Recommended next action: un-pause when scheduled; until then record as code-only
- Evidence: CODE-ONLY

### FG-035 Notifications board is "all sites"; code and the owner decision are this-site
- Module / Screen-location / Feature: Notifications
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: `4418:140492` "Notifications — all sites" plus the cross-site confirm `4418:172794`. On 09-21 the owner scoped notifications to the site until a workspace inbox exists. The Activity panel's permission state is also undrawn.
- Expected behavior: board scoped to the site.
- Current behavior: CODE `shell/NotificationPanel.tsx:112`; UNVERIFIED whether the board text changed after 09-21 (not re-read)
- Figma status: `4418:140492`, `4418:172794`
- Code status: site scope
- Integration impact: none
- Probable root cause: stale board
- Dependencies: none
- Recommended next action: re-read and update
- Evidence: CODE-ONLY

### FG-036 Onboarding (checklist, achievement prompt, rail coach) ships with no boards
- Module / Screen-location / Feature: Onboarding / tips
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Design
- Severity: Medium
- Problem: code mounts OnboardingChecklist, AchievementPrompt and RailCoach, plus a "Getting started" replay in the Site menu (LIVE `e2-sitemenu.png`). Figma has only "Add · first-use tip" and a rail tooltip. First-run is the highest-traffic journey, and it is undesigned.
- Expected behavior: boards for each onboarding surface and its states (first run, step done, dismissed, replay).
- Current behavior: CODE `onboarding/*`, `shell/AquibraStudio.tsx:828`
- Figma status: `7054:78348`, `4433:46540` only
- Code status: shipped
- Integration impact: none
- Probable root cause: code-only
- Dependencies: none
- Recommended next action: draw an onboarding family
- Evidence: LIVE-VERIFIED (menu row) + CODE-ONLY

### FG-037 Commerce is incomplete in both
- Module / Screen-location / Feature: Commerce
- Labels: FIGMA + CODE ISSUE, INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Functional
- Severity: Low
- Problem: Figma has 4 STATE boards (setup / sample-added / bound). Code has a setup modal + blocks + Stripe export injector but no server router and no "bound" editor state. Product listing, cart and checkout states are absent in both.
- Expected behavior: a scoped decision: ship it as a complete flow or hide it.
- Current behavior: CODE `ecommerce/CollectionSetupModal.tsx:65-105`, `engine/export/StripeInjector.ts`
- Figma status: `4418:145182`, `4418:145403`, `4418:145614`
- Code status: partial
- Integration impact: a half feature is reachable via StudioModals
- Probable root cause: parked
- Dependencies: owner
- Recommended next action: owner decision; if parked, mark PLANNED in both
- Evidence: CODE-ONLY

### FG-038 Template replace confirm: code adds backup option the board lacks
- Module / Screen-location / Feature: Templates
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: the board `7836:194324` "Replace Home with Restaurant / confirm" has no backup choice. Code titles it "Replace this page with '<template>'?" and adds a backup checkbox plus "Replace without a backup". This is behaviour (a safety net), so the code wins.
- Expected behavior: board shows the backup option.
- Current behavior: CODE `sidebar/tabs/templates/TemplatesTabModals.tsx:78-85,280`
- Figma status: `7836:194324`
- Code status: shipped
- Integration impact: none
- Probable root cause: board newer copy, older behaviour
- Dependencies: none
- Recommended next action: update board
- Evidence: CODE-ONLY

### FG-039 (not filed: page-tab "+" opens the Pages panel in both code and the base shell's prototype (`4418:92256`); consistent)

### FG-040 Review v2 boards draw the floating canvas footer the 10-04 change docked
- Module / Screen-location / Feature: Canvas / footer toolbar
- Labels: FIGMA ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: the 10-04 Group 3 change "dock footer toolbar" was applied to existing boards. The Review v2 boards (03 Oct) still show a rounded floating bar inset in the canvas. Live is docked full-width.
- Expected behavior: docked bar on every CURRENT shell.
- Current behavior: `work-FG/fig-review-v2-not-sent.png` vs LIVE `e2-review.png`
- Figma status: section `8165:219385`
- Code status: docked (`canvas/CanvasFooterToolbar.tsx`)
- Integration impact: none
- Probable root cause: v2 drawn a day before the docking pass
- Dependencies: FG-002
- Recommended next action: fix while consolidating Review
- Evidence: LIVE-VERIFIED

### FG-041 Add panel has no loading / error rows
- Module / Screen-location / Feature: Add
- Labels: CODE ONLY ISSUE, MISSING FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Low
- Problem: Figma (09-21 C row) draws loading and error rows in the Add list. Code shows only a toast "Couldn't add component".
- Expected behavior: per board.
- Current behavior: CODE `sidebar/tabs/build/BuildTab.tsx:144-145`
- Figma status: 09-21 C row "Add Soon/loading/error rows" (Soon now built)
- Code status: partial
- Integration impact: none
- Probable root cause: not built
- Dependencies: none
- Recommended next action: add rows
- Evidence: CODE-ONLY

### FG-042 Drag & drop: the invalid-drop state ships with no board
- Module / Screen-location / Feature: Drag & Drop
- Labels: FIGMA ONLY ISSUE
- Category: Incomplete existing feature
- Type: Missing State
- Severity: Low
- Problem: code shows a red outline plus a spoken reason ("Text cannot contain elements"). Figma has dragging states (S3.1, Layers dragging) but no not-allowed state.
- Expected behavior: board for invalid drop.
- Current behavior: CODE `canvas/overlays/DropFeedbackOverlay.tsx:20-23,63-64,120`
- Figma status: `4418:126318`, `4418:80489` (valid drag only)
- Code status: shipped
- Integration impact: none
- Probable root cause: code-only
- Dependencies: none
- Recommended next action: draw
- Evidence: CODE-ONLY

### FG-043 CMS Date field has no type-specific configuration; code comment says "no boards"
- Module / Screen-location / Feature: CMS / field config
- Labels: CODE ONLY ISSUE
- Category: Incomplete existing feature
- Type: Functional
- Severity: Low
- Problem: boards "Configure Long text field" `7978:197166` and "Configure Date field" `7978:197182` now exist. Code gives Long text min/max length, gives Date nothing, and its comment still says "no boards".
- Expected behavior: per boards (format, min/max date, etc.).
- Current behavior: CODE `cms/AddFieldDialog.tsx:11`, `cms/FieldInspector.tsx:44`
- Figma status: as above
- Code status: partial
- Integration impact: date rendering format on published pages
- Probable root cause: boards drawn after the code
- Dependencies: none
- Recommended next action: conform to boards
- Evidence: CODE-ONLY

### FG-044 Create site "Start from Scratch" lands on the dashboard site page, not the editor
- Module / Screen-location / Feature: Onboarding / dashboard create flow → editor
- Labels: INTEGRATION ISSUE
- Category: UX improvement
- Type: UX
- Severity: Low
- Problem: after Create a site → name → Start from Scratch, the browser landed on `/dashboard/sites/cmuyn3mh6001u2qi79gdaf2r2`, so the user must click again to edit. This may be intended; the dashboard is outside the Editor v3 Figma page. Not checked against a dashboard board.
- Expected behavior: "Start from Scratch" opens the editor on the empty page (whose empty-state CTA is designed: `4428:44164`).
- Current behavior: LIVE, observed `work-FG/d3-after-create.png` (URL printed by probe `d3.mjs`)
- Figma status: not checked (dashboard)
- Code status: not traced
- Integration impact: extra hop on first run
- Probable root cause: unknown
- Dependencies: none
- Recommended next action: confirm intent with the dashboard agent's findings
- Evidence: LIVE-VERIFIED

### FG-045 Dashboard "Delete Site" says "cannot be undone", but delete is a 30-day restorable soft delete
- Module / Screen-location / Feature: Sites (dashboard) / row ⋯ › Delete / delete confirm
- Labels: CODE ONLY ISSUE, INTEGRATION ISSUE
- Category: UX improvement
- Type: UX
- Severity: Low
- Problem: the confirm reads "This action cannot be undone." The server soft-deletes (`deletedAt`) with a 30-day restore window. No toast or Undo follows the delete. The editor Settings has a designed "Overview · pending-deletion" state (`8137:216089`), so the product knows it is recoverable. The dashboard copy contradicts it, and users are frightened away from a reversible action.
- Expected behavior: copy states the restore window ("You can restore it from Trash for 30 days"); a toast with a link to restore.
- Current behavior: LIVE, observed while trashing my own audit site (`work-FG/t6-delete.png`; dialog text captured by `t7.mjs`; no toast after confirm). CODE `packages/dashboard/components/sites/delete-confirm-modal.tsx:34`; `server/services/sites.service.ts:614-658`; `packages/shared/schemas/sites.ts:55` (`SITE_RESTORE_WINDOW_DAYS = 30`).
- Figma status: editor board `8137:216089` (pending deletion); dashboard not checked
- Code status: as cited
- Integration impact: dashboard and editor describe the same delete differently
- Probable root cause: copy predates soft delete
- Dependencies: none
- Recommended next action: change copy, add restore toast
- Evidence: LIVE-VERIFIED

---

## 6. Module verdict table (Figma ↔ code alignment lens)

Columns follow the brief.
- **UI** = live or board match.
- **Function** = code implements what the boards design.
- **States** = E / L / X / S / D covered in both.
- **Integrations / persistence / errors:** only marked where checked.

| Module | UI | Function | States | Integrations | Persistence | Errors | Journey complete? |
|---|---|---|---|---|---|---|---|
| Add | VERIFIED (rail / panel live) | PARTIAL (FG-041) | PARTIAL | NOT CHECKED | NOT CHECKED | PARTIAL | No |
| Layers | VERIFIED | VERIFIED (select mode live) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Pages | PARTIAL (FG-008) | VERIFIED (menu live) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Page settings / SEO | BROKEN vs board (FG-007, FG-012) | PARTIAL | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Assets / Media | NOT CHECKED live | VERIFIED (code) | VERIFIED (both) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| Full Media Library | NOT CHECKED | VERIFIED (code) | VERIFIED (both) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| CMS | NOT CHECKED | VERIFIED (code) | PARTIAL (FG-043; Figma orphans FG-013) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| Components | NOT CHECKED | PARTIAL | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Brand | PARTIAL (FG-017/018/019) | PARTIAL (Part 1b/1c) | PARTIAL | NOT CHECKED | NOT CHECKED | PARTIAL | No |
| Inspector | PARTIAL (Figma stale FG-020) | PARTIAL (FG-021/022) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Selected-element controls | NOT CHECKED live | VERIFIED (code) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| AI | NOT CHECKED | PARTIAL (FG-023) | PARTIAL (FG-024/025) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Forms | PARTIAL (FG-031) | PARTIAL | BROKEN (FG-032b, missing both) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Review | BROKEN vs v2 (FG-001/002) | PARTIAL (FG-004, FG-006) | PARTIAL | NOT CHECKED | NOT CHECKED | PARTIAL | No |
| Comments | NOT CHECKED live | VERIFIED (code) | VERIFIED (both) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| Issues | NOT CHECKED | PARTIAL (FG-027/028) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| History | NOT CHECKED | VERIFIED (code) | PARTIAL (FG-033) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Activity | NOT CHECKED | VERIFIED (code) | VERIFIED (both) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| Notifications | NOT CHECKED | VERIFIED (code) | PARTIAL (FG-035) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| Publish | VERIFIED (button live) | VERIFIED (code) | VERIFIED (both) | NOT CHECKED (real Vercel) | NOT CHECKED | VERIFIED (code) | No (deploy unverified) |
| Settings | VERIFIED (nav / search live) | PARTIAL (SEO) | PARTIAL (Figma orphans) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Templates | NOT CHECKED | VERIFIED (code) | PARTIAL (FG-038) | NOT CHECKED | NOT CHECKED | VERIFIED (code) | No |
| Search / Command palette | VERIFIED (topbar search removed, matches) | VERIFIED (code) | VERIFIED | NOT CHECKED | n/a | NOT CHECKED | No |
| Responsive | NOT CHECKED | PARTIAL (FG-029) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Canvas / Zoom / View | VERIFIED (footer live) | VERIFIED (code) | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Drag & Drop | NOT CHECKED | VERIFIED (code) | PARTIAL (FG-042) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Domains | NOT CHECKED | VERIFIED (code) | BROKEN (no boards, FG-034) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| SEO (site) | BROKEN vs board (FG-009) | PARTIAL | PARTIAL | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Accessibility | n/a | PARTIAL | BROKEN (FG-026) | NOT CHECKED | n/a | NOT CHECKED | No |
| Onboarding / tips | VERIFIED (menu row) | VERIFIED (code) | BROKEN (no boards, FG-036) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |
| Commerce | NOT CHECKED | PARTIAL | BROKEN (both) | NOT CHECKED | NOT CHECKED | NOT CHECKED | No |

No module is "complete" under the brief's rule (every column VERIFIED).

---

## 7. Counts

52 issues filed. FG-005 and FG-039 are withdrawn and not counted.

| Severity | Count | Issues |
|---|---|---|
| High | 4 | FG-001, FG-002, FG-007, FG-009 |
| Medium | 23 | FG-003, FG-004, FG-006, FG-010, FG-012, FG-013, FG-014, FG-015a, FG-015b, FG-015d, FG-015e, FG-015f, FG-015g, FG-019, FG-020, FG-021, FG-023, FG-026, FG-029, FG-031, FG-032b, FG-034, FG-036 |
| Low | 25 | FG-008, FG-011, FG-015c, FG-015h, FG-015i, FG-016, FG-017, FG-018, FG-022, FG-024, FG-025, FG-027, FG-028, FG-030, FG-032, FG-033, FG-035, FG-037, FG-038, FG-040, FG-041, FG-042, FG-043, FG-044, FG-045 |

Side to correct:
- Figma only: 17
- Code only: 28
- Both: 6
- Integration (dashboard hop, FG-044): 1
