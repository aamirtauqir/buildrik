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

## Gap closure (2026-10-09, branch `verify-extra`)

Worktree dev server on :3590 (`BRAND_TOKENS_V2=on`, `NEXT_PUBLIC_FEATURE_DS_AI=true`;
restarted once without the switch for the skipped-version push), plus a local
production build on :3591 for the perf numbers and a final Chromium run. QA
workspace only; every Playwright page aborts `sites.publish` before navigating
(0 publish requests in every run). All throwaway sites deleted; the workspace's
shared theme (null) and every site's `themeLocked` (false) restored and
re-checked. Harness scripts, JSON reports, screenshots and CPU profiles:
`scratchpad/verify-extra/` (`harness/` holds the throwaway specs).

### Bugs found and fixed (failing test → fix → live re-check)

| Commit | Bug |
|---|---|
| 363f95bf3 | Brand colour picker: typing a hex key by key (`#C2410C`) produced `#CC2244C` and disabled Apply. The valid prefix `#C24` moved HSB and the sync effect wrote the expanded `#CC2244` back into the field mid-typing. The E2E uses `fill()`, so it never typed. Found by the 700-element walk; re-checked live (typed hex applied, canvas repainted to `rgb(194,65,12)`). |
| 36b863b57 | Theme push results never said "kept N site tokens" although the owner chose that copy (1b OQ-8) and the service returns `kept`. Live re-check: "Updated · kept 1 site token", "Updated · kept 3 site tokens". |
| 8290d4f55 | (test only) Brand-heavy page through the publish file builder — item 5 below. |

### 1. Cross-browser (`e2e/brand-tokens.spec.ts`, `PW_FORCE_LOCAL=1`)

| Browser | Result |
|---|---|
| Chromium (prod build, final code) | 11/11 |
| Firefox 151 (Playwright, dev server) | 11/11 — first run 8/11; the 3 failures were `Can't reach database server` inside the spec's own Prisma seeding while the machine sat at load 150–480; all 3 green on re-run. No product failure. |
| WebKit | **Not verified.** Playwright 1.61 ships no WebKit for macOS 13 (`npx playwright install webkit` refuses; the mac14 fallback build aborts in dyld: `_CGImageSourceDisableHardwareDecoding` missing). BrowserStack WebKit (Sonoma) through a private tunnel, runner and seeding local: against the prod build every test lands on the login page — the session cookie is `__Secure-next-auth.session-token` (Secure), which WebKit does not send to `http://localhost`; against the dev server the unbundled editor did not finish loading through the tunnel before BrowserStack's idle timeout (300 s). Harness limits, not product findings — WebKit still needs a real Safari run (HTTPS staging, or a macOS 14 machine). |

### 2. Large-page performance (694 elements; 63 sections × heading + 8 paragraphs + button, 126 bound to Primary, 504 to Text)

Plan budget (1b live item 6): "no visible stutter; the usage index built at
most once per burst". There is no numeric budget, so typing is read against
one frame + INP "good" (≤ 200 ms). Machine load average 30–60 during the prod
runs (other agents), so absolute times are pessimistic.

| Measure | Prod build | Dev build |
|---|---|---|
| Canvas inline typing, 43 keys: keydown → next painted frame | p50 26 ms · p95 36 ms · max 45 | p50 7 · p95 10 |
| Same, Event Timing keydown duration | p50 32 · p95 40 · max 48 ms | — |
| JS during those 43 keys (CPU profile) | ~40 ms total; rest is style/layout/paint | — |
| Usage-index builds while typing | 0 (index is lazy; Brand closed) | 0 |
| Brand open (rail click → token list) | 0.81 s | 5.4 s |
| Usage count visible ("Used by 126") | 0.98 s | 6.5 s |
| Usage-index builds on Brand open | 1 | 1 |
| Hex typed key by key in the picker | Event Timing p50 16 · p95 144 ms | p95 88 |
| Apply Primary → 694-element canvas repainted | 0.60–0.87 s (click event 408–440 ms) | 5.0 s |

Verdict: typing is within budget (no stutter, index never rebuilt while typing,
once per Brand open). "Typing with Brand open" as the plan wrote it cannot
happen: Brand is a full-page view and the canvas is not on screen (measured:
canvas element not visible). Two discrete actions exceed INP "good" and are
recorded, not fixed (neither is typing, neither is the usage index): committing
an inline edit (Enter → frame 0.24–0.45 s prod, 2.1–2.3 s dev — React
re-render of the canvas, `SectionReorderHandles` the largest editor frame,
pre-existing, not Brand) and Apply on a token (0.6–0.87 s — ColorTokenList
re-render, `validateTokens`/`tryMerge`, the live-preview `exportHTML`
rebuild). Profiles: `prof-*.cpuprofile`.

### 3. Real theme push + rollback (local DB, QA workspace, from the theme manager)

Four throwaway sites per run (source v6, v6 with an in-use + an unused site
token, held v6, v5 with tokens). The other 35 QA-workspace sites were locked
for the push and unlocked after (they report "Locked — kept own"; 0 snapshots
written for them). Capture → Push to sites → preview → Push, not intercepted.

| Run | Results (UI) | DB |
|---|---|---|
| Switch on | src "Updated"; keep "Updated · kept 1 site token" (`color-brand-x` kept, unused one dropped); held "Brand rolled back — skipped" (tokens byte-identical); v5 "Updated · kept 3 site tokens" (migrated to v6). Preview: "2 will change · 1 already match · 35 locked (kept) · 1 skipped (brand format)". | 3 `theme-push` snapshots (v5 site's records `tokensSchemaVersion` 5) |
| Switch off | v5 "Brand upgrade paused — skipped" (server: "Brand upgrade is paused for this site."; still v5, 96 tokens); keep "Updated · kept 1 site token"; held skipped. | 2 snapshots |
| Undo push (UI, per row) | keep and v5 restored byte-exactly (v5 back to schema 5); snapshot consumed (0 left); Undo button gone. | |

### 4. Real website extraction (M11, unmocked, SSRF-guarded server fetch)

| URL | Result |
|---|---|
| https://example.com | 1.1 s · only `#222`/`#eee` → "We couldn't find brand colours on this site" + pick-a-colour fallback (correct) |
| https://www.wikipedia.org | 1.6 s · preview: Primary `#3366CC`, Accent `#92BA56`; fonts Montserrat / Playfair Display (Linux Libertine replaced) |
| https://stripe.com | 3.7–4.7 s · preview: Primary `#EE30FB`, Accent `#635BFF`; Inter / Inter (sohne-var replaced) |
| https://httpbin.org/delay/20 | 10.7 s → "That site took too long to answer" + Try again (real timeout, 10 s budget) |
| localhost:3590, 127.0.0.1:5432, 169.254.169.254, 10.0.0.1 | all refused in 0.4–0.7 s: "This address can't be used" |
| Confirm (throwaway site only, stripe.com) | canvas Primary `rgb(26,86,219)` → `rgb(238,48,251)`; 1 `logo` restore point |

Observation: for stripe.com the heuristic picks the higher-chroma magenta
(`#EE30FB`) over Stripe's brand `#635BFF` (most frequent saturated colour,
now Accent). That is the spec'd rule (highest chroma among the top 3); owner
call whether frequency should win.

### 5. Publish path

Not published — no real Vercel publish was run. `lib/__tests__/publish-files.brand.test.ts`
(8290d4f55) runs a Brand-heavy page (v6 tokens incl. a custom semantic with a
dark value, bound heading/button/text, a theme toggle) through the editor's
publish export (`exportPublishPages`), the worker's page passes
(`wireSliders`, `wireWidgetRuntimes`) and `buildDeployFiles`: Dark Auto ships
the token CSS byte-identical to the single-file export, the boot script in
`<head>` before the inlined sheet, the toggle runtime once in `<body>`; every
line the export wrote reaches the deployed file; Off ships the hide rule and
no boot script, runtime or dark block. 2/2.

### Still not verified

- WebKit / Safari (reasons above).
- A real Vercel publish and the deployed page (by instruction).
- Production deploy, prod env, the runbook's read-only SQL (owner).
- Perf on a quiet machine: every number above was taken at load 30–480.
