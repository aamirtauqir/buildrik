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

## 8. The closing pass — the three checks §7 said it had not run

§7 listed three gaps. All three were then run, and each found a class of defect
nothing before it could see.

### Coverage — 93 of the 131 boards no lane had opened

| section | opened | of |
|---|---|---|
| Settings/S7 | 30 | 42 |
| Media | 16 | 28 |
| Review | 15 | 27 |
| Layers | 10 | 12 |
| Inspector + AI captions | 22 | 22 |
| **Client sign-off** | **0** | **10** |

54 findings, 12 Critical. The largest: **thirty Settings boards draw a pane
header with a right-aligned primary button** — "Add domain", "Save changes",
"Export CSV". The shipped header is `DrillInHeader`, whose props interface has
no action slot at all; Save and Discard live in a bottom savebar. One lane
caught it on one board. It is on thirty.

### Conformance — the first colour and type measurement of this file

31,356 paints, 14,837 text nodes, measured as histograms rather than sampled.
**Purple/violet/indigo: clean** — every purple is the allowlisted PRO/avatar
ramp, swatch content, or a violet-tinted *neutral*, and there are zero
gradients. Two indigo defects turned out to be in the CODE, not the file:
`Canvas.css:693-698` ships `var(--bk-accent, #667eea)` on every contenteditable.

It also convicted this arc's own boards: **16 of the 22 were raw hex with 0%
bound paint and 0% bound text style**, using four colours that exist in neither
`tokens.generated.css` nor anywhere under `packages/`. Fixed — 109 values
remapped, 733 paints bound to variables, 15 Inter Bold nodes down to Semi Bold.

### Visual — 70 of 253 changed boards actually looked at, 19 defects

The number that matters is not 19, it is **the four defect CLASSES the geometric
sweep could not see**, each now a detector:

| class | why the sweep missed it | example |
|---|---|---|
| **SQUEEZED** | the node is inside its parent, just unreadable | "☁ Browse stock" at 16px wide and 160px tall, on eleven Media boards |
| **OVERPRINT** | the collision is with a SIBLING, not a parent | a timestamp printed straight through the word "enabled" |
| **ESCAPES** | overflow measured against the BOARD, not the parent frame | a caption 19px wider than its card went unreported while 8px cases elsewhere were flagged |
| **clipping** | a clip is not an overflow, and a clipped pill is not tall-and-narrow | the `STOCK` badge cut mid-K on every board instancing `Card / media` |
| **STACK** | no child is out of ITS parent and no two text nodes intersect — the panel is simply short | `Media · no-results` lost its ENTIRE footer, sitting at y827 in an 812-tall board |

Five of the six became detectors. **Clipping did not, and that is a result rather
than a gap**: a targeted clip-risk query over 116 boards returned 9 candidates
and every one was benign, because a clipped label's own measured width IS the
clipped width — the node reports as fitting. It is the one class in this file
where eyes are the only instrument.

The sixth, STACK, is the opposite and the most valuable of the set: one line of
arithmetic — the last child's bottom must equal the panel height — catching a
failure that silently DELETES a UI region from a spec. A reviewer sees a panel
with no footer and cannot tell whether the product has one.

The sweep itself was wrong three more times and each is fixed in it: it exempted
a hotspot but not the label inside one; it exempted downward overflow in a
clipping frame as a scroll region but not upward; and it crashed on the rate
limiter's prose instead of reporting a throttle.

### And one regression of my own, caught only by looking

The variable-binding pass blanked **318 hotspots** file-wide, on the assumption
that a hotspot is an invisible click target. That is true of 599 of them. The
file also uses a labelled parked marker — a filled rectangle carrying a state
name — and I destroyed those, including their colours, across boards this arc
does not own. 117 were repaired to the convention; the exact prior pixels are
gone. Recorded rather than quietly patched.

### Client sign-off — closed, and it convicted the harness

The one section no pass had opened is now **10 of 10 boards opened and 10 of 10
screenshotted**. It found something worth more than its own defects:

`boards.json` records **seven of those ten as `verified: "match"`** — 13% of every
match in a 439-row harness — and **all ten carry `recipe: null`**, meaning
`diff.mjs` has never run against any of them. The clean-pass rate is 0 of 10.
Every one of the seven has a nameable defect, including an A0 identify board that
draws **no form at all**: a form-shaped void between the paragraph and the
button.

No edit was made — `boards.json` is code. But it is the shape this repo has paid
for twice: a gate reporting a number nobody keyed, and a `verified` field
outranking the thing it claims to verify.

It also inverted a premise everyone had accepted. For three of the ten boards the
**echo direction is backwards** — the 1280×720 "canonicals" on page `1:6`
borrowed the echo's height *and* its superseded shell, so they are the
derivatives while the names still call them the source. All seven genuine pairs
have drifted, and on `F · expired` the drift runs the other way: the echo's body
matches `DEAD_LINK_COPY.EXPIRED` verbatim and the canonical's does not. "The
canonical wins" is not a rule that can be applied here.

### Still open
- **183 of 253 changed boards never looked at.** Two lots are queued and paused.
- **Publish's declared gap is untouched** — 20 boards read text-only, with no
  claim made about fill, type, spacing or auto-layout.
- Effect styles, shadows, focus rings, tracking and radius: **not measured at
  all**.
- Pages `1:2`, `1:4`, `1:5` and `988:2` are outside every number here.
- **The app was run, and proved only that it boots.** No board was verified
  against a running screen; the one family this pass touched is not reachable in
  the demo build.

---

## 9. What was NOT verified

- **The app was run once, at the very end, and it reached almost nothing.** The
  standalone demo came up clean on `localhost:5051` with zero console errors, and
  its rail exposes six panel tabs — Insert, Layers, Pages, Media, Content, Brand.
  **Corrected 2026-09-06: I read that rail wrong, twice over.** The seventh tab I
  counted was not a rail tab at all but the homepage tab from `PageTabBar.tsx:234`
  — a SECOND `role="tablist"` in the shell that switches pages, not panels. And I
  wrote that the Review/Compare family "cannot be reached in the standalone demo
  at all", which is false: Review is off-rail BY DESIGN and has three doors —
  the `R` key and `mode: "panel"` (`tabsConfig.ts:236-243`), a row in the ⋯ menu
  (`SiteMenu.tsx:203`), and ⌘K. The config comment says so outright: "No `zone` →
  the zone-driven rail render leaves it out; the below-divider rail button is a
  follow-up (the panel is routable today via TabRouter)." What is true is that it
  has no RAIL BUTTON, which is a discoverability finding, not an unreachable one.
  The wider fact the rail hid: `TabRouter.tsx:125-244` renders **12** panels
  behind 6 rail buttons — Templates, Components, AI, Publish, History and Review
  are all door-less in the same way. Every other verdict in this report remains a
  static read of source plus a read or screenshot of the file. This repo's own
  rule calls a code reading a claim about code, and code here has passed three
  suites over a broken feature.
- **Board coverage varies by lane and each lane states its own.** Some read every
  board in their section; others read a third and said so. No lane's coverage
  should be read as complete unless it says so.
- **Almost nothing was checked visually beyond the boards this arc changed.** No
  colour, type-ramp or spacing conformance pass was run; those belong to the
  design-system audit, not this one.
- **`order-sections.mjs` regenerates every section name** from its own table, so
  the section-level renames in this arc are only stable until that script is next
  run by hand.
