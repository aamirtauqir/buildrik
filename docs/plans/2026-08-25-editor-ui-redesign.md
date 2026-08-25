<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260825-021450.md -->
# Editor UI redesign — every editor surface, drawn and shipped

Status: REVIEWED (autoplan 2026-08-25 — CEO, Design, Eng; dual voices)
Date: 2026-08-25 | Branch: `main` | HEAD: `ff7ec317`
Supersedes nothing. **Inherits** `docs/plans/2026-08-24-editor-production-walk.md`
(its SHIP gate and five carried conditions are dispositioned below).

Founder ask: open `Micuc1rmLcFhjxF1A08Kk2` (Buildrick — Existing UI Baseline —
ACTIVE), read the current editor flow and UI, then **fix the product's UI** —
design screens for every editor surface, verify against the existing product,
and implement. **UI quality first.**

## Objective

Redesign and ship every editor surface, as one coherent system, proven against
the running app.

Done-condition (observable, not claimable):

> A family is done when, for every surface **and every state in its state
> matrix**, the running app at 1440×900 matches its redesigned board side by
> side, and every ledger row belonging to that family is measured gone via
> `getComputedStyle`. Not when the boards are drawn. Not when a test passes.

## Scope — FOUNDER DECISION 2026-08-25 (binding, not re-arguable)

**All editor surfaces get a redesign, a verification, and an implementation.**
Chosen at the autoplan premise gate over the reviewer's recommendation (fix
the measured defects plus a design pass on ~12 core surfaces). Both review
voices argued the narrower shape; the tradeoff was put to the founder
explicitly and the founder reaffirmed the full scope. Settled — the sections
below execute it, they do not re-argue it.

The concern, recorded once and dropped: 443 editor commits since the content
pin, and after five prior Figma-driven arcs only **6 of 366 active boards
(1.6%)** have ever been checked against the running app.

**Mitigation — per-family loops, not draw-all-then-build.** Each family goes
diff → design → implement → verify and ships before the next is drawn.
Families are ordered by user impact, so a cut-short arc still leaves the
surfaces users touch already done.

## THE TRAP — read before resolving a single board

`scripts/baseline/figma-census.json` (generated 2026-08-18) indexes the editor
page at 46 frames and hands out ids like `62:2`, `88:2`, `70:2`. **Every one is
a superseded frame.** The file was re-captured 08-21/22/23. Page `75:2` today:

| | Count |
|---|---|
| Top-level frames | **117** |
| Distinct `BL-` ids | **62** |
| Marked `CURRENT` (08-21 → 08-23) | **53** |
| Marked `SUPERSEDED` | 10 |
| No marker at all (the old set) | **54** |

I read six boards through the census and drew four conclusions the current
frames refute. The independent CEO voice hit the same wall from a different
direction and reached the same finding.

**The node-id SSOT is `scripts/baseline/inventory.json`** — 224 rows, 60 with
`flow: "editor"`, each carrying `figmaNodeId`, `capturedFrom`, `pipelineState`.
It resolves `BL-0123` → `330:2` (`captured-current`), not the census's `88:2`.

1. Resolve every board through `inventory.json`. Never the census.
2. If a frame's name does not carry `CURRENT`, it is not the baseline.
3. `screens-editor.json` still points at `88:2` for BL-0123 — harness bug, T1.
4. `inventory.json` covers `BL-0100..BL-0224` (60 rows); the Figma page carries
   62 ids incl. `BL-0230`, `BL-0233`, `BL-0235` added 08-23. Reconcile — T1.

## What the current boards show

Read at native resolution, all CURRENT: `315:2` shell, `330:2` inspector-text,
`316:2` layers, `322:2` brand, `319:2` media, `332:2` inspector-container,
`323:2` publish-confirm. The editor is in far better shape than the stale
boards suggested — proper status bar, rebuilt canvas toolbar, and an inspector
whose section vocabulary matches the code registry exactly.

### Ledger

Ordered by first contact in a real session, not by which board I opened.
Every pixel number carries its source; anything marked `eyeballed` is
re-measured in Phase A before it drives a task.

Rows marked **[LIVE]** were measured in the running app on 2026-08-25 with
`getComputedStyle`, not read off a board.

| # | Defect | Source | Severity |
|---|---|---|---|
| R0 | **[LIVE] The element library has no icons.** Every Insert row renders `<span class="tw:size-[12px] tw:rounded-[2px] tw:bg-[var(--bk-ink-muted)]">` — a solid 12×12 grey square, `rgb(107,114,128)`, **no SVG** (`GroupSection.tsx:101`). Every Layers row renders `<span class="bdc-lr-ic">`, same grey, same no-SVG. So 53 element types and every layer in the tree are visually identical. `elementIcons.tsx` maps each type to its own lucide glyph and is imported by exactly one file — `ProInspector.tsx` | measured live; source found | **Critical** — it is the first thing a user looks at and it carries zero information |
| R1 | **Inspector shows a value that is not the element's.** The site H1 carries `font-size: 52px` and renders 52px while the inspector's Font size field reads `inherit`, disabled, with no reason string | `docs/walks/U2-build-a-page.md:576` | **Critical** — a lying panel must not be restyled |
| R2 | Two floats stack bottom-right on load, before anything is clicked: the onboarding `0 / 7 done` pill and a dark circular FAB. The pill overlaps the inspector's `BACKGROUND` / `BORDER` rows | every CURRENT board | High |
| R3 | **[LIVE] Rail hover tooltip renders over the open drawer.** Hovering Brand puts the bubble at `x 8→92, y 443`; the drawer occupies `x 60→380`. 32px of overlap, measured. It hides whatever row sits behind it | measured live | High |
| R4 | **[LIVE] Rail tooltip is near-black and off the type ramp, and it bypasses the z-token.** Measured: `background rgb(17,24,39)` = `#111827`, every channel under `0x35`, against DESIGN.md:104 "zero pure-black or near-black surfaces… tooltips all follow this". `font-size 14px` where a hint is 11-12. `z-index 50` hardcoded (`HintTooltip.tsx:41` `tw:z-50`) instead of `var(--bk-z-tooltip)` = 90 | measured live; `HintTooltip.tsx:41-42` | High |
| R5 | The **FAB has no owner**. A dark circular float in a desktop pro tool whose every action has a rail item, a menu item, a shortcut and a ⌘K entry. First question is whether it survives, not where it sits | `315:2` | High |
| R6 | Inspector **Color row collapses** — swatch, garbled overlapping value, `100%`, eye toggle and warning triangle colliding. Width `eyeballed`; the inspector is **300px** (`layout.ts:35`, `--bk-size-inspector`), so re-measure before designing to it | `330:2` | High |
| R7 | Canvas breadcrumb bar (`Canvas › Container … ← Parent → Child`) **clipped by the canvas viewport**, roughly half visible | `332:2`, `330:2` | Medium |
| R8 | Media's actions appear **twice** — empty state (Upload · Browse stock) and footer (Upload · Stock · Icons) — different sets, the footer set unowned. *The bare centred text is the spec (DESIGN.md:321, "No illustrations"), not the defect* | `319:2` | Medium |
| R9 | Media filter chips render `image 0 · video 0 · svg 0 · icon 0` and stay visible at zero | `319:2` | Low |
| R10 | Brand panel — the design-system surface — is a plain text list with counts. No swatches, no type specimens | `322:2` | Medium |
| R11 | Brand footer reads "All changes saved" beside a live `Discard` and a low-contrast `Apply Changes` that reads disabled but is not. **Two save vocabularies on screen at once** with the topbar `SaveStatus` — an IA defect, not a footer defect. Also a contrast failure | `322:2` | Medium |
| R12 | Publish modal's value column runs into the right border and clips — "your connected Vercel projec[t]". Left padding ~24px, right 0 | `323:2` | Medium |
| R13 | Review bar (`0 open · Next › · Compare … Re-send`) holds a full-width band even at zero open comments | every CURRENT board | Low |
| R14 | Inspector empty state is one centred sentence in a column that keeps full width while empty. Width `eyeballed` at 210px but the token says **300px** — re-measure; if it really renders 210 that is the bigger defect | `315:2` | Low |
| R15 | **No overflow/truncation rule anywhere.** No coverage of a 60-char page name, a 12-deep layer tree, a long font family, a long filename. R12 is one instance of a missing system rule | absent from boards | Medium |

Tooling defects are **not** ledger rows. The census/`screens-editor.json`/
`inventory.json` disagreement is T1's justification, recorded above.

### Claimed on stale boards, refuted on current ones

| Claim | Verdict |
|---|---|
| Three inspectors, three vocabularies | **Refuted.** `inspector/sections/registry/index.tsx` composes one `SECTION_REGISTRY`. No `Stroke` or `Colors` section exists in the codebase |
| ~~53 Insert elements share one grey square glyph; Layers likewise~~ | **MOVED TO THE LEDGER AS R0 — the board was right and my "capture artifact" call was wrong.** Measured live 2026-08-25, see R0 |
| Breakpoint chip wraps "Desk / top" | **Refuted.** Current board renders `Desktop` on one line |
| `0 / 7 done` pill renders twice | **Refuted.** One pill. The overlap is real (R2); duplication was a stale-frame artifact |
| "2 of 12 sections apply" is orphan text | **Not a defect.** `sectionApplies()` is documented behaviour |
| **"Nothing owns the z-layer above the drawer"** — my own Phase B premise | **Refuted.** `tokens.generated.css:137-146` ships ten `--bk-z-*` layers (canvas 0 → tooltip 90), and `docs/designs/2026-07-18-editor-shell-wireframes.md:275` §5.9 is a *second*, contradicting ten-layer contract. See "The real z-layer problem" below |
| Cookie banner covers the editor's bottom 40px | **Unresolved.** `global-providers.tsx:11` mounts `<CookieConsent />` app-wide so `/edit/[siteId]` inherits it, but no CURRENT board shows it. Live check in Phase A |

## The real z-layer problem

Two z-index contracts ship and they disagree:

- `tokens.generated.css:137-146` — canvas 0 · chrome 10 · drawer 20 · topbar 30 · popover 40 · overlay 50 · modal 60 · cmdk 70 · toast 80 · **tooltip 90**
- wireframes §5.9 — **modals 100** · palette 90 · toasts 80 · drawer-when-overlaying 70 · canvas toolbar pill 60 · floating selection toolbar 50 · comment pins 40 · canvas overlays 30 · review bar 20 · page frame 10

They invert modal vs tooltip, and the token set has **no layer at all** for the
canvas toolbar pill, the floating selection toolbar, comment pins or the review
bar — precisely R2, R3, R7, R13. DESIGN.md:251 names that wireframes file
authoritative for z-index.

And the contract that exists is ignored: **20** `var(--bk-z-*)` consumers
against **203** raw `z-index` / `zIndex` / `tw:z-` sites in `src/editor`,
including `zIndex: 10001` (`LayerContextMenu.tsx:115`), `9999`
(`PageContextMenu.tsx:67`), `1050`, `1000`. `HintTooltip.tsx:41` is hardcoded
`tw:z-50`, not `var(--bk-z-tooltip)`.

So this is an **adjudication plus a drain behind a ratchet**, not a new layer.
Note §5.9 already specifies the collision behaviour: *"Canvas toolbar pill —
yields to an overlaying drawer — shifts right by the drawer width so it stays
centred in the visible canvas."*

## Which Figma file — resolved

**Draw in `g4GzQFqzNYz5sosz1QtZXC` page `1:3`**, where
`packages/editor/scripts/conformance/boards.json` points: 422 boards, 366
active, 34 active families, generated 2026-08-14, and **every board carries an
`authority` field** adjudicating board-vs-code conflicts. That file is wired to
`gate:boards`. A new file would be the third live editor design target with no
tiebreak. The ACTIVE baseline stays untouched — it is the *before*.

## The design supply that already exists

**Correction, and it is load-bearing:** an earlier draft of this plan cited
`DESIGN.md §Sidebar Panel System (:271-338)` as binding. **DESIGN.md:232-238
marks that exact range SUPERSEDED (2026-07-18)** — *"A designer who follows
them builds the previous product."* Only the **values** survive (`:255`:
colour, typography, spacing, motion, row density, NO BLACK, accent, semantics,
token namespace, chrome axioms, anti-slop, accessibility). The **layout** —
Width Rule, Composition Map, Rail Rules — is dead.

DESIGN.md's own banner names what to build from instead. Phase B dispositions
each as adopt / amend / retire; it does not re-derive them.

| Artifact | What it holds | Status |
|---|---|---|
| `docs/designs/2026-07-18-editor-shell-wireframes.md` | **§5.7 empty-state copy, written** (11 states, incl. Media verbatim "No images or files yet." / Upload · Browse stock) · **§5.8 the five control states** every control needs · **§5.9 z-index contract** · **§7 a drift table naming every stale DESIGN.md layout claim by line** | Authoritative per DESIGN.md:251. **Was missing from this plan entirely** — read before Phase B |
| `docs/designs/2026-07-17-…-complete.md` §4.3 | The placement map | Authoritative per DESIGN.md:250 |
| `docs/designs/2026-07-18-site-fullpage-wireframes.md` | The Site full-page area | Authoritative |
| `docs/prd/editor/` | Per-screen specs — `01-shell-rail-panels.md` (updated 08-23), `02-sidebar`, `03-inspector`, `04-canvas`, `05-engine`, `06-design-system-catalog`, `07-blocks-templates` | Authoritative |
| `DESIGN.md` **values only** — Row Density `:304-312`, Content Rules `:314-321`, Anti-Slop `:340-362`, Accessibility `:364-370` | Still SSOT | Cite by line. **Never cite `:271-338` as one unit** |

DESIGN.md's banner also already answers the rail question (below): 6 flat tool
icons, `A P L M D B` + `C` + `⌘P` + `⌘K`, **320px for all six** as a declared
override of the dead Width Rule.

## Prerequisite — the rail IA is already settled; delete the other two

`packages/editor/src/editor/rail/tabsConfig.ts:371-373`, verbatim:

> This is a THIRD render source alongside the zone rail (legacy) and the tool
> rail (E3) … which one renders is chosen by `editorViewMode.railMode`
> ("figma" is the default).

Three IAs ship in one component behind `?rail=`: **legacy** (13 tabs, three
zones), **e3** (4 tools — "pure data; no behaviour wired yet"), **figma** (6
items, the default, what every CURRENT board and DESIGN.md's banner show).

Drawing on an unsettled IA produces a fourth opinion. DESIGN.md already picked
`figma`; T2 deletes the other two.

## Family order

Mapped onto `boards.json`'s **actual** active-family counts, not invented ones.
An earlier draft budgeted roughly a fifth of the existing coverage and silently
dropped History, AI, Templates, Compare, Components and Issues.

| # | Family | Active boards | Ledger rows |
|---|---|---|---|
| 1 | Shell states (12) + Shell (6) + Canvas (7) | 25 | R2, R3, R4, R5, R7, R13, R14 |
| 2 | Inspector | 20 | **R1 first**, R6 |
| 3 | Layers (18) + Insert (13) + Pages (13) | 44 | R15 |
| 4 | Media (29) + Media drill-ins (1) | 30 | R8, R9 |
| 5 | Brand (28) + Components (8) | 36 | R10, R11 |
| 6 | Review panel (13) + Compare (8) + Orphan comments (3) + Issues (5) | 29 | — |
| 7 | Publish (12) + Templates (11) | 23 | R12 |
| 8 | History | 16 | — (named in the inherited SHIP gate `F-A6`) |
| 9 | Content | 15 | — |
| 10 | AI (11) + CmdK (7) + Notifications (6) | 24 | — |
| 11 | Modal (5) + Exit (2) + Onboarding (2) | 9 | — |
| 12 | S-flows (S1 26, S5 23, S3 17, S7 14, S2 11, S6 1, S1 1) | 93 | — |

**366 active boards**, not 62. The 62 `BL-` ids are the as-built baseline's
coverage of the same product; `boards.json` is the design target's coverage and
it is five times larger, because it already enumerates the states the baseline
never captured.

## The state matrix — every family, before any board is drawn

The single biggest gap in the earlier draft: it named one state family (empty)
and would have shipped a beautiful rest state for every panel and no loading,
error, disabled, mixed or multi-select state anywhere — while the code already
models four of those.

Every family enumerates these before drawing. A family without its state rows
is not scoped.

| State | Already in code | Spec |
|---|---|---|
| rest | — | — |
| hover / focus-visible / pressed | `a11y.css:101-114` | wireframes §5.8 |
| disabled **+ reason** | `PropertyState.reason` (`inspector/config/cssContext.ts:35-40`), `ReviewTab.tsx:436` `disabledReason` | §5.8 — *a disabled control without a reason tooltip is a bug, not a state* |
| loading / in-flight | `chrome-ui/Skeleton.tsx` (24 consumers) | §5.8 — 14px inline spinner, no reflow |
| empty | `chrome-ui/EmptyState.tsx` | §5.7 — copy already written |
| error / failure | save, publish, upload, offline | — **gap** |
| partial / mixed | `CssContext.mixedKeys` + `MixedValueBadge` | — **gap** |
| multi-select | `composer.selection.getSelectedIds()`, `pages/useBulkSelect.ts` | DESIGN.md:278 Footer = selection count · batch actions |
| overridden / token-bound | `PropertyState.isOverridden`, `inspector/sections/DSBindingChip.tsx` | — **gap** |
| permission / role | `ReviewTab.tsx:436` viewer path | — **gap** |
| overflow / truncation | — | — **gap** (R15) |

**Empty-state contradiction to settle in Phase B, one line:** DESIGN.md:321
says *"13px muted title, 12px tertiary body, one primary action. No
illustrations."* Wireframes §5.7 says *"icon 32 muted · one line · one primary
action"* then lists Media with **two**. Shipped `EmptyState.tsx` has an `icon`
prop and a plural `EmptyStateActions` flex row. Shipped Media has **three**.
Four opinions on one component; pick one before T7.

## Phases

### Phase A — re-ground on the running app

Boot the dashboard with `NEXT_PUBLIC_UNIFIED_EDITOR=true`, reach a real
server-backed session on fixture `cmrsur1fp000unh3rvmmiq25t`, replay
`screens-editor.json` (55 of 60 carry driving actions, live-verified 08-21),
and diff with `board-diff.mjs` / `image-compare.mjs`.

A **diff, not a re-capture** — `screens-editor.json:_note` closes the 08-23
pass with "every editor state that CAN be captured has been", and commits
`1463424c`, `ef247a12`, `ac0168c3`, `e2d1c4db` did that two to four days ago.

Phase A also **re-measures every `eyeballed` pixel number in the ledger with
`getComputedStyle`** (R6, R14 at minimum) and settles the cookie banner.

Known limits, documented, not worth rediscovering: ⌘K closes when the capture
script takes focus (`481:2` is the first success); CSS-painted overlays do not
survive html-to-design.

**Rig traps hit on 2026-08-25 — do not re-pay for these:**

1. **The magic-link token is single-use.** `generateToken("magic_link", …)`
   is marked `used` by the callback. Re-running a probe with the same token
   silently lands on `/auth` and every DOM query returns empty — which reads
   exactly like "the panel is broken". Four probes were measuring a login
   page. **Log in once, then `context.storageState({path})` and reuse it.**
   The rig lives at `scratchpad/rig.mjs` (`openEditor()` throws on
   `SESSION DEAD` rather than returning a silent empty page).
2. **`auth.verifyMagicLink` is rate-limited 10 per 15 minutes**
   (`normalRateLimit` = `createRateLimitedProcedure(10, 15*60*1000)`,
   `routers/auth.ts:23,144`). Burning it during probing blocks the rig. State
   is a Postgres row in `rate_limit_buckets` keyed `::1:auth.verifyMagicLink`
   — deletable in dev, no need to wait out the window.
3. **A dev overlay floats at `z-index 100000` and `99996`** and shows up in any
   naive "list fixed-position elements" probe (`v3.0.2 Output Detail…`). It is
   not product chrome. Strip it before counting floats, or the float ledger is
   wrong.

**Settled by Phase A so far:** the cookie-consent banner **does** render in the
live editor (`cookieBanner: true`, visible at the bottom band covering the page
tabs) even though no CURRENT board shows it — the capture fixture had consent
set. It is a real defect. Confirmed rail is `figma` (6 tabs:
`add · layers · pages · assets · content · design`). Zero console errors on
editor boot.

### Phase B — reconcile, do not re-derive

1. Read wireframes §5.7, §5.8, §5.9, §7 and disposition them.
2. Adjudicate §5.9 against `--bk-z-*` — pick one, name the four missing float
   layers, record the loser as superseded in **both** files.
3. Settle the empty-state contradiction in one line.
4. Reconcile DESIGN.md's layout sections to wireframes §7, **keeping the
   supersede banner and the drift notes verbatim**.

**No new `--bk-*` tokens are added by hand.** They are generated —
hand-editing `tokens.generated.css` fails `gate:tokens-generated`. Any task
needing a token gets an explicit sub-step: Figma variable → re-export
`scripts/tokens/figma-tokens.json` → `node scripts/tokens/generate.mjs` →
commit both generated files. Default assumption for this arc: **zero new
tokens, compose existing ones.**

### Phase C + D — per family, twelve times

```
  for each family:
    1  enumerate the state matrix; states without boards get boards
    2  diff live states against the CURRENT boards            (Phase A rig)
    3  draw the redesign in g4GzQ page 1:3, authority field set
    4  implement against the drawn board
    5  verify:
         - live screenshot beside the board at 1440x900
         - getComputedStyle on every ledger row in the family
         - axe clean on the surface
         - Tab reaches every interactive element in DOM order and shows
           the ring; any hover-revealed action also reveals on :focus-within
    6  commit the family; only then start the next
```

**Estimate one family end to end and publish its cost before committing to
twelve.** T1-T12 below total ~30h human and cover only the ledger; the redraw
of 366 boards carries no number yet, and when an arc runs long the first thing
cut is the state matrix, because states are invisible in a side-by-side shot.

### Kill criteria

- **Phase A:** a family whose CURRENT boards already agree with the app above
  95% goes to the back of the order — it is not where the problem is.
- **Phase C+D:** a family taking more than two loops to reach visual agreement
  stops and gets re-scoped. Two prior arcs (08-07, 08-11) died by redrawing
  instead of stopping.
- **Whole arc:** a data-loss defect in any live walk preempts it. The last six
  days fixed four.

## Risks

| Risk | Why real | Mitigation |
|---|---|---|
| **Chrome CSS bleeds into customer content.** `Canvas.tsx:674` mounts customer HTML via `dangerouslySetInnerHTML` into `.buildrick-canvas`, a **descendant** of chrome root `.bd-studio`. No iframe. `chrome-reset.css` warns it loads unlayered, so a leak "would very likely win over the customer's own CSS" | Phases B and D touch this cascade across every surface | T10 — extend `chrome-reset.test.ts`'s selector guard, in the same commit as each new rule. Canvas iframe isolation flagged as its own arc |
| **A rail rebuild silently reintroduces a critical axe violation.** `HintTooltip.tsx` exists because flowbite's `Tooltip` rendered two siblings inside the rail's `role="tablist"`, producing `aria-required-children` critical and losing the tab-set relationship. It clones its child and portals the bubble | T2 and T4 both touch it; neither's original verify ran axe | a11y verify is now in the per-family gate and in T2/T4 |
| **T4 fixes 4 of 203 z-index sites and passes** | 20 token consumers vs 203 raw | T4 carries a ratchet gate in `verify:ds` |
| Board rot | 443 editor commits since the pin; 1.6% ever checked | Per-family loops |
| A fifth design artifact | Four already exist | Draw in `g4GzQ`; disposition the rest in Phase B |
| Anti-slop regression on Brand (T8) | "Swatches and specimens" is the canonical shape for tile grids, category hues, cards and shadows — anti-slop rules 3, 9, 10, 11 | T8 carries four written constraints (below) |

## Inherited from `2026-08-24-editor-production-walk.md` — not dropped

That plan asks the next plan to carry its open conditions forward rather than
rediscover them, and names three prior plans that failed to.

**SHIP gate.** Item 1 (deploy 869 commits) closed 08-24. Items 3 (real Vercel
publish) and 4 (Stripe live) descoped by the founder 2026-08-25. **Item 2 is
open:** `F-A1` boot/load · `F-A2` save/autosave · `F-A3` publish · `F-A6`
versions · `F-A7` undo, plus `U1` first-run→publish and `U2` build-a-page,
walked live with zero open data-loss defects. **This arc does not close it** —
stated so the gate is not lost by omission, which is the exact failure the
08-24 plan named.

| Condition | Disposition |
|---|---|
| Nobody has been asked — one session (2026-06-21), verbatim "no idea if a process errored or succeeded" | Not addressed; feedback-and-state problem. Carried |
| The differentiator has never run — `agency_layer` default-off, no real client-review walk | Not addressed. Family 6 draws review surfaces; drawing is not walking. Carried |
| The product cannot see itself — verified: `sidebarAnalytics.ts:19` is `noopProvider`; `setSidebarAnalyticsProvider` is called only from its own test | Not addressed, and it is why family order is judgement not measurement. ~20 lines into the existing seam. Carried, recommended before family 8 |
| Chromium-only e2e (`playwright.config.ts:56`); `bs-webkit-ventura` exists in the dashboard config | Not addressed. Carried |
| Published-site beacon CORS-open — `app/api/public/track/[siteId]/route.ts:13` is `"Access-Control-Allow-Origin": "*"`, no consent gate, every customer site | Not addressed. Security, not UI — should not wait for a UI arc. Carried |
| **Added here (sixth):** the editor palette fails its own WCAG lint (08-19 founder decisions) — unresolved, and it silently vanished between plans | R11 is one instance. Carried explicitly |

## What already exists (do not rebuild)

`SECTION_REGISTRY` · `elementIcons.tsx` · `chrome-ui/` (50 components) ·
`tokens.generated.css` incl. ten `--bk-z-*` layers · `EmptyState.tsx` ·
`Skeleton.tsx` · `PropertyState` / `mixedKeys` / `MixedValueBadge` /
`DSBindingChip` · `useBulkSelect` · `a11y.css` focus ring ·
`inventory.json` · `screens-editor.json` · `boards.json` (422 with
`authority`) · `board-diff.mjs` / `image-compare.mjs` / `live-shot.mjs` ·
wireframes §5.7 empty-state copy · §5.8 control states · §5.9 z-index.

## Explicitly NOT in scope

- Dashboard, auth, onboarding, emails, public/agency boards. **Exception:**
  chrome that leaks into the editor is in scope wherever it mounts.
- Vercel and Stripe — founder call 2026-08-25.
- Canvas iframe isolation — its own arc.
- Restoring the ACTIVE file's dropped SVG icons — a capture-pipeline arc.
- The six inherited conditions — carried, not adopted.

## Implementation Tasks

- [ ] **T0 (P1, human: ~3h / CC: ~25min)** — element icons — Wire `getElementIcon` into the Insert rows and the Layers tree; delete the grey-square placeholders
  - Surfaced by: R0, measured live. `GroupSection.tsx:101` renders a solid 12×12 `<span>` for all 53 element types; the Layers tree does the same via `.bdc-lr-ic`. `elementIcons.tsx` already holds the per-type lucide map and is used only by `ProInspector.tsx`
  - Files: `sidebar/tabs/build/components/GroupSection.tsx`, the Layers row component, `editor/shared/elementIcons.tsx`
  - Verify: probe the live Insert and Layers rows — every row has an `<svg>`, and the path signature differs per element type (the check that caught this: identical `pathSig` across rows means the placeholder is still there). Icon size and colour measured against the DESIGN.md ramp
- [ ] **T1 (P1, human: ~2h / CC: ~15min)** — baseline tooling — Make `inventory.json` the single node-id resolver; regenerate `figma-census.json` from CURRENT frames; fix `screens-editor.json`'s stale ids; reconcile 60 rows against 62 Figma ids
  - Surfaced by: the census misled this review twice
  - Files: `scripts/baseline/figma-census.json`, `baseline-census.mjs`, `screens-editor.json`, `inventory.json`
  - Verify: all three resolve `BL-0123` → `330:2`; the generator refuses unmarked frames
- [ ] **T2 (P1, human: ~4h / CC: ~30min)** — rail — Delete the `legacy` and `e3` IAs, their `?rail=` resolution and their test suites; keep `figma` (already DESIGN.md's answer)
  - Surfaced by: `tabsConfig.ts:371-373`
  - Files: `rail/tabsConfig.ts`, `editorViewMode.ts`, `sidebar/LeftSidebar.tsx`, three test suites
  - Verify: `grep -c railMode` → 0 branches; editor unchanged at 1440×900; **axe clean on the rail; Tab reaches every rail item; arrow keys move within the tablist; Escape dismisses the tooltip**
- [ ] **T3 (P1, human: ~4h / CC: ~30min)** — inspector — Spec **then** fix the Font size field. Show the resolved value as the field text plus an inherited affordance and a reset-to-inherit control; typing commits an explicit override
  - Surfaced by: R1. `PropertyState` already models explicit/inherited/overridden/mixed — a naive "make it read 52" erases that distinction and regresses a working system
  - Files: `inspector/config/cssContext.ts`, `inspector/sections/registry/typography.tsx`
  - Verify: field reads 52, is visibly marked inherited, reset returns it to inherited, and the disabled state carries a reason string
- [ ] **T4 (P1, human: ~6h / CC: ~45min)** — z-layer — Adjudicate wireframes §5.9 against `--bk-z-*`; name the four missing float layers (canvas toolbar pill, floating selection toolbar, comment pins, review bar); record the loser as superseded in both files; then drain raw z-index behind a ratchet
  - Surfaced by: R2, R3, R7, R13. **Not** a missing layer — 20 token consumers vs **203** raw sites incl. `zIndex: 10001` (`LayerContextMenu.tsx:115`), `9999` (`PageContextMenu.tsx:67`); `HintTooltip.tsx:41` is `tw:z-50`, not `var(--bk-z-tooltip)`
  - Files: `themes/`, `docs/designs/2026-07-18-editor-shell-wireframes.md`, `scripts/gates/`, the 203 sites
  - Verify: ratchet gate in `verify:ds` locks the non-token count and may only go down; **negative-tested** by planting a raw `z-index` and watching the gate fail. Floats use `--bk-shadow-drag` or `--bk-shadow-overlay` only; no float gets a scrim except modal. §5.9's "pill yields to an overlaying drawer" holds live
- [ ] **T5 (P1, human: ~1h / CC: ~10min)** — rail tooltip — Move off `tw:bg-gray-900` to a token surface; drop `tw:text-sm` to the hint ramp
  - Surfaced by: R4 — DESIGN.md:104 NO BLACK, DESIGN.md:138 chrome type ramp
  - Files: `chrome-ui/HintTooltip.tsx`
  - Verify: `getComputedStyle` on the bubble — no channel under `0x35`; font-size ≤ 12px; **axe still clean, tablist children still exactly the tabs**
- [ ] **T6 (P1, human: ~2h / CC: ~20min)** — floats — Answer "does it survive?" for the onboarding pill and the FAB before answering "where does it sit?". If the pill survives it is dismissible and remembers dismissal
  - Surfaced by: R2, R5 — anti-slop rule 9, DESIGN.md:99 "chrome steps out of the way"
  - Files: `onboarding/OnboardingChecklist.tsx`, the FAB owner
  - Verify: load the editor live; count floats on first paint
- [ ] **T7 (P1, human: ~3h / CC: ~25min)** — inspector — Rebuild the Color row. **Name the mechanism first**: which of swatch / value / opacity / eye / warning leaves the row, and where it goes (swatch popover, row overflow menu, hover-reveal). "Fit without collision" is satisfiable by shrinking type below the ramp and is not an acceptance criterion
  - Surfaced by: R6 — re-measure against the real 300px inspector first
  - Files: `inspector/sections/`
  - Verify: `getComputedStyle` — no overlap, no font-size below the chrome ramp; focus-visible on every control; hover-revealed actions also reveal on `:focus-within`
- [ ] **T8 (P2, human: ~4h / CC: ~30min)** — brand — Show the design system, under four written constraints: **swatch is the value, no card around it; token group is a label, never a hue; zero shadows; zero accent uses outside selection and focus**. Resolve R11's two save vocabularies against the topbar `SaveStatus` and state the contrast ratios
  - Surfaced by: R10, R11 — highest slop risk in the arc
  - Files: `design-system/ui/DesignSystemTab.tsx`
  - Verify: open Brand live; anti-slop checklist clean; `Apply Changes` contrast measured
- [ ] **T9 (P2, human: ~3h / CC: ~25min)** — media — Settle the four-way empty-state contradiction (DESIGN.md:321 vs wireframes §5.7 vs `EmptyState.tsx` vs shipped Media), then make Media's actions appear once. Hide zero-count chips
  - Surfaced by: R8, R9. **Do not add an illustration or a card** — bare centred text is the spec; the duplication is the defect
  - Files: `sidebar/tabs/media/MediaTab.tsx`, `chrome-ui/EmptyState.tsx`
  - Verify: empty library live shows one action group matching the settled spec
- [ ] **T10 (P2, human: ~2h / CC: ~15min)** — cascade guard — Extend `chrome-reset.test.ts`'s selector guard so every new chrome rule is checked against the canvas subtree
  - Surfaced by: `Canvas.tsx:674` mounts customer HTML inside `.bd-studio`
  - Files: `chrome-reset.css`, `__tests__/chrome-reset.test.ts`
  - Verify: plant a bare `.bd-studio *` rule; the gate fails
- [ ] **T11 (P2, human: ~2h / CC: ~15min)** — DESIGN.md — Reconcile the layout sections to wireframes §7, **keeping the supersede banner at `:232` and the drift notes verbatim**; fold in `§Accessibility:364-370`, whose rail shortcut map (`A/T/M/Z/P/⇧A/D/S/U/H`) documents the rail T2 deletes
  - Surfaced by: the design supply section. An earlier draft said "delete the Composition Map", which would have destroyed the guardrail and collapsed present-tense claims into deletion history — the exact thing `audit:rules` exists to separate. Port the Map's four surviving facts (which panels have a Footer zone, the mono meta line, Insert's 2-col 48px grid, Layers 28px rows) into the panel-zone grammar first
  - Files: `DESIGN.md`
  - Verify: the `:232` banner still stands and points at §7; no *present-tense* claim of 240px, 11 tabs, or the old shortcut map survives; shortcuts checked against the live `⌘K` registry
- [ ] **T12 (P2, human: ~1h / CC: ~10min)** — publish modal — Right padding on the value column; wrap or truncate with a title attribute. Land it as the first instance of the R15 overflow rule, not a one-off
  - Surfaced by: R12, R15
  - Files: `shell/modals/`
  - Verify: "your connected Vercel project" renders whole
- [ ] **T13 (P3, human: ~1h / CC: ~10min)** — review bar — Collapse the band at zero open comments
  - Surfaced by: R13
  - Files: `sidebar/tabs/review/ReviewTab.tsx`, shell header
  - Verify: 0-open state reclaims the band
- [ ] **T14 (P3, human: ~1h / CC: ~10min)** — inspector empty state — Wireframes §5.7 already picked the copy ("Select something on the canvas to edit it.", **no** action). Re-measure the column first — the token says 300px, the board read 210
  - Surfaced by: R14
  - Files: `inspector/`
  - Verify: `getComputedStyle` on the column; copy matches §5.7

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open | Premise gate answered by founder (full scope, option B); 24 findings from dual voices, 9 folded in |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | issues_open | `[subagent-only]` — Codex failed twice on remote-compaction 404 |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | 26 findings; 3 critical, all verified against code and folded in |
| DX Review | `/plan-devex-review` | Developer experience | 0 | skipped | No developer-facing scope — the product's users are site builders |

**CEO DUAL VOICES — CONSENSUS**

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| Premises valid? | NO | NO | **CONFIRMED** — both independently found the census/superseded-frame trap |
| Right problem to solve? | NO | NO | **CONFIRMED** — both argued a narrower shape; founder overrode, which is their call |
| Scope calibration correct? | NO | NO | DISAGREE with founder decision; decision stands |
| Alternatives explored? | NO | NO | **CONFIRMED** — board-walking `g4GzQ` and settling the rail IA were undismissed; both now in the plan |
| Competitive risks covered? | NO | NO | **CONFIRMED** — carried as inherited conditions |
| 6-month trajectory sound? | NO | NO | **CONFIRMED** — recorded, founder informed |

**DESIGN VOICE — 3 critical, all verified before folding in:** the
"nothing owns the z-layer" premise was false (ten `--bk-z-*` tokens ship, plus
a second contradicting contract in wireframes §5.9); this plan cited a
**superseded** DESIGN.md range as binding; and eight state families were
missing from a 366-board arc while the code already models four of them.

**CROSS-MODEL:** both CEO voices independently reached the superseded-frame
finding from different evidence (Codex via `inventory.json` drift notes, Claude
via `boards.json`). Three of my own board-derived findings were refuted by
code, and two more by the CURRENT frames — a 5-in-15 false-positive rate from
board reading, which is why Phase A re-measures every `eyeballed` number.

**VERDICT:** CEO + DESIGN CLEARED with findings folded in. Eng review ran
subagent-only (Codex infra failure) — a fresh `/plan-eng-review` before Phase
C is recommended, not required.

**UNRESOLVED DECISIONS:**
- Empty-state contract: four opinions (DESIGN.md:321, wireframes §5.7, `EmptyState.tsx`, shipped Media). Settled in Phase B, not yet settled.
- §5.9 vs `--bk-z-*`: which contract wins, and where the four missing float layers sit. Settled in Phase B (T4), not yet settled.
- Per-family cost: one family must be estimated end to end before committing to twelve.
- Whether the FAB survives at all (T6).
