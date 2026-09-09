# V2 → V1 · Publish, Export, Preview & SEO — report

**Slug** `publish` · **Target sections** `1776:8378` (15 · Publish · 20) and
`1779:4` (14 · Preview · 8) · **Source** page `2668:2`, sections `2797:559`,
`2797:342`, `2797:574`, `2797:2`.

---

## The one thing to read first

**No write reached the Figma file.** The seat quota for the Figma MCP server was
exhausted account-wide (fifteen agents on one Professional seat) before the
first write in my sequence ran. Every row below that is not `ALREADY-CORRECT`
is therefore `BLOCKED-ON-QUOTA`, and the deliverable is a resolved, executable
plan rather than an applied change.

What I *did* get from the live file before the cap, and what everything here
rests on, is a **full node dump of fourteen boards** — ids, geometry, every
TEXT node's exact characters, and every prototype edge. Those ids are read, not
inferred. The distinction is marked per row and enumerated in §Provenance.

**One correction to my own slice, found by reading the code rather than the
finding.** `UX-E-01` — the Critical this whole module is organised around — was
**fixed in code** at commit `11541dc35` ("fix: four audit Criticals"), which
landed after the audit was taken. `justPublished` is now
`publishJob?.jobId != null && publishJob.uiState === "published" && snapshot.changeCount === 0`
(`PublishTab.tsx:233`), so the panel no longer claims "Published to production"
on a reload. The board work it implies still stands — the board must say
*which* publish it is describing — but a board marker that calls this a live
defect would now be printing a stale claim, and my plan says so instead.

**Line numbers in every plan row are re-read at this HEAD**, not copied from the
slice. The audit's `PublishTab.tsx:698 / :222 / :549 / :602 / :76-84 / :788-806`
are now `:710 / :233 / :561 / :614 / :76-83 / :805-813`. Nine of the module's
findings cite at least one line that has moved.

---

## Findings

| V2 finding | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-E-01** Critical · panel opens "Published to production" with a dead CTA | reserve the success beat for a publish that finished in THIS session; never derive publishable-ness from the undo stack | `784:4326` Publish · live · `641:2652` Publish · panel · caption `788:4319` | Board renamed to scope it to a this-session publish, and to record that the CTA-greying half was fixed in code, not on the board. `784:4384` gains "· published in this session". Caption rewritten. Plans: `publish-marks.json`, `publish-text-1.json`, `publish-text-3-captions.json` | Read from file: `784:4383` = `"Published to production."`, `784:4384` = `"v15 · live · just now"`, footer `784:4363` = `INSTANCE 'Button · disabled'`. Code read at HEAD: `PublishTab.tsx:233` now gates on `jobId != null` | **BLOCKED-ON-QUOTA** (plan resolved; the code half is **CLOSED at `11541dc35`**) |
| **UX-E-02** Critical · topbar and panel answer "anything to publish?" from different data | one source of truth; the panel's change LIST stays session-scoped and is labelled as such | `641:2652` · `778:4238` · topbar board in `1776:8385` (**not located**) | Panel half fully resolved: section header `SINCE LAST DEPLOY` → `CHANGES IN THIS SESSION` on both boards, addressed by their instance-child ids. Topbar half is a selector row in `publish-crosssection.json` | Read from file: `I641:2677;16:17` = `"SINCE LAST DEPLOY"`, `I778:4251;16:17` = same. Code read at HEAD: `usePublishSnapshot.ts:157` still `getHistoryStack()`, `:181` `changeCount: changes.length` — the split is live | **BLOCKED-ON-QUOTA** |
| **UX-E-03** Critical · a dropped poll strands the user in "publishing" forever | give the wait a ceiling and an exit — its own state, Retry and Check status | new board `Publish · lost contact` ← clone of `784:4403`; caption `788:4318` | Full clone spec: source, name, four length-checked copy replacements, marker name, and an inbound hotspot at `x=0 y=676 w=280 h=34` on `784:4250`. Plan: `publish-states.json` | Read from file: `784:4403` children (`784:4460` "Publish failed.", `784:4461`, `784:4463` "Try again", `784:4464` "View log"). Code at HEAD: `usePublishJob.ts:167-168` `setError` + `stopPolling`, `:299-306` uiState from job status — defect live | **BLOCKED-ON-QUOTA** |
| **UX-E-04** Critical · feature-off, no-connection and connection-lost are one screen | three states, three sentences, three actions | `784:4480` Publish · unavailable (feature off) · new board `Publish · no Vercel connection` · `781:4489` (already the connection-lost state) · caption `788:4321` | `784:4480` rewritten to the honest feature-off sentence and its Vercel button hidden; the Vercel copy moves to a clone that keeps it verbatim. **Clone must run before the text rewrite** — stated in the plan. Plans: `publish-states.json`, `publish-text-1.json`, `publish-structure.json`, `publish-marks.json` | Read from file: `784:4537` = `"Connect Vercel to publish."`, `784:4538` = `"Buildrick deploys into your own Vercel account — we host nothing."`, footer `784:4516` → `784:4517` `Button · primary` "Connect Vercel". Code at HEAD: `PublishTab.tsx:336` `noPublishPath`, `:436` the same string | **BLOCKED-ON-QUOTA** |
| **UX-E-05** Critical · CMS detail pages ship the template's identity | replace the head identity, don't append; preview one entry's rendered head | Content section `1776:8376` — **not located, not my section** | Selector row with the exact card to draw and the corrected framing (canonical/og:url are NOT leaked — `publish-html.ts:88-97` injects a correct per-path pair; the title and social card are). Plan: `publish-crosssection.json` | Code read at HEAD: `cms.service.ts:206`, `:213` `<title>${escapeHtml(seoTitle)}</title>`, `:215` appended before `</head>` with the template head kept — defect live | **BLOCKED-ON-QUOTA** (cross-section) |
| **UX-E-13** Critical · the export modal swallows its own failures | every download door reports its outcome; delete or re-point the orphaned handler | `1172:4825` Export · HTML (modal) | Recorded on the board name with the two catch sites. A dedicated `Export · failed` board is **NOT** in the plan — see §Not covered | Read from file: board has `btn/Cancel` (`1172:4834`) and `btn/Export as HTML` (`1172:4836`), no outcome region. Code at HEAD: `ExportModal.tsx:135`, `:156` both `devError(...)`, no `useToast` import | **BLOCKED-ON-QUOTA** (partial — marker only) |
| **UX-E-17** Critical · preview cannot show what a visitor gets | decide what preview is FOR; if it stays inert, say so on screen | `2429:11904` Preview · what the sandbox drops (reference) · `817:4856` · overlay board `65:211` in `1776:8385` (**not located**) | "Active page only" body rewritten to name the missing page switcher; `817:4856`'s marker corrected to scope the `sandbox=""` claim to `PreviewOverlay.tsx:106`. The on-screen notice belongs on `65:211` → selector row. Plans: `publish-text-4-preview.json`, `publish-marks.json`, `publish-crosssection.json` | Board id `2429:11904` read from the file; its **child text ids were not read** (rows are selector rows). Exact current characters known from `scripts/figma/build-preview-reference.mjs:24-37`, the file that wrote them. Code at HEAD: `ExportUtils.ts:39` strips `script,…,form`; `PreviewOverlay.tsx:106` `sandbox=""` | **BLOCKED-ON-QUOTA** |
| **UX-E-06** Major · checklist measures six things, server refuses on a seventh | approval becomes row 7 of the same list; a refusal keeps the wizard open | `833:4518` · `893:4518` | Row 7 fully specified: geometry copied from the six existing rows (icon box `x=24 w=20`, label `x=54`, detail right-aligned to `463`, action right-aligned to `496`), children at `y≥321` shift `+36`, board `439 → 475`. Warnings band loses "Client approval is a separate gate." Plans: `publish-structure.json`, `publish-text-2.json`, `publish-marks.json` | Read from file: six rows at `y = 105,141,177,213,249,285`; `833:4577` divider at 321, `833:4579` band, `833:4581` divider, `833:4582` footer; `833:4580` = `"⚠ 4 warnings — none block. Client approval is a separate gate."` Code at HEAD: `publish.service.ts:18-108` six checks, approval gate at `:248-300` | **BLOCKED-ON-QUOTA** |
| **UX-E-07** Major · the build log always blames step one | record the index of the running step | `784:4403` · caption `788:4320` | `784:4461` rewritten from the raw code to a translated sentence that names the step that actually failed; the raw-string defect moves into the caption so the record is not lost | Read from file: `784:4461` = `"VERCEL_TOKEN_INVALID Nothing was deployed."` (matches QA-C-16's correction, so that fix did land) | **BLOCKED-ON-QUOTA** |
| **UX-E-08** Major · "step N of M" never renders | one vocabulary across worker, transport and panel | `784:4250` · caption `788:4318` | **No board change needed** — the board already draws the corrected line. Caption gains the `running`/`active` mismatch | Read from file: `784:4308` = `"Deploying to CDN · step 3 of 5 · started 14s ago"` — the board names its phase, which is exactly what the fix asks for | **ALREADY-CORRECT** (board) · caption update BLOCKED-ON-QUOTA |
| **UX-E-09** Major · no way to cancel a publish | a Cancel in the in-progress state, next to the progress bar | `784:4250` | `v2/cancel` at `x=208 y=150` (inside the Status frame, right of the progress track) plus `v2/cancel-scope` at `x=16 y=280` (inside the empty spacer) carrying the PHASE4 correction: cancel is scoped, and a late cancel does not stop the deploy. Plan: `publish-structure.json` | Read from file: Status frame `784:4306` spans 44–170, progress track `784:4309` at `y=138` `x=24..256`, spacer `784:4285` spans 262–764. Code at HEAD: `usePublishJob.ts:97`, `:228-236` expose `cancel`; grep of `src/editor/sidebar/tabs/publish/` finds **zero** call sites | **BLOCKED-ON-QUOTA** |
| **UX-E-10** Major · `cancelled` is reachable and undrawn | its own state, with the two facts a user needs | new board `Publish · cancelled` ← clone of `784:4403` | Full clone spec. **Copy deliberately does NOT say "nothing was deployed"** — per `PHASE4-QA-REPORT §1.2` that sentence is unsatisfiable. It reads "If the deploy had already started it may still finish. We will tell you which." Plan: `publish-states.json` | Code at HEAD: `usePublishJob.ts:33` and `:305` include `"cancelled"`; `PublishTab.tsx` has no `cancelled` branch. `publish.service.ts:414` permits `QUEUED`/`BUILDING` only; worker checks at `route.ts:374` then `runVercelDeploy` at `:375` then nothing until `:387` | **BLOCKED-ON-QUOTA** |
| **UX-E-11** Major · "Fix ›" abandons the flow and lands short | deep-link the sub-screen, return with the row re-checked | `833:4518` · `893:4518` | **The boards already draw the corrected behaviour** — every Fix › is wired to its specific destination. The code gap is recorded on `893:4518`'s name | Read from file: `833:4542 "Fix ›" → 638:3070` (SEO), `833:4554 → 639:3092` (Domains), `833:4576 → 140:2` (Pages), `892:4524 → 638:2378` (Favicon). Code at HEAD: `PublishTab.tsx:76-83` — SEO configured / Domain connected / Favicon all `tab: "settings"`; `:812-813` closes the wizard then emits a bare tab id | **ALREADY-CORRECT** (board) · marker BLOCKED-ON-QUOTA |
| **UX-E-12** Major · two publish doors, two gates of different quality | one gate, or give the confirm modal the same affordances | `914:4507` · topbar confirm board in `1776:8385` (**not located**) | `914:4507` renamed to record that both doors reach it and only one carries a per-row Fix and a Connect primary. Topbar half → selector row | Read from file: `914:4507` is the shared confirm (Target / Pages / Client approval / Rollback + warning band + Back / Publish now). Code at HEAD: `PublishConfirmModal.tsx:98-100` blocker as text, `:111` disabled, footer Cancel + Publish; `PublishConfirmFacts.tsx:126-130` first failing check only | **BLOCKED-ON-QUOTA** |
| **UX-E-14** Major · the export modal previews one page and downloads another | make scope an explicit, visible choice | `1172:4825` | Two length-checked rewrites: the format blurb names the page ("the page open now (About), saved as index.html") and the stats line carries the scope ("· 1 of 12 pages — pick ZIP for the whole site"). Plan: `publish-text-2.json` | Read from file: `1172:4827` = `"One HTML file with styles inlined — open it anywhere."` at `x=16 y=40 w=255` (format grid begins `y=62`, hence the width-500 single-line constraint); `1174:4831` = `"12 elements · 48 KB HTML · 12 KB CSS"` at `y=230`, foot at `y=252` | **BLOCKED-ON-QUOTA** |
| **UX-E-18** Major · any background image renders unstyled in Preview | filter declarations, not whole attributes and sheets; report what was dropped | `2429:11904` · overlay `65:211` (**not located**) | The missing card is added by rewriting the "One external stylesheet" pair — heading → "One external stylesheet — and no url() in CSS", body → the whole-sheet drop with its citation. Length-matched so the absolutely-positioned card below is not overrun. Plan: `publish-text-4-preview.json` | Code at HEAD: `ExportUtils.ts:12` `FORBIDDEN_STYLE_TOKENS = ["expression","url("]`, `:56-61` style ATTRIBUTE removed wholesale, `:71-76` whole `<style>` filtered out. Board child ids **not read** — selector rows | **BLOCKED-ON-QUOTA** |
| **UX-E-19** Major · the Google preview shows what the deploy will never serve | render from the same resolver the export uses; print the deployed URL | Pages section `1776:8377` — **not located, not my section** | Selector row naming both edits: templated title, and `yoursite.com/about.html` rather than `yoursite.com › about`. Plan: `publish-crosssection.json` | Code at HEAD: `SeoTab.tsx:78` prints `domain › slug`, `:81` prints `s.seoTitle \|\| page.name` raw, no `resolvePageTitle` import — defect live | **BLOCKED-ON-QUOTA** (cross-section) |
| **UX-E-20** Major · SEO spread over three surfaces with no precedence | one destination, or a link and a sentence naming which wins | `1776:8377` + `1776:8387` — **not located** | Selector row with the injector's real order spelled out. Plan: `publish-crosssection.json` | Code at HEAD: `SeoScreen.tsx` holds the three site fields and `defaultOgImage`; precedence lives at `SEOInjector.ts:110-128` | **BLOCKED-ON-QUOTA** (cross-section) |
| **UX-E-21** Major · the visibility control says two opposite things | delete the stale per-mode sentence; surface the consequence at confirm | `1776:8377` Advanced tab (**not located**) · `914:4507` (mine) | Confirm half fully resolved: `914:4542` gains "1 hidden page will not be deployed." The helper deletion is a selector row. Plans: `publish-text-2.json`, `publish-crosssection.json` | Read from file: `914:4542` = `"⚠ This replaces the live site immediately for all visitors."` at `x=36 w=314` inside a 472-wide band (hence `width: 440`). Code at HEAD: `AdvancedTab.tsx:49-56` honest helper, `:57-61` the contradicting one, still present | **BLOCKED-ON-QUOTA** |
| **UX-E-22** Major · a configured collection can contribute nothing, silently | a picker over the real page list; a warning row on the checklist | Content `1776:8376` board `1170:4713` (**not located**) · `893:4518` (mine) | Checklist half recorded on `893:4518`'s name; the picker is a selector row that also carries QA-A-01's placement ruling (the field belongs on `1170:4713`, not the four dynamic-pages boards) | Code at HEAD: `cms.service.ts:240` `pages.find((p) => p.path === col.pageTemplatePath)`, `:234` requires both fields non-null — exact-string match, defect live | **BLOCKED-ON-QUOTA** |
| **UX-E-23** Major · the number approved is not the number deployed | state the deploy manifest | `914:4507` | `914:4524` "Pages" → "Deploy manifest"; `914:4526` "3 pages" → "3 pages + 12 generated from Blog", **right-edge-anchored** (`x = 496 - width`) so the longer string grows left and cannot escape the 520 board. Plans: `publish-text-2.json`, `publish-structure.json` | Read from file: `914:4526` at `x=446 w=50`, board right gutter `496`, board width `520` — the reason the naive width-only rewrite would have run 56px off the board. Code at HEAD: `publish.service.ts:329` `appendDynamicPagesToPublish` runs after the browser's count | **BLOCKED-ON-QUOTA** |
| **UX-E-24** Major · a simulated publish is indistinguishable from a real one | say it on the success state; suppress View live | new board `Publish · published (simulated)` ← clone of `784:4326` | Full clone spec: two copy replacements and `View live site` set invisible. Plan: `publish-states.json` | Read from file: `784:4386` = `"View live site"`, `784:4387` = `"Compare v14 → v15"` inside `784:4385 'actions'`. Code at HEAD: `route.ts:406-440` `runSimulation`, `:100-105` the opt-in flag | **BLOCKED-ON-QUOTA** |
| **UX-E-25** Major · raw server strings, and "already publishing" painted as failure | translate every error; give ALREADY_PUBLISHING a non-failure state | `784:4403` · caption `788:4320` | `784:4461` becomes the translated sentence; `v2/already-publishing` note at `x=16 y=300` says this code must not reach the red board. Plans: `publish-text-1.json`, `publish-structure.json`, `publish-text-3-captions.json` | Code at HEAD: `publish.service.ts:379`, `:386` throw `WORKER_DISPATCH_FAILED`; `sites.ts:339` maps `ALREADY_PUBLISHING` to a CONFLICT error. Board spacer `784:4438` spans 274–764, so `y=300` is free | **BLOCKED-ON-QUOTA** |
| **UX-E-15** Minor · three download buttons, no statement of the difference | one download action per format | `1172:4825` | **No change.** The board already draws exactly one download action | Read from file: `1172:4838 'foot'` contains `1172:4834 btn/Cancel` and `1172:4836 btn/Export as HTML` and nothing else — no "Download All", no "Download CSS". The board is already the corrected design; the defect is code-only (`ExportModal.tsx:102`, `:107`, `:354`, `:359`) | **ALREADY-CORRECT** |
| **UX-E-16** Minor · the export modal's CMS options never render | wire the section or remove it | `1172:4825` | Recorded on the board name. No control is drawn for it, so there is nothing to remove on the board | Read from file: `1174:4824 'tabs'` has `tab/Preview`, `tab/Code`, `tab/Options` — the tab exists on the board and leads to no drawn panel. Code at HEAD: `ExportModal.tsx:264` `<OptionsPanel config onChange />`, no `hasCMSBindings` | **BLOCKED-ON-QUOTA** (marker only) |
| **UX-E-26** Minor · "Compare v2 → v3" compares nothing | point the button at the comparison it names | `784:4326` · History › Published board in `1776:8374` (**not located**) | `add-hotspots.mjs` row fully specified except the destination id: `{ over: "784:4387", to: <History › Published>, name: "hotspot/compare-versions", pad: 6 }`. Plan: `publish-crosssection.json` | Read from file: `784:4387` = `"Compare v14 → v15"` and carries **no reaction** — the board draws a dead control, which is the defect. Code at HEAD: `PublishTab.tsx:498` emits `{ tab: "history" }` only | **BLOCKED-ON-QUOTA** |
| **UX-E-27** Minor · the disabled primary explains itself in two of three cases | every disabled state names its reason under the control | `784:4326` · `781:4489` · `778:4238` | Three `v2/reason-*` text nodes at `x=16 y=740` — the one band on a 280×812 panel where two lines fit without landing on a control. Plan: `publish-structure.json` | Read from file: on all three boards the `Panel footer` frame starts at `y=764` and the `spacer` above it is empty from `y=352`/`186`/`259`. Code at HEAD: `PublishTab.tsx:710` disables, `:748` and `:755` are the only reasons rendered | **BLOCKED-ON-QUOTA** |
| **UX-E-28** Minor · "Preview — None", forever | drop the row, or replace it with the draft-share link | `641:2652` · `784:4326` · `784:4250` · `784:4403` | **NOT applied — deliberately.** See §Decisions I did not take unilaterally | Read from file: the row exists on all four boards (`641:2672/2673/2675/2676`, `784:4397/4398/4400/4401`, `784:4320/4321/4323/4324`, `784:4474/4475/4477/4478`), value `"None"` on each — a prior arc (FIG-C-08) already drained the fake URL to `"None"` and left a note that the chevron still needs deleting. Code at HEAD: `usePublishSnapshot.ts:179` `preview: { label: "Preview", value: null }` | **BLOCKED** (on a decision, not on quota) |
| **UX-E-29** Minor · the panel has no door to publish history | a quiet "All versions" link on LAST DEPLOY | `641:2652` | `v2/all-versions` at `x=16 y=360` — inside the empty spacer, **not** on row `641:2701`, whose timestamp occupies `x=204..264`. Hotspot destination is a selector row | Read from file: `641:2701 'Row · v14 · live'` spans `y=320..352` with `641:2702` at `x=16` and `641:2704` at `x=204..264`; spacer `641:2705` spans `352..696`. Code at HEAD: the version list lives at History › Published, reachable only from SiteMenu | **BLOCKED-ON-QUOTA** |
| **UX-E-30** Minor · the wizard walks to the end before refusing a no-site publish | answer the precondition at the door | `833:4518` | Recorded on the board name with both citations. A separate `Publish · no site` board is **not** in the plan — the checklist is where the refusal belongs and one more near-identical 520-wide board would be noise | Code at HEAD: `PublishTab.tsx:266-278`, `PublishWizard.tsx:222-229` — Continue is enabled over an empty check list | **BLOCKED-ON-QUOTA** (marker only) |
| **UX-E-31** Critical · module summary | one state machine, one progress vocabulary, one gate, a named way out of every terminal state | whole module | The seven-state table from `SPEC-PUBLISH-PANEL` §2.2 is the spine of this plan. V1 draws four of the seven; the plan adds `cancelled` and `lost contact` as boards and `blocked` as the checklist's seventh row, leaving `idle`, `publishing`, `published`, `failed` where they are. The V2 corrected-panel copy (`build-polished-panels.mjs:97-127`) is the source for every new string | V2 source read **locally**, not over MCP: `scripts/figma/build-polished-panels.mjs` is the script that drew section `2797:559`'s seven states, so its `ps` array is the board content verbatim | **BLOCKED-ON-QUOTA** |

**Counts** — 31 rows: `ALREADY-CORRECT` 3 (UX-E-08 board half, UX-E-11 board half, UX-E-15) · `BLOCKED` on a decision 1 (UX-E-28) · `BLOCKED-ON-QUOTA` 27 · `IMPLEMENTED` **0**, because no write reached the file and this report will not claim one without a read-back.

---

## Decisions I did not take unilaterally

**1. UX-E-28 — the Preview row.** The fix offers two moves: drop the row, or
replace it with the draft-share link. I planned the second (relabel to
"Share link" / "Copy"), then withdrew it. Two reasons, both worth a founder
call rather than my judgement:

- `SPEC-PUBLISH-PANEL` §3 deletes **ENVIRONMENT as a section**, not just the
  Preview row — the Production row becomes the panel's leading status sentence
  and "two rows became one sentence". Relabelling the Preview row instead
  entrenches a section the spec removes, on four boards.
- The share link is owned by `access-tab.tsx` + `share-link.service.ts` in the
  dashboard (`QA-B-19`), not by the editor. Putting its door in the Publish
  panel is a new IA edge, not a copy fix.

The row as it stands is at least honest — a prior arc already drained the fake
`brk-preview.vercel.app` to `"None"`. Leaving a true-but-useless row beats
inventing a door.

**2. The expanded drawer, 700 vs 560.** The brief says **draw 700** and file the
560 proposal as an open decision. `SPEC-PUBLISH-PANEL` has since had a
reconciliation section appended (2026-09-07) that concedes to 560 on arithmetic:
at 1440, a 700 drawer plus the 60 rail and 300 inspector leaves 380px of canvas
against a 1024 desktop-frame floor. **I drew neither** — no board in my two
sections is an expanded-drawer state (every panel board is 280 and every wizard
board is 520), so the conflict never bound my work. Recording it because the
brief asked, and because a later agent redrawing the Publish panel expanded
WILL hit it.

**3. UX-E-13 — no `Export · failed` board.** The finding is Critical and the
honest fix is a state the modal does not have. I stopped at a board marker
because a new modal board needs a footer outcome region, an error sentence and
a retry, and `1172:4825` is 560×293 with its foot at `y=252` — there is no
vertical room to draw the outcome in place, and a new board is a design
decision about where export failure is reported (in the modal, or as the toast
`useExportHandlers.ts:82-103` already implements and nothing calls). Named, not
guessed.

---

## Provenance — read vs inferred

**Node ids READ from the live file** (full dumps, before the cap). Everything in
`publish-marks.json`, `publish-text-1.json`, `publish-text-2.json` and
`publish-structure.json` is addressed by these:

| Board | id | what I have |
|---|---|---|
| Publish · panel | `641:2652` | every child id, geometry, text, and all 8 outbound edges |
| Publish · live | `784:4326` | same |
| Publish · publishing | `784:4250` | same |
| Publish · failed | `784:4403` | same |
| Publish · unavailable (feature off) | `784:4480` | same |
| Publish · load-error | `781:4489` | same |
| Publish · loading | `778:4238` | same |
| Publish · pre-checks | `833:4518` | same, incl. all four `Fix ›` destinations |
| Publish · pre-checks · blocked | `893:4518` | same |
| Publish · Confirm | `914:4507` | same |
| Publish · issues-confirm | `1168:4732` | same |
| Publish · stale-approval | `1168:4713` | same |
| Export · HTML (modal) | `1172:4825` | same |
| [not-implemented] Publish · Options | `912:4520` | same |

Plus the two **section listings** — `1776:8378` (20 boards: id, name, xy, size)
and `1779:4` (8 boards) — which is where every Preview board id and every
`caption/*` id in this report comes from.

**INFERRED, not read:**

- **The current characters of the six `caption/*` nodes** (`788:4316`–`788:4321`).
  Their **ids** are read (section listing); their **text** is reconstructed from
  `docs/design-jobs/applied/plan-text-A.json` and `plan-qa-text.json`. Every row
  in `publish-text-3-captions.json` therefore carries a short `expect` prefix
  that both known revisions share, so a stale plan is refused rather than
  applied. `QA-C-08` records that one `788:4321` rewrite was silently skipped by
  exactly this guard — that row is re-issued with the correct `expect`.
- **Every child id of `2429:11904`.** The board id is read; its text nodes are
  not. `publish-text-4-preview.json` is entirely selector rows, and the exact
  current characters are known from `scripts/figma/build-preview-reference.mjs`,
  which wrote them.
- **Every board in `publish-crosssection.json`.** I never located the topbar
  board, the History › Published board, the Pages page-settings tabs, the
  Settings SEO screen, or the Content collection-setup modal. Each row names its
  section id and the text to match on.

---

## What I did NOT cover

Plainly, because six of eighteen boards walked is six.

1. **No Figma write was performed. Zero.** Nothing in section `1776:8378` or
   `1779:4` has changed. `verify-invariants.mjs` was **not run** — the
   coordinator's stop covers read-only calls, and a quota string is not a
   measurement. Anyone applying these plans must run it afterwards; the two
   riskiest edits for it are the `+36px` board growth on `833:4518` / `893:4518`
   (board-overlap check) and the four clones landing at `y=220` (I computed
   `x = 380 / 660 / 940 / 1220` from the section's own measured grid, but
   `add-state-board` re-derives and collision-tests this itself).
2. **Six of the twenty boards in section 15 were never dumped**: the six
   `caption/*` TEXT nodes. Ids read, contents inferred.
3. **Seven of the eight boards in section 14 were never dumped.** I have their
   ids and full names from the section listing — enough for the five board
   renames in `publish-marks.json`, which are name-only edits — but I never read
   inside `817:4899`, `817:4856`, `817:4950`, `1157:4593`, `879:6901`,
   `879:6896`, `817:4774`, or `2429:11904`.
4. **The V2 source boards were never read over MCP.** `2797:559` reached me
   through `scripts/figma/build-polished-panels.mjs`, which is the script that
   drew it — good enough for the seven-state copy, and it is the same content.
   `2797:342`, `2797:574` and `2797:2` reached me only through
   `scripts/figma/build-proposal-page.mjs` (journey 4: 8 steps, 7 broken, first
   stop at step 3) and the local `UX-FLOW-MAP.md` / `PHASE4-QA-REPORT.md`. **I
   did not lay eyes on a single V2 board**, so if any of those four sections
   carries content its builder script does not, I missed it.
5. **Eleven findings live on boards outside my two sections** and are handed off
   as selector rows: UX-E-02 (topbar half), UX-E-05, UX-E-12 (topbar half),
   UX-E-17 (overlay half), UX-E-18 (overlay half), UX-E-19, UX-E-20, UX-E-21
   (helper half), UX-E-22 (picker half), UX-E-26 (destination), UX-E-29
   (destination). Four of these belong to the Pages, Settings, Content and Shell
   agents; if those agents are also editing, my `expect` guards protect against a
   collision but my selectors may go stale.
6. **No screenshot comparison.** The founder's own acceptance for this arc is
   "board screenshot vs live screenshot, side by side, by eye". Nothing here was
   verified that way, and the brief's own warning applies: a silent sweep is the
   quota, not a clean file.

---

## Contradictions with the V2 source, recorded rather than resolved

1. **`SPEC-PUBLISH-PANEL` §1 and §6 rest on "cancellation is built end to end".
   It is not**, and `PHASE4-QA-REPORT §1.2` is right: there is no cancel check
   across the Vercel deploy (`route.ts:374` → `runVercelDeploy` at `:375` → next
   check `:387`), `DEPLOYING` is not cancellable at all
   (`publish.service.ts:414`), and `:425-428` forces `site.status = "DRAFT"` on
   cancel, mislabelling a site still serving a previous deploy. **My cancelled
   board does not say "nothing was deployed."** It says "If the deploy had
   already started it may still finish. We will tell you which." Acceptance #5
   as written is unsatisfiable and my plan does not draw it.
2. **The spec says two of its fourteen fixes are server-side. Seven are** — also
   `PHASE4-QA-REPORT`'s finding, and it changes what a design review is signing
   off. Recorded on the boards that depend on them (`833:4518`, `893:4518`,
   `914:4507`, and the CMS row in `publish-crosssection.json`).
3. **`UX-E-01` is closed in code** at `11541dc35`, after the audit. The V2
   proposal board's own headline for this module — "the panel today has three
   states and opens in the wrong one" — is now half stale: it still opens with
   the wrong *change count* (`usePublishSnapshot.ts:157` is still the undo
   stack), but it no longer greys its CTA on reload. Any board that repeats the
   old sentence would be printing a claim the code contradicts, which is the one
   thing the precedence rule forbids.
4. **The audit calls this "Publish panel (rail · U)". There is no rail button.**
   `publish` is in `GROUPED_TABS_CONFIG` and absent from `RAIL_FIGMA`, whose own
   comment reads "publish → topbar Publish button". `UX-FLOW-MAP` §1 already
   settled this and I followed it: read "rail · U" as "shortcut U".
5. **The brief's CMS framing is wrong and `UX-E-31` corrects it** — canonical
   and og:url on generated detail pages are NOT the template's; the server
   injects a correct per-path pair. Carried into `publish-crosssection.json` so
   the Content agent does not re-file the refuted half.

---

## Apply order (it matters in three places)

```
1  apply-truth-marks.mjs   plans/publish-marks.json        --apply    # 13 board names
2  add-state-board.mjs 784:4403 "Publish · cancelled"      --apply
3  add-state-board.mjs 784:4403 "Publish · lost contact"   --apply
4  add-state-board.mjs 784:4326 "Publish · published (simulated)" --apply
5  add-state-board.mjs 784:4480 "Publish · no Vercel connection"  --apply   # BEFORE step 6
6  apply-text-fixes.mjs    plans/publish-text-1.json       --apply
7  apply-publish-v2-states.mjs                             --apply    # clone copy, hotspots, final names, preview board
8  apply-text-fixes.mjs    plans/publish-text-2.json       --apply
9  apply-publish-v2.mjs                                    --apply    # structural; AFTER step 5 (hides 784:4517)
10 apply-text-fixes.mjs    plans/publish-text-3-captions.json --apply
11 verify-invariants.mjs                                              # NOT run by me
```

Three ordering constraints, each of which silently corrupts the result if
ignored: **step 5 before step 6** (the clone must inherit the Vercel copy before
the original is rewritten); **step 5 before step 9** (step 9 hides the button
step 5's clone needs to keep); and **steps 2–4 before step 7** (step 7 finds the
clones by name, and step 7 then renames them to their markers, so it cannot run
twice against the short names).

`scripts/figma/apply-publish-v2.mjs` and
`scripts/figma/apply-publish-v2-states.mjs` are new, committed, syntax-checked,
and idempotent — every node they create is named `v2/<key>` and removed before
being recreated, so a re-run replaces rather than stacks. Both read back every
node they claim to have written and print the value from the file, not from the
local handle.
