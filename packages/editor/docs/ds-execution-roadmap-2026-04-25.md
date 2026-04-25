# DS Migration Execution Roadmap

**Date:** 2026-04-25
**Branch:** `main` (solo workflow — direct commits, no PR)
**Status:** Phase 3 done (codemod), Phase 4 partial (2 batches done, 10 remain), Phase 5 pending
**Source docs:** `ds-audit-2026-04-25.md` (inventory), `ds-migration-plan-2026-04-25.md` (categorization)

---

## 1. North Star — what "done" means

When this roadmap finishes:

1. **Hex consumer count** in `packages/editor/src/**` (excl `themes/`, `project/`, D-bucket allowlist) ≤ **300 sites**, all justified per-file.
2. **`var(--bd-space-*)`** consumed in ≥ **80%** of spacing slots (padding/margin/gap) across `.css` + `.tsx` Emotion blocks.
3. **`var(--bd-shadow-*)`** consumed in ≥ **80%** of `box-shadow:` declarations.
4. **Zero banned tokens** in chrome: no `purple/violet/indigo/fuchsia/magenta` color names outside D-bucket; no `Arial/Helvetica/Roboto/Times` in chrome `font-family`; no Tailwind classes in `editor/`; no decorative gradients in chrome (only canvas dot grid + skeleton shimmer + transparency checker allowed).
5. **Zero dead duplicates** in `components/ui/` and `shared/ui/`.
6. **ESLint rules promoted to ERROR** for: `no-raw-hex` (scoped to `editor/` + `features/`), `no-banned-color`, `no-banned-font`, `no-tailwind-class`. WARN for: `no-decorative-gradient`, `no-2px-border-outside-contrast`.
7. **Hex gate baseline reset** to current count, runs in CI as monotonic ratchet.
8. **TSC + vitest** stay green throughout. Visual smoke check at port 5050 confirms no regression.

Out of scope: full architectural rewrite of `components/` legacy, `.pen` file edits, Playwright visual regression suite (deferred per memory).

---

## 2. Current state — measured 2026-04-25

| Metric | Value | Δ from session start |
|---|---:|---:|
| Hex consumer sites | 1018 | −329 |
| Hex full tree | 1169 | −329 |
| `var(--bd-*)` total | 3033 | +998 |
| `var(--bd-space-*)` | 831 | +817 |
| `var(--bd-shadow-*)` | 8 | 0 |
| Banned colors (consumers) | 49 | −2 |
| Tailwind real violations | ~1 | −18 |
| 2px borders | 135 | 0 |
| Decorative gradients (real) | ~10-30 | 0 |
| Inline px in `.tsx`/`.ts` | ~2076 | 0 |
| Dead primitives in `components/ui/` | 24 root + 0 subfolders | −9 root, −5 subfolder pairs |
| ESLint warnings | 865 | −66 |
| TSC errors | 186 (pre-existing, unrelated to DS) | 0 |
| Vitest | 796/796 pass | green |

---

## 3. Phase status

| Phase | Status | Commits | What |
|---|---|---|---|
| 1. Inventory | ✅ DONE | (docs only) | Read-only audit, baselines captured |
| 2. Categorization | ✅ DONE | (docs only) | A/B/C/D buckets, batch plan |
| 3. Codemod | ✅ DONE | `4ff3ced 12d0d29 be52e1a ea5c8ec` | 9 deletes + 320 hex + 817 spacing substitutions |
| 4. Manual sweep | 🟡 PARTIAL | `3f96b05 860e40a` | 10 more dead deletes; 10 more items pending |
| 5. Lockdown | ⏳ PENDING | — | ESLint promotions, gate baseline reset, memory update |

---

## 4. Phase 4 — Execution plan (10 batches remaining)

Each batch follows the same gate pattern:
1. Pre-count target sites
2. Execute (sed / Edit / git rm)
3. Post-count verify
4. `cd packages/editor && npx tsc --noEmit` → expect baseline 186
5. `npx vitest run` → expect 796/796
6. `git commit -m "..."` to `main`

If any gate fails: `git restore` working tree, investigate, document.

### Batch 4.1 — Finish `components/ui/` root delete

**Scope:** 24 root-level `.tsx`/`.ts` files in `components/ui/` confirmed zero direct imports + barrel redirects to `shared/ui/`. Same pattern as `4ff3ced` and `860e40a`.

**Files:**
```
components/ui/{Accordion, ColorSwatch, ContextMenu, CopyButton, EmptyState, ErrorMessage,
                ErrorState, FormField, Grid, HelpTooltip, Icon, Icons, PremiumBadge,
                QuickSwitcher, QuickSwitcher.styles, QuickSwitcher.types, useQuickSwitcher,
                Resizable, Skeleton, SliderInput, Toast, TreeView, UpgradeGate, UpgradeModal}.{tsx|ts}
```

**Pre-flight check (must run):**
```bash
for f in components/ui/*.tsx components/ui/*.ts; do
  base=$(basename "$f" | sed 's/\.[^.]*$//')
  [ "$base" = "index" ] && continue
  c=$(grep -rE "from\s+['\"][^'\"]*components/ui/${base}\b['\"]" \
      packages/editor/src --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)
  [ "$c" -gt 0 ] && echo "ALIVE: $base ($c imports)"
done
```
If output empty → all dead, proceed. If any ALIVE line → exclude that file, proceed with rest.

**Execute:**
```bash
git rm packages/editor/src/components/ui/{Accordion,ColorSwatch,ContextMenu,...}.tsx
# (full list once pre-flight confirms)
```

**Estimate:** ~10 min. **Risk:** low (matches 3 prior delete batches).

---

### Batch 4.2 — `Canvas.css` purple → boxmodel migration

**Scope:** 17 sites in `components/Canvas/Canvas.css` only (verified single consumer). Migrate `--buildrick-accent-purple-*` → canonical `--buildrick-boxmodel-{content,padding,margin}` per the new color.css definitions.

**Spec (color.css):**
- `--buildrick-boxmodel-content: rgba(111, 168, 220, 0.50);` (light blue)
- `--buildrick-boxmodel-padding: rgba(147, 196, 125, 0.45);` (green)
- `--buildrick-boxmodel-margin: rgba(246, 178, 107, 0.50);` (orange)

**Mapping required (manual judgment per site):**
- `--buildrick-accent-purple-{05,30,45,60,...}` alpha variants → which boxmodel category (content / padding / margin)?
- Read each site's CSS class name + surrounding rule to infer semantic role.

**Execute:** Read `components/Canvas/Canvas.css`, edit each of 17 sites, also delete the local `--buildrick-accent-purple-*` token definitions in the file (lines around 53/66/99/114).

**Estimate:** ~20 min. **Risk:** medium (color value changes are visible — purple → blue/green/orange palette swap). Visual smoke check required.

---

### Batch 4.3 — 13 semantic-fixup sites (`color: bg-card` → `fg-on-accent`)

**Scope:** 13 specific sites where `color: var(--bd-bg-card)` is used as text color (semantic mismatch — both tokens resolve to `#FFFFFF` so visually identical, but token semantics wrong).

**Sites (already enumerated):**
```
blocks/Media/Icon.tsx:32, 58
blocks/Components/Modal.tsx:22
components/Panels/LeftSidebar/LeftSidebar.css:364, 371, 2048, 2097, 2944, 2949, 3206, 3693
components/Canvas/Canvas.css:356
editor/canvas/Canvas.css:298
```

**Execute:** Edit each site, swap `var(--bd-bg-card)` → `var(--bd-fg-on-accent)` in `color:` declarations only.

**Estimate:** ~10 min. **Risk:** zero visual change. Pure semantic cleanup.

---

### Batch 4.4 — Legacy 4 `.css` files hex sweep

**Scope:** Remaining hex in 4 high-density `.css` files after Batch 3.2 + 3.3 codemods stripped canonical hex. Off-palette colors that need either (a) new canonical token, (b) redirect to existing token, or (c) D-bucket exclusion.

**Files + remaining hex (approx):**
- `components/Panels/LeftSidebar/LeftSidebar.css` — was 83, now lower after 3.2/3.3
- `editor/sidebar/tabs/templates/TemplatesTab.css` — was 96
- `editor/sidebar/tabs/build/BuildTab.css` — was 72
- `components/Canvas/Canvas.css` — was 53 (further reduced after Batch 4.2)

**Pre-flight:**
```bash
for f in components/Panels/LeftSidebar/LeftSidebar.css editor/sidebar/tabs/templates/TemplatesTab.css editor/sidebar/tabs/build/BuildTab.css components/Canvas/Canvas.css; do
  echo "--- $f ---"
  grep -niE '#[0-9a-fA-F]{6}\b' "$f" | head -20
done
```

**Approach per site (manual):**
- Hex inside `box-shadow:` → defer to Batch 4.5 (shadow tokenization)
- Hex inside `linear-gradient()` rgba conversion / replacement
- Off-palette accent → flag for new token addition
- Off-palette neutrals → map to closest existing `--bd-fg-*`/`--bd-bg-*`/`--bd-border-*`

**Estimate:** ~45 min. **Risk:** medium (off-palette values may have intentional design reasons).

---

### Batch 4.5 — Box-shadow tokenization

**Scope:** Inline `box-shadow:` definitions across `.css` + `.tsx`. Map each to canonical `--bd-shadow-{xs,sm,md,lg,xl,modal,dropdown}` family, OR flag bespoke shadows for new token / removal.

**Pre-flight count:**
```bash
grep -rcE 'box-shadow\s*:' packages/editor/src --include='*.css' --include='*.tsx' \
  --exclude-dir=themes --exclude-dir=project --exclude-dir=__tests__ \
  --exclude-dir=node_modules --exclude-dir=dontTouch --exclude-dir=dist 2>/dev/null \
  | grep -v ':0$' | sort -t: -k2 -n -r | head -10
```

**Approach:**
1. List all unique `box-shadow:` values in repo
2. Build mapping table (value → canonical token)
3. Apply mapping via Edit (not codemod — judgment per case)

**Estimate:** ~30 min. **Risk:** medium (visual emphasis often relies on shadow specifics).

---

### Batch 4.6 — `2px solid/dashed/dotted` → `1px` / focus ring (135 sites)

**Scope:** DESIGN.md says 1px universal, 2px allowed only under `prefers-contrast: high`. 135 sites use 2px borders.

**Per-site decisions:**
- Selection / focus indicator → swap to `box-shadow: 0 0 0 3px var(--bd-accent-tint);` (canonical focus pattern)
- Decorative emphasis → swap to `1px` border
- Genuine accessibility → wrap in `@media (prefers-contrast: high)`

**Top files:**
- `components/Panels/LeftSidebar/LeftSidebar.css` (13)
- `components/Canvas/Canvas.css` (12)
- `editor/canvas/Canvas.css` (10)
- `editor/sidebar/tabs/build/BuildTab.css` (7)
- `editor/canvas/overlays/DropFeedbackOverlay.tsx` (6)

**Estimate:** ~45 min. **Risk:** medium (selection rings are functionally important; 1px can look weak).

---

### Batch 4.7 — Decorative gradients in chrome (~10-30 real sites)

**Scope:** Total 161 gradients found, but most legit (template fixtures, gradient picker tool). Real chrome violations:
- `editor/inspector/styles/inspector.css:98` — header gradient (delete or convert)
- `LeftSidebar.css` skeleton shimmer (~3 sites — judgment: keep as common UX or replace with token-driven shimmer animation)
- `BuildTab.css:312, 319, 390` — chrome backgrounds (likely delete — DESIGN.md zero gradients)
- `Canvas.css` 5 sites — needs read

**Estimate:** ~20 min. **Risk:** low (chrome already mostly gradient-free).

---

### Batch 4.8 — `styles/tokens/canvas.tokens.ts` refactor

**Scope:** File name implies it references tokens, body has 21 hex + 22 px literals. Two options:
1. Convert literals to imports of canonical CSS vars (via `getComputedStyle` lookup or string references)
2. Delete file + redirect callers to canonical CSS directly

**Pre-flight:** Read file fully. Grep callers. Decide.

**Estimate:** ~20 min.

---

### Batch 4.9 — `shared/constants/{canvas,defaultStyles,uiStyles}.ts` review

**Scope:** 130 hex + 81 px in 3 files. Many are USER-CONTENT defaults (block default colors, default styles for newly-inserted elements). Some are chrome-related.

**Per-file judgment:** read, identify which constants are user-website defaults (D-bucket — leave or move to `--buildrick-design-*` user-website tokens) vs chrome (migrate to `--bd-*`).

**Estimate:** ~30 min. **Risk:** low if classification is careful.

---

### Batch 4.10 — `.ts` files top-13 hex (40 sites, deferred from 3.2/3.3)

**Scope:** TypeScript files contain mix of JS values (passed to canvas API → must stay raw hex) and CSS strings (consumed by Emotion → can be tokenized). Per-file inspection required.

**Pre-flight:**
```bash
for hex in '#FFFFFF' '#E2E8F0' '#64748B' '#94A3B8' '#F8FAFC' '#F1F5F9' '#2D6DFF' '#334155' '#CBD5E1' '#DC2626' '#0F172A' '#D97706' '#16A34A'; do
  grep -rl "${hex}" packages/editor/src --include='*.ts' \
    --exclude-dir=themes --exclude-dir=project --exclude-dir=__tests__ \
    --exclude-dir=node_modules --exclude-dir=dontTouch --exclude-dir=dist 2>/dev/null
done | sort -u
```

For each file: classify usage → swap CSS-string usages → leave JS-value usages → commit per file.

**Estimate:** ~30 min. **Risk:** low if classification correct.

---

## 5. Phase 5 — Lockdown (after Phase 4 complete)

### Batch 5.1 — Update hex gate baseline + flip ESLint rules

**Scope:** Memory baseline 1498 is stale. Reset to current count. Promote ESLint rules.

**Steps:**
1. Update hex gate config (likely `scripts/check-hex-baseline.ts` or similar) baseline number → current consumer count.
2. Promote rules in `eslint.config.mjs`:
   - `buildrik/no-raw-hex` → ERROR for `editor/**` + `features/**`, WARN for `components/**` + `blocks/**` + `templates/**`
   - `buildrik/no-banned-color` → ERROR (allowlist `colorTypes.ts`, `devLogger.ts`, `templates*`, `*Picker*`)
   - `buildrik/no-banned-font` → ERROR (allowlist `FontManager.ts`, `MediaManager.ts`, `SelectFontField.tsx`, `TemplatePreview.tsx`)
   - `buildrik/no-tailwind-class` → ERROR (`editor/**` only)
   - `buildrik/no-2px-border-outside-contrast` → WARN (universal)
   - `buildrik/no-decorative-gradient` → WARN (chrome only, allowlist `templates*`, `*Picker*`, `gradientParser*`, `ColorSwatch*`)
3. Remove `|| true` from CI gate invocation (per memory: "ESLint currently in allow-fail mode until backlog clears").
4. Commit.

**Estimate:** ~30 min. **Risk:** low (config-only; no source edits).

---

### Batch 5.2 — `components/ui/` barrel cleanup

**Scope:** Per inline comment in `components/ui/index.tsx`: "Remove this file in Phase 5 (barrel cleanup)." After Phase 4.1 deletes the 24 remaining root files, only `components/ui/index.ts` + `index.tsx` (barrels) + the residual `forms/` `Layout/` `AI/` etc. subfolders remain. Check each subfolder for actual consumers; if dead, delete; rewire any callers from `@components/ui/*` to `@shared/ui/*`.

**Estimate:** ~20 min. **Risk:** low after Phase 4.1.

---

### Batch 5.3 — Memory + doc finalization

1. Update `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_v1_remediation.md` with final baseline numbers + commit hashes.
2. Add note in `editor/CLAUDE.md` codifying:
   - "All NEW chrome code uses `--bd-*` tokens. Raw hex/px in non-allowlist files = CI fail."
   - "Use `var(--bd-fg-on-accent)` for text on accent buttons; `var(--bd-bg-card)` is for backgrounds only."
3. Archive audit + plan + roadmap docs by linking from `editor/docs/index.md` (if exists) or top-level CHANGELOG.

**Estimate:** ~15 min.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Token alias breaks at runtime | Low | High | TSC catches build errors. Vitest catches runtime logic. Visual smoke at 5050 catches CSS resolution. |
| Codemod over-reaches across CSS properties | Medium | Medium | Property-scoped regex (already implemented in 3.4). `.ts` files deferred until manual review. |
| Off-palette hex represents intentional design | Low | Medium | Phase 4.4 reviews each off-palette site, flags for new-token-addition vs map-to-existing. |
| Component delete breaks consumer | Very low | High | Pre-flight grep on every delete batch. Three deletes already validated pattern. |
| ESLint promotion breaks CI on PR | Medium | Low | Roll out one rule at a time. Re-allow `\|\| true` per-rule until backlog clears. |
| **Topbar visual regression (open)** | Active | Medium | See §7. |

---

## 7. Topbar regression (USER-FLAGGED, OPEN)

**State:** User reported topbar height + buttons issue post-Batch 3.4 (spacing codemod). Theoretical analysis shows zero visual delta possible (all substitutions resolve to identical pixel values). Three hypotheses:

1. **Browser cache** holding stale CSS — fix: hard refresh (Cmd-Shift-R)
2. **Vite HMR partial** — fix: restart dev server
3. **Pre-existing bug** now visible during smoke check — fix: investigate independently from DS work

**Diagnostic steps (any one resolves):**
```bash
# Step 1: Clean dev server
cd packages/editor && rm -rf node_modules/.vite && npm run dev

# Step 2: DevTools console at port 5050:
document.querySelector('.bdc-top')?.getBoundingClientRect()
# Expected: height ≈ 48px

# Step 3: DevTools Computed tab on .bdc-top:
# Look at: padding, gap, height, --bd-shell-header-h resolved value
```

**Escape hatch:**
```bash
git revert ea5c8ec    # revert Batch 3.4 spacing only; keeps hex wins
```

**Decision gate:** before continuing Phase 4 batches that touch the same files (4.4, 4.5, 4.6 all touch `LeftSidebar.css` / `Canvas.css`), confirm topbar regression status. If confirmed real → revert + reschedule those batches with stricter scope.

---

## 8. Execution order recommendation

Given current state and the open topbar regression:

```
1. Batch 4.3 — semantic fixups (13 sites, zero visual risk, builds confidence)
2. Batch 4.1 — finish components/ui/ root delete (24 files, dead, low risk)
3. PAUSE — visual smoke check at 5050 to address topbar regression
4. (if regression real) git revert ea5c8ec, then resume
5. Batch 4.10 — .ts hex (40 sites, file-by-file)
6. Batch 4.2 — Canvas.css purple → boxmodel
7. Batch 4.5 — box-shadow tokenization
8. Batch 4.4 — legacy 4 .css hex sweep
9. Batch 4.6 — 2px borders
10. Batch 4.7 — decorative gradients
11. Batch 4.8 — canvas.tokens.ts refactor
12. Batch 4.9 — shared/constants/* review
13. Batch 5.1 — ESLint promotion + gate baseline reset
14. Batch 5.2 — components/ui/ barrel cleanup
15. Batch 5.3 — memory + doc finalization
```

**Total estimate:** ~6-8 hrs across multiple sessions. Each batch is independent; can be split across days.

---

## 9. Decision gates marked

Each `🔴 DECISION` below = pause before proceeding:

- 🔴 Before Batch 4.4: confirm topbar regression status (§7)
- 🔴 Before Batch 4.4: approve "introduce new token" pattern if off-palette colors warrant it
- 🔴 Before Batch 4.5: approve shadow taxonomy mapping (xs/sm/md/lg/xl/modal/dropdown — does it cover all bespoke shadows?)
- 🔴 Before Batch 4.6: confirm "convert 2px borders to focus-ring shadow pattern" preference
- 🔴 Before Batch 4.8: choose between refactor vs delete for `canvas.tokens.ts`
- 🔴 Before Batch 4.9: classify each constant in `shared/constants/*` as user-content vs chrome
- 🔴 Before Batch 5.1: re-read final ESLint rule list, confirm allowlist files

---

## 10. Exit criteria

This roadmap is "done" when:

1. All Phase 4 + Phase 5 batches checked off
2. North Star §1 metrics achieved
3. TSC + vitest still green
4. Visual smoke check at port 5050 confirms no regression
5. Memory entry `project_ds_v1_remediation.md` updated with final baseline + commit list
6. CHANGELOG entry added describing the migration
7. New `CLAUDE.md` rule entry: "Token-only chrome. Hex/px in non-allowlist files = CI fail."

If a batch can't reach exit criteria within 2× estimate → STOP, document the obstacle, ask for human decision.
