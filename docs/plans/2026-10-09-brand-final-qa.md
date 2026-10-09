# Brand Part 1 (1a + 1b + 1c) — final QA, 2026-10-09

Branch `qa/brand-final` from `main` 50ab12da6. Worktree dev server on :3550
(`BRAND_TOKENS_V2=on`, `NEXT_PUBLIC_FEATURE_DS_AI=true`; restarted once with the
switch unset for the switch-off case). QA workspace, throwaway sites only (all
deleted), every Playwright page routes `sites.publish` to a 403 before
navigating — zero publish requests made. Screenshots and side-by-side
board | live pairs: `scratchpad/brand-final/shots/` (`pairs/<state>.png`).
Board PNGs reused from earlier captures; no Figma call made.

## Gates

| Gate | Result |
|---|---|
| Brand E2E `e2e/brand-tokens.spec.ts` (`PW_FORCE_LOCAL=1`) | 12/12 on the final run (2 × 1a, 4 × 1b, 6 × 1c); 0 publish requests |
| Editor vitest `--maxWorkers=2` (after the fixes) | 1317/1317 files, 13101 passed, 22 todo; exit 1 from one pool "worker failed to start" timeout (`useAiQuota.test.ts`, 4/4 alone). Baseline run before the fixes: 2 failed in `RedirectsScreen.test.tsx`, 40/40 alone. |
| Root `npx vitest run` | 14581 passed, 1 failed under load (`KeyboardCheatSheet.search` — 8/8 alone) |
| `pnpm test:db` | 29 files, 138 tests passed |
| `tsc --noEmit` editor / dashboard | 0 / 0 errors |
| `verify:ds` (editor) | exit 0 |
| `gate:ds` (dashboard ds-grep) | 7/7 passed |
| `gate:trpc-orphans` | pass (309 procedures, 28 orphans all accounted) |
| `audit:rules` | 0 present-tense findings (23 history lines, read) |

E2E flows added (1b Task 14 / 1c Task 16): insert binding + ⌘Z; safe delete
with replacement (canvas + export follow, ⌘Z); Connect preview / apply / ⌘Z;
autosave of an edit and of its ⌘Z + Review changes stale row and one-row
revert; Dark Auto generate → preview → confirm → ⌘Z, export dark page
(luminance < 0.1) + light text under `prefers-color-scheme: dark`; generator
keeps `#0E7490` exactly at step 600; generator restore point restores after
reload, ⌘Z undoes it; brand from a PNG logo + `logo` restore point; theme
toggle in Add only on Auto, hidden (`display:none`) in an Off export.

## Bugs found and fixed (failing test → fix → live re-check)

| Commit | Bug |
|---|---|
| c19c1aa9a | Review changes · Revert on any colour edit was refused ("That revert wasn't applied"): the removal guard counted the edit's own `custom-*` primitive as in use through the CURRENT alias chain. Now counted through the pending set. |
| 18af500da | M3 board's third Colours action "From logo or URL" was missing. |
| fdfd4f8ba | M8 dark-preview: previewing Auto on an Off site showed dark tokens on a white page with black text in the live preview (the saved Off export lacks the Auto page rules). |
| 79752384c | Switch off / held / failed: Brand checks listed 4 false "Semantic token needs an alias" errors (jargon) on the v5 overlay set. |

## Board walk (1440×900, board vs live, getComputedStyle where it matters)

| Family | States | Verdict |
|---|---|---|
| M1 read-only | failed (v6 site with invalid saved tokens, real DB), held (`tokensMigrationHold`, real DB), switch off (server restarted without `BRAND_TOKENS_V2`, v5 site; saved version stayed 5, 0 snapshots, edits disabled) | Pass after 79752384c. Copy exact for all three. |
| M2 Review changes | empty · list · stale · one-row reverted | Pass after c19c1aa9a. |
| M3 header | idle (no Save; Review changes · Restore points) + actions row | Pass after 18af500da. Header also carries the page action ("+ Add token"), as shipped. |
| M4 theme push | results card + re-capture tooltip | Pass. `theme.getShared` GET patched, `previewPush`/`push` fulfilled locally — no real push. |
| M5 usage | counts · unknown (component store read held) · highlight | Pass. |
| M6 safe delete | replacement · unused · unknown · replaced | Pass. |
| M7 Connect | suggestions · choose (tie) · preview · applied · nothing | Pass (copy drops "creates a restore point" per OQ-4). |
| M8 Dark mode | off · auto · aliases · dark-preview · preview-disabled · auto-dark-preview | Pass after fdfd4f8ba (canvas heading `rgb(241,121,83)` = generated #F17953). |
| M9 generator | pick · generated · preview · confirmed | Pass; picked step 600 = `#0E7490` exactly, preview button `rgb(14,116,144)`. |
| M10 restore points | list · empty · restored | Pass; restoring `dark-auto` put Primary back to `rgb(26,86,219)` and Dark mode Off. |
| M11 logo / URL | source · loading · preview · no colours · timeout · refused · confirmed | Pass. Loading/timeout/preview mocked at the tRPC route; `127.0.0.1` and `169.254.169.254` refused by the live server; logo decode + restore point real. |
| M12 theme toggle | add panel · canvas light · canvas dark · published auto · off hidden · published dark | Pass with one deviation: see "Canvas dark" below. Published pages from single-file exports: Dark click flips and persists across reload, OS-dark default pressed, boot script in `<head>` (no flash); Off export hides it, no boot script, no runtime. |

DESIGN.md (measured across every Brand state captured, chrome only — canvas,
live preview and swatches excluded): text in Inter only; the only saturated
blue is `#1A56DB`; zero purple/violet/indigo; no Brand weight above 600;
off-grid values only 1px borders and the board's 11px popover offset. The
dashboard's own "Agency" page title is 700 (pre-existing, outside Brand).

## Observations, not changed

- **Canvas dark (M12 8228:233404).** Since L4-021 (5b44aaa16) the Light/Dark
  switch is preview-only inside Brand, so the editor canvas itself never shows
  dark; the toggle's dark state is visible in Brand's live preview only. The
  board draws it on the canvas. Owner call.
- The live preview frame reloads ~0.3–0.8 s after a token write (doc rebuild),
  showing a blank frame for that moment.
- A generator / logo / restore write does not appear in Review changes (it is
  one ⌘Z step and a restore point instead).
- E2E flakes seen only while the root suite ran 7 workers (load ~130): editor
  load timeouts and one restore ⌘Z miss; all green alone, twice.

## NOT verified

- Real website extraction against a public site (mocked; only the refusals hit the live fetcher).
- Real theme push / rollback on real sites (intercepted by design).
- Publish and the deployed page (single-file export only, never published).
- Production deploy, prod env, the runbook's read-only SQL (owner runs it).
- 1b live item 6 (typing on a ~700-element page, usage index once per burst) and 1c Task 15 (not shipped).
- Mobile / other browsers (Chromium 1440×900 only).
