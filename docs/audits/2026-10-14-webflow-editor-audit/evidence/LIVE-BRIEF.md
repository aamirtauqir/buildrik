# Live verification brief — Buildrick audit 2026-10-14

You are a live verifier. Execute the "Live checks needed" (§10) of your assigned code-map file, plus your assigned end-to-end journeys, in the RUNNING app. Do not edit product code, tests, config, Figma or repo docs. Local test data you create (pages, elements, CMS rows, test users in the local DB) is fine; prefix names with `audit1014`.

## Environment (already running — do not start/stop servers)
- App: http://localhost:3300 (Next dev, main @ df60cf9ec, worktree ~/Desktop/buildrik-worktrees/editor-live-audit). Shipping editor at /edit/<siteId>.
- Rig: /Users/shahg/Desktop/pencil/buildrik/scripts/baseline/editor-rig.mjs — READ ITS HEADER (7 traps). Always run scripts with env `BK_BASE=http://localhost:3300` and cwd /Users/shahg/Desktop/pencil/buildrik. Exports: login, openEditor({statePath, site}), stripDevOverlays, readInspector, clickCanvasElement, readToasts, clickMenuRow, resetLoginRateLimit.
- Logged-in session (owner qa@buildrik.local, user cmpa9ohx10000wrjux4ecumzo): copy /private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/726dae5c-727f-4c77-bc55-c68ee4778d8a/scratchpad/audit/live/auth.json to your own dir and pass it as statePath. Don't burn magic links unless you need another user; if you do, call resetLoginRateLimit() first.
- Playwright: `createRequire("/Users/shahg/Desktop/pencil/buildrik/packages/dashboard/package.json")` → `@playwright/test` (see rig). Viewport 1440×900 unless a check says otherwise (also check 1280×720 where relevant).
- ONLY use your assigned site. NEVER modify the shared fixture site cmrsur1fp000unh3rvmmiq25t.
- The workspace "E2E Blank WS 0a95fc" has a REAL Vercel connection: clicking final Publish deploys for real. Only the agent explicitly authorized below may do that.
- Never waitUntil networkidle. Strip dev overlays before READING panels. Scroll into view before coordinate clicks. Run multi-step chains in one browser session.

## Method
- Measure, don't eyeball: getComputedStyle, DOM attributes, network responses (page.on('response')), reload-and-reread for persistence. Screenshots as supporting evidence only.
- A null/empty result is your harness until proven otherwise (wrong selector, overlay, off-screen, dead session). Re-try with a different method before concluding.
- For each check record: ID (from the code map), claim, steps actually run, measured result, verdict = CONFIRMED (defect/behaviour reproduced as claimed) | NOT REPRODUCED (behaves correctly / claim false) | PARTIAL (differs from claim — say how) | BLOCKED (couldn't execute — say exactly why and what evidence is needed), evidence paths.
- Also record any NEW issue you observe, with steps + measurement, and state coverage you actually saw (empty/loading/error/disabled/saving/saved/conflict...).
- Save screenshots/JSON under your evidence dir.

## Output
Write markdown to your results file: summary counts, a table of every check, journey walkthroughs (step → observed → issue), new findings, and an explicit "Not verified" list with reasons. Return a <=300-word summary + file path.
