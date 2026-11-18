# Phase 1 runtime evidence

Date: 2026-09-25. Application source unchanged. Local Vite demo at `http://127.0.0.1:5050/`, Chromium via installed Playwright 1.61.1, isolated browser context, viewport 1440×900. No user profile/cookies imported, no AI request, invitation, publication or deletion sent.

The two installed gstack browse binaries failed because their required Chromium revisions 1208 and 1234 were missing; the installed project runtime uses available revision 1228. The local Vite server and browser required sandbox escalation; approved commands were used. A temporary local-only Playwright driver at `/tmp/buildrick-phase1-browser.mjs` exercised ordinary UI controls and read DOM/ARIA state. This driver is audit tooling, not application code.

## R1 — AI has two simultaneously mounted destinations

Related finding: IA-001 / IA-PROD-01. **VERIFIED in the standalone local demo**; authenticated production-host equivalence is not established.

Steps exercised:

1. Open the clean local demo, dismiss rail introduction, click the no-selection Inspector action “✦ Ask AI ›”. Right Inspector becomes AI with a Back to Inspector control.
2. Press Meta+K, choose “Open AI panel I”. The left panel begins lazy-loading AI while right AI remains present.
3. Navigate to the local dashboard, then return to the demo; the persisted left tab is AI. Click “✦ Ask AI ›” again to open right AI. Wait for rendering before inspection.
4. The ARIA tree now contains an AI tabpanel on the left and a separate AI surface within “Element properties” on the right, each with Prompt, Send, scope and draft actions.
5. DOM inspection of `textarea[placeholder="Ask AI to change something…"]` returns two visible boxes: left x=76,y=140,w=247,h=52; right x=1156,y=176,w=268,h=52.

Evidence: [simultaneous AI surfaces](ai-dual-panels.png). The first transient screenshot was discarded as evidence because it showed the left loading skeleton; the retained capture shows both loaded surfaces. Closing Back to Inspector and returning the left rail to Add restores the ordinary layout. No model generation was invoked; session divergence follows additionally from the separately instantiated local React message/mode state identified in the source report.

## R2 — authenticated dashboard prerequisite

Navigating the isolated browser to `http://localhost:3000/dashboard` redirects to `http://localhost:3000/auth` and presents sign-in. No credential bypass or user-cookie import was attempted.

Therefore authenticated draft-sharing modal creation, workspace notifications, invitations, real review data, publication, and server persistence are **NOT RUNTIME VERIFIED**. Their Phase 1 claims remain source-qualified; this is not a pass or a failure of those authenticated features.

## R3 — duplicate Undo actions in the same palette

During Audit 2, Meta+K exposes both “Undo” and “Undo last action”, each showing the same shortcut and disabled “nothing to undo” reason in the same context. DOM/ARIA inspection confirmed both command options. Source inspection at `src/editor/shell/modals/CommandPalette.tsx:71` and `:143` establishes identical `composer.history.undo()` handlers and `canUndo()` guards. This verifies duplicate exposed entries; no destructive history-clear operation was executed.

## R4 — Settings return resets navigation context

During Audit 3, select Pages in the rail, open Site menu → Site settings, then choose Back to canvas. The selected rail tab becomes Add rather than Pages. Read-only DOM inspection confirmed Add selected after this exact sequence. `StudioPanels.handleFullPageClose` at `src/editor/shell/StudioPanels.tsx:411` explicitly sets Add for non-media full-page closure. **VERIFIED in local demo.** No setting was edited or saved.

The Settings overview displayed its expected request-error/retry state in the unauthenticated demo. That infrastructure limitation is not classified as a new product failure.

## R5 — bare panel shortcut does not reopen the drawer

During Audit 3, select Add, click its already-selected rail item to close the drawer, then press the unmodified `p` key. Pages content is mounted, but its tabpanel remains only 1px wide at x=60,y=56,h=780. It is not a usable visible panel. Clicking the Pages rail item opens it normally. Evidence: [hidden Pages after shortcut](shortcut-hidden-pages.png). **VERIFIED in local demo.** This checks keyboard entry visibility, not whether every panel keyboard combination works.

## R6 — existing Media Library compile blocker

During Audit 3, Assets → Manage assets fails to load the full library. The panel displays its error fallback and Vite reports `[plugin:vite:react-babel] .../LibraryManager.tsx: Unexpected token (870:0)` at a literal `<<<<<<< HEAD` line. A source search confirms the marker at `src/editor/media/LibraryManager.tsx:870`; the staged diff captured at the start of this audit already contained it. No audit agent edited production files.

**P1 — VERIFIED working-tree compile/navigation blocker.** This is not claimed to be a deployed production crash. Evidence: [media load failure](media-compile-blocker.png). Full-library flows are blocked until the owner approves resolving the staged conflict residue. The editor shell remains navigable through the rail; the audit returned to Add without modifying the source or discarding staged work.

## R7 — dashboard authentication redirect omits the requested destination

Navigated the isolated browser to `http://localhost:3000/dashboard/media?from=phase1-audit`. The final location is plain `http://localhost:3000/auth`, with no return-path/query parameter. This verifies the redirect portion of NAV-W01. Post-login destination remains **NOT RUNTIME VERIFIED**, since no login was performed.

The backup-code screen was also opened with an explicitly dummy token and continuation parameters, and Back to code was clicked. No verification code or credential was submitted. The driver did not capture the settled post-click URL, so NAV-W02 remains source-verified rather than upgraded on incomplete runtime evidence.

## R8 — issue row dismisses instead of navigating

Related finding: NAV-C02. Open the 17-warning Issues surface in the demo, then click the first row naming `Brand › color-primary`. Issues closes; read-only DOM inspection shows Add remains selected and no issue row remains mounted. No Brand navigation or element selection occurs. Source callback at `AquibraStudio.tsx:626` only sets issuesOpen false. **VERIFIED in local demo.** The click did not request token auto-fix or mutate the issue target.

## R9 — AI command does not reveal a hidden Inspector

Related finding: IA-001, another symptom of the destination/visibility contract rather than a separate issue count. Hide Inspector using the footer toggle; open Meta+K and select “Open AI assistant ctrl+shift+a”. After rendering settles, AI is mounted inside the still-hidden Inspector: the aside rectangle is x=1440,width=0 in a 1440px viewport; the prompt textarea starts at x=1456. Clicking the footer Inspector toggle reveals it. Repeated once before capturing [hidden AI destination](ai-hidden-inspector.png). **VERIFIED in local demo.** No AI request was submitted. The alternate palette action “Open AI panel I” is the separate left destination covered by R1.

## R10 — scoped search smoke checks

Meta+K → query “Pages” returns “Replace page layout with template…” and “Open Pages panel”; the first matches its internal Pages group. Escape closes the palette. Add → Search elements → “Heading”, after the debounced render settles, shows two Heading results grouped ELEMENTS and BLOCKS, not duplicate instances of the same result. **PASS for these narrow demo search cases.** This does not establish full search coverage, server pagination, or dashboard palette behavior.

## Runtime boundaries

The demo shares editor source but does not establish the production Next route/auth/API state. No page errors were captured through R1/R2; R6 subsequently establishes the Media compile failure. This does not assert an error-free network: unauthenticated API responses are expected in this setup. Later scenarios will record their own results rather than inheriting a blanket pass.
