# Editor ↔ Figma "Foundations (32-2)" drift audit — Phase 0

**Source of truth:** Figma `g4GzQFqzNYz5sosz1QtZXC`, node `32-2` (Foundations page — tokens only; no screens/flows).
**Goal:** apply this foundation language across the whole editor chrome, kill drift, stay clean, prove with tests.
**Scope of this doc:** audit only, no edits. Read before Phase 1.

---

## 1. Colour tokens — Figma vs current

Canonical current tokens: `src/themes/design-system/color.css` (`--buildrick-*`).

### Surfaces — ✅ ALIGNED
| Figma | value | Current | match |
|-------|-------|---------|-------|
| bg-app / bg-subtle | #F1F5F9 | `--buildrick-bg-subtle` #F1F5F9 | ✅ (no `bg-app` token — add or alias) |
| bg-card | #FFFFFF | `--buildrick-bg-card` | ✅ |
| bg-panel | #F8FAFC | `--buildrick-bg-panel` | ✅ |
| bg-elevated | #FFFFFF | `--buildrick-bg-elevated` | ✅ |

### Ink — ❌ MATERIAL DRIFT (biggest visible change)
Figma ink scale is **darker / higher-contrast** than current. Naming also differs (`ink-*` vs `text-*`).
| Figma | value | Current | current value | verdict |
|-------|-------|---------|---------------|---------|
| ink | #0F172A | text-primary | #334155 | ❌ drift — Figma much darker |
| ink-soft | #485465 | text-secondary | #64748B | ❌ drift |
| ink-muted | #656F7E | text-muted | #94A3B8 | ❌ drift |
| ink-disabled | #CBD5E1 | text-disabled | #CBD5E1 | ✅ |
| ink (heading) | #0F172A | text-heading | #0F172A | ✅ (only heading matches Figma ink) |

**Impact:** applying Figma ink darkens most body/secondary text across the editor. This is the core "new look."

### Borders — mostly ✅, one MISSING
| Figma | value | Current | verdict |
|-------|-------|---------|---------|
| border | #E2E8F0 | `--buildrick-border` #E2E8F0 | ✅ |
| border-medium | #CBD5E1 | `--buildrick-border-medium` #CBD5E1 | ✅ |
| border-strong | #94A3B8 | `--buildrick-border-strong` #94A3B8 | ✅ |
| **border-input** | **#8D949C** | — | ❌ **MISSING** — add token |

### Semantic — ⚠️ DRIFT + 1 real conflict
| Figma | value | Current | current value | verdict |
|-------|-------|---------|---------------|---------|
| success | #16A34A | success | #16A34A | ✅ |
| **warning** | **#D97706** | warning | **#B45309** | ⚠️ **CONFLICT — see §4** |
| error | #DC2626 | error | #DC2626 | ✅ |
| success-text | #117D39 | success-strong | #15803D | ❌ drift (name + value) |
| warning-text | #A05804 | warning-strong | #854D0E | ❌ drift |
| error-text | #CB2323 | — | — | ❌ missing |
| success-tint | #E3F4E9 | success-soft | #DCFCE7 | ❌ drift |
| warning-tint | #FAECDC | warning-soft | #FEF3C7 | ❌ drift |
| error-tint | #FBE5E5 | — | — | ❌ missing |

### Accent — ✅ ALIGNED
accent #406ED6 ✅, accent-text #3C68C9 (current border-focus uses #406ED6; add `accent-text`), accent-on #FFFFFF = `text-on-accent` ✅, accent-tint #ECF0FB (add token).

---

## 2. Size tokens — ❌ mostly NOT tokenised

Figma "committed numbers" (`src/themes/design-system/layout.css`):
| Figma size | value | Current token | verdict |
|-----------|-------|---------------|---------|
| topbar | 56 | `header-height` 56px | ✅ (rename to topbar) |
| header | 44 | — | ❌ missing |
| footer | 32 | `footer-height` **40px** | ❌ drift (40 vs 32) |
| drawer | 320 | `layout-drawer-right` 320px | ✅ |
| rail | 60 | — | ❌ missing (hardcoded in rail?) |
| inspector | 300 | — | ❌ missing |
| panel-right | 360 | — | ❌ missing |
| nav | 240 | — | ❌ missing |
| row / row-dense / row-tall | 32 / 28 / 64 | — | ❌ missing |
| (current) drawer-left | 344px | — | ⚠️ no Figma equivalent — reconcile |

**Impact:** these numbers live hardcoded in components. Tokenise them so the shell dimensions come from one place.

---

## 3. Type & radius

- **Radius:** sm 4 ✅, md 8 ✅, lg 12 ✅, full 9999 ✅. Current has extra `xl 16` (Figma has none — keep or drop, low-risk).
- **Type family:** Figma ui styles = **Inter**, data = **Geist Mono**. Current = **"Inter Tight"** + Geist Mono. ⚠️ drift (Inter vs Inter Tight) — decision needed (Figma says Inter; code deliberately ships Inter Tight per FINDING-003).
- **Type scale:** Figma names 11 styles (data/11-13 mono; ui/11 caption 500, ui/12 small 400, ui/13 row-label 400, ui/13 row-label-medium 500, ui/14 panel-title 600, ui/16 heading, ui/20 heading-lg, ui/24 title). Current typography.css has ~20 token lines — map each Figma style to a token; add any missing.

---

## 4. ⚠️ THE ONE REAL CONFLICT — Figma vs accessibility

Three current tokens **deliberately deviate from Figma** for WCAG AA (documented in color.css):
- `warning` **#B45309** — Figma #D97706 **fails** WCAG AA on warning-bg (3.19:1 < 4.5). Code fixed it to 5.04:1.
- `success-strong` #15803D, `warning-strong` #854D0E — chosen for AA text-on-tint.

**Blindly matching Figma here REGRESSES accessibility** (re-introduces a documented contrast failure).

**Default decision (unless founder overrides):** keep the a11y-safe values; treat them as intentional deviations; note them in a `/* keep: WCAG AA, Figma #D97706 fails */` comment. Match Figma on every non-conflicting token. → This needs a one-line founder nod; the loop proceeds on all non-conflicting tokens meanwhile.

---

## 5. Hex drift per chrome surface (hardcoded `#hex` in JSX)

`grep -roE '#[0-9A-Fa-f]{6}' src/editor/<surface>/*.tsx`:
| Surface | count | note |
|---------|-------|------|
| rail | 0 | ✅ already clean |
| onboarding | 3 | low |
| panels | 7 | low |
| sidebar | 17 | |
| media | 18 | |
| shell | 18 | |
| canvas | 19 | |
| **inspector** | **51** | highest — despite recent 32-2 pass; re-verify which are intentional |
| *(all src/editor)* | *~311* | Phase 2 target: → 0 (or tokenised) |

---

## 6. Gates (keep — they enforce this design)
`pnpm verify:ds` runs: `verify-design-baselines` + `ds-grep-gates.sh` + `check-ds-ssot` + `check-tsc-baseline`. Plus `gate:buildrick`, `gate:ds-ssot`, `gate:ds-migrations`, `gate:ds-alias`. **Do not remove.** Adjust only a specific baseline number that literally blocks a legit new value, with a reason.

---

## 7. Phase plan (from here)
- **P1 token reconcile:** add missing tokens (border-input, ink rename/darken, semantic text/tint, accent-text/tint, bg-app, size tokens rail/inspector/panel-right/nav/header/row). Match Figma except §4 a11y keeps.
- **P2 apply + remove old:** repoint chrome to tokens; kill ~311 hardcoded hex; apply 32-2 language to all surfaces; delete dead CSS.
- **P3 verify:** token-conformance test vs a Figma-derived fixture; Playwright visual regression per surface; `pnpm verify:ds` green; tsc + vitest.

**Open decisions for founder:** (a) §4 a11y warning — keep a11y-safe (default) or force Figma #D97706? (b) type family Inter (Figma) vs Inter Tight (shipped)? Loop defaults to a11y-safe + keep Inter Tight; override anytime.
