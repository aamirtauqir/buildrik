# V2 → V1 · module **brand** (+ Templates, Components, Ecommerce)

**Agent slice:** `docs/design-jobs/V2-TO-V1/slices/brand.json` — 7 UX findings + 1 module summary
**V1 sections owned:** `1776:8373` 07 · Brand (51) · `1084:4527` 11 · Templates (18) · `1938:8372` 10 · Components (12) · `1779:6` 22 · Ecommerce (5)
**Date:** 2026-09-07

---

## Headline

**I wrote nothing to Figma. Zero boards changed.** The coordinator issued a hard
stop mid-run: the Figma MCP seat quota is exhausted account-wide (fifteen agents
on one Full seat), it is a seat cap and not a rate limit, and read-only calls
cost the same as writes. Everything below is either a measurement I actually took
before the stop, or a resolved plan.

**I took exactly one successful full read of page `1:3`, at 2026-09-07T05:07Z**,
covering all four of my sections. Every number in the "measured" column comes from
that read. Nothing in it is inferred from a lane row. The two follow-up reads
(board copy, and the page-wide off-token counters) both died on the quota and are
reported as `UNMEASURED`, not as zero.

### The two counts I was asked for

| | before | after |
|---|---|---|
| `#1A264D`, **my four sections** | **0 — measured** | 0 (nothing written) |
| `#1A264D`, **page 1:3 whole** | **UNMEASURED** | UNMEASURED |
| weight > 600, **my four sections** | **1 — measured** (`813:4498`, and probably canvas content, see below) | 1 (nothing written) |
| weight > 600, **page 1:3 whole** | **UNMEASURED** | UNMEASURED |

The measured zero is worth stating carefully. **CONF-1-01 names two boards that
live in my section `1938:8372`** — `2476:12064` (2 paints) and `2476:12081`
(1 paint). My census walked both (their TEXT counts came back 11 and 6, and it
found `#000000` and `#6B7380` paints on their siblings, so the walk was working)
and found **no `#1A264D` on either**. Either the drain already ran between the
CONF-1 measurement and 05:07, or CONF-1-01's per-board attribution for those two
is off. I have resolved the whole CONF-1-01 node list anyway, in
`plans/brand-03-conformance.json`, including the 11 boards outside my sections,
for whoever owns them.

The single >600 node is `813:4498` on `S1.1e · template-preview (modal)`:
Inter **Bold** 32/AUTO reading *"Build something amazing"*. That is a marketing
headline inside a template preview — almost certainly customer SITE content, which
TYPE-COLOR-SYSTEM rule 3 exempts (13 of the 575 sit under a canvas/preview
ancestor). My census did not capture the ancestor chain, so **I am not counting it
as chrome debt and I am not draining it on the strength of the weight alone.**
The plan says: classify first.

---

## Plans produced

| file | what it applies | rows |
|---|---|---|
| `plans/brand-00-census-raw.json` | the RAW 05:07 read, kept in the repo because the scratchpad is session-local and this is the only measurement of these four sections anyone took | 86 boards |
| `plans/brand-00-measured-baseline.json` | the same read, distilled — per-section totals and every off-token / sub-11px / >600-weight node id | 86 boards |
| `plans/brand-01-text.json` | directly applyable `apply-text-fixes.mjs` plan | 8 rows, all with `expect` |
| `plans/brand-02-text-unresolved.json` | the same work where the TEXT node id was never read — selector rows, marked `unresolved-id` | 6 rows |
| `plans/brand-03-conformance.json` | repaint · promote · weight · `#1A264D` · text-style binding | 2 + 39 + 1 + 13 boards |
| `plans/brand-04-boards.json` | 4 new boards (`add-state-board.mjs`), 5 board edits, 4 hotspots | 13 |
| `plans/brand-05-arrangement.json` | the 18 ARRANGE rows | 4 re-flows + 3 explicit moves |
| `plans/brand-06-vis-defects.json` | VIS-1-22 · VIS-2-13 · VIS-3-30 | 3 + 4 cached |
| `plans/brand-07-ecommerce.json` | QA-B-13 + the five-board truth check | 5 code claims re-verified |
| `plans/brand-08-templates-components.json` | the two unowned sections | 2 new findings + 8 carried |

New tooling: **`scripts/figma/drain-offtoken.mjs`** — plan-driven repaint + bind +
sub-11px promotion with a board-edge overflow guard and a read-back on every row.
Written because none of the eight existing scripts fits (`fix-accent-near-miss`
hardcodes three nodes, `fix-label-tracking` discovers its own, `bind-master-type-styles`
is masters-only by design). It carries the three rules those three files paid for:
a swatch is never token-bound, `setBoundVariableForPaint` returns a new paint, and
a 10→11px promotion widens the box. `node --check` clean, `lint-sandbox-scripts.mjs`
clean. **Never run** — no quota.

---

## Findings

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-H-26** (Critical) | Don't pre-answer the conflict question with the destructive option. Default to nothing; disable Apply until the user chooses. | `153:120` Brand · import-export → **new board N1** `Brand · import · resolve conflicts (per-token)` | Board designed in full: neither chip selected, help line "…nothing is applied until you choose.", primary `Apply` **disabled**, and once chosen it names the outcome ("Apply — 40 new, 12 replaced") instead of `Apply 12 valid only`. `add-state-board.mjs 153:120 … --at 1700,1316` (free slot, measured). | none — no write made | **BLOCKED-ON-QUOTA** |
| **UX-H-27** (Major) | Show collisions as rows — token, your value, their value — with per-row keep/take; the whole-file chips become bulk shortcuts over that list. | same new board **N1** | 5-row per-token list specified with columns and sample data, `+ 7 more` overflow row, bulk chips redrawn as shortcuts *over* the list. `diffTokens` already computes `parsed.diff.modified` (ImportCard.tsx:26, :180, :239) — the data exists and is never shown. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-28** (Major) | Advertise only what parses; refuse a Tailwind config at the moment of drop, not after a failed parse. | `306:2261`, `306:2294`, `306:2327` (resolved) · `153:120`'s own copy (`unresolved-id`) · **new board N2** `Brand · import · unsupported format (refused at drop)` | 3 resolved `apply-text-fixes` rows with `expect` ("Drop .json" → "Drop tokens.json — JSON only"); 1 selector row for `153:120`; N2 specced with the refusal block ("Tailwind configs aren't supported yet…"), toned warning not error, timed at drop. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-29** (Minor) | Carry per-token rejections into the summary so "Valid 40" can sit beside a truthful "Errors 3 — heading-xl, radius-pill, shadow-soft". | `153:120` detail block (`unresolved-id` — the VALUE node beside the "Errors" key) + N1 | Selector row written, with the shape stated as the contract and the sample named as sample. `ingestRaw` clears parsed state on any error and builds `ParsedState` with a literal `errors: []` (:183), so the row at :346-354 can only ever read 0. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-30** (Major) | Separate looking from committing: select previews, an explicit "Apply <name>" commits, and name what a starter overwrites before it does. | `152:137` Brand · starters · `306:2186` starters · applied · caption `155:60` · **new board N4** `Brand · starters · confirm apply` | 3 resolved text rows (`152:145`, `306:2191`, `155:60`, each with `expect`); E3/E3b add a 48h footer bar with `Apply Linear Dark` + `Cancel` and a selected-card ring — **new nodes**, since `StartersSection.tsx:8-12` states outright that no Apply button exists on either board; N4 draws the confirm naming 34 tokens and 6 staged edits. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-31** (Major) | Replace `window.prompt` with an in-app rename that validates against the existing ids and says how many elements will be re-pointed. | `152:83` Brand · token-detail · caption `155:58` · **new board N3** `Modal · Brand · rename token ID` | N3 specced from `1172:4840` (520x239, the right Brand-modal size class): field, rules line, duplicate-id error, "34 elements are bound to this token and will be re-pointed", and the kind guard FIG-F-09 forces — rename is a silent no-op for type and spacing, so the modal must draw that rather than repeat the prompt's lie in a nicer box. 1 resolved caption row. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-32** (Major) | Preview the brand on something — a specimen answers every token kind at once; a swatch row cannot. | `1333:7162` Brand · root (CURRENT, measured 280x812 / 47 TEXT / **0 bound**) · `154:132` root · Beginner mode · caption `155:56` | E5/E5b specced: keep the 10 swatches and 2 specimens, add a ~104px specimen block — a card at the brand's radius/border/shadow/spacing holding heading, body, a primary button in the brand accent, and a ghost button — plus an 11px caption. 1 resolved caption row with `expect`. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-35** (module summary) | Put a what-will-change step in front of every whole-brand write — starter, import, AI. | starters → N4 · import → N1 · AI → `1706:8483` | Two of the three doors are designed above. **The third already has the right shape**: FIG-F-32 read all four AI-prompt boards and found the success board correctly draws a schema *preview* and *no* Accept button, because the modal's `onAccept` is optional and its only mount omits it — which is the propose → diff → apply → single-undo contract V2 §5 calls "the one contract worth keeping". The remaining AI gap is the `FEATURE_DS_AI` flag (`useComposerInit.ts:132` gates the client, `DesignSystemTab.tsx:890` does not gate the button), and that is the AI lane's, not mine. | FIG-F-32's read, not mine | **BLOCKED-ON-QUOTA** (2 of 3) |
| **QA-B-13** (Major) | Rewrite the Ecommerce section name: the cart and Stripe runtimes exist and export inert; orders have no model at all. | `1779:6` section name | **None needed.** | **READ BACK 05:07Z, verbatim:** "22 · Ecommerce · 5 — [not-implemented] ORDERS only. Narrower than first written: the cart and Stripe checkout runtimes exist and are wired into export (StripeInjector.ts via ExportEngine.ts:40), and are inert only because no screen writes config.stripe. What genuinely does not exist is any order, fulfilment or customer model." I then re-derived all four of its claims from source (see below). All four TRUE. | **ALREADY-CORRECT** |
| **CONF-1-01** (Critical) | Repaint all 51 `#1A264D` to `#111827` and bind `color/ink`. | in my sections: `2476:12064`, `2476:12081`. Outside: 11 boards + J1. | Measured. Full node list resolved for the other owners in `brand-03-conformance.json`. | **0 `#1A264D` paints across all 86 boards of my four sections, measured 05:07** — including on both boards CONF-1-01 names. | **ALREADY-CORRECT in my sections** (with the caveat above) · out-of-scope rows **RESOLVED, NOT APPLIED** |
| **CONF-1-02** (Critical) | Drain `#333340` (25 new violet-tinted neutrals). | — | Measured. | **0 in my four sections** | **NOT-APPLICABLE** |
| **CONF-1-03** (Major) | Drain `#FAFCFF`, the arc's blue-tinted default board ground. | — | Measured. | **0 in my four sections** | **NOT-APPLICABLE** |
| **CONF-1-07** (Major) | Pure `#000000` is painted 26 times on page 1:3 — the NO BLACK rule. | 37 nodes across my sections | Measured, then classified. | **All 37 are prototype markers.** Every layer name begins `hotspot/back·`, `hotspot/state·`, `hotspot/row·` or `hotspot/alt·` — ids listed in the plan. Same exemption TYPE-COLOR-SYSTEM §2d already records for the 291 `#0000FF` hotspot nodes. CONF-1-07's population of 26 page-wide must already exclude hotspot layers, since 37 sit in four sections alone. | **NOT-APPLICABLE — recorded so it is not re-filed** |
| **CONF-1-10** (Minor) | Repaint the near-miss hexes to the token value and bind. | `641:2599` Components · detail, nodes `2483:11988` and `2483:11991` | Both resolved into `brand-03-conformance.json` `repaint` (→ `#6B7280`, bind `color/ink-muted`). They are **also** two of the 39 sub-11px nodes, so one pass closes both findings on the same two nodes. | **2 × `#6B7380` fills, unbound, measured.** `#1A57DB` 0 · `#9DA3AF` 0 · `#111928` 0 in my sections. | **BLOCKED-ON-QUOTA** (resolved ids) |
| **CONF-1-11** (Critical) | Bind every TEXT node on the 22 arc boards to the ramp. | `2476:12064`, `2476:12081` | Into `brand-03-conformance.json` priority 3. | **`2476:12064` = 0/11 bound; `2476:12081` = 0/6 bound — measured, and an exact match for CONF-1-11's own figures.** Section around them: 121/229 = 52.8%. | **BLOCKED-ON-QUOTA** (confirmed, resolved) |
| **CONF-1-12** (Major) | Reset the 13 Inter Bold anatomy titles to `ui/16` / `ui/20`. | none of the 13 is in my sections | Measured. | **1 node >600 weight in all four sections, and it is not one of the 13** — `813:4498`, Inter Bold 32/AUTO, "Build something amazing", on `S1.1e · template-preview (modal)`. Ancestor chain not captured, so chrome-vs-canvas **UNVERIFIED**. | **NOT-APPLICABLE** (the 13) · **BLOCKED, CLASSIFY FIRST** (the 1) |
| **CONF-1-13** (Major) | Nothing below the 11px floor. | 39 nodes across 19 boards in all four sections | All 39 ids resolved into `brand-03-conformance.json` `promote`, with the overflow guard `fix-label-tracking.mjs` needed. | **39 nodes, every one of them exactly 10px, measured** — per-board list in the plan. | **BLOCKED-ON-QUOTA** (fully resolved) |
| **CONF-1-14 / -15 / -16** | Leading off the ramp · AUTO line-height · 22 font sizes. | all four sections | Folded into the promote step (which sets 11/16, so the node becomes bindable). Not separately measured. | none | **BLOCKED-ON-QUOTA** |
| **CONF-1-19 / -20 / -22** | 4px-grid misses · no auto-layout · off-grid board y. | `2476:12064`, `2476:12081` are 2 of the 22 | Not measured — my census captured geometry to the pixel for boards but not for their children. | none | **NOT COVERED** |
| **VIS-1-22** (Major) | Grow the Brand · lint footer note by a line; inset the issue-row detail 48px. | `154:2` (board confirmed: 280x812, 12 TEXT, 11 bound) | Both child ids **resolved from a local file** — `154:25` is the note (its string was set by the applied `plan-text-B.json` and VIS-1-22 quotes the clipped render of exactly it), `154:17` the issue row (same). Plan flags a conflict to resolve first: FIG-F-12 says the shipped lint rows have *no* control, so if 'Open' has already gone, the 48px inset is wrong. | board geometry read back; child ids from a repo file | **BLOCKED-ON-QUOTA** |
| **VIS-2-13** (Major) | Move the 'Draft preset' pill out of the heading's rectangle. | `306:2161` (board confirmed: 280x812, 15 TEXT, 13 bound) | Selector rows for the pill and the heading. Plan carries VIS-2-32's warning: `render-defects.mjs:118` filters both sides of OVERPRINT to TEXT, so a pill-over-text pair is invisible to it — **a clean sweep is not proof this is fixed**. | board geometry only | **BLOCKED-ON-QUOTA** |
| **VIS-3-30** (Major) | Grow the floating canvas toolbar 40 → 80 and shift its children 16. | `642:2832` / `642:2928` (board confirmed: 1440x900, 109 TEXT, 87 bound) | Exact geometry from the lane transcribed. **Plus a sibling check I derived**: the cached SWEEP-FULL shows the identical `Canvas toolbar (floa…` bottom +8 / top +8 defect on `642:2556` (node `642:2652`), `807:4299` (`807:4330`) and `807:6694` (`807:6778`). Same toolbar, same class, three more boards. | board geometry only | **BLOCKED-ON-QUOTA** |
| **ARR-A-25** | Exile orphan caption `155:69` to the Notes section. | `155:69` (measured @ 100,7093 · 280x108, alone on a row) | **I recommend the opposite and say why.** ARR-A-25's premise — that the caption describes a board that does not exist — is confirmed (no `Brand · pro-locked` board anywhere in the section). But its *text* was rewritten since, by FIG-F-01, and now accurately describes `154:132 Brand · root · Beginner mode`, which does exist. Re-aim it (rename to `caption/Brand · root · Beginner mode`, place under `154:132`) rather than binning the one caption that explains the Beginner/Pro model. Escalation path written into the plan. | board list read back | **BLOCKED-ON-QUOTA**, with a counter-proposal |
| **ARR-A-26 … -33** (8 rows) | Re-flow section `1776:8373`. | 51 boards | `layout-section.mjs 1776:8373` + 6 acceptance checks. **The lane's explicit coordinates are STALE** — ARR names rows y=1226/2681/3723/4079; I measured y=220/1052/1316/2148/2358/2714/3646/4578/5410/5602/5961/6793/7093/7321/7459. Replaying them would move boards to slots that no longer mean what the lane meant, so the plan re-derives instead of replaying, and keeps the lane's intents as acceptance criteria. One measured bonus: the four AI-prompt modals are already on one row (y=2358) but **out of order** — idle@100, error@940, generating@1780, success@2620. | full board list + geometry read back | **BLOCKED-ON-QUOTA** |
| **ARR-B-16 / -17 / -18** | Split Components' one 4,380px row into three. | `1938:8372`, 12 boards | `layout-section.mjs 1938:8372` + 3 acceptance checks. | full board list read back | **BLOCKED-ON-QUOTA** |
| **ARR-B-19 / -20 / -21 / -22** | Re-pack Templates; segregate the RETIRED board; order the S1.x journey run. | `1084:4527`, 18 boards | `layout-section.mjs 1084:4527` + 4 acceptance checks. | full board list read back | **BLOCKED-ON-QUOTA** |
| **ARR-A-18** | Rehome `Templates · empty` out of Insert. | `1138:13413` → `1084:4527` | Written as a cross-section move needing the Insert owner's agreement. **Id from the lane, not read by me** — it is not in my sections. | my side confirmed: `782:4402` no-results, `781:4372` load-error, `778:4102` loading already sit together in `1084:4527` | **BLOCKED-ON-QUOTA** + needs coordination |
| **ARR-C-33** | Move the Ecommerce toast up to the flow position it belongs in. | `1719:8414`, `1719:8443`, `1719:8450`, `1719:8421` | **Exact coordinates, safe to replay** — my 05:07 measurement agrees with the lane's premises node for node (toast @100,1160 · 280x812; the three bind boards on y=740 at 100/460/820). Moves written: toast → 100,740; binds → 500/860/1220,740. Section drops 3 rows → 2, 1220x2112 → ~1620x1770. | all five boards' geometry read back | **BLOCKED-ON-QUOTA** (highest-confidence row I own) |
| **V2 §7 `2797:410` Design System** | Build on the generated token set, don't build beside it. Weights cap 600. One accent. `--bk-leading-18` has zero consumers. 22.4% AUTO leading. | all four sections | Read **from the local builder source** (`scripts/figma/build-proposal-page.mjs`, which generated that board) — zero Figma calls. Turned into the conformance plan: 39 promotions, 2 repaints, 1 weight classification, 4 binding priorities. | — | **BLOCKED-ON-QUOTA** (applied as plan) |
| **V2 §8 `2797:491` Component Library** | 338 masters → 125 judged units → 49 zero-use. Merge Nav item (1026) with Settings nav row (600); active = fill, not the bar; weight 600. | — | **Nothing.** §8 is a census of the Figma masters on page `1:2` and section `2040:8372`. My `1938:8372` is the editor's saved-components **panel** — a product screen, not the library — and the boards I measured there instance `Panel header` / `Section header`, not `Nav item` / `Settings nav row`. The merged-nav row is *drawn and deliberately not applied* by the builder's own note, and **I did not apply it**. | — | **NOT-APPLICABLE** |
| **V2 §4 `2797:342` Missing Screens & States** | 28 missing-state · 28 missing-action · 10 missing-screen · 21 dead-end · 13 destructive-confirm. Loading unexamined in 10 of 13 modules, error in 8 of 13. | Templates + Components | Read from the local builder source. Applied as the async-completeness lens on both unowned sections — see the two new findings below. | Components' async family measured **complete** (empty `1138:13394`, loading `778:4173`, error `781:4433` all present) | **BLOCKED-ON-QUOTA** (the fixes) |
| **V2 §1 `2797:2` UX Audit** | 295 findings, 55 Criticals; brand's share is 7. | — | My 7 are the slice rows above. | — | see UX-H rows |
| **NEW — derived from source today** | `781:4372 Templates · load-error` is mis-titled: there is no load. | `781:4372` + caption `788:4312` | `TemplatesTab.tsx` has no fetch and no `isLoading`; its two effects sync `appliedId` and emit the panel width. What ships is an **apply**-error banner — `tpl-error-banner` at :575-586 with Retry (gated on `canRetry`, set :281) and Dismiss — raised applying a template to a page, not fetching a list. Fix written: rename to `Templates · apply-error (banner · Retry / Dismiss)` and redraw as a banner over the gallery, or mark `[not-implemented] as drawn` with `apply-truth-marks.mjs`, which never deletes a design. Corollary: `778:4102 Templates · loading — RETIRED (no producer)` is **confirmed correct** by the same read. | code, not Figma | **BLOCKED-ON-QUOTA** (new, unowned) |
| **NEW / FIG-F-57 — re-derived today** | `781:4433 Components · load-error` draws a live "+ Create component" footer and its caption promises it stays live. Neither is true. | `781:4433` + caption `788:4315` | `ComponentsTab.tsx:93-113` — the error branch returns a `PanelFrame` holding only the header and `PanelErrorState` and **returns**; the one primary "+ Create component" is at :278-287 in the normal branch. Fix written: delete the button, rewrite the caption to "The error branch returns before the footer…". Second-order note: the branch is the `!composer?.components?.isAvailable()` guard (:65), not a fetch failure, so the board is right about what the user sees and slightly wrong about why. | code, not Figma | **BLOCKED-ON-QUOTA** (unowned) |

---

## Ecommerce — the four claims, re-derived from source

The section name makes four behavioural claims and rule 4 says a behavioural
claim on a board must match the code. I re-derived all four locally, at zero
Figma cost. **All four TRUE.**

| claim | verdict | evidence |
|---|---|---|
| the cart runtime exists | TRUE | `StripeInjector.ts` `generateCartScript()` — a full localStorage cart (`CART_KEY 'aquibra_cart'`), currency, success/cancel URLs, both checkout modes |
| the Stripe checkout runtime exists | TRUE | `StripeInjector.ts:13` emits the Stripe.js tag; `:39` constructs `Stripe(config.publishableKey)`; `:173-174` `redirectToCheckout({sessionId})` |
| wired into export at `ExportEngine.ts:40` | TRUE | `:40` is the import of `generateStripeScripts`; the call site is `:544-547`. Both accurate; if anyone tightens the string, cite **both** lines |
| no screen writes `config.stripe` | TRUE | `IntegrationsConfig.stripe` at `project.ts:375`, `StripeConfig` at `:381-396`. The only integrations key any code reads is `email` (`Composer.ts:744-748`, `StorageAdapter.ts:180-187`). Settings' `IntegrationsScreen.tsx` says in its own docblock "Real integration API not yet available; each row links to docs/external setup" — Stripe is one of those link rows (`settings/constants.ts:31-36`) |
| no order / fulfilment / customer model | TRUE | `prisma/schema.prisma` holds 70 models; none matches `Order|Customer|Product|Fulfil|Cart`. The nearest neighbours are `CmsCollection`/`CmsEntry` (generic content) and `Subscription`/`PaymentMethod`/`Invoice` (Buildrick's own billing, not the customer's commerce) |

**The section name is correct as it stands and must not be widened back.**

**The honest missing screen this exposes:** there is no Stripe *config* screen
anywhere — publishable key, checkout mode, endpoint, currency, success and cancel
URLs, which is exactly the shape of `StripeConfig`. Writing it is the single
change that turns the shipped-but-inert cart runtime live. Filed as a
missing-screen in `plans/brand-07-ecommerce.json`; **not drawn as though it ships.**

---

## Measured section health (05:07Z, the one read I got)

| section | boards | TEXT | style-bound | % | off-token paints | >600 weight | <11px |
|---|---:|---:|---:|---:|---|---:|---:|
| `1776:8373` Brand | 51 | 628 | 283 | 45.1 | 0 (34 `#000000`, all hotspots) | 0 | 22 |
| `1084:4527` Templates | 18 | 479 | 293 | 61.2 | 0 (3 `#000000`, all hotspots) | 1 (probably canvas) | 9 |
| `1938:8372` Components | 12 | 229 | 121 | 52.8 | 2 × `#6B7380` | 0 | 4 |
| `1779:6` Ecommerce | 5 | 58 | **0** | **0.0** | 0 | 0 | 4 |
| **all four** | **86** | **1394** | **697** | **50.0** | **2 real** | **1 unclassified** | **39** |

Two independent corroborations fell out of this, worth keeping:

- TYPE-COLOR-SYSTEM §3 step 5 lists **"Ecommerce (58)"** among the seven sections
  at 0% on page 1:3. I measured `1779:6` at exactly **58 TEXT / 0 bound**. It is
  the smallest of the seven, so it is the cheapest one to move to done.
- CONF-1-11 puts `2476:12064` at 0/11 and `2476:12081` at 0/6. I measured
  0/11 and 0/6.

---

## What I did NOT cover

Stated plainly, because six of eighteen boards walked is six.

1. **I made zero writes.** No board changed. Nothing is `IMPLEMENTED`, because
   nothing has a read-back and this repo has reported success on a dead POST.
2. **`verify-invariants.mjs` was NOT run.** The coordinator's stop covers it
   explicitly: every call returns the quota string, and a quota string is not a
   measurement. **Loose / oob / overlap / secoverlap / dangling for my four
   sections is UNMEASURED**, both before and after.
3. **Page-wide `#1A264D` and page-wide weight-700: UNMEASURED.** The call that
   would have taken both was killed mid-flight. I am reporting no number.
4. **I never read board COPY.** Every string in every plan is either (a) a new
   string I authored, (b) a string recovered from an *applied* local plan file
   (`docs/design-jobs/applied/plan-text-B.json`), or (c) a selector. **Six rows in
   `brand-02-text-unresolved.json` carry `unresolved-id`** and must be resolved by
   matching characters inside a named board before anything is written.
5. **The four V2 source boards were never opened in Figma.** `2797:410`,
   `2797:491`, `2797:342` and `2797:2` were read from
   `scripts/figma/build-proposal-page.mjs`, the committed script that *generated*
   that page, plus `docs/design-jobs/applied/2026-09-06-proposal-page.json`. That
   is the source of truth for their content and it cost nothing — but if a board
   has been hand-edited on the page since the build, I would not know.
6. **`813:4498`'s ancestor chain.** The one >600-weight node in my sections is
   unclassified chrome-vs-canvas. It is **not** counted as drained and **not**
   counted as debt.
7. **CONF-1-19 / -20 / -22** (4px-grid misses, absent auto-layout, off-grid board
   y) — not measured for my sections. My census captured board geometry to the
   pixel but not children's.
8. **Eleven open FIG-F rows in `1938:8372`** (FIG-F-45, -47, -48, -49, -50, -52,
   -53, -55, -57, -59, -66) — a previous arc's lane, not one of the board-level
   lanes this arc assigned me. Each has its evidence already written and is a
   small `apply-text-fixes` or `apply-truth-marks` plan. Listed in
   `plans/brand-08-templates-components.json` as the obvious next slice.
9. **Four cached SWEEP-FULL defects in `1084:4527`** (the six overflowing
   template cards on `807:7252`, the RETIRED loading board's eight, `813:4489`'s
   72px modal overflow, `807:6694`'s canvas overflows) — identified from the
   2026-09-06 cache, **not re-measured by me**, and therefore not planned.
10. **Two different things are called "Components" and only one of them is mine.**
    Section `1938:8372` — the editor's saved-components **panel** — is mine and was
    unowned. Page `1:2` and section `2040:8372` (shared chrome) are the component
    **library**, and they belong to the `components` agent, whose own report names
    exactly those two targets. Nothing in my plans touches either.
11. **No screenshot comparison.** The founder's acceptance for this file is board
    screenshot vs live screenshot side by side. That is a Figma call and a running
    app; I did neither.
