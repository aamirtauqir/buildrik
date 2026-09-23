# Conformance harness

Plan: `docs/plans/2026-08-03-editor-figma-conformance.md`. Drift is invisible to
code review and to the test suite — it only shows up when the running product is
measured against the Figma board. This directory holds the tooling that does the
measuring.

Everything below is LIVE as of 2026-08-03 and covered by 78 tests in
`scripts/__tests__/conformance-{lib,scripts}.test.mjs`.

## The loop

```
  agent (local, has the Figma MCP)      node (anywhere)          browser
  ────────────────────────────────      ───────────────          ───────
  get_design_context(nodeId)
        │
        ▼
  raw-figma/<board>.json  ──────────▶  extract.mjs
       COMMITTED                           │
                                           ▼
                                    specs/<board>.json ──┐
                                                         │
  surfaces/<surface>.json ───────────────────────────────┼──▶ diff.mjs ──▶ verdict
       the recipe: testIds, states, spec+nodeId join     │        0 PASS
                                           ▲             │        1 FAIL
                                           │             │        2 STALE
                                    measured/<surface>.json       3 MISSING
                                           │
                                     measure.mjs ◀──────────── the running editor
```

## Pieces

| File | Job |
|---|---|
| `check-hooks.mjs` | Is the installed git hook the one this repo ships? Advisory, always exits 0 — see the header for why it cannot be enforcement. Runs first in `verify:ds`. |
| `check-token-resolution.mjs` | Every `var(--token)` in `src/`+`demo/` must resolve to a definition (or carry a fallback → WARN). |
| `check-anchors.mjs` | Every `testId` a recipe names must exist in `src/`. No browser; catches a deleted anchor before a measurement cycle would. **~14s** as of 2026-09-08 — this row said ~0.3s, which was true at ~40 anchors and is not at 667 across 134 recipes; the cost is anchors x files and grows with coverage, not with any one change. It resolves a derived id through ONE level of indirection (`data-testid={sub("label")}` where `sub` builds a template), because an attribute-only regex reported all 66 of `ListRow`'s derived anchors as missing while every one of them renders. |
| `check-board-copy.mjs` | Board copy vs rendered copy — the structural blind spot, approached through text. ADVISORY, always exits 0: boards carry sample data, so a lead is a shape to look at, not a verdict. The "extras" direction is suppressed unless every target carries a spec, because a partly-joined recipe cannot tell drift from uncovered scope. |
| `check-spec-age.mjs` | How long since each spec was extracted. `--mode=prepush` FAILS, `--mode=ci` WARNS. The mode is never inferred. |
| `lib.mjs` | Shared vocabulary: recipe schema, `figmaTokenToBk`, colour/length normalisation, the tolerance table, `EXTRACTOR_VERSION`. Derived from `scripts/tokens/figma-tokens.json`, never hardcoded. |
| `extract.mjs` | `raw-figma/*.json` → `specs/*.json`. Pure file-to-file, never touches Figma. |
| `measure.mjs` | Drives the running editor at the board's viewport, reads every target plus both contrast sweeps, in ONE page visit across all interaction states. |
| `diff.mjs` | `target · property · figma · code · verdict` + grouped failures + evidence paths. |
| `surfaces/*.json` | Per-surface recipe: `testId` targets, states, and the `spec`+`nodeId` join to a board. |
| `raw-figma/*.json` | Verbatim `get_design_context` output, COMMITTED so a PR shows the board changing. Written by an agent step — see "Why extraction is an agent step". |
| `specs/*.json` | Derived. Carries `figmaHash` + `extractorVersion` + `extractedAt`. |
| `measured/*.json`, `measured/<surface>/*.png` | Gitignored. Describes a build, not source. CI uploads it on failure. |
| `.conformance-baseline.json` | Ratchets: SKIPPED coverage, compared count, and known contrast failures. May improve, never regress. |

## Running it

```bash
# 1. agent step, local only: get_design_context(nodeId) -> raw-figma/<board>.json
pnpm run conformance:extract <board>
npx vite --port 5050                     # the demo app measure.mjs drives
pnpm run conformance:measure <surface>
pnpm run conformance:diff <surface>
```

`--update-baseline` on either `measure` or `diff` re-records a ratchet after a
deliberate change.

## Rules the harness encodes (learned 2026-07-20 week, six defects)

1. **Every `var(--token)` must resolve.** Undefined CSS vars fail silently;
   this class alone produced three of the six defects.
2. **Contrast is computed, never eyeballed.** Text-on-fill under 4.5:1
   (3:1 for ≥18px) fails the run.
3. **Measure at the width the board specifies, with the inspector open.**
   The canvas-toolbar overlap only existed at 1440 with a selection.

## Why extraction is an agent step

This table used to say the Figma specs were "extracted via the Figma plugin API
(agent step — **MCP is not scriptable from node**)". That parenthetical was
wrong, and it went unchallenged from July until 2026-08-03 — surviving an
office-hours design pass, two engineering reviews, a CEO review and three
adversarial codex passes, each of which cited it back as settled fact.

What is actually true, verified rather than assumed:

- The Figma MCP is **not a local process**. It is a remote HTTP endpoint —
  `type: "http"`, `https://mcp.figma.com/mcp`, streamable-http (see the figma
  plugin's `.mcp.json` / `server.json`). Node can reach it with `fetch`.
- The blocker is **authentication**, not transport:

  ```
  POST https://mcp.figma.com/mcp   ->  401 Unauthorized
  www-authenticate: Bearer resource_metadata=".../oauth-protected-resource",
                    scope="mcp:connect"
  ```

  OAuth 2.1. The token comes from an interactive browser flow and lives in the
  macOS Keychain under service `Claude Code-credentials`. There is no
  `FIGMA_TOKEN` in the environment, in any workflow, or in any script here.

So extraction stays an agent step, for two honest reasons rather than one
imagined one:

1. **Locally**, a script could only authenticate by reading Claude Code's own
   keychain credential — an undocumented internal format that rotates, and a
   build script has no business coupling itself to the agent's auth.
2. **In CI** it is genuinely impossible: no keychain, no interactive OAuth, and
   the token is scoped to one user on one machine.

The alternative that WOULD script in CI is the Figma REST API with a personal
access token (`X-Figma-Token`). It was considered and not taken: REST returns
node geometry and style references, not the generated className strings that
`get_design_context` produces, so the token-identity read would have to be
rebuilt against a different payload shape.

**The lesson worth keeping** is not about Figma. A single unverified
parenthetical in a status table became load-bearing across five review passes
because every reader treated the previous reader's citation as verification. A
`curl` against the documented endpoint would have settled it in ten seconds at
any point.

## Why known defects are baselined rather than fixed-or-ignored

Three real WCAG AA failures predated this harness (gray-500 on gray-100 at 4.39
against a 4.5 floor, on the add-page and zoom controls). Wiring conformance into
CI with a hard zero would have landed the build red on day one, and a gate that
is red on arrival gets disabled rather than fixed.

**Those particular three are now fixed** — `shell-default` measured 0 text and 0
icon failures on a whole-`body` sweep on 2026-09-08 and its baseline was
tightened from 3 to 0, which is the ratchet working as intended. The policy
below stands; the example is now history. Note that the pair itself is not
history: gray-500 on gray-100 is `--bk-ink-muted` on `--bk-bg-subtle`, still
4.39, and still 15 live instances on other surfaces — see
`docs/design-jobs/FIGMA-TO-CODE/CONTRAST-INK-MUTED.md`. That token passes on
white and fails on every tint the system ships, which is a token-value defect
the boards themselves specify, not something a call site can fix.

So they are baselined, the same way `check-styling-ratchet.mjs` baselines
`inline_literal` / `inline_hoisted` / `css_lines`. The defects print on every
run, cannot grow, and lowering the count prompts you to lower the baseline. A
MISSING target is never baselined — that is an instrument failure, not a product
defect, and it exits 3.

## Two ways a green verdict used to mean nothing

Both were found on 2026-09-08, both by agents using the harness rather than by
reading it, and both are now refusals rather than silences.

**An empty contrast sweep.** `contrastScope` is a CSS selector, and a selector
that resolves to a subtree containing none of the text under test reports
`0 text-contrast failures` — indistinguishable from a clean screen. Five
recipes were certifying modals nobody had measured, because `ModalRoot`
PORTALS to the overlay root and a probe-, scrim- or panel-scoped selector
contains no part of the dialog. The moment one was corrected it found a
`--bk-warning` cell at 3.51:1; correcting the rest found a **1.34:1** — the
canvas breadcrumb, effectively invisible text, on four more surfaces.
`measure.mjs` now exits 3 and names the likely cause when a sweep sees nothing.

**A measurement that never happened.** `diff.mjs` reads
`measured/<surface>.json` and had no way to know the run that should have
written it aborted. So while `modal-success-then-close` timed out on a step and
read nothing at all, `diff` kept reporting `11 compared · 11 pass · 0 fail`
from the previous run's file. `measure.mjs` now stamps the file on abort and
`diff.mjs` exits 2 (STALE) rather than reporting an older build as today's
verdict.

The shape is the same one this directory keeps rediscovering: **absence reads
as success unless something refuses it.**

## What this harness cannot see

Stated so nobody mistakes a green run for more than it is:

- **Structure.** `diff.mjs` compares the computed properties of anchored
  targets. It knows nothing about their children, so a missing or extra child
  element is invisible to it. The shipped topbar renders three controls board
  681:26 does not contain; the screenshot caught that, the numbers could not.
  `check-board-copy.mjs` now reaches the part of this that IS comparable — a
  label is a label on both sides — and found real drift on surfaces already
  passing their property diff: `export-html-modal` is 73/73 green while the
  board says "Export site as HTML" and the product says "Export site as", and
  while the board's body names which page becomes `index.html` and the
  product's does not. Full structural comparison remains out of reach: Figma
  nests frames the DOM has no obligation to mirror, so a child-count diff would
  false-fail on every legitimate wrapper.
- **Board freshness, continuously.** CI has no Figma access. `check-spec-age` is
  a calendar alarm, not drift detection.
- **Hook installation.** `.git/hooks` is untracked and `--no-verify` exists.
- **Token identity in the code.** ~6% of shipped chrome classes carry a
  `var(--bk-*)`; the rest are plain Tailwind. The token verdict is advisory and
  reports UNKNOWN outside that 6%.

- **Opacity.** `lib.mjs` normalises a colour by dropping its alpha channel
  (`:116`), treating only a literal alpha of `0` as distinct (`:109`). So
  `rgba(17, 24, 39, 0.4)` and `#111827` compare EQUAL. This is deliberate
  rather than accidental: Figma cannot export a layer opacity, so every scrim
  on every board is baked to its opaque base colour, and requiring alpha to
  match would fail all of them against a correct implementation. The cost is
  that a scrim which lost its transparency entirely would still pass. If that
  matters for a surface, assert it in a test, not here.

- **Whether a fill is inherited or declared** — and this one has a rule.
  `measure.mjs`'s `bgFor` reports an element's OWN background when it declares
  one (translucent included), and composites up through its ancestors only when
  the element is fully transparent. Chrome mostly does not restate an inherited
  fill: a modal foot inside a white card is left transparent and simply looks
  white, so comparing the declared `rgba(0, 0, 0, 0)` against the board's
  `#ffffff` called a pixel-identical surface a failure. Compositing
  unconditionally would have been the opposite error — it turned a scrim's
  deliberate `rgba(17, 24, 39, 0.4)` into `#979da5` and silently redefined the
  target. The declared value is kept alongside as `background-color-declared`
  for evidence; no spec names it, so nothing compares it.
