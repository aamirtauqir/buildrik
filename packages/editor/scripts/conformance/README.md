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
| `check-anchors.mjs` | Every `testId` a recipe names must exist in `src/`. ~0.3s, no browser, catches a deleted anchor before a measurement cycle would. |
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

Three real WCAG AA failures predate this harness (gray-500 on gray-100 at 4.39
against a 4.5 floor, on the add-page and zoom controls). Wiring conformance into
CI with a hard zero would have landed the build red on day one, and a gate that
is red on arrival gets disabled rather than fixed.

So they are baselined, the same way `check-styling-ratchet.mjs` baselines
`inline_literal` / `inline_hoisted` / `css_lines`. The defects print on every
run, cannot grow, and lowering the count prompts you to lower the baseline. A
MISSING target is never baselined — that is an instrument failure, not a product
defect, and it exits 3.

## What this harness cannot see

Stated so nobody mistakes a green run for more than it is:

- **Structure.** `diff.mjs` compares the computed properties of anchored
  targets. It knows nothing about their children, so a missing or extra child
  element is invisible to it. The shipped topbar renders three controls board
  681:26 does not contain; the screenshot caught that, the numbers could not.
- **Board freshness, continuously.** CI has no Figma access. `check-spec-age` is
  a calendar alarm, not drift detection.
- **Hook installation.** `.git/hooks` is untracked and `--no-verify` exists.
- **Token identity in the code.** ~6% of shipped chrome classes carry a
  `var(--bk-*)`; the rest are plain Tailwind. The token verdict is advisory and
  reports UNKNOWN outside that 6%.
