---
date: 2026-04-21
topic: editor-ds-fresh-options
focus: Fresh ideation on editor DS / layout-component / per-tab CSS sprawl (second opinion uncontaminated by 2026-04-20 committed rollout)
mode: repo-grounded
status: draft-survivors
---

# Ideation: Editor DS — Fresh Options

## Context

The user asked for a detailed second-opinion ideation on: "the editor has no proper design system, no layout components, and too much per-tab/per-panel CSS — what are the options to overcome this?"

A committed rollout already exists at `docs/ideation/2026-04-20-editor-chrome-ds-ideation.md` (Weeks 0-5 shipped as of 2026-04-21). This document deliberately avoided that rollout's 7 ranked ideas during generation. Where a survivor below converges with the existing plan, it goes **deeper** (branded types, reflection-driven, codegen manifest). Where it diverges, it is flagged NEW.

## Codebase Context (verified 2026-04-21)

### Surface area
- 394 editor `.tsx` files, 160 primitives in `shared/ui/` (~24% editor-wide adoption)
- 10 per-tab CSS files totalling ~10,158 lines; `sidebar/tabs/` alone = 6,019
- 47 inspector section files mapped to 17 section IDs (9 adapter-fit, 8 bespoke)
- 714 inline `style={{}}` across Topbar (199), Left (165), Right (350) bars — flagged CRITICAL-FOR-DX in bar audit
- 566 magic layout literals, 212 box-shadow sites (only 8 tokenized), 129 gradients, 592 panel-chrome radii > 4

### What's already landed
- `shared/constants/layout.ts` SSOT (WARN-mode gate against magic literals)
- PanelShell primitive + token convergence (Week 2-3)
- InspectorRenderer + schema + control registry foundation (Week 5, commit 2cf6061)
- `.ds-green-panels.json` strict-zero allowlist (174 files, one-way ratchet)
- 4 chrome-axiom grep gates file-backed by `.chrome-axioms-baseline`
- `themes/design-system/` = 11 canonical CSS files, `--buildrick-*` chrome vs `--buildrick-design-*` user-site namespace (locked two-namespace contract)

### Hard constraints (non-negotiable)
- Emotion CSS-in-JS only. No Tailwind, CSS Modules, Sass, Vanilla Extract, Panda.
- No purple/violet/indigo. Cobalt `#2D6DFF` is the only accent.
- Two-namespace DS contract is locked (chrome ≠ user-site).
- Solo workflow, direct-to-main (no feature branches, no PRs).
- No flag-day rewrites — WARN→FAIL gate-driven only.
- No custom ESLint plugins — `no-restricted-syntax` rules and jscodeshift scripts only.

### Prior-learning filters
- Inventory before architecture (killed V1+V2 theme specs)
- SSOT must be grep-verified (orphan constants exist in this codebase)
- Axioms must be tested against shipped code day zero (killed Week 0 draft 1)
- WARN→FAIL with file-backed baselines is the proven migration mechanism

### External prior art used
Blender bTheme / uiStyle context-dispatch • JUCE LookAndFeel subtree strategy • Unity USS namespace convention • Radix compound-with-context • Retool 40-sections → 3-effect-groups • Storybook Controls type-inferred registry • Webflow codemod fixture-first pattern • SAP Fiori Cozy/Compact density-as-root-class • tldraw z-layer + EditorComponentsProvider • Panda/Vanilla Extract branded-token-type compile enforcement

---

## Ranked Ideas

### 1. Branded-Token `<Box>/<Stack>/<Row>/<Grid>` Primitive Kit

**Description.** Ship four layout primitives in `shared/ui/layout/` whose style props accept only **branded TypeScript types** generated from CSS-var token files:

```ts
type Space = Brand<"0" | "1" | "2" | ... , "ds.space">;
type Color = Brand<"chrome.panel.bg" | "chrome.border" | ..., "ds.color">;
type Radius = Brand<"sm" | "md" | "lg" | "pill", "ds.radius">;

<Box p="4" bg="chrome.panel.bg" radius="sm">…</Box>
<Stack gap="2" direction="column">…</Stack>
<Row gap="2" align="center" justify="space-between">…</Row>
```

`style={{}}` is globally shadowed on chrome components via an ambient `.d.ts` declaration that sets `style?: never`. Raw hex / px / magic radii produce TypeScript compile errors. Emotion renders under the hood with `var(--buildrick-*)` lookups. Dynamic values (drag positions, computed colors) use a narrow `css` prop escape hatch that still requires tokens, not raw literals.

Pair with a jscodeshift codemod (fixture-driven, 15-20 before/after pairs) that sweeps `sidebar/tabs/*.tsx` + `editor/**/*.tsx` and rewrites the common shapes: `style={{ padding: 12 }}` → `<Box p="3">`.

**Rationale.** Today's gates catch violations at CI time with baseline counts in the thousands. Branded types catch them at **compile** time — `tsc` becomes the gate, baselines become unnecessary for the values the type system covers. 714 inline styles + 1498 hex sites + 566 magic literals converge into one oracle: does `tsc` pass? This is what the April 20 plan's "Token Binding Contract" aimed at but stopped short of — it described typed props but not branded types, which leaves the string escape hatch open.

**Downsides.** The branded-type generator must stay in lockstep with CSS var files (codegen script, see idea 7). Dynamic values still need an escape hatch — must be surgical so it's not abused. Codemod risk across ~400 files (mitigated by fixtures + `.ds-green-panels.json`-style per-file ratchet).

**Confidence:** 90% · **Complexity:** Medium · **Status:** Unexplored

---

### 2. Chrome Region Context-Dispatch (Blender bTheme port)

**Description.** Same token name resolves to different concrete values depending on which region it's consumed in. Implementation: a `<RegionScope type="inspector" | "sidebar" | "topbar" | "canvas-overlay">` React context that injects a CSS-variable layer:

```tsx
<RegionScope type="inspector">
  <Box bg="surface.1">…</Box>   {/* resolves to --buildrick-inspector-surface-1 */}
</RegionScope>

<RegionScope type="sidebar">
  <Box bg="surface.1">…</Box>   {/* resolves to --buildrick-sidebar-surface-1 */}
</RegionScope>
```

The author writes **one** symbolic token path; the region dispatches to the concrete value. Eliminates the triplication of `--inspector-bg`, `--sidebar-bg`, `--topbar-bg` family tokens. Follows Blender's `get_color_ptr(TH_BACK)` pattern where the same `TH_BACK` identifier returns different RGB based on current editor region.

**Rationale.** The existing token inventory already shows per-region duplication (see bar audit — 3 bars each have their own near-identical hex palette). Context-dispatch collapses N region-specific token families into 1 symbolic family + N region overrides. Also makes the editor easier to theme: flip `RegionScope` overrides once to add a dark mode or high-contrast mode without touching component code.

**Downsides.** Extra indirection — a symbolic token doesn't tell you the concrete value without knowing the region. DevTools inspection gets slightly harder (one layer of CSS-var cascade). Requires disciplined region boundaries — components that render "inside inspector from sidebar" will resolve tokens per outermost region, which is usually correct but occasionally wrong.

**Confidence:** 70% · **Complexity:** Medium · **Status:** Unexplored · **NEW vs April 20 plan**

---

### 3. Codemod-Driven Per-Tab CSS Deletion + File-Extension Ban + Unified TabShell

**Description.** A three-part move that kills the 10,158 lines of per-tab CSS:

1. **TabShell primitive** (extends existing PanelShell). `<TabShell header, toolbar, body, footer>` owns all tab-level layout — header strip, toolbar strip, body padding, footer, collapse state, scroll behaviour, empty/loading/error states. Consumers declare content, not chrome.
2. **Per-tab codemod** (fixture-driven, 20+ before/after pairs per Webflow pattern). Reads each `sidebar/tabs/*.css` selector, maps `.panel-header` / `.tab-toolbar` / `.row` / etc. to TabShell slots + Emotion `styled()` for the remainder. Tab-by-tab, not flag day.
3. **File-extension gate.** `**/*.css` becomes illegal under `src/editor/sidebar/tabs/**` and `src/editor/inspector/sections/**`. ESLint `no-restricted-imports` on `*.css` imports from those directories; CI script fails on `.css` files found under them. The filesystem becomes the enforcement.

Migration is per-tab via the green-panel ratchet — each tab flips from "CSS file + React" to "TabShell composition" with its own PR. Baseline: 10 CSS files at Week N = 0, one-way ratchet down.

**Rationale.** April 20 plan's idea #1 (PanelShell + per-tab CSS deletion) is in-flight, but the mechanism was "ban new `.css` files via ESLint." This survivor adds (a) the **codemod** to migrate existing CSS, not just prevent new files, and (b) the **file-extension ban** as a filesystem-level gate — strictly stronger than an ESLint rule because it catches a dev who accidentally adds a CSS file without touching the React component. PagesTab.css already dropped 46% (3427→1862) in mega-orphan-sweep; codemod completes the remaining ~65%.

**Downsides.** 20+ fixture pairs is upfront cost (~1-2 days before any tab migrates). Complex selectors (`.panel .row:hover .label::before`) won't all auto-translate — flag list expected. Tabs differ enough that TabShell slot grammar might need ~2 escape-hatch slots (e.g., `sidebar: ReactNode` for unusual cases).

**Confidence:** 90% · **Complexity:** High (codemod + 10 migrations + gate wiring) · **Status:** Unexplored · Partial overlap with April 20 #1 but strictly deeper

---

### 4. Reflection-Driven Inspector (Element Schema → Auto-Generated Sections)

**Description.** Each element type in the editor (text, image, container, button, form, ...) declares a **Zod schema** of its stylable/editable properties with inspector metadata:

```ts
const TextElementSchema = z.object({
  content: z.string().describe({ section: "content", control: "textarea" }),
  fontSize: z.number().describe({ section: "typography", control: "length", unit: "px" }),
  color: z.string().describe({ section: "typography", control: "color" }),
  // …
});
```

The `<InspectorRenderer>` walks the schema of the currently selected element and **derives** which sections to render, what fields go in each, and which control primitive to use. "Add a new property to an element" becomes a one-line schema edit — no inspector React code touched. The 47 section files collapse into ~12 control primitives + N element schemas. The 9 adapter-fit sections migrate first (Week 5 work already there); the 8 bespoke become either schema entries or rare `Bespoke: () => JSX` escape-hatch nodes.

Conceptually this is Unity's `[Range(0,100)] float speed` pattern — the inspector reflects the type. Storybook Controls does this via arg-type inference. Retool collapsed 40 sections to 3 effect-based groups via a decision flowchart.

**Rationale.** April 20 plan's idea #4 builds section-level schemas manually; this survivor goes a layer up — **element** schemas drive section emergence. The upside: you never write a section; you declare fields on elements. Sections stop being a unit of code; they're an emergent grouping from field metadata. Inspector becomes fully type-safe (adding a property to an element type automatically exposes it in the inspector with the right control).

**Downsides.** Large schema design cost up front — 8 bespoke sections need to be expressed as escape-hatches or refactored. Zod's `.describe()` with custom metadata needs a small wrapper. Harder to customise per-element quirks like "this property only shows when this other property is set" — needs a `conditional` DSL.

**Confidence:** 75% · **Complexity:** High · **Status:** Unexplored · **Deeper than April 20 #4**

---

### 5. Region-as-Primitive + `data-density` Root Attribute

**Description.** Replace the "panel" mental model with Blender-style **Regions**. The editor shell becomes a grid of regions, each with a fixed anatomy (header + body + optional side-panel + optional footer). Topbar, left rail, left sidebar, canvas, inspector, bottom bar all become `<Region type="topbar">`, `<Region type="sidebar-pages">`, `<Region type="inspector">`, etc. Region is the unit — panels don't exist as a first-class concept.

Density is a first-class root attribute: `<EditorShell data-density="compact" | "comfortable">`. Every spacing / radius / font-size token resolves against density via the CSS-var cascade (`:root[data-density=compact]`). No component opts in; the shell attribute is the only lever. Pairs with survivor 2 (context-dispatch) — Region type and density together fully determine resolved token values.

JUCE's LookAndFeel strategy is the non-React analogue: swap one object at the subtree root, every widget under it draws differently.

**Rationale.** The strongest reframe of the problem. The "panel" concept is implicit — no file explicitly defines what a "panel" is. 592 panel-radius sites + 129 gradients + 212 shadow sites are symptoms of each "panel" reinventing its own identity. Regions kill the mental model: there is no "panel," only "region content." Density-as-attribute converts DESIGN.md's prose ("compact density") into a testable, togglable property.

**Downsides.** Biggest refactor in the survivor set — touches the shell layout at the root. Mental shift for the author. Existing PanelShell migration (Week 3-4) might need to be re-homed under Region. Some legitimate "panel within panel" cases need nested Region handling — edge-case heavy.

**Confidence:** 65% · **Complexity:** High · **Status:** Unexplored · **NEW vs April 20 plan**

---

### 6. Live DS Debt Dashboard Inside the Editor (`/ds-health`)

**Description.** A dev-only route in the editor itself that renders, in real time, the state of every DS gate:

- Inline `style={{}}` count per file (clickable → opens the file in IDE via `vscode://` URI)
- Raw hex count per file
- Radius-not-in-token count per file
- shared/ui adoption % per directory
- New-offender list since last commit
- Sparkline per week of each count

Runs the existing grep gates (`scripts/ds-grep-gates.sh`) through a tiny Express handler in dev mode and renders results as a sortable table. Optional in-canvas overlay (Option+Shift+D) highlights every DOM node by token provenance: green = shared/ui primitive, yellow = inline style, red = raw hex.

**Rationale.** Current gates produce numbers in CI logs or audit files. For a solo dev, "invisible debt" rots — visible debt gets paid. Making drift observable in the running editor converts every coding session into a drift-reduction opportunity without a separate audit step. Cost is very low (the gates already exist; this just surfaces their output). It's also the cheapest **motivation** multiplier for all the other survivors — you see the curve go down as you land each codemod.

**Downsides.** Negligible. Dev-only, no production impact. The one risk is "dashboard becomes background noise" — mitigate by filtering to files you're actively editing.

**Confidence:** 85% · **Complexity:** Low · **Status:** Unexplored · **NEW vs April 20 plan**

---

### 7. Single-Manifest Codegen Pipeline (tokens → types + CSS + Storybook + DESIGN.md + gate allowlists)

**Description.** One TypeScript manifest file declares every DS token:

```ts
export const tokens = {
  color: {
    chrome: { panel: { bg: "#F8F9FA", border: "#E9ECEF", ... } },
    accent: { cobalt: "#2D6DFF" },
    // ...
  },
  space: { 0: "0", 1: "4px", 2: "8px", ... },
  radius: { sm: "4px", md: "8px", lg: "12px" },
  shadow: { panel: "0 1px 2px rgba(0,0,0,0.04)", ... },
  motion: { fast: "120ms", normal: "200ms" },
  typography: { ... },
};
```

`pnpm ds:gen` emits all of:
- `themes/design-system/color.css`, `spacing.css`, `radius.css`, `shadow.css`, `motion.css` (CSS custom properties)
- `shared/types/ds-tokens.d.ts` (branded string-literal unions for survivor 1)
- Emotion theme object
- Storybook MDX swatch pages per token family
- `DESIGN.md` token tables (auto-updated between `<!-- ds:gen -->` markers)
- Gate allowlists (`.chrome-axioms-baseline` allowed-values for hex/radius gates)
- Legal-value sets used by the inspector control registry (survivor 4)

Adding one token emits 7 artifacts with zero drift between them.

**Rationale.** The April 20 plan ships tokens, types, and CSS but maintains them by hand. Every new token is 3-5 manual edits in 3-5 files. This survivor makes the manifest the single truth and generates everything downstream. Pairs perfectly with survivor 1 (supplies the branded types) and survivor 4 (supplies the control-registry legal values). Pattern is the "StyleDictionary / Spectrum tokens / Radix theme" standard — proven in every mature DS.

**Downsides.** One-time cost to write the generators (~2-3 days). Generated files need a `<!-- generated, do not edit -->` banner to deter manual edits. CI must fail if a generated file is out of date vs the manifest (simple `git diff --exit-code` after `ds:gen` in CI).

**Confidence:** 80% · **Complexity:** Medium · **Status:** Unexplored · **Deeper than April 20**

---

## How these compound

The survivors are not mutually exclusive — they compose:

```
             ┌─────────────────────────────────────┐
     7 ───► │  Single-manifest codegen pipeline   │────┐
             └─────────────────────────────────────┘    │ generates
                                                        ▼
                                        ┌────────────────────────┐
                                        │  Branded token types   │
                                        └────────────────────────┘
                                                        │ consumed by
                                                        ▼
                              ┌─────────────────────────────────────────┐
                              │  1. <Box/Stack/Row/Grid> primitive kit  │
                              └─────────────────────────────────────────┘
                                          │          │            │
                                          ▼          ▼            ▼
                              ┌──────────┐  ┌──────────┐  ┌──────────────┐
                              │  3. Tab  │  │  4. Refl │  │  5. Region-  │
                              │  Shell   │  │  Inspec. │  │  as-primit.  │
                              └──────────┘  └──────────┘  └──────────────┘
                                          │
                                          ▼
                            ┌──────────────────────────────┐
                            │  2. Region context-dispatch  │  (pairs with 5)
                            └──────────────────────────────┘

                                          │
                                          ▼
                            ┌──────────────────────────────┐
                            │  6. Live DS debt dashboard   │  (visibility for ALL)
                            └──────────────────────────────┘
```

Minimum viable set if you only had budget for two:
- **7 + 1** (codegen + primitive kit). Collapses hex sprawl, magic literals, inline styles into a single type system. Most leverage per unit effort.

Next best add-on:
- **6** (dashboard). Very low cost, massive motivation multiplier, makes 1 and 7 visible while they land.

## Pre-requisite hygiene (not a survivor, but mentioned twice in raw candidates)

Before any of the 7 ships, run a **dead-code sweep** with `knip` / `ts-prune`. Prior audit found 5+ orphan "primitives" (EmptyStates.tsx, SkeletonStates.tsx, ViewSwitcher.tsx, FilterChips.tsx) and 40+ dead redirect files in `components/Panels/LeftSidebar/`. These inflate the 394/160 denominator and make adoption % lie. Shipping survivors on top of dead code means the gates count corpses. Cheap: one baseline file, one-way ratchet down.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Drop Emotion entirely (all-CSS or Vanilla Extract) | Violates CLAUDE.md "Emotion only" mandate; already rejected in April 20 plan |
| 2 | Merge chrome + user-site DS into one namespace | Contradicts the locked two-namespace contract (Codex-killed once) |
| 3 | Blocks ARE the DS atoms (one system for both) | Same as #2 — two-namespace contract is non-negotiable |
| 4 | 2-week flag-day rewrite | Violates "no flag-day rewrites" constraint; solo-dev risk too high |
| 5 | Tabs → cmd-K + pinned regions | UX/navigation redesign, different problem space from DS sprawl |
| 6 | AI-only authors — DS as LLM-optimised manifest | Workflow optimisation, not a DS mechanism; orthogonal |
| 7 | Editor chrome as a `.pen` file opened in itself | Radical dogfooding, interesting north star but too speculative for near-term action |
| 8 | Generate tokens FROM components (reverse direction) | Too speculative; inverts SSOT direction unsafely; Codex would flag for "axioms vs shipped code" |
| 9 | Codex review as pre-commit hook | Operational workflow improvement, not DS ideation; fold into ship / CI process separately |
| 10 | CSS vars as ONLY SSOT, TS reads via getComputedStyle | Overlaps with survivor 7 and adds runtime cost; not stronger than codegen |
| 11 | DS is a verb — linter + codemod, not a folder | Partly true, folds into survivors 3, 6, 7 (all three embody the "verb" mechanism) |
| 12 | Chrome coverage gate (ratchet UP not DOWN) | Tactical gate detail, folds into each survivor's rollout plan |
| 13 | PanelShell mandatory via context-throw (Radix-style) | Technique, folds into survivor 1 (compound components with context error) |
| 14 | Hex values contraband — only themes/ may contain # | Already in April 20 plan as Gate 7 (hex gate WARN→FAIL) |
| 15 | Magic-number literal extraction to `--ed-space-{n}` | Folds into survivor 1 migration codemod |
| 16 | Shadow/gradient/radius triage → 12-token scale | Folds into survivor 7 manifest (shadow/gradient/radius families) |
| 17 | Playwright screenshot visual regression grid | Overlaps survivor 6 (dashboard); screenshots are different mechanism, could be added later |
| 18 | Bloomberg `<Cell>` primitive | Folds into survivor 4 (inspector control registry) |
| 19 | OBS scene composition (reusable sources) | Folds into survivor 4 (schema-driven sections) |
| 20 | Ableton Device Rack shell | Folds into survivor 3 (TabShell) |
| 21 | Mission-profile HUD 5-7 tile primitives | Folds into survivor 4 (control primitive registry) |
| 22 | CarPlay contribution slots registry | Mechanism folds into survivor 5 (Region system) |
| 23 | Dead-code purge as PR gate | Prerequisite hygiene, not ideation option (mentioned above survivors) |
| 24 | `style?: never` type shadowing | Folds into survivor 1 (branded types approach) |
| 25 | Per-tab CSS ban without codemod | Strictly weaker than survivor 3 (survivor includes both gate AND codemod) |

## Notes

- Every survivor is compatible with the April 20 committed rollout — none require abandoning Week 6-7 work. The closest overlap (survivor 3 vs April 20 #1) is a **deepening**, not a replacement.
- Survivor 7 is the highest-compounding single move. Survivor 1 is the highest-leverage user-visible move. Survivor 6 is the lowest-cost motivation multiplier.
- Survivors 2 and 5 are the most novel (not in April 20 plan) but carry the highest "needs a prototype to be sure" risk.
