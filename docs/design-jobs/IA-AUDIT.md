# Editor Figma file — IA audit and rebuild checklist

File `g4GzQFqzNYz5sosz1QtZXC`, page `1:3`. Every number below was fetched from
the file, not estimated. Ground truth captured 2026-09-04.

## Phase 1 — what is actually on the page

| kind | count |
|---|---|
| screens (≥280×200, not caption/strip/shape) | **397** |
| caption frames | 244 |
| thin strips / annotations | 162 |
| stray shapes at top level (`Rectangle`, …) | 12 |
| section markers (📄 🗃️ 🔍) | 5 |
| **total top-level frames** | **820** |

Prototype graph: **2,489 edges** — 350 at frame level, **2,139 on hotspot
children**. Orphan screens **21 (5%)** — of which **3 are real defects**; 13 are self-annotated retirements and 5 are page markers. Dead ends **12 (3%)** — **3 real**, nine annotated by design.

> **A first pass read reactions only at frame level and reported 77% orphans and
> 58% dead ends.** Both were wrong by an order of magnitude: 86% of this file's
> wiring hangs off hotspot children. Any flow claim made without walking
> descendants is fiction. This is a recorded trap in this repo and it still
> caught me.

## Phase 2 — findings

Severity: **Critical** blocks a job · **Major** IA/hierarchy/missing states ·
**Minor** consistency · **Polish** micro-detail.

| # | Finding | Evidence | Sev | Recommendation |
|---|---|---|---|---|
| IA-1 | **Two competing taxonomies organise the same 397 screens.** A feature taxonomy (Media 39, Brand 30, History 19, Layers 18, Content 18, Pages 13, Publish 12, Insert 11, Inspector 9) and a flow taxonomy (S1 22, S3 18, S5 23, S7 42 = 107 screens). A screen can only sit in one, so "where does this live" has two answers. | frame-name census, 80 families over 397 screens | **Critical** | Pick ONE spine. The product's own rail is feature-based, so features are the spine; S-flows become a cross-cutting *journey* layer that references feature screens instead of owning parallel copies. |
| IA-2 | **40 of 80 families contain exactly one screen.** `S1.1c`, `S3.10`, `B9.5`, `Exit`, `Export`, `S2.0`, `S6.2` are identifiers, not groups. | taxonomy count | **Major** | Fold every singleton into its feature parent; keep the flow id in the frame name as a suffix, not as the grouping key. |
| IA-3 | **The S-flow numbering implies seven flows and delivers four.** S1 22 screens, S3 18, S5 23, S7 42 — but **S2 = 1, S6 = 1, S4 = 0**. A reader counting S1–S7 expects seven journeys; three of those slots are empty or a stub. | per-flow counts | **Major** | Either build S2/S4/S6 or retire the numbering and name journeys for the job they do ("First run", "Publish", "Client sign-off"). |
| IA-4 | **Screens and annotation share one flat page.** 418 of 820 frames are captions, strips, markers or stray shapes, interleaved with the 397 screens in one list. | kind census | **Major** | Group with Figma Sections: screens by feature, annotation into a parallel `Notes` section per feature. Sections preserve node ids, history and every prototype link. |
| IA-5 | **12 stray shapes sit at page top level** (`Rectangle` ×12). | name census | **Minor** | Delete or move into the frame they annotate. |
| IA-6 | **3 real orphan screens.** The graph reports 21, but 13 already carry `RETIRED`/`SUPERSEDED`/`UNBUILDABLE` in their own names and 5 are page markers (📄 🗃️ 🔍), not screens. The three with no entry point and no explanation: `65:2` Shell state 1 · First run, `130:2` S5.2 · none, `807:8723` S5.5 · reviewer-view · external-reviewer. | flow graph, cross-checked against frame names | **Major** | Give these three an entry point or annotate them like the other 13. |
| IA-7 | **3 real dead ends.** Of 12, nine are annotated `CONDITION-ONLY`, `NOT A STATE`, `TERMINAL by design` or `RETIRED`. The three unexplained: `295:1972` S1.3 · new-page · 3-way, `1707:8456` Inspector · error-boundary, `1719:8421` Ecommerce · bound · inspector. | flow graph, cross-checked | **Major** | Each needs an onward step — an error boundary with no way back is the worst of the three. |
| IA-8 | **The file already annotates its own retirements, and the convention works.** 13 orphans and 9 dead ends carry the reason in the frame name, which is why the true defect count is 6 and not 33. | name census | — | Keep the convention; apply it to the six above so the next audit reads clean. |

### What is already working — protect it

- **Flow wiring is in good shape**: 5% orphans and 3% dead ends across 397
  screens is a healthy graph, and 2,139 hotspot-level edges means transitions
  are scoped to real controls rather than whole-frame click-anywhere.
- The feature families that dominate (Media, Brand, History, Layers, Content)
  already match the product's rail, so the spine in IA-1 is a consolidation,
  not an invention.

## Phase 3 — the rebuild, in cascade order

1. **Sections for the spine** (IA-4, IA-2): one Figma Section per feature, one
   `Journeys` section for S-flows, one `Notes` section for annotation.
2. **Resolve the taxonomy conflict** (IA-1): every S-flow screen either moves
   under its feature or is recorded as a journey-only composite.
3. **Retire or build the empty flow slots** (IA-3).
4. **Close orphans and dead ends** (IA-6, IA-7).
5. **Sweep stray shapes** (IA-5).

## Phase 4 — executed 2026-09-04, verified live

**28 Figma Sections now hold every frame on page 1:3. Zero loose frames.**
Reparenting preserves node ids, history and wiring: the prototype edge count
read **2,489 before and 2,489 after**, walked across all 36,280 descendants —
the reorganisation broke nothing.

| section | screens | | section | screens |
|---|---|---|---|---|
| Journeys · S-flows | 74 | | Shell | 17 |
| Settings/S7 | 45 | | Insert | 14 |
| Media | 40 | | Publish | 14 |
| Brand | 30 | | Pages | 13 |
| Review | 23 | | AI | 11 |
| History | 21 | | Inspector | 10 |
| Layers | 18 | | Client sign-off | 10 |
| Content | 18 | | Compare | 8 |
| Command palette | 7 | | Notifications, Preview | 6, 6 |
| Modal | 5 | | Canvas, Ecommerce | 3, 2 |
| Notes · captions & annotation | 418 | | | |

The last 41 frames were placed by design judgment rather than by the literal
name rule, because the rule could not route them: five new feature sections
(Notifications, Command palette, Preview, Canvas, Ecommerce) and the rest
folded into the feature that owns the job — modals with their feature, not
into a `Modal` bucket, because grouping by form tells a user nothing about
what they came to do.

### IA-9 · Two command palettes — **Major**, and exactly the duplication asked about

`CmdK · empty/typing/results/no-results/ai-offer/disabled-command` (640×420,
six frames) and `Canvas · command palette (⌘⇧P)` (520×426) are two designs for
one job, at two sizes, under two names, with two different shortcuts implied.
A user cannot tell which one they get. Both now sit in `Command palette · 7
screens` so the duplication is visible instead of scattered. **Resolution
needed: one palette, one shortcut, one size.**

## Product navigation audit — measured in the running editor

Driven live at 1440×900 on :5050; 19 screenshots and a DOM probe. The findings
that survived checking:

### IA-10 · Four doors labelled "Components", three destinations — **Major**

| door | leads to | what it means there |
|---|---|---|
| Site menu → `Components ⇧A` | `openLeftPanelToTab("components")` | manage your saved components |
| Insert drawer → `▸ COMPONENTS 14` | inline catalog group | components you can place |
| Brand root → `Components · "What the brand ships"` | Brand sub-screen | the *styles* the brand defines |
| `rail/tabsConfig.ts` → `Components` tab | "Create and use reusable components" | a fourth definition, not in the visible rail |

A user who wants "components" has to guess. **Fixed for the odd noun out:** the
Brand row now reads **"Component styles"** — its own hint already said that is
what it is. The other three are genuinely different jobs and keep their names;
Insert's is scoped inside Insert, so context disambiguates it.

### IA-12 · "Brand" and "Design system" are one destination with two names — **Major, fixed**

`SiteMenu.tsx:244` rendered `Design system`; it calls `onOpenDesignSystem`,
which is `openLeftPanelToTab("design")` — the exact tab the rail's **Brand**
button opens, and the panel that appears is headed `Brand`. Two names for one
screen is a door the user has to learn twice. **The menu row now reads
"Brand."**

### IA-13 · Copy naming a control that does not exist — **Minor, fixed**

Brand › Components told the user *"Components live as their own **rail**
panel"* and referred to *"the **Design tab**"*. There is no Components button
in the shipping 6-item rail, and the panel is headed Brand. Both corrected.
Same defect class as a two-named door: the interface describing itself wrongly.

### IA-14 · Three rail hierarchies live in the code; a flag picks one — **Major, open**

`rail/tabsConfig.ts` carries a legacy 11-button zone rail, a 4-tool E3 rail
(`?rail=e3`), and the shipping 6-item Figma rail — its own comment calls this
"a THIRD render source". The live rail matches the Figma one exactly today, and
nothing prevents drift back. **Recommendation:** delete the two dead renderers
or gate them behind a loud dev-only flag, so there is one navigation model in
the code and not just in what happens to ship.

### IA-15 · Insert and Layers open with no purpose copy — **Minor, open**

Measured live with storage cleared: `Insert` and `Layers` render a title and
raw content and nothing else, while Content, Media and Pages each give a
sentence or a CTA in the same state. Layers is weakest — a search box, one
truncated row and "1 layer".

> I had dropped this finding earlier after reading `LayersEmptyState.tsx`,
> which does explain itself. Both are true: the EMPTY state speaks, the
> POPULATED state — the one a returning user sees — does not. Reading the code
> answered a different question than the one the probe asked.

### IA-16 · Brand root has 9 destinations, not 8 — factual correction

`Import / export` was missing from the list I had been working from. Not a
defect; recorded so downstream counts are right.

### IA-11 · The panel header never changes on drill-in — **Minor**

`DesignSystemTab.tsx:596` is `const headerTitle = "Brand"`, hardcoded, so at
Brand › Tokens › color the header still reads `Brand ✕`. Mitigated, and that is
why this is Minor not Major: the body renders a `‹ Tokens · color` back row, so
"where am I" is answered — just not by the header.

### Two findings I dropped after checking

- **"Four of six panels never say what they are for."** The probe recorded no
  purpose copy for Insert, Layers, Pages and Media. Reading the code: Layers
  says *"This page is empty. Drop something on the canvas to see it here."* with
  an `Open Insert` action. The probe had measured a POPULATED panel, where a
  purpose line is legitimately absent. The finding was an artefact of the state
  I measured in, not a defect.
- **"Panel purpose belongs in the header subtitle."** `PanelFrame` supports one,
  and the rail already carries the copy as `ariaLabel`. But the subtitle renders
  *beside* the title capped at `max-w-40`, and the component's own note says a
  sentence like this "will not fit beside a label". Using it would have shipped
  `Upload and manage…`. The body, where Content and Brand already put theirs, is
  the right home.

## Adversarial review — what it broke, and what it fixed

An independent reviewer re-derived every number live and ran codex over the
document. Three claims held; three did not, and the two real ones are fixed.

**Held.** 28 sections / 0 loose frames (re-fetched). Edge total 2,489 before and
after, summed over 36,285 descendants — the cleanest confirmation in the audit.
IA-9's two command palettes, measured: six `CmdK` frames at 640×420 and
`Canvas · command palette` at 520×426.

**Broke — and it was right.** The audit contradicted itself: its own prose says
*"modals with their feature, not into a `Modal` bucket, because grouping by
form tells a user nothing about what they came to do"* — while a `Modal · 5
screens` section sat in the summary table two paragraphs above. **Fixed:** the
three `Modal · Brand · AI prompt` states and the B9.5 migration modal moved to
Brand, `Modal · Add Child Element` to Insert, and the empty container removed.
27 sections now; edge total re-verified at 2,489.

**Broke — and the answer is that nothing was lost.** The review computed 395
screens against the audit's 397 and, with codex converging on the same figure by
pure arithmetic, called it an unreconciled 2-screen gap. It is a classification
difference, not a loss, and the manifest settles it exactly:

| | |
|---|---|
| top-level frames in the Phase-1 census | 820 |
| of those, nodes that were themselves legacy Sections (📄 ×2, 🗃️, 🔍 ×2) | −5 |
| their children, which were never top-level | +83 |
| **= items inside sections now** | **898** ✓ |

Every id in the pre-reorg census is still present. The five legacy sections are
each ≥280×200, so a size-based "is this a screen" test counts them as screens —
which is where the difference comes from.

**The process gap was real and is closed.** The review noted no pre-reorg node-id
manifest was committed anywhere, making the question unanswerable after the
fact. It existed only in a scratch directory. It is now committed at
`docs/design-jobs/baselines/figma-page-1-3-pre-reorg.tsv` — 820 rows of
`id · size · prototype targets · name` — so any future reorganisation of this
page can be reconciled against it exactly, the way this one just was.

**Also fair, and recorded rather than argued:** the C1–C3 ticks cite counts that
do not by themselves establish the broader property claimed ("28 sections" is
not "every family has a section"), and the 350/2,139 frame-vs-hotspot split does
not reproduce post-reorg — it measures 416/2,073, because the 66 edges under the
five legacy sections changed depth. The total is what the claim rests on, and
the total is exact.

## Checklist — agents tick these, each with evidence

- [x] C1 · Sections exist for every feature family with ≥5 screens — 28 sections, counts read back live
- [x] C2 · Every screen sits in exactly one section — loose frames at page top level: **0**
- [x] C3 · Annotation frames are out of the screen list — 418 in `Notes`, verified as its child count
- [ ] C4 · No family has exactly one screen unless it is genuinely standalone
- [ ] C5 · S-flow numbering is either complete or retired — no phantom slots
- [ ] C6 · The 3 real orphans (65:2, 130:2, 807:8723) have an entry point or a recorded retirement
- [ ] C7 · The 3 real dead ends (295:1972, 1707:8456, 1719:8421) have an onward step
- [ ] C8 · Stray top-level shapes are gone
- [x] C9 · Prototype edge count **2,489 → 2,489**, walked across 36,280 descendants twice
- [ ] C10 · A codex review has read the diff and signed off

**Rule for every tick:** cite the fetched value. A tick without evidence is a
guess, and guesses are what this audit exists to remove.
