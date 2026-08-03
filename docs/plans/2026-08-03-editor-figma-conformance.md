# Editor ↔ Figma conformance — build order

Written 2026-08-03. One file, in the order you build it.

Background and every decision behind this: `~/.gstack/projects/aamirtauqir-buildrik/ceo-plans/2026-08-03-editor-figma-conformance.md`.
Architecture and alternatives considered: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260803-022937.md`.

---

## What this is

A harness that opens the running editor in a real browser, measures what it
actually renders, and compares that to what the Figma board says it should be.

It is **not** a rebuild. Every Figma family already has a shipped counterpart,
and the shell geometry already matches (rail 60 / topbar 56 / drawer 320 /
inspector 300). The gap is drift, and drift is invisible to everything we
currently run.

## Why it has to exist

Three things in this repo cannot see visual drift:

- **Code review** reads diffs, not pixels.
- **The vitest suite** is blind to `tw:` classes by construction — jsdom loads no
  stylesheet, so `getComputedStyle` on `tw:text-blue-700` returns black. 7,758
  tests stay green while the editor renders wrong.
- **`style-parity.spec.ts`** records what the code *currently does*. That catches
  changes, but a value that was wrong on day one becomes the accepted baseline
  forever. `bd-chain-btn` was invisible for months for exactly this reason.

Comparing against Figma is the only mechanism that says **wrong from the start**
rather than **changed since last time**. Screenshot services (Applitools,
Chromatic, Percy) all bless the first baseline they are given, so they inherit
the same blind spot.

## Three limitations, stated up front

1. **Spec freshness is a human ritual, not a gate.** CI has no Figma access. The
   hard check lives in the pre-push hook, which is installed per clone and
   bypassable with `--no-verify`. CI can only warn.
2. **Token-identity checking covers ~6% of chrome.** 372 of 6,564 `tw:` classes
   carry `var(--bk-*)`. The rest are plain Tailwind (`tw:bg-white`,
   `tw:text-gray-900`). The verdict reports UNKNOWN outside that 6%.
3. **A hand-edited `raw-figma/*.json` can make a diff pass.** Nothing mechanical
   catches a plausible edit. The control is reading the raw file in the PR.

---

## Phase 0 — make measurement trustworthy

Nothing downstream is worth building until these land. Every number the harness
produces is unreliable today.

### 0.1 — Self-host the fonts *(live bug)*

`demo/index.html:13-15` loads Inter and Geist Mono from `fonts.bunny.net` with
`display=swap`, which renders a fallback first by design. Nothing waits for the
swap — `grep -rn "document.fonts" e2e/ scripts/` returns zero hits.

**This already affects committed files.** `style-parity.spec.ts:22-40` tracks
`font-family`, `font-size`, `line-height` and `width`, so the baselines in
`e2e/baselines/` may have been captured against the wrong font.

- Vendor Inter + Geist Mono as local `.woff2`, add `@font-face`, delete the Bunny
  `<link>` and `preconnect`.
- `await document.fonts.ready` before any measurement read.
- Re-run `pnpm test:parity:update`. **Read the diff.** Every value that moves was
  a baseline captured mid-swap.

Files: `demo/index.html`, `public/fonts/`, `e2e/baselines/`
Done when: no network request for fonts, and the baseline diff is reviewed and
explained in the commit message.

### 0.2 — One shared computed-style reader

`style-parity.spec.ts` and the conformance run do identical work reading the
browser. Only the comparison differs. Build the reader once.

```
         e2e/lib/readComputedStyle.ts
              |                    |
   parity comparator        conformance comparator
   vs e2e/baselines/        vs specs/*.json
```

Pin the browser here: bundled Chromium only, no fallback to installed Chrome
(`measure.mjs:38` currently falls back, and CI is Ubuntu while dev is macOS).
Fail loudly if it is absent.

Files: `e2e/lib/readComputedStyle.ts`, `e2e/style-parity.spec.ts`,
`scripts/conformance/measure.mjs`
Done when: `pnpm test:parity` passes against the shared reader, and deleting the
bundled browser produces exit 3, not a silent fallback.

### 0.3 — Split the CI browser job

`editor-ci.yml:53` is `timeout-minutes: 15`. The full conformance run is
estimated at 15–20 minutes. The job as it stands cannot hold this.

Copy the two-job shape from `dashboard-tests.yml`: a separate job that installs
Chromium (`:104`), runs `pnpm test:parity` (which currently runs **nowhere** —
it appears only at `package.json:39`), runs conformance, and uploads artifacts on
failure (`:117`).

Files: `.github/workflows/editor-ci.yml`
Done when: `test:parity` runs in CI for the first time, and a deliberate failure
leaves a downloadable artifact.

---

## Phase 1 — make chrome pointable

### 1.1 — Anchor the wave A surfaces

Chrome has no stable hooks. `Topbar.tsx:106` renders a `<header>` wearing only
utility classes, so any selector built from them breaks on the next drain commit.

Use the convention already here: **`data-testid`**. 125 already ship across 54
files — but zero in `chrome-ui/` and two in `shell/`, which is exactly the gap.

Anchors may live on shared components. Recipes scope to a root rather than
relying on global uniqueness.

Files: `src/editor/chrome-ui/`, `src/editor/shell/` (wave A surfaces only)
Done when: every wave A surface has an anchor, added per wave — not all sixty
up front.

### 1.2 — Static anchor gate

`check-anchors.mjs`: every `testId` named in a recipe must appear in `src/`.
~20 lines, ~1 second, no browser. Joins `verify:ds`.

This catches a deleted anchor at commit time. The browser check still catches the
different case — present in source but not rendered on that surface.

Files: `scripts/conformance/check-anchors.mjs`, `package.json`
Done when: deleting an anchor fails `verify:ds` in under two seconds.

### 1.3 — Fix the shell-default recipe

Two of its five selectors are dead:

| Selector | Files in `src/` |
|---|---|
| `.bd-topbar` (step + target) | **0** |
| `.bd-bp-switcher` (target) | **0** |
| `.ls-rail` / `.ls-panel` / `.buildrick-canvas` | 5 / 10 / 27 |

The run dies on the first `waitFor` before reaching any target. Move it to
anchors and add an assertion that every selector and every testId resolves.

Files: `scripts/conformance/surfaces/shell-default.json`
Done when: `measure.mjs shell-default` exits 0. **This is the first proof the
harness works at all.**

---

## Phase 2 — the spec pipeline

### 2.1 — Two-step extraction

**Corrected 2026-08-03.** This step used to say "node cannot call the Figma MCP,
`conformance/README.md:14` says so." That was wrong and unverified. The MCP is a
remote HTTP endpoint (`https://mcp.figma.com/mcp`, streamable-http) that node can
reach with `fetch`; it answers 401 with `www-authenticate: Bearer
scope="mcp:connect"`. The blocker is OAuth, not transport: the token comes from an
interactive browser flow and lives in the macOS Keychain under
`Claude Code-credentials`. So a local script could only authenticate by reading
Claude Code's private credential store, and CI has neither a keychain nor an
interactive flow. Extraction stays an agent step for those reasons. Full write-up
in `scripts/conformance/README.md` § "Why extraction is an agent step". So:

```
step 1 (agent, local)    get_design_context(nodeId)
                         -> raw-figma/<surface>.json     COMMITTED

step 2 (node, anywhere)  extract.mjs raw-figma/<surface>.json
                         -> specs/<surface>.json
                            + figmaHash        sha256 of the raw file
                            + extractorVersion catches parser drift
                            + extractedAt      feeds the age check
```

Committing the raw file is what makes drift reviewable: a PR shows the Figma
response changing, not just a derived spec appearing. It also makes `extract.mjs`
a pure file-to-file transform, which is the only reason it can be tested.

Files: `scripts/conformance/extract.mjs`, `raw-figma/`
Done when: the same raw file extracted twice produces an identical hash, and a
malformed raw file exits 1 rather than writing an empty spec.

### 2.2 — Recipe schema and `lib.mjs`

One vocabulary rule, enforced by the schema rather than remembered:

```json
{
  "steps": [
    { "action": "click", "testId": "rail-insert" },
    { "action": "waitForState", "selector": ".ls-panel.is-open",
      "because": "open is a class, not an element" }
  ],
  "targets": [
    { "name": "panel", "testId": "sidebar-panel" },
    { "name": "media-card", "root": "media-grid",
      "testId": "media-card", "mode": "uniform" }
  ]
}
```

- `targets` reject a CSS selector at read time.
- CSS is allowed only in `waitForState`, and only with a `because` field.
- **Repeated elements use `mode: "uniform"`** — read every match, assert the
  siblings agree, compare the agreed value once. Sibling disagreement is its own
  failure, which catches one-card-in-twelve. `nth` exists as an escape hatch and
  requires a `because`.

`lib.mjs` also owns the tolerance table:

| Property class | Rule |
|---|---|
| lengths (w/h/padding/gap) | ±0.5px |
| border-width, radius | exact |
| colors | normalize to `#rrggbb`, exact |
| font-size | exact |
| font-family | **string equality** (only valid after 0.1) |
| box-shadow | parsed, compared per component |

Import the `var(--token)` parser from `check-token-resolution.mjs`; do not write
a second one.

Files: `scripts/conformance/lib.mjs`
Done when: a target written with a CSS selector is rejected at read time, naming
the file.

### 2.3 — `diff.mjs`

Two verdicts per property:

- **value** — resolved comparison. This gates CI.
- **token** — did the code use the token or a literal? **Advisory only**, and
  only meaningful for the ~6% of classes carrying `var(--bk-*)`. UNKNOWN
  elsewhere. `Topbar.tsx:176` documents deliberate exact-match palette utilities
  that must not fail.

Exit codes:

| Code | Meaning |
|---|---|
| 0 | PASS |
| 1 | FAIL — a value does not match |
| 2 | STALE — `figmaHash` or `extractorVersion` mismatch |
| 3 | MISSING — spec or measurement absent |

A missing input must never read as a pass. `nodeId: null` counts as SKIPPED with
the count in the header and a baseline lock, so coverage cannot shrink silently.

Group failures by root cause — one token rename must not read as forty unrelated
defects.

Files: `scripts/conformance/diff.mjs`
Done when: a planted wrong value exits 1 and names the property; a mutated hash
exits 2; a deleted measurement exits 3. Record all three in the commit message.

---

## Phase 3 — states and reporting

### 3.1 — All four states in one page visit

Four states × sixty surfaces is 240 page loads if each reloads. One visit each
is sixty.

```
load surface once
  measure default
  hover    -> measure -> reset
  focus    -> measure -> reset
  disabled -> measure -> reset
  measure default AGAIN, assert identical to the first
```

That final re-measure is the entire safety argument. Without it, sharing a page
across states is a guess.

Files: `e2e/conformance.spec.ts`
Done when: the leak test passes, and deliberately skipping a reset makes it fail.

### 3.2 — Contrast beyond text

`measure.mjs:103` only selects elements that paint text directly. The rail and
topbar are almost entirely icon-only controls, so their contrast is unchecked.

Extend to icon-only controls, SVG fill and stroke, placeholder text and
pseudo-element labels. **Note the threshold: WCAG non-text UI components are
3:1, not the 4.5:1 applied to text.**

Read first: the inverted WCAG lint found during the drain, and the open
`#B45309` vs `#D97706` warning-token question from the 07-24 arc.

Files: `e2e/lib/readComputedStyle.ts`
Done when: an icon button below 3:1 fails, and a decorative icon does not.

### 3.3 — Screenshots on failure

Playwright is already driving the browser. Attach the rendered element screenshot
to every FAIL. On a local run — where the Figma MCP exists — add the board image
beside it.

Do not commit reference PNGs. They would be a second artifact that goes stale
silently, which is the failure this whole plan exists to stop.

Files: `e2e/conformance.spec.ts`, `.github/workflows/editor-ci.yml`
Done when: a CI failure produces a downloadable screenshot.

---

## Phase 4 — freshness (best-effort, labelled)

### 4.1 — `check-spec-age.mjs`

Every spec carries `extractedAt`.

- **Pre-push: FAIL** past the limit. Your machine has the Figma MCP and can
  re-extract.
- **CI: WARN.** CI cannot fix what it cannot access.

Label it honestly in the output: this is a calendar alarm, not drift detection.
A board can change ten minutes after extraction and stay green until the
threshold expires.

Files: `scripts/conformance/check-spec-age.mjs`, `scripts/hooks/pre-push`,
`.github/workflows/editor-ci.yml`
Done when: both severities are tested, and neither mode is inferred — the mode is
an explicit argument.

### 4.2 — Hook check, labelled advisory

CI can assert the hook exists in its own checkout, and that is all. It cannot see
another developer's laptop, and `pre-push:58` is bypassable with `--no-verify`.

Keep the check. Label it advisory. Do not describe it as enforcement anywhere.

Files: `.github/workflows/editor-ci.yml`

---

## Phase 5 — tests and docs

### 5.1 — 56 test paths

Full list: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-eng-review-test-plan-20260803-060000.md`

Use the existing `scripts/__tests__/*.mjs` temp-repo + `execFileSync` + exit-code
pattern; `check-ds-ssot.test.mjs` is the model.

Three negative controls are mandatory — a check nobody has watched fail is not a
check:

1. Plant a wrong value in a spec → exit 1, property named.
2. Mutate `figmaHash` → exit 2, both hashes printed.
3. Delete a measured file → exit 3, never a pass.

Plus the boundary pair: 0.5px off passes, 0.51px off fails.

### 5.2 — Update the docs

`conformance/README.md` still describes `specs/*.json` and `diff.mjs` as unbuilt,
and describes extraction in terms Phase 2.1 supersedes.

---

## Then the waves

Fix conformance surface by surface. The inline-style drain rides along in the
same commits — when a surface is opened, its inline styles and dead CSS go too.

| Wave | Families | Why this position |
|---|---|---|
| **A** | Shell states (12) · Inspector (11) · Insert · Layers · Pages · canvas toolbar | every session touches these; drift is felt daily |
| **B** | Review panel (12) · S5.1–S5.6 · Client review S5.5 (16) | the differentiator, and the least-exercised code |
| **C** | Media (15) · Brand (14) · Content (10) | biggest board counts, heaviest token use, highest drift risk |
| **D** | Publish · Rollback · Versions · Compare · Domains · Export | low frequency, high stakes — a defect here loses work |
| **E** | AI (11) · CmdK · Issues · Notifications · Portfolio · Site settings | everything else |

Ratchets must keep falling and never rise: `inline_literal` ≤ 785,
`inline_hoisted` ≤ 344, `css_lines` ≤ 10,651.

---

## The one step that cannot be delegated

Before the harness reports on anything:

Open the editor at exactly 1440×900. Select an element so the inspector
populates. Screenshot it beside Figma node `32:2`. **Write down every difference
you can see with your own eyes.**

That list is the control. When `diff.mjs` produces its first inspector report,
compare the two. If the tool finds everything on your list plus more, it is
trustworthy and the other 59 families can be automated. If it misses something
you spotted, the blind spot is found on surface one instead of surface sixty.

Twenty minutes.
