# Figma-truth pass — making the board say what the product does

**The direction is reversed from every earlier wave in this repo.** Those built
CODE to match the BOARD. This one is the opposite, on the founder's rule:

> FIGMA = EDITABLE DESIGN SOURCE. CODEBASE = READ-ONLY FUNCTIONALITY REFERENCE.

Nothing under `packages/`, `server/`, `lib/` or `prisma/` was touched. The only
code written is Figma tooling under `scripts/figma/`, which is how every fix in
this arc has been executed since it began.

---

## 1. What was reviewed

**Sixteen read-only lanes, one per module, then four compiler lanes and three
independent QA lanes.** Every finding carries a `file:line`; a claim without one
was rejected by the brief.

| | |
|---|---|
| findings | **513** across 16 lane files |
| modules covered | **27** |
| severity | 87 Critical · 237 Major · 189 Minor |
| by action | fix-board 220 · none 143 · add-state 80 · mark-unimplemented 38 · create-board 22 · wire-edge 10 |

`none` is not filler. 143 rows record a board that was checked and found correct,
because coverage that is not written down gets re-audited by the next pass.

Every section of page `1:3` was walked: **29 sections, 905 boards at the start.**

---

## 2. What changed in the file

| | |
|---|---|
| strings rewritten | **295** |
| nodes renamed | **123** |
| new boards | **11** |
| new prototype edges / hotspots | **16** |
| sections re-laid | all touched, `overlaps=0` every time |

Every write was **read back from the file** before being reported. This
toolchain has reported success on a dead POST and failure on four writes that
landed, so a write is not evidence of itself.

### The marker vocabulary — one concept, one spelling

The file carried **four** spellings for what turned out to be **three** different
claims. Collapsed:

| marker | means | count |
|---|---|---|
| `[not-implemented]` (prefix) | the code has no producer; it could be built | 56 |
| `[not-implemented]` (inline) | only PART of that board is unbuilt | 9 |
| `[unreachable]` | the product cannot produce this state by construction | 4 |
| `RETIRED` | superseded by another board | 23 |
| `superseded` | the Archive section's own naming | 29 |

**Nothing was deleted.** Deleting a drawing because it was never built destroys
the design on the grounds that it is not yet real — a call already made and
recorded in this arc (`SH-CO-01`). Every marked board keeps its design and gains
a reason with a `file:line`.

Only four boards earned `[unreachable]`, and the distinction is real:
`Layers · empty` cannot happen because `buildLayersFromEngine` always emits a
root row, whereas `Layers · list-view` simply was never built. Collapsing those
two into one word would have lost the difference that decides whether anyone
should build it.

### The eleven boards that were missing

Screens the product HAS and the file did not draw:

| board | why it mattered |
|---|---|
| `Content · dynamic-pages` + 3 states | `DynamicPagesView` is built and reachable, renders six bodies, and carries the module's two most consequential warnings. The Content section had 33 boards and not this one. |
| `Inspector · INTERACTIONS · list / add-trigger / edit` | The only place interactions can be authored. All 14 triggers fire on a published page. Every profile board drew INTERACTIONS as a collapsed `>` and nothing opened it. |
| `Pages · structure` | `view` is a THREE-way state; the third renders a route tree and is the only place page hierarchy appears at all. |
| `Media · local-only assets` | `localOnly` decides whether a placed image will publish, and the drawer where assets are picked showed nothing per asset. |
| `Preview · what the sandbox drops` | Section 14 drew seven preview features that do not exist and zero of the preview that ships. |
| `Module Interaction Map` | See §3. |

Five of the eleven were orphans — drawn and reachable from nothing. All eleven
now have inbound edges, measured rather than assumed.

---

## 3. The Module Interaction Map

Board `2357:11981`, in the Reference section, draws the chain the founder named:

```
Collections → Schema/Fields → Content → Dynamic Page → Data Binding
→ Preview → SEO → Publish
```

hop by hop, with the verdict the CODE gives for each. **Four of the eight hops
do not exist.** The page carried 33 Content boards and 20 Publish boards and,
until this arc, nothing anywhere that said the road between them is out — so a
designer reading it would have priced the CMS as shipped.

The sharpest hops:

- **Content → Dynamic Page.** A grep for `dynamicPages` across
  `packages/editor/src` returns **zero** hits. The Pages panel has no CMS
  reference of any kind.
- **Dynamic Page → Data Binding.** `bindCollection` / `unbindCollection` have no
  caller outside their own unit test. `RepeaterRenderer` — 288 lines that expand
  one clone per record — is constructed nowhere. No element can ever repeat.
- **SEO → Publish.** A collection contributes ZERO pages unless
  `pageTemplatePath` matches an exported page path exactly, and the only field
  that sets it is free text whose placeholder shows a format the exporter cannot
  produce. `runPrePublishChecks` has six checks and not one is about CMS.

Every hop carries `verified` (re-run by the coordinator) or `audited`
(inherited from the module pass). That distinction is on the board because two
claims changed under checking — see §5.

---

## 4. Cross-module facts, measured

**The composer event bus**, across 891 source files: 304 events declared, 222
named anywhere, **82 declared and never named**, **125 emitted with no listener**.
Six engine modules exchange nothing across module lines.

**The prototype**, all 3,200 edges on page `1:3` resolved to
`source section → destination section`:

- `06 · Content` has 109 inbound edges and **four** outbound, none of them
  reaching Pages, Publish, Preview or Inspector. The founder's chain is not
  walkable in the file either.
- `19 · Client sign-off` is terminal — and **correctly so**. See §5.
- `27 · Archive` has zero inbound edges. Nothing live navigates into it.
- Media's 54 outbound edges decompose to **45 from one shared chrome component**
  instanced on five fullpage boards, 7 documentation cross-links, and **2 real
  product edges**. Media's true product graph is 1 in, 2 out.

---

## 5. Things this pass got wrong, and how

Recorded rather than quietly corrected, because a pass that only reports its
successes is not an audit.

| claim | what happened |
|---|---|
| "Client sign-off is terminal — the most concrete defect in its family" | **Wrong, and the boards said so in their own names.** All ten end "echo of 1:6 (canonical); kept because Figma rejects cross-page NAVIGATE", and one says "TERMINAL by design". Corrected to the lane before it could act. |
| "The Archive's 83 outbound edges are boards still wired into the live file" | **Harmless.** Archive has zero INBOUND edges. |
| "A publish emits no sitemap" — and it was on the map board for one build | **Refuted.** `buildDeployFiles` emits `sitemap.xml` server-side. The true claim is smaller: the ZIP and single-file EXPORTS go without. |
| "ProjectData has no bindings field" | **Stale.** The working tree declares `cmsBindings` and `Composer` writes it. Read the tree, not HEAD. |
| "16 `AI_*` events are declared and never named" | **13**, not 16. |
| `findAllWithCriteria` warning broadcast to twelve lanes | **Over-broad.** The failure is PAGE-scoped; node-scoped calls are fine. One lane proved it with a three-instrument diff rather than accepting it. |
| A marker census reporting zero `[unreachable]` | **The census's own key list omitted the word.** Three had been applied that morning. |

Three defects were introduced by this arc's own writes and caught only by
looking at the render: a doc board whose paragraphs overlapped every heading, a
route tree stacked at the bottom of its panel by an auto-layout, and a view link
drawn on top of its neighbour. **None of them appeared in any tool result.**

---

## 7. QA — three independent lanes, and what they overturned

Every module was reviewed by an agent that did not audit it, per the founder's
rule. They read 119 marked nodes, 295 rewritten strings and 22 new boards.

| | |
|---|---|
| confirmed | **75** |
| wrong | **54** |
| regressed | **12** |
| verdict rows filed | 146 across `QA-A/B/C.jsonl` |

Everything actionable they found is fixed. The three that matter most were all
mine:

**The map board asserted something false, on my own bad grep.** Hop 3 said "the
link does not exist in the editor at all — a grep for `dynamicPages` returns
ZERO hits", marked `verified`. The codebase spells it `dynamic-pages`. The
screen is fully wired, **and this same arc built four boards for it** — the
board was refuting its own file. I had broadcast "a null result is your
instrument until proven otherwise" to twelve agents and then failed to apply it.

**Four boards drew a control that does not exist** — a TEMPLATE PAGE picker on
the dynamic-pages screen. `ContentViews.tsx:630` says outright "Nothing in this
panel sets it". Inventing an affordance is the precise defect this arc exists to
remove.

**Eleven boards were marked not-implemented and are shipping**, including one
whose marker *masked a real bug*: the deploy pipeline is built, and the reason it
looks dead is that the worker emits `"active"` while `PublishTab.tsx:239` looks
for `"running"`. A wrong "not implemented" costs more than a missing one — three
Insert boards marked `RETIRED (no producer)` are built, unit-tested components
with zero mounts, and RETIRED tells a builder to delete finished work.

QA also caught a Critical regression that no automated check could see: a
rewritten restore-confirm body grew from two lines to four inside a clipping
frame and rendered **through** its Cancel and Restore buttons. The section scan
said `overlaps=0` because it measures top-level boards — exactly as the QA brief
predicted.

### Acceptance, measured against the file

```
sections             29
boards              927
section-count drift  none
top-level overlaps   0
markers              [not-implemented] 66 · [unreachable] 3 · RETIRED 21
old marker spellings 0
new boards reachable 22 of 22, zero orphans
```

### What QA could not check

- **5 of 119 marked nodes were screenshotted.** A rendering defect could exist on
  any of the other 114.
- The 23 `SUPERSEDED` nodes' successor targets were never opened.
- No colour, type-ramp or token conformance was checked on any board.
- **The app was never run**, so no verdict here is a live observation.

---

## 8. What was NOT verified

- **The app was never run.** Every verdict is a static read of source plus a
  read or screenshot of the file. This repo's own rule calls a code reading a
  claim about code, and code here has passed three suites over a broken feature.
- **Board coverage varies by lane and each lane states its own.** Some read every
  board in their section; others read a third and said so. No lane's coverage
  should be read as complete unless it says so.
- **Almost nothing was checked visually beyond the boards this arc changed.** No
  colour, type-ramp or spacing conformance pass was run; those belong to the
  design-system audit, not this one.
- **`order-sections.mjs` regenerates every section name** from its own table, so
  the section-level renames in this arc are only stable until that script is next
  run by hand.
