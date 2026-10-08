# Phase 2 — Full live Editor audit (2026-10-08) — shared brief for every agent

## Goal
Honest, complete picture of the current Editor BEFORE major fixes. AUDIT ONLY: do NOT
edit, stage, commit or stash anything in any repo checkout. Do not refactor. Read-only code
reading + live walkthrough + read-only commands.

Three-way comparison for every feature: (1) Figma, (2) code, (3) what a complete Editor
logically should do. Neither Figma nor code is the source of truth — decide which side
(or both) needs correction.

## Environment (already running — do NOT start/stop servers, do NOT log in again)
- Code under audit: /Users/shahg/Desktop/buildrik-worktrees/editor-live-audit (detached at
  current `main`). Read code here.
- Live app: http://localhost:3300 (Next dashboard with the bundled editor at /edit/:siteId).
  It is a dev server on a loaded machine: first visit of a route can take 30–120s. Be patient;
  never `waitUntil: "networkidle"` (HMR socket never idles).
- Logged-in session (qa@buildrik.local, OWNER of workspace "E2E Blank WS 0a95fc", BUSINESS
  plan): Playwright storageState at
  /private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/32768d0c-fd16-4e81-9c07-95328f6a40d5/scratchpad/bk-auth-3300.json
  Reuse it. NEVER mint magic links / log in (single-use tokens, rate limited).
- Rig: `scripts/baseline/editor-rig.mjs` in the worktree. READ ITS HEADER FIRST — it lists
  7 traps already paid for (dev overlay impersonating the inspector → `stripDevOverlays`
  before reading; canvas nodes are `[data-buildrick-id]`; scroll before coordinate clicks;
  some menu rows open a NEW TAB → listen `context.on("page")`; etc.). Import with
  `BK_BASE=http://localhost:3300`. Playwright: require it as the rig does
  (createRequire on packages/dashboard/package.json). Viewport 1440×900.
- Write probe scripts ONLY in your own folder: scratchpad/audit2/work-<your-id>/ .
  Screenshots there too. Run node scripts from that folder with absolute imports.
- YOUR OWN SITE: do not edit the shared fixture site (cmrsur1fp000unh3rvmmiq25t) — other
  agents run concurrently and save-conflicts would create fake findings. Create your own
  throwaway site through the dashboard UI (that also audits the create flow) named
  `Live audit 2026-10-08 · <your-id>`; if UI creation fails, record it as a finding, then
  duplicate an existing scratch site via the dashboard. At the end move your site to trash.
- PUBLISH: the QA workspace has a REAL Vercel connection — a publish deploys for real.
  Do NOT complete a real publish. Audit up to the pre-publish checks / confirm dialog and
  mark the rest UNVERIFIED unless the coordinator says otherwise.
- AI: dev routes streamPrompt to Ollama (OLLAMA_BASE_URL) and other AI calls to OpenAI
  (real key, costs money). Keep live AI calls minimal (≤ 15 total for the AI agent, ≤ 3 for
  others) — enough to prove each flow works or not.
- Machine is heavily loaded (other sessions run too). A timeout is your harness until
  proven otherwise. CLAUDE.md rule: "A null result is your harness until proven otherwise."
  Re-check with a screenshot before filing "does nothing".
- Measure, don't eyeball: use getComputedStyle / DOM reads for visual claims.

## Prior work to reuse (don't redo, but re-verify anything you cite — it may be stale)
- Phase-1 code audits (2026-10-08, against slightly older main 44f5db956):
  scratchpad/audit/01-ai-editor.md, 02-ai-server.md, 03-engine.md, 04-canvas-inspector.md,
  05-pages-cms-components-forms.md, 06-brand-media-seo-issues.md,
  07-publish-api-integration.md, 08-ai-extensions.md.
  Fixes for many of those exist on a PARKED branch `fix/editor-ai-audit-2026-10-08`
  (NOT on main). The live app runs main, so those bugs should still reproduce on main —
  a live reproduction of a phase-1 finding is valuable confirmation; mark it
  "Confirmed live (fix parked on branch)".
- Figma ↔ code gap work: packages/editor/docs/audit-2026-09-21/ (03-gap-matrix.md,
  02-figma-inventory.md, REPORT.md, dump/live-*.json = 1,098 boards) and
  packages/editor/docs/code-figma-alignment-2026-09-27/ in the founder checkout
  /Users/shahg/Desktop/pencil/buildrik (read-only).
- Figma source of truth file g4GzQFqzNYz5sosz1QtZXC page 4418:45431 (Editor v3 · IA).
  Only the Figma agent makes live Figma calls.

## Output — write to scratchpad/audit2/<your-id>.md
Start with: modules covered, what was walked live, what was only read in code, what could
not be verified and why. Then one entry PER ISSUE (do not merge issues; do not skip because
there are many):

```
### <ID e.g. L1-007> <Issue title>
- Module / Screen-location / Feature:
- Labels: (one or more of) FIGMA ONLY ISSUE | CODE ONLY ISSUE | FIGMA + CODE ISSUE |
  BROKEN FUNCTIONALITY | INCOMPLETE FUNCTIONALITY | MISSING FUNCTIONALITY |
  INTEGRATION ISSUE | AI ISSUE
- Category: Broken existing feature | Incomplete existing feature | Missing required feature |
  UX improvement | Nice-to-have enhancement
- Type: Design | Functional | Integration | AI | UX | Code Quality | Missing State
- Severity: Critical | High | Medium | Low
- Problem:
- Expected behavior:
- Current behavior: (say "LIVE: observed …" with screenshot path, or "CODE: …" with file:line)
- Figma status: (board id/name or "no board" or "not checked")
- Code status: (file:line)
- Integration impact:
- Probable root cause:
- Dependencies:
- Recommended next action:
- Evidence: LIVE-VERIFIED | CODE-ONLY | PHASE-1 CONFIRMED LIVE | UNVERIFIED (why)
```

Then a short module verdict table: module | UI | function | states | integrations |
persistence | errors | journey complete? — use VERIFIED / PARTIAL / BROKEN / NOT CHECKED.
A module is "complete" only if every column is VERIFIED.

Final chat message: ≤ 25 lines — counts by severity, top 5 critical/high, path to file.
