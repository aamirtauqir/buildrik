# Conformance harness (Phase 0)

Plan: `docs/designs/2026-07-26-editor-conformance-plan.md`. Drift is invisible
to code review and to the test suite — it only shows up when the running
product is measured against the Figma board. This directory holds the tooling
that does the measuring.

## Pieces

| File | Job | Status |
|---|---|---|
| `check-token-resolution.mjs` | Every `var(--token)` in `src/`+`demo/` must resolve to a definition (or carry a fallback → WARN). Runs in `verify:ds` and editor CI. | LIVE |
| `measure.mjs` | Drives the running editor at 1440×900 to a surface state, dumps live geometry / computed fills / radii / font sizes + computed contrast per text-on-fill pair. | Phase 0b |
| `surfaces/*.json` | Per-surface state recipes (rail tab, selection, panel) + board ref. | Phase 0b |
| `raw-figma/*.json` | Verbatim `get_design_context` output per board, COMMITTED. Written by an agent step, never by a script — see "Why extraction is an agent step" below. | Phase 0c |
| `specs/*.json` | Derived from `raw-figma/` by `extract.mjs`, a pure file-to-file transform. Carries `figmaHash` + `extractorVersion` + `extractedAt`. | Phase 0c |
| `diff.mjs` | `surface · property · figma · code · verdict` report. | Phase 0c |

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
