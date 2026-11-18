# Resumed audit observations

## UX-26 — Create page defaults to a browsing action

Priority P2. Observed behavior and source verified; usability judgment, not a failed creation claim.

Steps: open Pages, Add new page, enter `Audit second page`, leave the default source unchanged, click **Create page**. The modal closes and the full Templates catalogue opens. The page list remains Home only. No new page exists at this step.

`NewPageModal.tsx:44` initializes source to `template`; the request handler resets it to `template`. `create` at lines 64–74 emits `UI_BROWSE_TEMPLATES` with the entered name/navigation preference, then returns. Its footer always says Create page. The handler retains the user's name in an event payload; whether every downstream template path preserves that payload still requires verification.

Impact: the button promises a completed creation when the next step is choosing a template. A user cannot infer the extra decision from the action label. Proposed design direction for Phase 3/5: match the primary action to the selected source, and show where naming/navigation choices will carry forward. Do not remove template-first creation or silently change the default during this audit.

Acceptance after approval: default source and action label correctly describe the next screen; template route preserves entered name/navigation choice; blank route creates/selects the named page; Cancel returns without phantom pages. Blank-page testing was interrupted by repeated automation timeouts and remains pending.

## Confirmed useful behavior

- Local CMS: UI-created collection and draft record survive reload; title `Audit record alpha`, slug `audit-record-alpha`, status draft. Remote sync remains unverified.
- Local components: UI-created heading master converted the original into its first instance; insert produced a second linked instance; inspector font edit and Update from selection propagated 44px to both; save/reload retained master version 2, two instances and both computed 44px values.
- Existing focused tests: 5 files / 63 tests passed. No test or production source was changed.

Evidence: `evidence/resume-verification.json`, `evidence/component-workflow.json`.

## Active constraints

The repository-provided login state now redirects the dashboard to `/auth`. Server save/reload, role-specific workflows and remote CMS/library operations need a usable disposable test-account session. The local browse daemon intermittently stopped answering health/action requests; three consecutive attempts to continue the blank-page flow timed out. These failures are tooling constraints, not product defects.

Handoff attempt: opened headless tab 2 at `http://localhost:3000/auth`, then requested a visible browser for test-account login. Handoff failed because the tool expects a missing Chromium 1234 executable (`chromium-1234/chrome-mac-x64/Google Chrome for Testing.app`). Headless browser remains running. No visible login window was opened. Resume requires repairing the headed-browser tool or an authorized usable test-session import; no password or token was printed.

No new Figma reconstruction/redesign has started: Gate 2 remains open. Prior Figma baseline remains untouched. Implementation planning/approval follows the audited AS-IS and validated TO-BE/prototype phases.
