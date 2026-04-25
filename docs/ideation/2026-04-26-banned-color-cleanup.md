# Banned-color cleanup — Phase 1 inventory + commit plan
**Date:** 2026-04-26
**Trigger:** TODOS.md "CI grep rule for banned indigo/violet hex" → Option C "full cleanup".
**Inventory pass:** grep across `packages/editor/src/**/*.{css,ts,tsx,js,jsx}` for `#1D4ED8`, `#1E40AF`, `#4F46E5`, `\bindigo\b`, `\bviolet\b`, `\bpurple\b`.

## Why this isn't a one-line gate

The TODO predates the cobalt accent convergence (`--buildrick-accent: #2D6DFF`, `--buildrick-accent-pressed: #1E58D9`). Naively adding a FAIL-mode regex breaks CI on shipped code:

- `#1D4ED8` (Tailwind blue-700) — 46+ live sites, mostly stale CSS fallbacks.
- `#1E40AF` (Tailwind blue-800) — 7 live sites, all stale fallbacks.
- `#4F46E5` (Tailwind indigo-600) — 0 sites. Already clean.
- `purple` word — 17+ sites, mix of legit (color parsers, dev tools, stock photo filter, debug overlays) and stale (canvas.ts comments, dead LeftSidebar.css block).
- `indigo`/`violet` words — 4 legit sites (color parsers + collab cursor + dev logger).

## Categorization

### Category A — drift to clean (FIX)

| File | Sites | Pattern | Fix |
|---|---|---|---|
| `editor/sidebar/tabs/templates/TemplatesTab.css` | 25 (`#1D4ED8`) + 1 (`#1E40AF`) | `var(--bd-accent, #1D4ED8)` fallbacks | Drop fallback (alias always defined) |
| `editor/sidebar/tabs/component-library/ComponentsTab.css` | 1 (`#1E40AF`) | `var(--bd-fg-primary, #1E40AF)` | Drop fallback |
| `editor/media/LibraryManager.css` | 3 (`#1D4ED8`) + 4 (`#1E40AF`) | both fallbacks | Drop fallbacks |
| `editor/media/ImageEditorModal.css` | 5 (`#1D4ED8`) + 1 (`#1E40AF`) | both fallbacks | Drop fallbacks |
| `editor/sidebar/shared/EmptyStates.css` | 1 (`#1D4ED8`) | `var(--buildrick-accent, #1D4ED8)` | Drop fallback |
| `editor/sidebar/tabs/media/MediaTab.tsx:140` | 1 inline | TSX style fallback | Drop fallback |
| `editor/canvas/overlays/MediaQuickActions.tsx:221` | 1 inline | TSX style fallback | Drop fallback |
| `editor/shell/CommandPalette.tsx:244,266` | 2 inline | `isActive ? "#1D4ED8" : "var(--bd-fg-...)"` | Replace with `var(--bd-accent)` |
| `editor/shell/InviteModal.tsx:28,412` | 2 inline | role color map + hover bg | Replace with accent token |
| `editor/shell/AccountModal.tsx:31,485` | 2 inline | role color map + active state | Replace with accent token |
| `editor/shell/PublishDropdown.tsx:40` | 1 inline | `hoverBg: "#1D4ED8"` | Replace with accent token |
| `shared/constants/canvas.ts` | rename + 5 comment fixes + alpha drift | `BRAND_PURPLE` const name + stale comments + `rgba(37, 99, 235, x)` should be `rgba(45, 109, 255, x)` | Rename to `BRAND_ACCENT`, fix comments, update rgba |
| `styles/tokens/canvas.tokens.ts:19` | 1 (`#1D4ED8`) | `dark: "#1D4ED8"` token def for `--buildrick-accent-pressed` dark variant | Change to `#1E58D9` to match canonical |
| `components/Panels/LeftSidebar/LeftSidebar.css` | 7 lines | `feature-icon--purple` + `feature-row--purple` + refs to undefined `--buildrick-purple-*` tokens | DELETE (zero TSX consumers — verified via grep) |
| `components/Canvas/Canvas.css:53` | 1 (`--buildrick-shadow-purple`) | "Legacy alias" comment | Audit consumers; DELETE if unused |

### Category B — legitimate use (ALLOWLIST)

These paths exist for reasons unrelated to design tokens. Gate 18 must allowlist them:

- `packages/editor/src/shared/utils/parsers/colorTypes.ts` — CSS color name → hex map (parser data, not design tokens)
- `packages/editor/src/engine/collaboration/CollaborationManager.ts` — collab cursor color comments
- `packages/editor/src/shared/utils/devLogger.ts` — dev tool log color ramp
- `packages/editor/src/editor/sidebar/tabs/media/components/StockSourceModal.tsx` — stock photo color FILTER (user-facing product feature, picks color of stock photos)
- `packages/editor/src/editor/sidebar/tabs/media/data/mediaTypes.ts` — type union for stock photo filter
- `packages/editor/src/components/Canvas/Canvas.css` (lines 66, 114) — debug ID badge + spacing-padding indicators (`#7c3aed` debug overlays, Alt+Shift hover inspector mode)
- `packages/editor/src/engine/canvas/constants.ts` — canvas debug overlay color comments
- `packages/editor/src/features/design-system/ui/modals/AddTokenModal.tsx` — placeholder text "e.g., Purple"
- `packages/editor/src/engine/media/__tests__/svgSanitize.test.ts` — test fixture input

### Category C — already clean

- `#4F46E5` — zero sites in src.

## Commit plan (8 commits, ~3 hr CC)

1. **Commit G1** — `TemplatesTab.css` chrome cleanup (26 fallback drops)
2. **Commit G2** — Other chrome CSS cleanup (`EmptyStates.css`, `LibraryManager.css`, `ImageEditorModal.css`, `ComponentsTab.css` — 14 sites across 4 files)
3. **Commit G3** — Chrome TSX inline literal cleanup (`CommandPalette`, `InviteModal`, `AccountModal`, `PublishDropdown`, `MediaTab`, `MediaQuickActions` — 9 sites across 6 files)
4. **Commit H1** — `canvas.ts` rename + comment fix + rgba alpha drift fix (`BRAND_PURPLE` → `BRAND_ACCENT`)
5. **Commit H2** — `canvas.tokens.ts` dark variant fix (`#1D4ED8` → `#1E58D9`)
6. **Commit H3** — `LeftSidebar.css` dead purple block deletion (7 lines + 3 undefined token refs)
7. **Commit H4** — `Canvas.css` legacy purple alias audit (`--buildrick-shadow-purple` delete if unused; debug badge values stay with allowlist comment)
8. **Commit I** — Gate 18 with allowlist + FAIL mode (added to `ds-grep-gates.sh`)

## Replacement values (canonical, 2026-04-26)

```
--buildrick-accent: #2D6DFF        (was: #2563EB blue → migrated to cobalt)
--buildrick-accent-pressed: #1E58D9  (was: #1D4ED8 → migrated)
--buildrick-accent-subtle: <see color.css>
--buildrick-accent-tint: <see color.css>
```

`rgba(45, 109, 255, x)` is canonical alpha for cobalt accent. `rgba(37, 99, 235, x)` is stale.

## Verification post-cleanup

After Commit I lands:
```bash
grep -rnE '#1D4ED8|#1E40AF|#4F46E5' packages/editor/src \
  --include='*.{css,ts,tsx,js,jsx}' \
  --exclude-dir=__tests__
# Expected: 0 hits
```
```bash
bash packages/editor/scripts/ds-grep-gates.sh
# Expected: Gate 18 PASS
```
