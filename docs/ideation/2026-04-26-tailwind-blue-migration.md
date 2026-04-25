# Tailwind blue palette migration — Phase 1 inventory + commit plan
**Date:** 2026-04-26
**Trigger:** TODOS.md "CI grep rule for banned indigo/violet hex" RESOLVED commit (`9b690ff`) flagged Tailwind blue palette as same-class drift, separate workstream.
**Followup to:** `docs/ideation/2026-04-26-banned-color-cleanup.md` (the original cobalt convergence cleanup).

## STATUS: COMPLETE 2026-04-26 — all 6 clusters landed

**Final commits:**
  C1 ebb1519  chrome shell (5 files, 27 sites incl. avatar #3B82F6 add-ins)
  C2 0e579a8  sidebar tab CSS (6 files, 17 sites — fallback drops)
  C3 c89de7b  canvas.tokens.ts (12 sites: hex + 8 azure rgba)
  C4 d99bac5  full chrome sweep (28 files, 50+ sites incl. rgba families)
  C5 (folded into C4 — most singletons absorbed by sweep; remainder allowlisted)
  C6 (this commit) — Gate 18 ratchet to lock cleanup permanently

**Final state:** 0 chrome Tailwind blue hex, 0 chrome Tailwind blue rgba.
Allowlist preserves user-token displays, published HTML, color picker presets,
dev tooling, and test fixtures.

## Resolved decision history

**P1 chosen 2026-04-26 (lint-only interpretation).** Author confirmed marker rationale is lost — was reflexive lint-quietener during 74483e4f cleanup, not load-bearing design statement. Marker means "skip Gate 16 baseline". SSOT cobalt convergence overrides marker. Workstream proceeded full 109 sites. Markers removed from files where all hex is migrated (became vestigial post-cleanup).

## Original conflict context (preserved for archaeology)

Phase 1 inventory + initial C1 bulk sed surfaced a major repo convention I missed in the inventory pass:

**`@lint-hex-policy: component-theme` markers exist on ~30 files.** Commit `74483e4f` ("Phase 3.11 complete — 0 unmarked inline hex sites remain", 2026-04-20) explicitly marked files with "intentional palette choices" as exempt from chrome hex lint rules. The author's commit message names the marker as a design-intent statement: *"Exempted as component-theme (intentional palette choices)"*.

**Of the 5 chrome shell files in C1:**
- AccountModal.tsx — has marker. Tailwind blue role palette is INTENTIONAL.
- BreakpointDropdown.tsx — has marker. Same.
- InviteModal.tsx — no marker. Has same role-palette pattern as AccountModal.
- CommandPalette.tsx — no marker. Has same active-state cascade as AccountModal.
- PublishDropdown.tsx — no marker. Doc comment explicitly names 4 hex per state ("draft → blue #2563EB"). Authorial intent in code, just no formal marker.

**Conflict:**
- This workstream wants to converge Tailwind blue → cobalt accent for SSOT.
- Existing marker convention says "intentional component-specific palette."
- Both authored by same person (you). Different days, different goals.

**Files that need policy decision before resuming:**
- ~30 files repo-wide have the marker. Including chrome shell + onboarding + canvas overlays + inspector components + AI components + skeleton loaders + many others.
- Tailwind blue cleanup would override marker intent on these files unilaterally.

**Possible policies (pick one before resuming):**
- (P1) **Lint-only interpretation:** marker means "Gate 16 baseline doesn't apply". SSOT migrations CAN still change values when there's a stronger reason (cobalt convergence). Workstream proceeds, marker doesn't block.
- (P2) **Design-intent interpretation:** marker means "leave this palette alone". Workstream skips ALL marked files. Estimated to shrink workstream ~30-40% (need exact recount). Marker-less files with similar palette intent (InviteModal, CommandPalette, PublishDropdown) need case-by-case judgment.
- (P3) **Hybrid:** workstream proceeds on marker-less files, BUT also adds new marker to files where author intent should be preserved. Surface a list of "files that should get markers" before adding any.
- (P4) **Defer entirely:** Tailwind blue palette is mostly user-visible chrome already serving a purpose. Not all drift is bad — leave the workstream paused indefinitely. Pivot to other work.

Once a policy is chosen, this doc + cluster plan below get updated to reflect scope.

## Inventory pass

```bash
grep -rniE '#EFF6FF|#2563EB|#DBEAFE|#BFDBFE|#1E3A8A|#3B82F6|#60A5FA' packages/editor/src \
  --include='*.css' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx'
grep -rniE 'rgba\(0,\s*163,\s*255' packages/editor/src ...
```

109 sites total across 8 hex variants + azure rgba family.

## Mapping table (Tailwind blue → cobalt accent ramp)

| Tailwind | Hex | Mapped to | Cobalt value |
|---|---|---|---|
| blue-50 | `#EFF6FF` | `var(--bd-accent-tint)` | rgba(45, 109, 255, 0.10) |
| blue-100 | `#DBEAFE` | `var(--bd-accent-tint)` | rgba(45, 109, 255, 0.10) |
| blue-200 | `#BFDBFE` | `var(--bd-accent-alpha-30)` | rgba(45, 109, 255, 0.30) |
| blue-400 | `#60A5FA` | `var(--bd-accent-hover)` | #4B8DFF |
| blue-500 | `#3B82F6` | `var(--bd-accent)` | #2D6DFF |
| blue-600 | `#2563EB` | `var(--bd-accent)` | #2D6DFF |
| blue-700 | `#1D4ED8` | `var(--bd-accent-pressed)` | #1E58D9 (already done G3) |
| blue-900 | `#1E3A8A` | `var(--bd-accent-pressed)` | #1E58D9 |
| azure | `rgba(0, 163, 255, x)` | `rgba(45, 109, 255, x)` | cobalt rgba family |

Visual shift expected to be minor (Tailwind blue and cobalt accent both in 220-240° hue range).

## Cluster plan (10-15 commits estimated)

### C1 — Chrome shell (5 files, ~25 sites)
- `editor/shell/InviteModal.tsx` — 4 `#2563EB`, 1 `#EFF6FF`, plus already-fixed `#1D4ED8`
- `editor/shell/AccountModal.tsx` — 1 `#2563EB`, 2 `#EFF6FF`, 1 `#BFDBFE`
- `editor/shell/CommandPalette.tsx` — 1 `#2563EB`, 1 `#EFF6FF`, 1 `#DBEAFE`, 1 `#BFDBFE`
- `editor/shell/PublishDropdown.tsx` — 2 `#2563EB`, 1 `#DBEAFE`, 1 `#BFDBFE`, 1 `#1E3A8A`
- `editor/shell/BreakpointDropdown.tsx` — 2 `#2563EB`, 2 `#EFF6FF`

### C2 — Sidebar tab CSS (5 files + 1 TSX, ~17 sites)
- `editor/sidebar/tabs/templates/TemplatesTab.css` — 7 `#DBEAFE`
- `editor/media/LibraryManager.css` — 5 `#DBEAFE`
- `editor/sidebar/tabs/build/BuildTab.css` — 3 `#DBEAFE`
- `editor/media/ImageEditorModal.css` — 1 `#DBEAFE`
- `editor/sidebar/tabs/component-library/ComponentsTab.css` — 1 `#DBEAFE`
- `editor/sidebar/tabs/media/components/SelectionBanner.tsx` — 1 `#DBEAFE`

### C3 — canvas.tokens.ts (1 file, 11 sites)
- 3 `#2563EB` + 8 azure `rgba(0, 163, 255, x)`
- File noted in H2 commit as full pre-cobalt + pre-light-theme artifact (Obsidian dark backgrounds, magenta guide). Surgical migration here; whole-file rewrite is separate scope.

### C4 — `#3B82F6` scatter (49 sites, judgment per file)
- `editor/onboarding/OnboardingChecklist.tsx` (5)
- `components/Canvas/Canvas.css` (4) — legacy file, dead. Just align values.
- `themes/design-system/design.css` (2) — user-facing design tokens canonical. AUDIT: legit user-token examples? If so, allowlist.
- `shared/ui/InfoBanner.tsx` (2)
- `shared/constants/config.ts` (2)
- `shared/constants/canvas.ts` (2) — already touched in H1, may be in BUTTON_BASE_STYLE or SHADOWS hex.
- `features/design-system/ui/spacing/SpacingTokenList.tsx` (2) — Design Tab, likely user-token displays. ALLOWLIST.
- `features/design-system/ui/modals/AddTokenModal.tsx` (2) — already in Gate 18 allowlist. ALLOWLIST.
- Plus other singletons.

### C5 — Singletons + AI (4 sites)
- `editor/shell/PublishDropdown.tsx:#1E3A8A` (folded into C1)
- `shared/utils/devLogger.ts:#60A5FA` — ALLOWLIST (dev tool ramp)
- `editor/sidebar/tabs/templates/templatesData.ts:#60A5FA` — likely template thumbnail color, audit
- `ai/AIAssistantBar.tsx:azure` — audit
- `editor/canvas/overlays/SectionReorderHandles.tsx:#2563EB` — audit (chrome overlay)
- `editor/canvas/overlays/DragHandle.tsx:#2563EB` — audit (chrome overlay)

### C6 — Gate 18 ratchet (final commit)
After C1-C5 land clean, extend Gate 18 banned-hex regex:
```
#1D4ED8|#1E40AF|#4F46E5|#EFF6FF|#2563EB|#DBEAFE|#BFDBFE|#1E3A8A|#3B82F6|#60A5FA|rgba\(0,\s*163,\s*255
```
Expand allowlist with: SpacingTokenList.tsx + AddTokenModal.tsx (already in) + design.css user-tokens + templatesData.ts (if it's template thumb data).

## Verification post-cleanup

```bash
grep -rnE '#EFF6FF|#2563EB|#DBEAFE|#BFDBFE|#1E3A8A|#3B82F6|#60A5FA' packages/editor/src \
  --include='*.{css,ts,tsx,js,jsx}' \
  --exclude-dir=__tests__ \
  | grep -vE 'allowlist paths'
# Expected: 0 hits
```
```bash
grep -rnE 'rgba\(0,\s*163,\s*255' packages/editor/src ...
# Expected: 0 hits
```
```bash
bash packages/editor/scripts/ds-grep-gates.sh
# Expected: Gate 18 PASS with extended ban list
```
