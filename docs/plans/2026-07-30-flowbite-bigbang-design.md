# Editor Chrome → flowbite-react — Big-Bang Migration (Design Spec)

Date: 2026-07-30 · Branch target: `flowbite-bigbang` (new, off a clean base)
Status: DESIGN APPROVED (user, 2026-07-30) — rev 4, Codex-cleared (pass 1: 5 P1 + 4 P2 · pass 2: 2 P1 + 2 P2 · pass 3: 0 P1 + 1 P2, gate PASS; all findings addressed, final P2 fix taken verbatim from Codex's own file:line audit)

## 1. Context & decision history

The editor UI currently runs on the in-house `src/editor/ui/` library
(56 components, plain CSS in `ui.css`, generated `--bk-*` tokens from Figma).
The token values were already rebased on the Flowbite palette (#1A56DB,
Flowbite ramps) on 2026-07-28 — the look is Flowbite-derived, the code is not.

User decisions locked in this brainstorm (2026-07-30):

| ID | Decision | Choice |
|----|----------|--------|
| FB-1 | Goal meaning | CODE — literally `flowbite-react` installed and used, not just the look |
| FB-2 | Coverage | COMPLETE — every `@/editor/ui` consumer migrated; `editor/ui` deleted at the end |
| FB-3 | Path | BIG-BANG — one arc, one branch, single merge (incremental rejected) |
| FB-4 | Tailwind | v4 — required by flowbite-react (its styling IS Tailwind utilities); v4 because current major, `@tailwindcss/vite` plugin fits Vite 7, CSS-first config |

Codex plan review (2026-07-30) corrected four false assumptions in rev 1;
this rev is written against verified code, file:line cited.

## 2. End-state

- **Every `@/editor/ui` consumer repo-wide** runs on `flowbite-react` +
  Tailwind utilities. Verified consumer set is NOT just shell chrome — it
  includes `editor/design-system/ui/` (e.g. `DesignSystemTab.tsx:9`),
  `shared/forms/` (`InputField.tsx:10` — the one sanctioned shared→editor
  edge), `templates/` (`TemplatePreview.tsx:9`), `editor/media/`,
  `editor/canvas/` chrome components (`Canvas.tsx:10`), and test harnesses.
  Stage 0 produces the authoritative import inventory; the sweep covers ALL
  of it, not a "chrome surfaces" subset.
- `src/editor/ui/` (56 components) + `ui.css` — DELETED at teardown.
- **`tokens.generated.css/.ts` and `scripts/tokens/generate.mjs` STAY.**
  Rev 1 said "retire the chrome token pipeline" — wrong: `--bk-*` has
  non-library consumers that survive this migration
  (`src/styles/tokens/canvas.tokens.ts:17`, `themes/legacy-components.css`,
  site-builder DS). Teardown removes only the `ui.css` import from
  `themes/default.css:26` and any `--bk-*` reads that die WITH deleted
  components. A stage-0 inventory of `--bk-*` consumers outside `editor/ui`
  defines exactly what must keep working.
- Editor-specific components live in new `src/editor/chrome-ui/` — custom
  React, Tailwind classes, Flowbite visual language.
- Accent continuity: Flowbite default primary (blue-700 #1A56DB) is already
  the product accent. Light-only; Flowbite dark mode off.

## 3. Prerequisite (non-negotiable)

The uncommitted topbar tail on `ds/fresh-token-system` (T8/T9 closure — 8
files, tests 116/116 green) is committed and the branch closed/merged FIRST.
The big-bang branch starts from that clean base.

## 4. Architecture

### 4.1 CSS isolation — preflight AND utility collision (Codex P1)

The editor document mounts CUSTOMER SITE HTML and the customer's own global
CSS into the SAME document: `Canvas.tsx:497` (`dangerouslySetInnerHTML`) and
`Canvas.tsx:512` (`<style>{globalCustomCss}</style>`). Two distinct risks:

1. **Preflight**: Tailwind's global reset restyles mounted user content.
   Mitigation: scoped/disabled preflight + a chrome-local minimal reset.
2. **Utility selectors are themselves global** (rev-1 missed this): a user
   site carrying class `flex` or `hidden` would be hit by Tailwind's
   utilities; AI-generated sites carry arbitrary classnames. Mitigation:
   **Tailwind v4 `prefix` — all utilities emit as `tw:*`**, which cannot
   collide with user markup. flowbite-react must be configured for the same
   prefix; verifying that flowbite-react's emitted class lists respect the
   prefix is a stage-0 acceptance check (if it cannot, the fallback decision
   — iframe the canvas vs drop the prefix and accept scoping-only — goes to
   the user before any surface work starts).
3. Reverse direction (user CSS restyling chrome) is a pre-existing condition
   and out of scope; the migration must simply not widen it.

### 4.2 Tailwind setup against the ACTUAL entry chain (Codex P2)

Today there is NO Tailwind/PostCSS footprint in `packages/editor`; Vite root
is `demo` (`vite.config.ts:11`); the CSS contract is layered
`themes/default.css` (`@layer reset, components, overrides` at `:21`, token
import at `:23`, `ui.css` at `:26`, `legacy-components.css` at `:28`). Setup
specifies:

- `@tailwindcss/vite` added to `vite.config.ts` (and `vitest.config.ts` if
  transform-relevant).
- One Tailwind CSS entry imported from `themes/default.css` (replacing the
  `ui.css` line at teardown). `@source` directives are DERIVED from the
  stage-0a importer inventory, not hand-listed — every directory containing a
  migrated consumer gets coverage. Known today: `src/editor/**`,
  `src/shared/forms/**`, **and `src/templates/**`** (`TemplatePreview.tsx:9`,
  `SaveTemplate.tsx:8`, `MyTemplates.tsx:9` are `@/editor/ui` consumers —
  without this their utilities never compile). Stage-1 acceptance includes a
  build-time check that no migrated file sits outside `@source` coverage.
- Layer coordination decided up front: Tailwind's own layers load INSIDE the
  existing cascade so unlayered engine selectors (`legacy-components.css`,
  canvas selectors) keep winning where they win today. Verified by the
  stage-0 canvas check, not assumed.
- Fonts per DESIGN.md (Inter/Inter Tight, Geist Mono) in the Tailwind theme.

### 4.3 Behavior layer — NOT a paint swap (Codex P1)

`editor/ui/index.ts:44` exports behavior contracts, not just visuals:
`Portal` (mounts to `#bk-overlay-root`, `Portal.tsx:14`), `OverlayMount`
(body-mounted + focus trap, `OverlayMount.tsx:26`), `ModalRoot`/`isModalOpen`
(the "an open modal owns the keyboard" contract, commit `ff230492`),
`Popover` (anchored, non-portalled, roving focus, `Popover.tsx:31`),
`Menu*` keyboard nav, `ToastProvider`/`useToast` lifecycle, `useFocusTrap`.

Rule: **paint swaps to flowbite-react only where flowbite's built-in behavior
meets or exceeds the shipped contract.** Per overlay component, stage 2
evaluates flowbite-react's focus/keyboard/portal semantics against ours; where
insufficient, the shipped behavior primitive MOVES to `chrome-ui/` (logic
kept, styling to Tailwind) instead of being replaced. `isModalOpen` and
`useFocusTrap` are expected keepers. Acceptance: keyboard/focus parity tests
(§8) — the modal-owns-keyboard, menu arrow-nav, and focus-return behaviors
must pass identically after the swap.

### 4.4 Portal/overlay policy — decided NOW (Codex P1)

Current reality is three overlay models in the library (`OverlayMount` →
`document.body`, `Portal` → `#bk-overlay-root`, anchored non-portal
`Popover`) PLUS at least seven direct body-portal/body-backed overlay call
sites outside or beside it — the grep-verified list (stage-0d re-runs it as
the authoritative version):
`PageTabBar.tsx:335` · `sidebar/tabs/pages/components/PageContextMenu.tsx:167` ·
`sidebar/tabs/media/components/FolderContextMenu.tsx:103` ·
`sidebar/tabs/templates/TemplatePreviewModal.tsx:155` ·
`sidebar/tabs/templates/ApplyProgressOverlay.tsx:72` ·
`sidebar/tabs/templates/TemplatesTabModals.tsx:40` ·
`editor/ui/Toast.tsx:115` — plus a documented portal/focus failure note
(`ConflictModal.tsx:11`).

Policy (binding for the whole arc): **one chrome overlay root element**
(successor of `#bk-overlay-root`), owned by the shell. Every portalled
surface — ours and flowbite-react's — targets it (flowbite-react Modal
accepts a root; components that cannot target it keep the custom primitive
per §4.3). Every stage-0d call site is normalized in its surface pass — the
sweep works the LIST, not just the one stray rev-1 named. Gate 22 successor
(§7) enforces the policy afterwards.

### 4.5 Folder layout

```
src/editor/chrome-ui/     # NEW — editor-specific + kept behavior primitives
src/editor/ui/            # DELETED at teardown
```

Site-builder DS (`src/editor/design-system/` styling domain +
`themes/design-system/`) and engine CSS (`themes/legacy-components.css`,
canvas selectors) — UNTOUCHED as STYLING targets. (Their React chrome files
that import `@/editor/ui` are consumers and DO migrate — see §2.)

## 5. Component mapping (56 → new homes)

**flowbite-react direct — paint AND behavior adequate (verify per §4.3):**
Avatar→Avatar · Badge→Badge · Button→Button · Checkbox→Checkbox ·
Drawer→Drawer · Radio→Radio · Select→Select · Slider→RangeSlider ·
Tabs→Tabs · Textarea→Textarea · Toggle→ToggleSwitch ·
Input/Field/FieldRow→TextInput+Label · ProgressRow→Progress ·
SkeletonCompounds→Spinner + `animate-pulse`

**flowbite-react CANDIDATES gated on behavior parity (§4.3 evaluation):**
Modal/ModalParts/ConfirmDialog→Modal (must satisfy `isModalOpen` keyboard
contract + focus return) · Popover→Popover (anchored semantics) ·
Tooltip/TooltipParts/HelpTooltip→Tooltip · Toast→Toast (one-action contract,
lifecycle) · Menu family→Dropdown (roving focus/arrow nav). Failing any
check → behavior primitive moves to `chrome-ui/`, Tailwind-styled.

**Custom in `chrome-ui/` (Tailwind-styled):**
Topbar · SaveStatus · IssueChip · Presence · BreakpointSwitcher ·
CommandPalette · Rail · NavItem · PanelFrame · PanelHeader · SectionHeader ·
RightPanel · EditorShell · Footer · StatusDot · TreeRow · ListRow · Row ·
RecordRow · VersionRow · CommentRow · FormatRow · IntegrationRow · MediaCard ·
SiteCard · CopyButton · EmptyState · UpgradeModal · Icon (Lucide wrapper) ·
kept behavior primitives per §4.3 (expected: Portal/overlay root owner,
useFocusTrap, isModalOpen).

**Dissolved:** Stack · Row(layout) — flex utilities at call sites.

**Also in scope — CSS that styles `bk-*` contracts OUTSIDE `ui.css`** (Codex
P2): `editor/shell/header.css`, `editor/shell/chrome.css`, and every other
stylesheet the stage-0 grep finds targeting `bk-` classes. These rewrite or
die with their surfaces — the swap is components + the CSS that assumes them.

## 6. Construction stages (one branch, single merge)

0. **Inventory (before any install):**
   a. Repo-wide `@/editor/ui` importer list (authoritative sweep scope).
   b. `--bk-*` consumers outside `editor/ui` (must keep working — §2).
   c. CSS targeting `bk-` classes outside `ui.css` (§5).
   d. Overlay/portal call sites (§4.4 normalization list).
1. **Setup** — install per §4.2; prefix + preflight per §4.1; stage-0
   acceptance: real user site (including an AI-generated raw-HTML site)
   mounted in canvas, styles byte-identical before/after Tailwind load;
   flowbite-react prefix compliance verified.
2. **Component swap layer** — full §5 mapping incl. behavior-parity
   evaluations, with contract tests written alongside.
3. **Surface sweep** — ALL stage-0a consumers: inspector, sidebar, media,
   panels, rail, onboarding, canvas chrome, design-system UI, shared/forms,
   templates, shell (shell last — freshest, 116 tests re-pointed here).
4. **Teardown** — delete `editor/ui` + `ui.css`; swap the `default.css:26`
   import; gates rework (§7). Token generator + generated files STAY.
5. **Verification gate (§8)** — before merge.
6. **Merge** — one event. Rollback = do not merge.

## 7. Gates rework (verified against `scripts/ds-grep-gates.sh`, not rev-1's
stale summary — Codex P2)

- Gate 22 (`ds-grep-gates.sh:518`) currently scans the DEAD `shared/vibcoder`
  path — it is stale today. Successor is an OVERLAY-SPECIFIC matcher, not a
  broad `document.body` grep: it matches `createPortal(` whose container is
  not the overlay-root accessor (plus overlay-node `appendChild` on body),
  with a curated allowlist for legitimate non-overlay body usage — known
  today: drag ghosts (`canvas/hooks/useCanvasElementDrag.ts:320`,
  `sidebar/tabs/elements/useElementsState.ts:180`,
  `sidebar/tabs/elements/ElementCard.tsx:143`, `media/AssetCard.tsx:149` —
  AssetCard is the drag-ghost pattern, not a download anchor), download
  anchors (`export/ExportModal.tsx:115`), and off-screen capture nodes
  (`shell/captureThumbnail.ts:49`). A broad grep would false-positive on all
  six; the allowlist is re-grepped at gate-authoring time, not trusted from
  this list.
- Gate 24 (`ds-grep-gates.sh:542`) hard-codes `editor/ui` as native-element
  owner. Successor: owners = `flowbite-react` (node_modules, implicit) +
  `chrome-ui/`.
- Retire for chrome: hex-ratchet & token-purity checks THAT POINT AT deleted
  chrome CSS. `gate:tokens-generated` STAYS (generator lives — §2) but its
  chrome-usage assertions adjust to the surviving consumer set.
- Keep: site-builder DS gates; `gate:vibcoder-ratchet` at 0.
- New: `gate:editor-ui-gone` — any `@/editor/ui` import fails the build after
  teardown (vibcoder-lock pattern).
- Execution: gate edits land in the SAME commits as the deletions they track,
  each named against its `ds-grep-gates.sh` line — not a vague end-of-arc
  "rewrite gates" task.

## 8. Verification gate (before merge, all mandatory)

- Full editor suite green. Coverage parity, not just the shell subset:
  `editor/ui/__tests__` is 9 files / **145 runtime specs** (measured
  2026-07-30: `vitest run src/editor/ui/__tests__` → "Tests 145 passed";
  static `it(`/`test(` grep shows 129 — `it.each` expansion accounts for the
  difference; both prior review counts were wrong). Stage 0 re-captures this
  number as the parity baseline; every spec maps to a successor
  (flowbite-swap consumers get equivalent assertions; kept primitives carry
  their specs to `chrome-ui/`); the 116 topbar/shell tests re-point in the
  shell pass.
- Keyboard/focus parity (§4.3): modal-owns-keyboard, menu arrow-nav, focus
  return, toast lifecycle — asserted, not assumed.
- Canvas isolation: real user site + AI raw-HTML site mounted, computed
  styles unchanged vs pre-migration baseline (utility-collision check, §4.1).
- Publish flow E2E once (chrome must not touch export output).
- Bundle size before/after recorded.

## 9. Risks & accepted tradeoffs (user-accepted at FB-3)

- No usable checkpoint mid-arc — abandoned arc = discarded branch.
- One giant diff; review once, large.
- CC ~5-6 long sessions; no feature work on this branch meanwhile.
- Highest-severity: utility/preflight leakage into customer canvas (§4.1) —
  stage-0 placement + hard acceptance check.
- flowbite-react behavior gaps discovered late → absorbed by §4.3 keeper
  rule (primitive stays, paint changes) instead of derailing the arc.

## 10. Out of scope

- Site-builder design system STYLING and customer-site rendering.
- Engine (`src/engine/`) and the canvas HTML-mount mechanism itself.
- Dashboard package.
- Figma file restructuring (Flowbite kit stays design source; token
  generator keeps serving its surviving consumers).

## 11. Effort

CC ~5-6 long sessions, one arc (human-team equivalent ~3-4 weeks sustained).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 3 | PASS (pass 3: 0 P1, 1 P2 fixed) | 14 findings, 14/14 fixed |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** 3 passes. Pass 1 killed four false rev-1 assumptions (chrome-only framing, preflight-only isolation, token-pipeline teardown, paint-only mapping). Pass 2 forced the real portal call-site list, `src/templates/**` @source coverage, and an overlay-specific Gate 22 matcher. Pass 3 verified all fixes against code (file:line) — remaining P2 (allowlist drag-ghost sites) applied verbatim from Codex's own audit. Spec count settled by measurement: 145 runtime specs (both models' counts were wrong).
- **VERDICT:** CODEX CLEARED — plan verified implementable against actual code. Eng review optional before implementation (Codex already audited architecture-level claims at file:line depth).

NO UNRESOLVED DECISIONS
