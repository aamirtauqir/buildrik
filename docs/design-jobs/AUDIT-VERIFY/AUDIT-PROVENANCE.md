# Provenance and self-consistency report — "Buildrick Deep UI and Modal Audit — 7 September 2026"

Audited artefacts:
- `/Users/shahg/Desktop/pencil/buildrik/docs/design-jobs/AUDIT-VERIFY/audit2.txt` (8,336 lines / 7,510 non-empty)
- `/Users/shahg/Desktop/pencil/buildrik/docs/design-jobs/AUDIT-VERIFY/ALL-FINDINGS.json` (48 findings)

Method: every number in this report was recomputed from the audit's own tables
(614 inventory rows, 95 modal-inventory rows, 29 module-coverage rows, the
prototype-destination lines). No Figma call was made. Where a claim cannot be
checked against the document, this report says so rather than scoring it.

---

## A. Evidence freshness

### A.1 Classification of all 48 by the `kind` field

**(i) Fresh — re-read in this pass ("Fresh …") — 7 findings (14.6%)**

| id | `kind` |
|---|---|
| M01 | Fresh screenshot + current node text |
| M02 | Fresh node text + hierarchy |
| M03 | Fresh node text + hierarchy |
| M05 | Fresh exact geometry |
| M06 | Fresh screenshot + geometry |
| M07 | Fresh complete node text |
| M19 | Fresh typography + geometry |

**(ii) Retained — carried over from the earlier scan ("Retained …") — 12 findings (25.0%)**

`M04` (Retained full text comparison), `M08`, `M09`, `M10`, `M11`, `M12`, `M13`,
`M16`, `M18` (all "Retained complete text"), `M14` (Retained measured
dimensions), `M15` (Retained text; sample-content inconsistency), `M17`
(Retained complete text; visible-label check).

**(iii) Other — no freshness marker at all — 29 findings (60.4%)**

- `M20` — "Measured geometry; viewport behavior requires visual/prototype verification"
- All 28 first-pass findings `F01`–`F28`, whose `kind` values are only
  `Visual` (20 of them), `Visual + structural` (F14, F23), `Structural`
  (F21, F22, F27), `Visual; canonical external page not visually audited`
  (F24), and `Structural candidate; sampled visual corroboration` (F28).
  None of these carries the word "Fresh" or "Retained".

7 + 12 + 29 = 48. ✔

### A.2 The two tool-call-limit statements, quoted

**First (opening scope note, line 10):**

> "Twenty-five V1 frames and the V2 final editor were visually inspected. **Figma then returned its tool-call limit, preventing the remaining per-state visual checks.** This was the first full-page structural pass with a sampled visual audit. The added modal pass below records refreshed checks and the continuing visual coverage limit. No section claims that every screen has passed visual QA."

**Second (modal-pass scope note, line 18):**

> "This pass adds 20 observations and checks to the initial 28. It reviewed 98 candidate inventory entries, retained 95 modal/popup/state/reference entries after excluding three unrelated matches, refreshed six relevant nodes/boards, and obtained one additional modal screenshot. The remaining entries use the earlier recorded Figma structure and text. **Figma returned its call limit again. Every modal has not received a fresh visual inspection.**"

### A.3 The "six refreshed nodes/boards" reconciles exactly

The 7 Fresh-labelled findings cite these distinct top-level boards:
`2850:22371` (M01, M06, M19), `2881:12608` (M02), `2850:21560` (M03),
`1170:4777` (M05), `1172:4840` (M07, M19), `46:2` (M19) — **exactly six**,
matching "refreshed six relevant nodes/boards". The second node in each M01–M03
pair (`1175:4827`, `1174:4849`, `1706:8501`) is the retained comparison
specimen, not a refreshed one.

"one additional modal screenshot" also holds: only one fresh screenshot caption
exists in the whole document —

> "Fresh screenshot of frame 2850:22371. The frame name says single file; the visible dialog says Delete 34 files." (line 65)

— and it is shared by M01 and M06, the only two findings whose `kind` says
"Fresh screenshot".

### A.4 Plainly stated

**41 of 48 findings — 85.4% — rest on evidence the audit did not re-verify in
this pass.** That is the 12 explicitly "Retained" plus the 29 with no freshness
marker (M20 + all 28 F-findings), for which the audit says only "The initial
editor-wide findings below remain relevant" (line 941) and "The remaining
entries use the earlier recorded Figma structure and text" (line 18).

If M20 is credited as fresh-derived — its node `1170:4777` was one of the six
refreshed, and M05 measured it fresh — the figure is **40 of 48 (83.3%)**.

Either way: **fewer than one finding in six was looked at again in the pass that
published them.**

One point in the audit's favour: the 12 "Retained complete text" findings were
checked against the modal-inventory excerpts they rest on. The inventory warns
"First-pass text excerpts are capped at 470 characters", and 16 of the 95
entries do hit that cap — but **none of the 12 source rows for the Retained
findings is truncated** (longest is M14's at 467 chars, and M14's `kind` is
dimensions, not text). The "complete text" claims are therefore supportable
from the record the audit kept.

---

## B. Internal arithmetic

| Claimed number | Verdict | Recomputed from the document |
|---|---|---|
| "29Editor v1 sections scanned" | **✔ CONFIRMED** | Module-coverage table holds exactly 29 section rows (parsed 30 = 1 header + 29). Section prefixes 01–29 each appear once, none missing, none repeated. |
| "614Frames inventoried, including reference and archived frames" | **✔ CONFIRMED** | The Searchable frame inventory has exactly 614 frame rows. The module-coverage "Frames" column sums to **613**; the audit closes the gap itself: "One additional Insert dragging frame sits directly on the page outside sections." The inventory's last row is `2661:11972` "Insert · dragging", section "Outside sections". 613 + 1 = 614. |
| "27Visual samples across both passes" | **✔ CONFIRMED, but only via prose** | The tables show **25**: exactly 25 inventory rows carry the marker "Visual sample", and the module-coverage table names 25 samples. The remaining two come from two sentences: "Twenty-five V1 frames **and the V2 final editor** were visually inspected" (+1) and "obtained **one additional modal screenshot**" (+1). 25 + 1 + 1 = 27. |
| "4828 initial findings + 20 modal observations/checks" | **✔ CONFIRMED** | F01–F28 = 28, M01–M20 = 20, total 48. Caveat: the "First corrections" summary table renders only **9** of the 20 modal findings (M01–M09; parsed 10 rows = 1 header + 9). That is not a contradiction — the audit says "Correction order: resolve M01–M09 first" — but a reader who reads only the summary table sees fewer than half the modal pass. |
| "42,007 descendants" | **⚠ NOT CHECKABLE** | Stated once ("The full Editor v1 page received a structural scan of 42,007 descendants") and never decomposed. No inventory row carries a descendant count. Nothing in the document confirms or contradicts it. |
| "525 distinct referenced destination IDs" | **✔ CONFIRMED — exact** | Collecting every node id from the "Prototype destinations:" lines across all 614 inventory rows yields **exactly 525 distinct ids**. This is the best-supported number in the report. |
| "3,569 nodes with reactions" | **✗ UNRECONCILED — 42 short** | The per-frame "Reaction nodes:" values across all 614 rows sum to **3,527** (613 numeric rows plus one "Reaction nodes: None"). The document asserts 3,569 and never accounts for the 42-node difference. It may be page-level nodes outside any inventoried frame — the audit does not say so. |
| "912 nodes named hotspot/" | **✔ INTERNALLY CONSISTENT, externally unverifiable** | Stated twice, identically: "912 nodes named hotspot/…" (line 14) and "There are 912 descendants named hotspot/ in the editor page, though not all are necessarily visible" (F23, line 1138). No table decomposes it. |
| "95 modal-related entries retained from 98 candidates" | **✔ CONFIRMED twice over** | 98 − 3 excluded = 95, and the modal inventory contains **exactly 95** entry rows (parsed 96 = 1 header + 95). The section heading and body agree: "95 modal-related entries" / "95 entries, including overlays, drawers…". |
| "31 audited Settings frames" | **✔ CONFIRMED as a flagged count; ⚠ misleading as written** | Of the 48 rows in section `21 · Settings/S7`, exactly **31** carry "Text clipping candidates: 1" and the other 17 carry 0. So F28's 31 is real. But the sentence reads "The structural check flags subtitle text outside clipping parents **across 31 audited Settings frames**", which parses naturally as "31 Settings frames were audited" — and the module-coverage table says the section has **48** frames, all structurally checked. The accept-when line ("All header subtitles are readable in the 31 **candidate** frames") disambiguates it correctly; the evidence line does not. |

### B.1 Additional self-contradictions found while checking the above

**1. Three different counts exist for the same sections, unreconciled.**
F22 ("Section totals and content types are not reliable screen counts") states:

> "Section titles include counts that differ from current children: Shell says 34 but has 56 children, Inspector says 51 but the audited batch contains 56, and History says 43 but has 49."

The module-coverage table's own **Frames** column, for those same three
sections, reads **32 (Shell), 40 (Inspector), 35 (History)** — and it is that
column, not F22's numbers, that sums to the headline 614. So the document
carries three sets of figures per section (the Figma section name's embedded
count, the audited "Frames" count, and F22's "children" count) and reconciles
none of them. The preamble hedges — "Counts below are direct design-bearing
frames, not unique screens or implemented features" — which makes this
defensible, but F22's specific 56 / 56 / 49 appear nowhere else in the document
and cannot be checked against it.

**2. One module-coverage row contradicts its own label.**
The row `09 · Canvas · 14 ↗` reports **15** in the Frames column, and the
inventory does contain 15 Canvas frames. The section's own name says 14. This
is exactly the defect F22 reports — a section title that disagrees with its
children — occurring inside the table the audit uses to count, and F22 does not
list Canvas among its examples.

**3. The runtime-validation queue makes no count claim.** The parsed 9 rows are
1 header + 8 recorded risks (CMS persistence, page state/routing, publishing
after lost contact, preview parity, layers locking, AI apply/scope/undo,
history/backups, commerce/integrations). No number in the prose to contradict.

**4. Numbers that do check out and are worth crediting:** "76 loose breakpoint
text labels… not 77 additional product screens" (1 + 76 = 77 ✔); 98 − 3 = 95 ✔;
28 + 20 = 48 ✔; 613 + 1 = 614 ✔; 525 destinations ✔.

---

## C. Scope honesty

### C.1 What the audit says it did NOT verify — quoted

**Runtime, repo, live app, persistence, publish, keyboard (line 11):**

> "Figma designs and their annotations cannot verify current runtime behavior. **No repository, live application, data persistence, real publish job or keyboard behavior was tested.** Existing code-level audit claims are identified below as a validation queue. No design changes were made."

**Per-state visual checks (line 10):**

> "Figma then returned its tool-call limit, **preventing the remaining per-state visual checks.** … **No section claims that every screen has passed visual QA.**"

**Per-modal visual checks (line 18):**

> "**Every modal has not received a fresh visual inspection.**"

**Keyboard (correction spec, Focus / keyboard row):**

> "**Verify by keyboard in prototype/runtime; not certified by this audit.**"

**Dismissal paths (correction spec, Dismiss / dirty state row):**

> "**Prototype or runtime testing confirms each dismissal path. Static screenshots alone cannot prove it.**"

**Contrast (correction spec, Color / readability row):**

> "**Contrast and focus checks remain pending where the needed visual/property evidence was unavailable.**"

**Visual coverage vs structural coverage (module coverage preamble):**

> "**Structural checks cover every listed section; visual inspection is limited to the explicit samples.**"

**What a row in the inventory means (inventory preamble):**

> "Every listed frame received structural inspection; **only rows marked Visual sample were rendered and viewed.** … Zero reactions can be intentional for a conditional or terminal state. **Clipping counts are candidates from immediate-parent bounds, not automatic defects.**"

**Prototype graph (line 14):**

> "**A valid node ID is not proof of a correct user journey.** The audit found 3,569 nodes with reactions and 912 nodes named hotspot/…; neither count is a count of unique user flows."

**Recorded risks (runtime queue preamble):**

> "These are claims already present in the Figma file. **They were not independently reproduced in this audit.** They are not included as confirmed application defects or added to the 28 findings."

**Closing note:**

> "Read-only audit. … **No automatic clipping or component-use count is treated as proof of a product defect.**"

### C.2 Findings whose wording exceeds that stated method

Ground truth used below: exactly 25 frames in the whole file carry the marker
"Visual sample"; one further frame (`2850:22371`) got the second-pass
screenshot; `2797:22382` was "inspected during the session but is not embedded
here". Everything else is structural-only by the audit's own labelling.

**Tier 1 — a rendered-outcome asserted as fact for frames that were never rendered.**

- **F07** — title: *"History retention warning **is cut off**"*, `kind: Visual`.
  It cites five frames; **one** (`163:2`) is a visual sample. The other four —
  `2854:12294`, and three the audit itself names `[design-ahead] …`
  (`2854:21739`, `2854:21814`, `2854:21854`) — are "Structural only". The
  accept-when ("The complete retention warning and save action are visible
  together") is written as if all five had been seen.
- **F06** — title: *"Explanatory and recovery content **is clipped**"*,
  `kind: Visual`. Two of its four frames (`171:136` "AI · not-configured",
  `2846:21667` "AI · error-provider") are structural-only, and `2846:21667`
  is cited in the Frames list without any evidence sentence about it. Credit
  where due: the evidence line *is* hedged for the unrendered ones ("have
  recovery text flagged outside clipping parents") and scopes "rendered" to the
  quota frame, which was a sample. The unqualified `Visual` kind and the
  factual title are what overreach — against the audit's own rule that
  "Clipping counts are candidates … not automatic defects."
- **F03**, **F09**, **F11**, **F12**, **F16**, **F19** — all `kind: Visual`,
  all cite at least one structural-only frame alongside the rendered one. In
  each case the evidence sentence happens to describe only the rendered frame,
  so no false statement is made; the overreach is the `Visual` label attached
  to a citation list that is mostly unrendered. Frame-by-frame:
  F03 (`2898:12617`, `2898:21981`), F09 (`1705:8704`), F11 (`1703:9046`),
  F12 (`2429:21281`, `1170:4713`), F16 (`2855:12407`), F19 (`2865:22206`).

**Tier 2 — user/runtime behaviour asserted about a frame the file itself marks
as not built.**

- **F09** — Impact: *"A user may send a page comment believing it is a threaded
  reply."* Its second frame is named **`[not-implemented]` Review ·
  reply-composer band**. The audit tested "no live application"; the artefact is
  labelled not implemented; the consequence is stated about a user.
  (Contrast **F25**, which is the honest version of the same shape: "The frame
  is also explicitly marked not implemented … should not be treated as proof of
  a working preview.")
- **F11** — Impact: *"An error becomes a dead end inside the affected task."*
  A claim about what the application does, from one static Settings frame.
- **F18** — Impact: *"The screen simultaneously promises and denies a usable
  connection"*, with accept-when *"Each linked status corresponds to a
  **demonstrable destination and a supported action**"* — demonstrable and
  supported are runtime properties.
- **F01** — Impact: *"Users cannot confidently predict which element an
  Inspector edit will change."* Both cited frames *were* rendered, so the
  observation is sound; the consequence is a claim about editing behaviour in a
  product the audit did not run.
- **F21** — Impact: *"Reviewers can enter obsolete designs while following a
  currently retained site-menu specimen"*, accept-when *"**Following these three
  controls lands on** the current Inspector, sharing and Settings surfaces."*
  The audit's own line — "A valid node ID is not proof of a correct user
  journey" — cuts against traversal claims in both directions. Note also that
  the one frame F21 cites, `642:3401` "Site menu (⋯)", sits in section
  `25 · Reference · specs & completeness`, which the module table describes as
  reference material, not a live screen.
- **M14** — accept-when: *"Loading, populated, empty and failed states use the
  same width and **do not jump sideways**."* A sideways jump is a runtime
  transition; the evidence is retained static dimensions.

**Tier 3 — absence in a text record used as proof of visual absence.**

- **M17** — title: *"Save-as-template field **has no visible label**"*,
  `kind: Retained complete text; visible-label check`. `1169:4753` is not among
  the 25 rendered frames. A text dump cannot see a label drawn as a vector,
  an icon, or an image. Compare **M12**, which does this correctly by scoping
  the claim: *"There is no Add component, Apply or usable preview action **in
  the recorded text**."*

**Tier 4 — a structural claim about a page the audit scoped its scan away from.**

- **F27** — *"the section's current children include additional CMS, Layers,
  Media, Brand, History, Review, Settings and AI panels."* This is a structural
  child-list claim about a V2-proposal node, while line 10 scopes the
  structural scan to "**The full Editor v1 page**". Nothing in the document
  states that the V2 page received a structural scan.
- **F26** — *"The V2 final screen **visibly uses** Inse, Laye, Page, Medi…"*
  A visual claim with **no embedded screenshot**; the closing note says "The V2
  screenshot was inspected during the session but is not embedded here." This
  is a provenance gap, not a method violation — the audit does claim the
  inspection happened.

**Findings that get this right and should be read as the standard:**
**F14** ("These additions are not visible in **the sampled** assembled frames"),
**F28** (`kind: Structural candidate; sampled visual corroboration` +
"Treat the unrendered cases as candidates until checked"),
**F24** (`kind: Visual; canonical external page not visually audited`),
**F25**, **M20** (`kind: … viewport behavior requires visual/prototype
verification`), and **M12**.

Screenshot provenance for the F-block: 24 of 28 F-findings carry an embedded
"View screenshot evidence" block. The four without are **F21**, **F22** (both
`kind: Structural` — appropriate) and **F26**, **F27** (both on the V2 page).

---

## D. Claims about another page

The audit's own frame of reference, line 5:

> "**Source: Editor v1 ↗ · Reference: Editor v2 — Proposal ↗**29Editor v1 sections scanned"

Everything the audit inventoried — the 614 frames, the 29 sections, the 42,007
descendants, the 525 destinations — is Editor v1. Findings whose subject sits
elsewhere:

| Finding | Cited nodes | Where it actually is | Evidence in the document |
|---|---|---|---|
| **F26** | `2797:22382` | Editor v2 — Proposal | Titled "**P1F26 · V2 proposal**". Node is **absent from all 614 Editor v1 inventory rows**, absent from every "Prototype destinations:" list, and absent from the 29-row module-coverage table. No embedded screenshot. |
| **F27** | `2797:559`, `2797:560` | Editor v2 — Proposal | Titled "**P2F27 · V2 proposal**". Both nodes **absent from the 614 rows**, from all destination lists, and from module coverage. No embedded screenshot. |
| **F24** | `1339:7171` | Node is on v1; **its subject is on page 1:6** | The node *is* an Editor v1 frame (section `19 · Client sign-off · 10`) and *was* a visual sample. But its own inventory name reads "Client sign-off · A · viewing · 1280 — **echo of 1:6** at the 1280×720 minimum fold; **canonical 23:21 is 1280×900**", and the finding says "**The node itself points to a canonical family on page 1:6.**" Its `kind` admits it: "Visual; **canonical external page not visually audited**", and the module-coverage row says "F24; **canonical reviewer page remains outside visual coverage**". |

**Out of scope for a question about "issues in Editor v1": F26 and F27.** Their
nodes appear nowhere in the Editor v1 structural scan the rest of the report is
built from, and no section of the module-coverage table covers them. A reader
asked "how many Editor v1 issues did this find?" should be told **46, not 48**.

**F24 is a boundary case, not a clean exclusion.** The frame it names is on
Editor v1 and was rendered; but the conclusion it reaches — "not a complete
viewing screen" — is a judgment about a canonical reviewer family on page 1:6
that the audit states it never looked at. The finding labels this honestly.

Two caveats on rigour:
1. The document **never states a page id for the V2 proposal page** — no string
   `2668` appears anywhere in `audit2.txt`, and `page 1:3` is never written
   either. The v1/v2 split above is established from the audit's own labels
   ("Source: Editor v1", "· V2 proposal"), from absence from the 614-row v1
   inventory, and from the explicit "page 1:6" mention in F24. The `2668:2` and
   `1:3` identifications come from outside this document.
2. Absence from the inventory does not by itself prove off-page: the inventory
   lists **frames**, so child nodes will be missing too. That is why nine other
   node ids also fail the lookup and are **not** flagged here — `M05`'s
   `1712:8430`/`1712:8431` (label/button inside `1170:4777`), `M06`'s
   `2850:22373` (alert inside `2850:22371`), `F21`'s `642:3538` / `926:4484` /
   `1172:4895` (an Inspector node, a share link and a hotspot, each described in
   F21 as a node inside a v1 frame), and `F22`'s `1776:8385` / `1776:8381` /
   `1776:8374` (section-title nodes, which are what F22 is about). Only F26 and
   F27 combine "not a frame row", "not a destination", "no module-coverage
   section" **and** a self-declared V2 label.

---

## E. Duplicates

48 findings cite **95 node references** but only **76 distinct nodes**. Fifteen
nodes are cited by two or more findings. Grouping findings that share at least
one node gives seven clusters and 23 genuine singletons.

### Cluster 1 — `2850:22371` counted three times (M01 · M06 · M19)

Media delete-confirm, single file. M01 = the copy is the bulk-delete copy;
M06 = the warning inside it is clipped; M19 = its typography drifts from the
reference kit. **Not three independent defects in practice**: M01's fix
("Create a real single-asset state with the filename, one asset's usage impact
and an action such as Delete hero-kitchen.jpg") replaces the very string M06
measures as clipped and re-typesets what M19 measures. M06 and M19 cannot be
verified until M01 lands. The audit sequences M01–M06 together but presents
them as three findings against one board. M07 joins this cluster via
`1172:4840`, shared with M19 for the same reason (M19 samples M07's board).

### Cluster 2 — the CMS records family counted twice (M14 vs M09 · M10 · M11)

`M14` cites `1170:4749`, `1706:8433`, `1706:8437`, `1706:8444`, `1706:8451`.
Three of those five are the entire evidence base of three other findings:
`1706:8451` = M09, `1706:8437` = M10, `1706:8433` = M11. M09/M10/M11 are content
defects in three members of the family; M14 is the width inconsistency **across
the same family**. One shell fix ("Use one CMS records dialog shell across
states") resolves M14 and touches all three. This is one structural defect
(no shared dialog shell) presented as four findings.

### Cluster 3 — contamination counted four times (F23 vs F03 · F06 · F12)

`F23` "Prototype and engineering material contaminates user-facing specimens"
cites exactly `170:2`, `2429:12111`, `140:2` — one frame each from F06, F12 and
F03. And the sub-claim is already inside all three:
- F03 correction: "**Move audit text and prototype helpers outside the product frame**"
- F06 correction: "**Move developer/prototype notes outside the frame.**"
- F12 correction: "**Move server and source-code notes outside product UI.**"

F23 is the generalisation of a correction already written into three findings,
using their frames as its evidence. `M15` joins this cluster via `1170:4713`
(shared with F12) but is a genuinely different defect (mismatched sample
content in the collection wizard).

### Cluster 4 — the same modal's footer twice (M05 vs M20)

Both on `1170:4777` (Create Component). M05 = Cancel's box overlaps the primary
button by 15×16px; M20 = the modal needs a viewport-constrained height. Both
fixes are the same footer rebuild: M05 "Place both actions in one horizontal
auto-layout footer with an explicit gap"; M20 "Add a viewport-constrained
variant with **fixed header/footer** and a scrolling form body … preserving
visible Cancel/Create actions." M20 is priority `Review`, so the audit already
half-signals this.

### Cluster 5 — the global footer twice (F15 vs F16), inside a 4-way `52:2` cluster

`52:2` is cited by **four** findings (F01, F02, F14, F16). Of those, F01/F02 are
cleanly distinct (selection identity vs fill mismatch). But F15 and F16 both
describe **the same footer element**:
- F15: "General Settings still displays 'Section · Hero 680 × 250' and
  '**Desktop · 100%**' along the bottom although the canvas is not visible."
- F16: "…plus a **second Desktop · 100% readout in the global footer**."

One footer that carries a canvas readout it should not; reported once as a
Settings problem and once as a Canvas problem. F14 links to both via `52:2` and
`638:2378` and is the general form ("the accepted shared chrome is not applied
to assembled screens") that subsumes F15.

### Cluster 6 — same Review board, three findings (F08 · F09 · F10)

All three cite `156:2` only. **Not duplicates** — grouping metadata (F08),
composer semantics (F09) and button fit (F10) are three unrelated defects that
happen to be visible in one render. Listed here for completeness because the
node-sharing analysis surfaces it.

### Cluster 7 — same Settings error frame, two findings (F11 · F28)

Both cite `1703:9208`. **Not duplicates** — missing retry action (F11) vs
clipped header subtitle (F28). Distinct.

### Summary of E

| Cluster | Findings | Verdict |
|---|---|---|
| 1 | M01, M06, M19 (+M07) | **Coupled/contingent** — one board, one rewrite; M06 and M19 are unverifiable until M01 lands |
| 2 | M14 vs M09, M10, M11 | **One structural defect, four findings** — M14 re-counts M09/M10/M11's frames under a different lens |
| 3 | F23 vs F03, F06, F12 | **Genuine duplication** — F23's correction is already written verbatim into all three |
| 4 | M05, M20 | **Same footer rebuild**, split across two findings |
| 5 | F15, F16 (+F14) | **Same global-footer readout**, reported under two owners |
| 6 | F08, F09, F10 | Distinct defects, shared render — **not duplicates** |
| 7 | F11, F28 | Distinct defects, shared render — **not duplicates** |

23 findings are true singletons: F04, F05, F07, F13, F17, F18, F19, F20, F21,
F22, F24, F25, F26, F27, M02, M03, M04, M08, M12, M13, M16, M17, M18.

**Net effect on the headline.** "48 findings" is a count of write-ups, not of
defects. The arithmetic, stated so it can be argued with:

- 48 − 2 off-v1 findings (F26, F27) = **46** Editor v1 findings.
- Cluster 1: M01 + M06 + M19 collapse to one delete-board rewrite (M07 stays,
  different board) → −2.
- Cluster 2: M14 collapses into the CMS family it re-counts (M09/M10/M11 stay,
  three distinct content defects) → −1.
- Cluster 3: F23 collapses into F03/F06/F12, whose corrections already contain
  it → −1.
- Cluster 4: M05 + M20 collapse to one footer rebuild → −1.
- Cluster 5: F15 collapses into F16/F14, one global-footer readout → −1.

46 − 6 = **40 distinct Editor v1 defects**, of which **41 of the original 48
write-ups** rest on evidence not re-read in the pass that published them.
Clusters 1 and 3 are the arguable ones — a reviewer who insists M19 (a
cross-board typography drift) and F23 (a file-hygiene pattern) deserve their own
line items lands at 42.

---

## Verdict

The audit's **structural** arithmetic is unusually good: 614, 525, 95, 29, 48
and the 31 Settings candidates all recompute exactly from its own tables, and
where a headline number differs from a table (614 vs 613) the reconciling
sentence is present. Its scope disclaimers are numerous, specific, and mostly
placed where they belong.

Three things do not hold up:

1. **3,569 reaction nodes** cannot be recovered from the document — the 614 rows
   sum to **3,527**, and the 42-node gap is never explained.
2. **85% of the findings were not re-verified in this pass**, and the report's
   own layout hides that: the freshness marker lives in a `kind` string, while
   the eight-word summary at the top of the page ("48 · 28 initial findings +
   20 modal observations/checks") presents all 48 with equal standing.
3. **Two findings (F26, F27) are about a different page** and are silently
   included in an Editor v1 total, with no screenshot, no inventory row, and no
   module-coverage section behind them.

The pattern behind all three is the same one the audit warns about in its own
prose — "**A valid node ID is not proof of a correct user journey**" — applied
one level up: **a finding id is not proof of a distinct, current, in-scope,
re-verified defect.**
