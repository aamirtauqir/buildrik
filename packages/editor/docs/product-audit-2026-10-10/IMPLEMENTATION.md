# Implementation and verification programme

Status: audit and interaction specification produced; first bounded menu correction implemented. This is not a claim that the whole redesign has shipped.

## Ordered slices

| Order | Change | Dependencies | Acceptance and verification |
|---|---|---|---|
| 1 | Context-menu keyboard/click activation | Existing menu registry | Failing regression first; submenu position, child execution, disabled guard, nested Escape; preserve hover and overlay |
| 2 | Preview/rendered-style parity | Export/style engine diagnosis | Reproduce UX-09 with stored breakpoint style; compare canvas CSS, export CSS, sanitization and iframe media query match. Assert font/line-height parity at375/768/desktop and after reload. Preserve current device separately |
| 3 | Effective inspector state | Resolved-style source contract | Inherited alignment, line-height units, token values, breakpoint resets and mixed selection match computed output. Unit and browser checks |
| 4 | Workspace focus isolation | Current portal/overlay ancestry | Settings/Brand/Assets/Templates tab order, nested dialog Escape, unsaved exit and opener restoration; no background shortcuts firing |
| 5 | Action eligibility and grouping | Canonical shared command contract | Text/image/root/locked/multi/CMS/component matrix; disabled reasons; group same-parent logic; reorder boundaries; one undo per mutation |
| 6 | Surface policy consolidation | Existing route and role regression tests | Typed policy for left/right/workspace/compare; preserve deep links, caller state and role restrictions. Migrate one host family per change |
| 7 | Narrow-screen behavior | Surface policy, Figma variants |1440×900,1280×720,1024×768,200% zoom; no clipped exits/actions, usable canvas and menus. Selection reveal and collapse behavior |
| 8 | First-run and creation flows | Route-return contract | One next task, no competing onboarding/success stack; named starter opens requested template; preview uninterrupted |
| 9 | CMS workflow refinement | Record/collection save contracts | Honest first step, central creation/import, fields→record→optional page→binding→return. CSV/reference/retry/conflict tests |
| 10 | Brand and reusable design | Usage and propagation evidence | Semantic palette, token usage/impact, local versus global clear; component edit/override/detach and undo tested |
| 11 | Asset and settings consistency | Workspace family and save models | Picker vs manager entry, return selected asset, versions/replacement/alt text; settings touched validation and accurate save feedback |
| 12 | Authenticated release flows | Disposable authenticated site and services | Owner/editor/viewer, save+reload+conflict, review delivery, approval gates, publish+failure+rollback, plan restrictions |
| 13 | Visual polish and final evaluation | Stable workflows, updated Figma variants | Typography/spacing/density/icon/colour parity; accessibility audit; representative task completion timing and user validation |

The order deliberately protects output correctness and recovery before broad visual change. No migration should remove stored features just because their present entry point is confusing. Keep data schemas backwards-compatible; move doors and consolidate handlers before deleting old code.

## First correction — current changes

Files: `src/editor/canvas/menus/{ElementContextMenu,SubmenuItem,SubmenuPanel,MenuItem}.tsx` and `__tests__/ElementContextMenu.overlay.test.tsx`.

- Keyboard state follows parent or child menu, so child actions can actually execute.
- Submenu positioning is computed on activation, including keyboard and click.
- Click can open submenus; existing delayed hover remains.
- Expanded accessibility state reflects open state rather than highlight.
- First Escape closes child; second dismisses menu; document-level duplicate Escape callback removed.
- Home/End and Space supported; menu rows are not separate Tab stops.

No action handlers, menu ordering, engine mutation semantics or brand styling were changed in this slice.

### Verification record

- Before implementation: new regression cases failed (3 failures; 3 existing tests passed).
- After implementation: **6 menu test files, 25 tests passed**.
- Final focused run including context-menu hook integration: **7 files, 28 tests passed**.
- `npm run typecheck`: exit 0, no TypeScript diagnostics.
- `npm run gate:chrome-ui-surface`: passed; `git diff --check`: passed.
- Chromium at1440×900, disposable local page: inserted Heading through Add; right-clicked; navigated Home + four Down keys to Style; before opening `aria-expanded=false`; ArrowRight opened submenu at x942/y414 with active child `copy-styles`; Enter executed Copy style and menu count became0.
- Click reopened Style; first Escape left main menu count1 / child count0; second Escape left main count0. [Screenshot](menu-keyboard-verified.png).
- The complete application suite and authenticated end-to-end flows were not run. This verification is scoped to the changed menu behavior.

## Whole-product acceptance scenarios

1. Create a page from a named starter, dismiss no unrelated modal, rename a layer, select/edit heading, and find the same element in Layers.
2. Set desktop and mobile typography, inspect origin, reset only mobile, undo/redo, then preview/export at the same width.
3. Select one/many/root/locked/CMS/component elements and compare menu, inspector and keyboard availability; no silent no-ops.
4. Open each full workspace from an element, use a nested dialog, Escape/back, and recover original selection, zoom and keyboard focus.
5. Create collection, fields, record, reference, import CSV, optional dynamic page; bind text/image and verify exported content.
6. Upload/select/replace media, inspect alt text, restore a version; cancel picker without changing caller; recover upload failure.
7. Create component, insert twice, edit master, override one instance, reset/detach; verify propagation and history.
8. Change brand token used by several elements; preview exact impact, save/reload, undo; distinguish unbound styles.
9. Edit site/page SEO, language, redirect and custom code; validate saved state and published output separately.
10. Lose network during save, encounter remote conflict, resume, reload; avoid false saved claims or duplicate records/jobs.
11. Request review, resolve feedback, publish/approve, inspect logs, fail/retry, rollback; verify permissions through every entry point.
12. Repeat key tasks at narrow desktop dimensions, keyboard only, reduced motion and zoom; profile large-page selection/typing/drag separately.

These scenarios are an acceptance backlog, not reported passes. Authenticated integration, performance budgets and assisted-technology testing remain required before calling the builder production-quality.
