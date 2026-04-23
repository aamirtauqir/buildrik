# Bar Consistency Audit — 2026-04-20

**Spec:** `docs/superpowers/specs/2026-04-20-bar-consistency-audit-design.md`
**Plan:** `docs/superpowers/plans/2026-04-20-bar-consistency-audit.md`
**Scope:** `packages/editor/src/editor/{shell,rail,sidebar,inspector}/`
**Method:** Read-only ripgrep + manual read-through. See Section 5 for grep patterns.

## 1. Summary Scoreboard

Hex counts split into **pure literals** (direct violations) and **fallback hex** (inside `var(--token, #xxx)` — acceptable guard but still a hex source that could drift). See 5.1 for grep patterns.

| Bar | Hex pure (.tsx) | Hex pure (.css) | Hex fallback (tsx+css) | Px literals | font-family | Inline style (static) | Inline style (runtime) | Header height | Primitive dup count |
|---|---|---|---|---|---|---|---|---|---|
| Topbar | 112 | 0 | 10 | 77 | 3 | ~199 | ~2 | 56 ✓ | 4 (patterns #1, #2, #3, #4) |
| Left (rail+sidebar) | 68 (1 rail css + 126 sidebar ≈ approx — see note) | see cell | 332 | 1913 | 5 | ~165 | ~8 | 44 ✓ (token=48 ✗) | 8 (patterns #1, #2, #3, #4, #5, #8, #9, #10) |
| Right (inspector) | 64 | 0 | 9 | 207 | 4 | ~350 | ~19 | padded (no fixed) ○ | 7 (patterns #1, #2, #6, #7, #8, #9, #10) |

> **Inline-style classification note.** Classification is an estimate based on a 10-sample-per-bar read-through plus a grep-based heuristic for runtime markers (template literals, inline ternaries). Multi-line inline-style blocks containing ternaries are under-counted by the heuristic. Spot-check (Task 9) will tighten these. What is clear from the sample: inline styles are overwhelmingly static across all three bars (>90%). Runtime totals are informational; only the static column is a violation count.

> **Left-bar note on hex arithmetic.** Raw totals: rail .tsx=0, rail .css=1, sidebar .tsx=68, sidebar .css=390. Fallback-hex (`var(--*, #xxx)`) count across rail+sidebar=332 (all of which are counted inside the raw totals). Pure-literal = raw − fallback per scope: rail css pure=1 (fallback inside rail was 0 separate pass), sidebar tsx pure=68−(sidebar tsx fallback rows)=≈30 after approximate split, sidebar css pure=390−(sidebar css fallback rows)=≈96. Precise per-scope fallback attribution deferred to spot-check (Task 9). For now the aggregate is: left bar has ~127 pure-literal hex + ~332 fallback hex. Topbar/inspector counts above are precise.

## 2. Per-Bar Findings

### 2.1 Topbar (`packages/editor/src/editor/shell/`)

**Dimension 1 — Hex literals**
- `.tsx` count: 122 total (112 pure literals + 10 fallback). Spread across 11 files.
- `.css` count: 0
- Highest-density file: `InviteModal.tsx` (22 hex — seed data + borders). Also `AccountModal.tsx` (22), `BreakpointDropdown.tsx` (11).
- Top evidence (pure literals):
  - `shell/InviteModal.tsx:22-24` — seed avatar colors `#3B82F6`, `#8B5CF6`, `#10B981` (violates single-accent rule + NO-PURPLE)
  - `shell/InviteModal.tsx:28-30` — role badge bg/text pairs as pure hex (no token usage)
  - `shell/InviteModal.tsx:115,132,181,205,240` — repeated inline `1px solid #E2E8F0` (should be `var(--buildrick-border)`)
  - `shell/InviteModal.tsx:159` — inline hover handler writing literal `#F8FAFC`
  - `shell/InviteModal.tsx:209` — `color: copied ? "#166534" : "#334155"` literal text colors
  - `shell/InviteModal.tsx:248-249` — focus handlers writing literal cobalt `#2563EB` (should be `var(--buildrick-accent)`)
- **Severity: HIGH.** 112 pure literals with zero fallback discipline in most places; direct NO-PURPLE rule violation at `InviteModal.tsx:23` (`#8B5CF6`).

**Dimension 2 — Hardcoded px (post-filter: excludes 0/1/2px borders)**
- Raw count: 149 (14 files). Excluded border-widths: 72. Post-filter: **77**.
- Highest-density: `AccountModal.tsx` (24 raw), `InviteModal.tsx` (21), `modals/CMSCollectionSetupModal.tsx` (20).
- Evidence (non-scale values are double violations per DESIGN.md 2/4/8/12/16/24/32/48/64 scale):
  - `shell/AccountModal.tsx:135,183` — `padding: "0 12px"`, `"0 16px"` (inline literal; 12/16 are on-scale but inline)
  - `shell/AccountModal.tsx:210` — `padding: "10px 12px"` — **10 not on scale**
  - `shell/AccountModal.tsx:236` — `padding: "2px 8px"` — borderline (2/8 both allowed)
  - `shell/InviteModal.tsx:115,132,181,205,240,262` — repeated `1px solid` inline (fine) but paired with non-tokenized colors
- **Severity: MEDIUM.** Volume is moderate (77); issue is inline-style pattern rather than non-scale values.

**Dimension 3 — font-family declarations**
- Count: 3 literal violations (expected: 0)
- Most declarations use `fontFamily: "inherit"` (safe) or `var(--buildrick-font-family*)` (safe). Violations:
  - `shell/AccountModal.tsx:76` — `fontFamily: "Inter, sans-serif"` — **literal font name** (DESIGN.md bans named fallbacks)
  - `shell/AccountModal.tsx:98` — same literal
  - `shell/AccountModal.tsx:444` — same literal (triplicate)
- **Severity: LOW-MEDIUM.** Only one file, but 3 occurrences of the same string = copy-paste drift. Fixable with a single find-replace.

**Dimension 4 — Inline `style={{}}`**
- Total occurrences: 201 (14 files)
- Estimated static: ~199 (violation — should move to Emotion `styled()` + tokens)
- Estimated runtime: ~2 (acceptable — drag/transform/computed positions)
- Highest-density: `AccountModal.tsx` (58), `InviteModal.tsx` (34), `StatusIndicators.tsx` (16), `CommandPalette.tsx` (15)
- Evidence (representative static violations):
  - `shell/AccountModal.tsx:51-54` — `{{ height: 20, width: 40, ... }}` (static literal sizing)
  - `shell/AccountModal.tsx:76` — `{{ fontSize: 24, fontWeight: 700, color: "var(...)", fontFamily: "Inter, sans-serif" }}` (compounds with Dim-3 violation)
  - `shell/AccountModal.tsx:85` — `{{ display: "flex", alignItems: "center", gap: 12 }}` (repeats across 20+ sites in same file)
- **Severity: CRITICAL-FOR-DX.** 199 static inline styles = 199 places the design can silently drift because Emotion can't refactor them. This is the single biggest DX-pain signal for the topbar.

**Dimension 5 — Header height**
- Actual: **56px** at `themes/components.css:3210` (`.tbBar { height: 56px; }`)
- Contract per DESIGN.md:123-126: 56px
- Status: **✓ matches**

### 2.2 Left — Rail + Sidebar (`packages/editor/src/editor/rail/`, `packages/editor/src/editor/sidebar/`)

**Dimension 1 — Hex literals**
- Rail `.tsx` count: 0
- Rail `.css` count: 1 (`rail/DrawerPanel.css` — single hex, likely token fallback)
- Sidebar `.tsx` count: 68 (20 files)
- Sidebar `.css` count: 390 (13 files)
- Fallback-hex rows across rail+sidebar: 332 (most usage is inside `var(--buildrick-*, #fallback)` — good pattern, but fallback is still a drift surface)
- Highest-density .css files: `PagesTab.css` (143), `BuildTab.css` (101), `TemplatesTab.css` (96)
- Highest-density .tsx files: `tabs/media/components/StockSourceModal.tsx` (11), `tabs/publish/PublishTab.tsx` (8), `tabs/templates/TemplatesTabModals.tsx` (7)
- Top evidence:
  - `sidebar/shared/FeatureCard.tsx:238-239` — pure literals `#FEF3C7`, `#92400E` (amber badge bg/text — no token)
  - `sidebar/tabs/pages/PagesTab.css:565,814,1660,1836` — repeated `color: #fff` and `background: #fff` (should be `var(--buildrick-bg-card)`)
  - `sidebar/tabs/pages/PagesTab.css:1076` — `background: var(--buildrick-bg-panel, #14141f)` — **NO BLACK violation in fallback** (`#14141f` is banned per DESIGN.md:196)
  - `sidebar/tabs/media/MediaTab.css:19-20` — checkerboard `#eee` literals in gradient
  - `sidebar/tabs/history/components/TimeTravelScrubber.tsx:168` — runtime style assignment `layer.style.background = "#f5f5f5"` (literal, no token)
  - `sidebar/shared/SearchBar.tsx:141` — fallback `var(--buildrick-border, #D1D9E6)` — fallback color doesn't match DESIGN.md canonical `#E2E8F0` (token drift)
  - `sidebar/LeftSidebar.css:34` — comment calling out legacy `#4ADE80` (dead code doc — count as informational)
- **Severity: CRITICAL.** Highest absolute count (459 hex total across rail+sidebar) AND a NO-BLACK violation at `PagesTab.css:1076`. Fallback-hex discipline is strong overall (332 fallbacks) but pure literals still total ~127 — mostly in the three big tab CSS files (Pages, Build, Templates).

**Dimension 2 — Hardcoded px (post-filter: excludes 0/1/2px borders)**
- Rail raw: 83, excluded: 29, **post-filter: 54**
- Sidebar raw: 2438, excluded: 579, **post-filter: 1859**
- Combined post-filter: **1913** (largest by ~24× vs topbar, ~9× vs inspector)
- Highest-density: `PagesTab.css` (791 raw), `BuildTab.css` (251), `TemplatesTab.css` (140)
- Evidence (non-scale values):
  - `sidebar/tabs/pages/PagesTab.css:32` — `height: 42px` — **42 not on scale** (should be 44 or 48)
  - `sidebar/tabs/pages/PagesTab.css:42` — `font-size: 12.5px` — **fractional px, never on scale**
  - `sidebar/tabs/pages/PagesTab.css:54` — `border-radius: 10px` — **10 not on DESIGN.md radius scale** (sm:4/md:8/lg:12)
  - `sidebar/tabs/pages/PagesTab.css:33` — `padding: 0 8px 0 14px` — 14 off-scale
  - `sidebar/tabs/media/MediaTab.css:137` — 137 px occurrences in one file
  - `sidebar/tabs/build/BuildTab.css:251` — 251 px occurrences (3rd-largest file)
- **Severity: CRITICAL.** Biggest visual-drift surface. Non-scale values (42, 14, 10, 12.5) indicate these CSS files were written pre-DESIGN.md and never migrated. Each non-scale value = one more way the 3 bars look different.

**Dimension 3 — font-family declarations**
- Rail violations: 0 (1 declaration, all tokenized)
- Sidebar violations: 5 (expected: 0)
  - `sidebar/shared/SearchBar.tsx:155` — **`fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"`** — DESIGN.md explicitly bans `-apple-system` and `BlinkMacSystemFont`
  - `sidebar/tabs/build/BuildTab.css:449` — `font-family: monospace` (generic, not token)
  - `sidebar/tabs/build/components/TipsFooter.tsx:54` — `fontFamily: "monospace"` (same issue inline)
  - `sidebar/tabs/build/catalog/sections.ts:674,691` — `font-family:inherit` inside emitted HTML strings (exported site template output — leaks into user sites)
- Informational (not counted as violations): `media/components/AssetDetailOverlay.tsx:127`, `LibraryView.tsx:353`, `StockSourceModal.tsx:250` use `fontFamily: \`"${item.name}", serif\`` — legitimate dynamic user-font preview.
- **Severity: HIGH.** `SearchBar.tsx:155` is the worst offense — a banned-fallback chain in a shared primitive that every sidebar tab imports.

**Dimension 4 — Inline `style={{}}`**
- Rail: 0 occurrences (exemplary — all styling in `.css` files or via tokens)
- Sidebar total: 173 (49 files)
- Estimated static: ~165
- Estimated runtime: ~8 (mostly media-preview dynamic fontFamily / background-image from user data)
- Highest-density: `tabs/settings/screens/BillingScreen.tsx` (14), `tabs/ComponentsTab.tsx` (11), `tabs/media/MediaTab.tsx` (10), `tabs/media/components/LibraryView.tsx` (10)
- Evidence:
  - `sidebar/tabs/settings/screens/BillingScreen.tsx:60-67` — multi-prop inline style (static)
  - `sidebar/tabs/settings/screens/BillingScreen.tsx:86-90` — `{{ padding: "3px 10px", borderRadius: "var(--buildrick-radius-full)", ... }}` (static)
  - `sidebar/tabs/media/components/LibraryView.tsx:353` — `{{ fontFamily: \`"${item.name}", serif\` }}` (legitimate runtime)
- **Severity: HIGH-FOR-DX.** 165 static inline styles across 49 files = wide surface area. But per-file density is lower than topbar (avg 3.4 vs topbar's 14.4), so leverage-per-extraction is smaller.

**Dimension 5 — Header height**
- Actual: **44px** at `shared/ui/PanelHeader.tsx:68` (inline constant in Emotion style object)
- Contract per DESIGN.md:126: 44px — **✓ matches**
- **But:** `themes/design-system/layout.css:13` defines `--buildrick-header-height: 48px`. PanelHeader does not use that token (hardcodes 44). Token and consumer disagree by 4px. This is a **DS token drift vs DESIGN.md** (same class of bug as DS V1 remediation spec Table 3 flagged for other tokens).
- Status: **✓ rendered height matches DESIGN.md, ✗ token definition drifts.** Either the token should be 44px, or PanelHeader should consume the token (and the token should be corrected). Current state: contract honored by accident (hardcoded literal).

### 2.3 Right — Inspector (`packages/editor/src/editor/inspector/`)

**Dimension 1 — Hex literals**
- `.tsx` count: 73 (31 files — widest spread of any bar)
- `.css` count: 0
- Fallback-hex rows: 9 (lowest fallback-discipline rate of the three bars — most hex is pure literal, not wrapped in `var()`)
- Pure literal count: ~64
- Top evidence (dark-theme residuals — direct DESIGN.md light-chrome violations):
  - `inspector/components/InspectorControls.tsx:48,98` — `color: "#e4e4e7"`, `"#cdd6f4"` (Catppuccin/dark residuals)
  - `inspector/shared/controls/TextControls.tsx:52,110` — `color: "#e4e4e7"` duplicate
  - `inspector/sections/elementProperties/DataAttributeEditor.tsx:32` — `color: "#e4e4e7"` same pattern
  - `inspector/components/InspectorErrorBoundary.tsx:61,65` — red-400 literals `#fca5a5`, `#f87171` (should use `var(--buildrick-error)`)
  - `inspector/components/InspectorEmptyState.tsx:48` — `color: "#4ade80"` (green) — direct literal
  - `inspector/shared/controls/ColorInput.tsx:49` — `resolved || "#000000"` — **NO-BLACK rule violation** (pure black fallback)
  - `inspector/shared/controls/ColorInput.tsx:96` — `"#808080"` default
  - `inspector/__tests__/TokenPickerPopover.test.tsx:*` — 11 hex in tests (counted but test-file exclusion candidate)
- **Severity: HIGH.** The dark-theme residuals (`#e4e4e7`, `#cdd6f4`) prove the Inspector was the last surface to flip light. The `ColorInput.tsx:49` NO-BLACK fallback is a direct DESIGN.md rule break.

**Dimension 2 — Hardcoded px (post-filter: excludes 0/1/2px borders)**
- Raw: 345, excluded: 138, **post-filter: 207**
- Widest spread: 60 files (most diffuse per-file density of the 3 bars — avg ~3.4 px/file vs sidebar's ~41 px/file)
- Highest-density: `InspectorEmptyState.tsx` (28), `TokenPickerPopover.tsx` (24), `BindingPopover.tsx` (14), `FontPickerDropdown.tsx` (14), `SpacingControls.tsx` (13)
- Evidence:
  - `inspector/components/InspectorEmptyState.tsx:141,144,171` — `padding: "24px"`, `marginTop: "40px"`, `maxWidth: "220px"` (inline — 40/220 not on scale)
  - `inspector/components/InspectorEmptyState.tsx:161,168` — `fontSize: "14px"`, `"13px"` (on scale but inline)
  - `inspector/shared/controls/SpacingControls.tsx` — 13 px declarations in a control file (expected: use tokens)
- **Severity: MEDIUM.** Volume moderate; inline-style pattern widespread but most values are on-scale.

**Dimension 3 — font-family declarations**
- Count: 4 literal violations (expected: 0)
  - `inspector/components/InspectorEmptyState.tsx:228` — `fontFamily: "monospace"` (generic)
  - `inspector/components/ElementBreadcrumb.tsx:85` — `fontFamily: "monospace"`
  - `inspector/sections/AllCSSSection.tsx:51` — `fontFamily: "monospace"`
  - `inspector/shared/MixedValueBadge.tsx:38` — **`fontFamily: "var(--font-mono, JetBrains Mono, monospace)"`** — double violation: wrong var name (`--font-mono` instead of `--buildrick-font-family-mono`) AND banned font (`JetBrains Mono` is not in DESIGN.md whitelist — mono font is Geist Mono)
- Informational (not counted): `FontPickerDropdown.tsx:149`, `FontPicker.tsx:129` — legitimate dynamic user-font preview.
- **Severity: MEDIUM.** `MixedValueBadge.tsx:38` is the worst — it names `JetBrains Mono` which the DS V1 remediation spec (`docs/superpowers/specs/2026-04-20-ds-v1-remediation-design.md:17`) already flagged as AI-slop. Same pattern that killed V1.

**Dimension 4 — Inline `style={{}}`**
- Total occurrences: 369 (55 files — most of any bar by absolute count)
- Estimated static: ~350
- Estimated runtime: ~19 (dynamic previews for selected element — `{{ color: active ? ... : ... }}`, `{{ fontFamily: font.value }}`)
- Highest-density: `sections/layout/previews.tsx` (26), `shared/TokenPickerPopover.tsx` (22), `sections/BackgroundSection.tsx` (19), `sections/SizeSection.tsx` (18), `shared/controls/SpacingControls.tsx` (15)
- Evidence:
  - `inspector/sections/layout/previews.tsx:24-63` — many preview thumbnails using spread of constant `box` style with inline literal sizes (static but shares a base object — could be tokenized into size variants)
  - `inspector/shared/TokenPickerPopover.tsx:66+` — 22 inline styles in one popover (single-surface hotspot)
  - `inspector/sections/BackgroundSection.tsx:*` — 19 inline styles driving gradient/color preview UI
- **Severity: CRITICAL-FOR-DX.** 350 static inline styles across 55 files. Most concentrated in `shared/controls/` primitive layer — which means the Inspector's primitive layer itself drifts at the pixel level.

**Dimension 5 — Header height**
- Actual: **no fixed height.** `inspector/styles/index.ts:82` defines `header: { padding: "10px 14px", ... }` — height computed from content + padding.
- Effective rendered height ≈ 40–48px depending on content (not measured live; static estimate from padding + content line-height).
- Contract per DESIGN.md: **not specified.** Inspector header is the only bar DESIGN.md doesn't define.
- Off-scale padding: `10px 14px` — 10 and 14 both off the DESIGN.md spacing scale (nearest values: 8, 12).
- Status: **○ no contract + off-scale padding.** The inconsistency with the other two bars (both have fixed heights) is itself the finding.

## 3. Primitive Duplication Ranking

### Surfaces scanned

- **Topbar (shell):** `Topbar.tsx`, `StudioHeader.tsx`, `AccountModal.tsx`, `InviteModal.tsx`, `PublishDropdown.tsx`, `CommandPalette.tsx`, `BreakpointDropdown.tsx`, `PageTabBar.tsx`, `StatusIndicators.tsx`, `modals/CMSCollectionSetupModal.tsx`, `modals/CreateComponentModal.tsx`, `modals/ProjectSettingsModal.tsx`, `modals/CommandPalette.tsx`
- **Left (rail + sidebar):** `LayoutShell.tsx` (rail), `LeftSidebar.tsx`, 8 tab roots (`BuildTab`, `LayersTab`, `PagesTab`, `MediaTab`, `ComponentsTab`, `TemplatesTab`, `HistoryTab`, `SettingsTab`, `PublishTab`)
- **Right (inspector):** `ProInspector.tsx`, 14 section files (`BackgroundSection`, `BorderSection`, `SizeSection`, `SpacingSection`, `TypographySection`, `AnimationSection`, `EffectsSection`, `GridSection`, `LinkSection`, `VariantSection`, `VisibilitySection`, `QuickActionsSection`, `CSSClassesSection`, `AllCSSSection`), plus major components (`BreakpointIndicator`, `ElementBreadcrumb`, `InspectorControls`)

### Patterns (top 10, ranked by occurrences × bars-spanned)

**Formula:** `score = total_occurrences × number_of_bars_pattern_appears_in`. Higher score = higher leverage for extraction.

| Rank | Pattern | Occurrences | Bars | Score | Primitive to extract |
|---|---|---|---|---|---|
| 1 | **Icon + label + meta/secondary + trailing action (row)** | ~15 | 3 | 45 | `Row` composite with slots |
| 2 | **Badge/pill with state color** (status, role, diff-state, breakpoint) | ~10 | 3 | 30 | `StatusBadge` / `Pill` primitive |
| 3 | **Dropdown with search + scrollable list + empty state** (CommandPalette, PublishDropdown, BreakpointDropdown, FontPickerDropdown) | 4 | 3 | 12 | `SearchDropdown` primitive |
| 4 | **Modal with header + scrollable body + sticky footer/CTA** (AccountModal, InviteModal, CreateComponentModal, CMSCollectionSetupModal, ProjectSettingsModal, DeleteConfirmModal, UnsavedWarningModal) | ~8 | 2 | 16 | `ModalShell` composite (extends `shared/ui/Modal` with contract) |
| 5 | **PanelShell composite — Header + Toolbar + Content + Footer** (DESIGN.md:138-148 specifies this; currently 8 sidebar tabs assemble it from individual parts) | 8 | 1 | 8 | `PanelShell` composite (exact DESIGN.md spec) |
| 6 | **Color preview + hex input + picker trigger** (Inspector ColorInput, TokenPickerPopover, Sidebar design-system ColorSwatch, Topbar publish-indicator dot) | 4 | 3 | 12 | `ColorField` primitive |
| 7 | **Labeled control group — label + input + unit/state indicator** (Inspector `ControlRow`, `InputControls`, `LinkedGapInput`; Sidebar settings form rows; Topbar dropdowns with labels) | ~20 | 3 | 60 | `ControlRow` — exists in inspector, extract to shared |
| 8 | **Section with collapsible header + body + More-settings toggle** (Inspector 14 sections via shared `Section` primitive; Sidebar Build tab categories assemble manually) | ~14 inspector + ~8 sidebar | 2 | 44 | `Section` — already exists, extract to shared |
| 9 | **Empty state — icon + typographic title + subtitle + CTA** (Inspector `InspectorEmptyState`, Sidebar `EmptyStates`, Topbar CommandPalette no-results) | 3 | 3 | 9 | `EmptyState` primitive — partial (sidebar has `EmptyStates.tsx`) |
| 10 | **Segmented / alignment grid** (Inspector AlignmentGrid, DirectionControls; Sidebar ViewSwitcher; Topbar BreakpointDropdown) | 4 | 3 | 12 | `SegmentedControl` primitive |

### Key observations

- **Cross-bar leverage is highest for rows and controls** (patterns #1, #2, #7 — scores 45, 30, 60). These span all 3 bars.
- **PanelShell (pattern #5)** has the smallest score (8) because it's confined to the Left bar. BUT — it has the most precise spec (DESIGN.md:138-148), the clearest DX-pain signal (user said "adding a new tab is slow"), and the highest per-instance complexity (Header+Toolbar+Content+Footer grammar with 3 width modes and 3 row-density modes).
- **Controls layer (patterns #7, #8)** — already partially extracted in `inspector/shared/controls/` but NOT available to sidebar or topbar. Promoting these to `shared/ui/` would land pattern #7 (score 60) AND pattern #8 (score 44) simultaneously.
- **Topbar has the fewest shared primitives by design.** Modals (pattern #4) are the main duplication surface; extracting `ModalShell` would collapse 7 one-off modal implementations.

## 4. Recommendation

### Bar to refactor first: **Left sidebar**

The Left bar leads on 5 of 6 violation dimensions: highest hex (459 total), highest px (1913 post-filter — ~24× Topbar and ~9× Inspector), highest font-family violations (5 including the banned-fallback chain in `shared/SearchBar.tsx:155`), tied-highest primitive-duplication-count (8 patterns participating), and the only bar where DESIGN.md specifies a composite primitive that hasn't been built (PanelShell). Dimension-by-dimension: hex `#14141f` at `PagesTab.css:1076` is a NO-BLACK rule break; 1913 non-border px includes off-scale values `42`, `14`, `10`, `12.5` that guarantee visual drift across the 8 tabs; `SearchBar.tsx:155` names `-apple-system, BlinkMacSystemFont` in a primitive every tab imports. Any one of these is actionable alone; together they identify Left as the biggest-ROI surface.

Counter-argument considered: Inspector has more absolute static inline styles (350 vs Left's 165) and the most NO-BLACK-adjacent dark-theme residuals (`#e4e4e7`, `#cdd6f4`). But Inspector's primitive layer (`inspector/shared/controls/`) is the most mature of the three — its inline-style load is distributed across well-named primitives, not bespoke tabs. Inspector's fix is a token migration, not a structural refactor. Left's fix is structural, which is what the "composite primitives missing" pain demanded.

### First primitive to extract: **PanelShell composite**

DESIGN.md:138-148 already specifies the grammar (`PanelHeader` 44px / `PanelToolbar` 36px / `PanelContent` scrollable / `PanelFooter` 40px optional) and the file path (`packages/editor/src/editor/sidebar/shared/panel/`). The folder does not exist. 8 sidebar tabs (Build, Templates, Media, Layers, Pages, Components, Settings, History, Publish) today import `PanelHeader` alone and assemble the remaining three zones inline with hand-rolled flex/padding/scroll wrappers. Each tab has an average of ~30-40 lines of composition boilerplate that would collapse into 3-6 lines of `<PanelShell mode="nav|authoring|fullpage"><PanelShell.Header>…</PanelShell.Header>…</PanelShell>` calls. Rough line-elimination estimate: 8 tabs × ~30 lines × 0.75 compression = ~180 lines of repetitive JSX removed, plus the DS-token drift at `PanelHeader.tsx:68` (hardcoded 44 instead of `var(--buildrick-header-height)`) gets fixed by routing through the composite.

Why this primitive before the higher-scoring ones (patterns #1 Row with score 45, #7 ControlRow with score 60): scope discipline per `feedback_inventory_before_architecture.md`. PanelShell is (a) one-bar-only, (b) DESIGN.md-specified down to the filename, (c) no cross-bar API design required, (d) collapses the specific user-reported pain ("adding a new tab is slow"). Cross-bar primitives like #1, #2, #7 have higher raw scores but require an API-design round that is exactly what killed V1 + V2 theme specs. Ship PanelShell first, prove the pattern, then tackle cross-bar primitives in separate brainstorms with PanelShell as the reference implementation.

### Do NOT touch yet (explicit)

1. **The other two bars (Topbar, Inspector).** No primitive extractions. No refactoring. Leave alone.
2. **Tokens.** DS V1 is locked (2026-04-19) and remediation is mid-flight. Do not rename, add, or migrate tokens as part of the PanelShell work.
3. **DESIGN.md.** The PanelShell grammar is already specified correctly; no doc changes needed.
4. **`components/` (legacy).** 371 files. Out of scope — adding new code to `editor/` only, per editor CLAUDE.md.
5. **`shared/ui/` primitives.** Button, Modal, Tooltip, etc. are fine. Do not extend them in the PanelShell work.
6. **Cross-bar primitives #1, #2, #6, #7, #10** (Row, StatusBadge, ColorField, ControlRow, SegmentedControl). Even though scores are higher, they cross bar boundaries and deserve their own brainstorms.
7. **Inspector dark-theme residuals** (`#e4e4e7`, `#cdd6f4` in InspectorControls, TextControls, DataAttributeEditor). Already covered by DS V1 remediation Phase 5 (HIGH codemod).
8. **`SearchBar.tsx:155` font-family violation.** Fix belongs to DS V1 remediation Phase 6 or opportunistic Gate-10 cleanup, not PanelShell work.

### Next step (out of scope for this audit)

Brainstorm the PanelShell extraction using this audit as input. Expected spec deliverable: `docs/superpowers/specs/2026-04-21-panelshell-primitive-design.md` (or later date). Expected pattern: migrate one low-risk tab first (Layers or Pages), verify visually, then migrate remaining 7.

## 5. Methodology

### 5.1 Grep patterns

**Dimension 1 — Hex**
- Pattern: `#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b`
- Globs: `*.tsx`, `*.css` (run separately)
- Fallback-hex sub-pattern: `var\(--buildrick-[^,)]+,\s*#` — captures `var(--token, #xxx)` rows. Pure-literal = raw − fallback.
- Known under-counts: does not match dynamic template literals (`` `#${hex}` ``), hex in JS-constructed strings, or 4-digit (`#RGBA`) forms.

**Dimension 2 — Px**
- Raw pattern: `\b\d{1,4}px\b`
- Excluded (filter): `\b[012]px\b` (border widths, hairlines, single-px offsets — not spacing violations)
- Post-filter count = raw − excluded.
- Does not distinguish on-scale (2/4/8/12/16/24/32/48/64) from off-scale (42/14/10/12.5 etc.) automatically — that classification is done by reading evidence rows.

### 5.2 Known blind spots

### 5.3 Spot-check log

### 5.4 Codex gate status
