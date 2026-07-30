# Editor Chrome → flowbite-react — Big-Bang Migration (Design Spec)

Date: 2026-07-30 · Branch target: `flowbite-bigbang` (new, off a clean base)
Status: DESIGN APPROVED (user, 2026-07-30) — implementation plan pending

## 1. Context & decision history

The editor chrome currently runs on the in-house `src/editor/ui/` library
(56 components, plain CSS in `ui.css`, generated `--bk-*` tokens from Figma).
The token values were already rebased on the Flowbite palette (#1A56DB,
Flowbite ramps) on 2026-07-28 — the look is Flowbite-derived, the code is not.

User decisions locked in this brainstorm (2026-07-30):

| ID | Decision | Choice |
|----|----------|--------|
| FB-1 | Goal meaning | CODE — literally `flowbite-react` installed and used, not just the look |
| FB-2 | Coverage | COMPLETE — whole chrome on Flowbite; `editor/ui` deleted at the end |
| FB-3 | Path | BIG-BANG — one arc, one branch, single merge (incremental rejected) |
| FB-4 | Tailwind | v4 — required by flowbite-react (its styling IS Tailwind utilities); v4 because current major, `@tailwindcss/vite` plugin fits Vite 7, CSS-first config gives cleaner preflight scoping |

## 2. End-state

- Chrome (shell / sidebar / inspector / panels / rail / media / onboarding /
  canvas-chrome overlays) = 100% `flowbite-react` components + Tailwind
  utility classes.
- `src/editor/ui/` (56 components) + `ui.css` + the chrome `--bk-*` token
  pipeline (`tokens.generated.css/.ts` chrome usage, `scripts/tokens/generate.mjs`
  chrome output) — DELETED.
- Editor-specific components that Flowbite does not have live in a new
  `src/editor/chrome-ui/` — custom React, styled with Tailwind classes in the
  Flowbite visual language.
- Accent continuity: Flowbite default primary (blue-700 #1A56DB) is already the
  product accent — zero brand drift.
- Light-only chrome (per DESIGN.md); Flowbite dark mode disabled.

## 3. Prerequisite (non-negotiable)

The uncommitted topbar tail on `ds/fresh-token-system` (T8/T9 closure — 8
files, tests 116/116 green) is committed and the branch closed/merged FIRST.
The big-bang branch starts from that clean base; otherwise the tail dies in
rebase.

## 4. Architecture

### 4.1 Tailwind scoping — the make-or-break constraint

The editor document also mounts CUSTOMER SITES (canvas mounts engine HTML into
the same document — `Canvas.tsx` escape hatch). Tailwind's global preflight
reset would restyle published-site content inside the editor.

- Preflight must NOT reach canvas-mounted user content: scope Tailwind's reset
  to the chrome root (Tailwind 4 CSS-first config; chrome root selector
  scoping / preflight off + minimal chrome-local reset — exact mechanism
  chosen at implementation, verified against a REAL user site before anything
  else is built).
- This is stage-0 work and the first verification, not the last.

### 4.2 Theme

- Flowbite defaults. Primary stays default blue-700 (#1A56DB).
- Fonts per DESIGN.md (Inter/Inter Tight, Geist Mono) wired into the Tailwind
  theme — no default font stacks.
- Dark mode off.

### 4.3 Folder layout

```
src/editor/chrome-ui/     # NEW — editor-specific components (Tailwind-styled)
src/editor/ui/            # DELETED at teardown
```

Site-builder DS (`src/editor/design-system/` + `themes/design-system/`) and
engine CSS (`themes/legacy-components.css`, canvas selectors) — UNTOUCHED.
They style customer output, not chrome.

## 5. Component mapping (56 → new homes)

**flowbite-react direct (≈20):**
Avatar→Avatar · Badge→Badge · Button→Button · Checkbox→Checkbox ·
Drawer→Drawer · Modal/ModalParts/ConfirmDialog→Modal · Popover→Popover ·
Radio→Radio · Select→Select · Slider→RangeSlider · Tabs→Tabs ·
Textarea→Textarea · Toast→Toast · Toggle→ToggleSwitch ·
Tooltip/TooltipParts/HelpTooltip→Tooltip · Input/Field/FieldRow→TextInput+Label ·
ProgressRow→Progress · SkeletonCompounds→Spinner + Tailwind `animate-pulse`

**Custom in `chrome-ui/` (Tailwind-styled, Flowbite language) (≈30):**
Topbar · SaveStatus · IssueChip · Presence · BreakpointSwitcher ·
CommandPalette · Rail · NavItem · PanelFrame · PanelHeader · SectionHeader ·
RightPanel · EditorShell · Footer · StatusDot · TreeRow · ListRow · Row ·
RecordRow · VersionRow · CommentRow · FormatRow · IntegrationRow · MediaCard ·
SiteCard · CopyButton · EmptyState · UpgradeModal · Icon (Lucide wrapper stays)

**Dissolved (no component — plain Tailwind classes at call sites):**
Stack · Row(layout) — flex utilities replace them.

**Resolve at implementation:** Portal/OverlayMount policy vs flowbite-react's
own Modal/Popover portaling (Gate 22 successor rule comes from this).

## 6. Construction stages (one branch, single merge)

1. **Setup** — install `flowbite-react` + `tailwindcss@4` + `@tailwindcss/vite`;
   preflight scoping; theme; verify against a real user site in canvas.
2. **Component swap layer** — build the full mapping above (flowbite-react
   wiring + all `chrome-ui/` customs) with contract tests.
3. **Surface sweep** — convert ALL chrome surfaces in one pass: inspector,
   sidebar, media, panels, rail, onboarding, canvas-chrome, shell (shell last —
   freshest code, 116 tests re-pointed here).
4. **Teardown** — delete `editor/ui` + `ui.css`; retire chrome token pipeline;
   gates rework (§7).
5. **Verification gate (§8)** — everything, before merge.
6. **Merge** — one event. Rollback = do not merge.

## 7. Gates rework (same arc as teardown)

- Retire for chrome: Gate 16 hex-ratchet, `gate:tokens-generated` chrome scope,
  `--bk-*` purity checks.
- Rewrite: Gate 24 (native elements owner becomes flowbite-react + `chrome-ui/`),
  Gate 22 (portal rule per §5 resolution).
- Keep: site-builder DS gates untouched; `gate:vibcoder-ratchet` stays at 0.
- New: `gate:editor-ui-gone` — after teardown, ANY import of `@/editor/ui`
  fails the build (same lock shape that held the vibcoder drain).

## 8. Verification gate (before merge, all mandatory)

- Full editor test suite green, including the 116 topbar/shell tests
  re-pointed at new components.
- Visual QA of EVERY chrome surface (screenshot walk).
- A real user site opened in canvas — preflight leak check (styles of the
  mounted site unchanged vs before).
- Publish flow E2E once (chrome changes must not touch export output).
- Bundle size measured and recorded (before/after).

## 9. Risks & accepted tradeoffs (user-accepted at FB-3)

- No usable checkpoint mid-arc — an abandoned arc = discarded branch, nothing
  salvaged.
- One giant diff; review happens once, and it is large.
- CC ~5-6 long back-to-back sessions; no feature work on this branch meanwhile.
- Preflight/canvas leak is the highest-severity risk — hence stage-0 placement.
- Two styling systems exist only INSIDE the branch, never on the merged main.

## 10. Out of scope

- Site-builder design system and customer-site rendering (different domain).
- Engine (`src/engine/`) and canvas HTML-mount path.
- Dashboard package (Next.js app — has its own styling world).
- Figma file restructuring (Flowbite kit stays the design source; only the
  chrome token EXPORT pipeline retires).

## 11. Effort

CC ~5-6 long sessions, one arc (human-team equivalent ~3-4 weeks sustained).
