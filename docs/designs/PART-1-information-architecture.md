# Part 1 — Information Architecture

> **The editor's structure, settled.** Where every surface lives and why. No audit history, no superseded markers, no alternatives — those live in `2026-07-17-editor-product-redesign-complete.md`. This is the answer.
>
> Read this before any screen work. Parts 2+ (shell dimensions, panel contents, inspector, floating panels, Site, the wedge) all assume this structure.
>
> ## ⚠ This is the TARGET architecture, not what ships today
>
> Every structure below is where things **will** live. Almost none of it is the current build. A verification pass on 2026-07-18 found 42 claims in an earlier draft that reported engine registries as if they were shipped UI — the single most important thing to know when reading this file.
>
> **Today the editor actually has:** a 5-tool rail in 2 labelled zones (`add · assets · components` / `layers · pages`) with **no Content tab and Brand routed to the topbar ⋯**; Settings as a **320px drill-in panel, not a full page**; a ⌘K palette that **ignores** the 39 registered commands; an Insert panel showing **59 blocks in 6 categories** (the 63/7 figure is the registry, not the panel); **no `/review` route, no Portfolio, no brand push, no publish history** in the editor; and `FEATURE_PUBLISH`, `FEATURE_DS_AI`, `FEATURE_COMPONENTS_V2` all **defaulting to false**, which gates the Publish CTA and Brand's AI generation off.
>
> **Every count in this file is illustrative, not authoritative.** The authority is `GENERATED-inventory.md`, emitted straight from the code's own SSOT files by `node .render/inventory.mjs`. It exists because 42 hand-written counts across these docs were found wrong in one audit — and it reports a zero as a *broken pattern*, never as an answer. If a number here disagrees with it, the generated file is right about the code.
>
> **For what is actually built vs broken, read `2026-07-18-editor-complete-state.md`.** That doc owns current state; this one owns target structure. Do not read a number here as a statement about the running product.
>
> **Platform: desktop only.** Editor and Site are desktop surfaces. The client review page is also desktop — reaffirmed 2026-07-18 after a cross-model review argued for mobile; the call stands and is not reopened.

---

## 1. The rule that decides everything

Eight questions, eight homes. Every surface in the product answers exactly one of these.

| Question the surface answers | Home |
|---|---|
| "What do I add or navigate to on this page?" | **Left rail** |
| "What is the state of this document or this review?" | **Topbar** |
| "How am I looking at the canvas?" | **Canvas toolbar** |
| "What is this thing I selected?" | **Right inspector** |
| "Is anything wrong / am I synced?" | **Footer** |
| "How does this site behave once it's live?" | **Site full-page** |
| "What does my client see?" | **Client** (dashboard package) |
| "What is true across **all my clients**?" | **Portfolio** (dashboard package) |

**The membership test for the left rail — two parts, both required:**
1. Does it operate on **this document**, rather than on the site, the account, or other sites?
2. Is it **browse-and-place** or **find-and-select**, rather than a form?

Both yes → left rail. That correctly seats Insert · Layers · Pages · Media, correctly ejects everything in Site, and correctly flags **Brand** and **Content** as borderline — which they are (Brand is roughly 40% non-canvas: import/export, lint, DS-mode).

*A one-part test — "does it change the canvas?" — was tried first and is refuted by its own example: **brand push** changes 4 sites, 27 pages and 312 elements, making it the most canvas-changing operation in the product, yet it is correctly not a rail item. Part 1 of the test catches it: it operates on other documents.* The test's real job is regression defence — a line you can say out loud to stop the rail regrowing to eleven tabs.

---

## 2. The nine regions

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▤ TOPBAR — global state + the one CTA                                │
├──────────────────────────────────────────────────────────────────────┤
│   PAGE TABS — the working set (conditional, >1 page)                 │
├────┬─────────────────┬────────────────────────────┬──────────────────┤
│ ◧  │  DRAWER         │  ▣ CANVAS                  │ ▥ INSPECTOR      │
│ R  │  the open       │                            │ edit the         │
│ A  │  panel          │   ▨ canvas toolbar         │ selection        │
│ I  │                 │      (floating pill)       │                  │
│ L  │                 │                            │                  │
├────┴─────────────────┴────────────────────────────┴──────────────────┤
│ ▁ FOOTER — status only                                               │
└──────────────────────────────────────────────────────────────────────┘

        🗔 SITE      — full-page takeover, from topbar ⋯
        👤 CLIENT    — outside the editor (dashboard) — what the client sees
        🏢 PORTFOLIO — outside the editor (dashboard) — everything above one site
```

### ◧ 1 · Left rail — six tools, frequency-ordered

Six flat icons. **No groups.** Grouping is one level down, inside a panel.

| # | Tool | Holds |
|---|---|---|
| 1 | **Insert** | 50 element types · blocks (registry 63 / 7 categories; the shipped panel today lists 59 / 6 — defect N2, unify on the registry) · components (browse + insert) · section templates · My Templates · Paste HTML |
| 2 | **Layers** | active-page tree · search · reorder · hide/lock · group · context actions |
| 3 | **Pages** | site tree · CRUD · folders (1 level) · bulk actions · SEO listings view · page settings (580w modal) |
| 4 | **Media** | grid · folders + smart folders · upload · stock · image editor · optimise · 368 icons / 17 categories · replace-across · versions · quota · alt-text AI |
| 5 | **Content** | CMS collections · records + per-record publish · dynamic pages · repeaters · **Data** (sources · global variables · conditions) |
| 6 | **Brand** | 9 sections: tokens (14 kinds / 94 defaults) · presets (18 / 11 categories) · starters (6) · classes · components · typography + fonts · colour mode · lint · import/export |

**Why this order — and its status.** Ordered by **adjacency first, frequency second**: Insert and Layers are the ping-pong pair in any builder (drop a thing, then go find it), so they sit together. Media follows because it feeds Insert. Pages, Brand and Content are phase tools — heavy in week 1 or week 5, quiet otherwise — so they trail.

⚠ **The frequency claim is a hypothesis, not a measurement.** It came from founder instinct, not instrumentation. It is also phase-dependent: week 1 is Brand·Pages·Insert, week 3 is Layers·inspector, week 5 is Layers·Media·comments — a frequency-ordered rail describes an average user at an average moment, who does not exist. Validate it by instrumenting panel-open counts per project week before treating the order as settled; a rail order is learned in week one and costs muscle memory to change.

**Behaviour:** icons are persistent; clicking one swaps the drawer; clicking the active one closes it. The drawer is transient by default (overlays, auto-closes on canvas interaction) and pushes when pinned.

**Plus one conditional item.** While a review is live, a **seventh icon appears at the bottom of the rail, below a divider**, and disappears when the review closes:

| ● | **Review** | resolve queue (`9 of 12 resolved`) · jump to next comment · compare with approved · re-send |

This is the wedge's address. Sign-off *status* stays ambient (topbar pill, canvas pins, the approved anchor in Versions) — but sign-off *work* now has one owner. The question a designer actually asks between rounds — **"what do I still owe the client before I re-send?"** — is answerable on one surface instead of smeared across four. The shell already tolerates conditional chrome (page tabs, recovery banner), so this costs no structural change.

**Shortcuts (target).** `A` Insert · `L` Layers · `P` Pages · `M` Media · `D` Content · `B` Brand · `R` Review (when live).
⚠ Today's bindings differ and must be remapped: layers is **`Z`**, `D` is bound to **design/Brand**, and `B` is bound to nothing.

### ▤ 2 · Topbar — global state and one CTA

`‹ Exit · Site name` — `Save-status pill` — `Review-status pill` — `[ Send for review ] / [ Publish ]` — `⋯`

- **Save pill** carries four states plus offline, and **opens Versions** — document state leads to document history.
- **Review pill** carries four states: pending · changes-requested · approved · edited-since-approval. When a review is live it expands into the review bar.
- **The CTA is state-dependent** and is the only filled cobalt button in the chrome: `Send for review` before a review, `Publish` once approved, disabled with a reason while pending.
- **⋯** — Site · Preview as client · Invite teammates · Help & shortcuts · ⌘K · Account.

Nothing that acts on the canvas lives here. No navigation lives here.

### ▨ 3 · Canvas toolbar — how you are looking at the canvas

Floating pill, bottom-centred over the canvas: `undo/redo · device & breakpoint · preview · 💬 comment mode · view options · zoom · ?`

Devices: **wide · desktop · tablet · mobile** — 4. *(Reconciled 2026-07-19 against `BreakpointSwitcher.tsx:40`, whose `Breakpoint` type carries exactly these four. This line previously claimed 5 including a `watch` device and asked someone to reconcile it; the code was the answer all along.)*

It floats so it never steals canvas height. **View options** is one popover: grid · rulers · guides · spacing · badges · X-ray · device frame · canvas prefs (grid + snap).

### ▣ 4 · Canvas — the page and direct manipulation

Page render · selection box + handles · hover overlay + spacing labels · smart guides · snap · rulers · guides · measurements · selection label · floating selection toolbar (ancestors · duplicate · delete · copy · wrap · move · +Add · ✨AI) · inline text editing + rich-text bar · right-click context menu (including *create component from selection* and *save as template*) · drop feedback · section reorder handles · **comment pins** · device frame · empty-canvas CTA · first-run coach.

### ▥ 5 · Right inspector — the selection

One scrolling column, **no tabs**. Header · breadcrumb · context bar (`This ▾ · Desktop ▾ · Base ▾`) · 18 sections ordered per element profile · Variant (instances) · component management · form settings · CMS binding · a11y findings. Shares its column with the AI panel during an agent run.

### ▁ 6 · Footer — status only

`Issues pill → issues panel` · sync status · breadcrumb. Never actions, never navigation.

### 🗔 7 · Site — everything that never touches the canvas

Full-page takeover from topbar ⋯. Nav 240 + content 720.
**SITE** General · SEO · Analytics · Custom code — **DISTRIBUTION** Domains · Redirects · Headers · Localization — **DATA** Forms · Integrations — **SHIP** Publish history · Export — **WORKSPACE** Members ↗ · Billing ↗ (leave for the dashboard).

*(Brand push moved to Portfolio — it operates on other sites, so launching it from one site's settings was a category error.)*

### 👤 8 · Client — what the agency's client sees

Outside the editor entirely, shipped from the **dashboard** package as a public tokenized route.
Client review page (`/review/<token>`) · identity capture on first visit (name + email, no password) · comment pins · approve / request changes · "what changed since last review" · white-label (agency logo and brand colour) · approval audit trail.

### 🏢 9 · Portfolio — everything above one site

Outside the editor, in the **dashboard** package. This is the region the IA was missing: every other region is scoped to one site, while the primary user runs 4-20 client sites at once.

| Holds | Why here |
|---|---|
| **All client sites** — status, last edited, review state, published state | the orientation surface an agency opens first |
| **Shared templates** | reuse across clients is the agency's real asset; site-scoped "My Templates" cannot express it |
| **Shared components** | same |
| **Brand kits** | one client's brand, reusable across their sites |
| **Brand push** — pick sites → diff → blast radius → confirm → rollback | **moved here from Site.** A cross-site operation launched from one site's settings is a category error, and this is the only flow that can damage a site the designer is not looking at. |
| **Handover** — what state is this site in, what has the client said, what is left | a weekly agency event with no surface until now |

**Cross-document transactions live here.** A brand push writes into several documents that none of those documents' own histories authored. Per-site Versions cannot model that, so the push's record — what changed, where, by whom, and the 24h reverse — belongs to the Portfolio, and each affected site's version list links back to it rather than inventing an author.

---

## 3. Deliberately not in the rail

Every one of these was considered for a rail slot and placed elsewhere. The reasoning matters, because the temptation to put them back will recur.

| Surface | Where it went | Why not the rail |
|---|---|---|
| **Templates** | full-page → New-Page flow · section → Insert | Templates are used at page-creation and at section-insert. Both moments already have a home. A rail slot would be a third surface for something used twice a project — and it is why three template surfaces existed. |
| **AI** | ⌘K + canvas selection toolbar; agent runs promote to the right panel | AI assists across every tool — draft, edit a selection, write copy, generate alt text. A cross-cutting assist is a launcher, not a destination. |
| **Comments** | canvas mode (💬, key `C`) + slide-in thread list | The conversation is anchored to the design, not to a panel. Pins live on the canvas because that is what they point at. **Comment mode must not disable the rail or inspector** — reading "hero too dark" and being unable to fix it without leaving the mode breaks the exact loop the product exists for. Pins stay visible while editing. |
| **Versions / history** | save-status pill → Versions panel | Document state leads to document history. One click, no kebab dive — restore is the safety net when client feedback thrashes a design, and safety nets do not live in overflow menus. |
| **Component management** | see the three-home rule below | Browsing is inserting; editing an instance is the inspector; **editing the definition needed a home and did not have one.** |

**The component object — one canonical home per job.** Components appeared in three places with no stated relationship, while §3 congratulated itself for dissolving three template surfaces. Resolved:

| Job | Home | Canonical? |
|---|---|---|
| Insert an instance | **Insert › Components** | yes, for insertion |
| Edit *this instance* (variant · detach · reset) | **inspector › Variant** | yes, for instances |
| Edit the **definition** (rename · variants · props · delete) | **Brand › Components** | **yes — this is the canonical definition surface.** Editing a master with nothing selected had no home before. |

Rule: Insert never edits, the inspector never edits definitions, Brand never inserts.
| **Settings · Domains · Export · Publish history** | Site full-page | Part 1 of the test: they operate on the site, not this document. |
| **Brand push** | **Portfolio** | It operates on *other* documents. Part 1 of the test ejects it from the rail; the Portfolio region is where it actually belongs. |
| **Sign-off status** | topbar pill (ambient) | Status is ambient by design — pill, canvas pins, the approved anchor in Versions. **Sign-off *work* is different and does have a home**: the conditional Review rail item (§2). The earlier version of this IA gave the noun four regions and the verb none. |

---

## 4. Navigation hierarchy

Three levels, one expression each.

| Level | Holds | Expression |
|---|---|---|
| **Primary** | the six canvas-interacting tools | the left rail — icons only, never labels-plus-icons, never a second rail |
| **Secondary** | sections inside a tool | either collapsible groups in one column (Insert · Layers · Pages) or a drill-in stack with a back row (Brand · Content · Media detail) |
| **Tertiary** | controls and rows | inside a section; never another chrome-level nav |

**Rules:**
1. The shell never changes between screens. Same rail, same topbar, same footer — only the active tool and the content change.
2. No second vertical panel of equal weight beside the rail. The drawer is subordinate: narrower context, one tool's contents, gone when that tool is not active.
   **Exception — selection-coupled panels.** Layers and the inspector both update when the canvas selection changes; they are selection surfaces, not browse surfaces. Layers therefore **does not auto-close on canvas interaction** and remembers its pinned state per project. A panel you select *with* cannot vanish the moment you select.
3. **Drill-in over tabs** wherever a panel has more than three sections. At 320px a five-way segmented control gives each option 57px; nine tabs is not expressible at all. Drill-in scales and matches the locked sidebar pattern.
4. Site is a takeover, not a modal and not a separate app — it needs depth and deep links, but you must return to the canvas in one click.
5. **Conditional rail items are allowed, below a divider, only for an active state** — never for a capability. Review qualifies (a review is either running or not). Content does not (CMS is a capability, and hiding it is how a feature goes undiscovered).

---

## 5. Job → where the work happens

The six jobs are the product lens, not nav labels. Each spans several regions; this is the map from what the agency is trying to do to where they do it.

| Job | Regions involved |
|---|---|
| **J1 Discover & onboard** | canvas (first-run coach, empty CTA) · overlay (checklist) · New-Page flow |
| **J2 AI-draft** | ⌘K (prompt) · right panel (agent run) · canvas (result) |
| **J3 Build the page** | rail (all six) · canvas · inspector · canvas toolbar — the bulk of the product |
| **J4 Make it on-brand** | rail › Brand · inspector (token binding) · **Portfolio › Brand push** (cross-site) |
| **J5 Get client sign-off** | **rail › Review** (the resolve queue — the owner) · topbar (CTA + status pill) · canvas (comment pins) · save pill (Versions + Compare) · **Client** (the review page) |
| **J6 Ship & run** | topbar (Publish) · Site (settings · domains · export · history) |

**J5 spans five regions, but one owns it.** Status is ambient across the editor — that part was always right. What changed: the *work* of resolving a round of feedback now has a single surface (rail › Review) instead of being distributed until no one owned it.

---

## 6. Every feature and its target home

**Placement only — no counts, no build status.** Both rot within a sprint and this document cannot be where they live. Counts come from `GENERATED-inventory.md` (emitted by `node .render/inventory.mjs`); build status comes from `2026-07-18-editor-complete-state.md`. **If a number appears below, it is a bug.**

**Insert** — element types · blocks · component catalog + user-saved · section templates · My Templates · search · drag + click · recent · Paste HTML

**Pages** — tree · create · duplicate · delete + undo · set home · copy link · rename · bulk select and actions · folders · SEO listings table · page settings modal · page command palette

**Layers** — tree · search · reorder by drag · hide · lock · group · ungroup · context actions · expand/collapse all · display settings

**Media** — grid · folders · smart folders · upload + retry · stock · image editor · optimise · icons · replace-across-site · asset versions · storage quota · alt text + AI generation

**Content** — collections · fields · records · per-record publish · dynamic pages · repeaters · data sources · global variables · conditions · bindings

**Brand** — tokens · presets · starters · global classes · DS components + AI generation · typography + fonts + custom upload · colour mode preview · lint + auto-fix · usage map + safe rename · import/export · DS mode

**Inspector** — sections per element profile · per-breakpoint overrides · pseudo-states · reach · token binding · CMS binding · component variants + detach + reset · form settings · interactions · animation · visibility · element properties · CSS classes · AllCSS · multi-select align + distribute + batch

**Canvas** — drag · select · multi-select · resize · rotate · inline edit · nesting rules · context menu · pick mode · zoom to fit · overlays · selection toolbar · comment pins · device frame

**Topbar** — exit · site name · save state · review state · send for review · publish · preview as client · invite · help · ⌘K · account · Site

**Canvas toolbar** — undo · redo · device + breakpoint · preview · comment mode · view options · zoom · shortcuts

**Footer** — issues + panel · sync status · breadcrumb

**Site** — General · SEO · Analytics · Custom code · Domains · Redirects · Headers · Localization · Forms inbox · Integrations · Publish history · Export · Members ↗ · Billing ↗

**Portfolio** — all client sites + status · shared templates · shared components · brand kits · brand push · handover · cross-document transaction record

**Client** — review landing · identity capture · site preview · comment pins · approve · request changes · what-changed · white-label · audit trail · expired-token

**Review** *(conditional rail item)* — resolve queue · jump to next comment · compare with approved · re-send · round history

**Floating** — ⌘K palette · Versions + Compare · Issues panel · AI agent panel

**Engine, no surface** — Composer + managers · history + transactions · version timeline · storage · recovery · sanitize · export injectors · page router · fonts · migrations

### 6.1 Where each kind of truth lives

| Question | Source |
|---|---|
| Where does X go? | **this document** — §2 and §6 |
| How many of X are there? | `GENERATED-inventory.md` — generated, never hand-written |
| Is X built, stubbed, gated or absent? | `2026-07-18-editor-complete-state.md` |

The inventory is generated and reports a zero as a broken pattern rather than an answer. That is the only reason a number in a design doc is worth trusting.

### 6.2 Surfaces that exist today with no place in the target IA

Real code that must be reconciled, not ignored: **BlockPickerModal** (canvas `+Add` — today the only surface exposing the full block catalog; fold into Insert) · **ElementsTab** (a second, unrouted Insert panel; delete) · **StructurePopover** (layers in the footer, contradicting "footer = status only"; delete, Layers owns it) · **ProjectSettingsModal** (second settings surface; reduce to canvas prefs) · **PublishDropdown** (the CTA is a dropdown today, not the plain button §2.2 describes) · **ConflictModal · recovery banner · AchievementPrompt** (transient states — no region needed, but list them or they get re-invented) · **ConnectionQualityIndicator** (collaboration UI beyond presence/cursors) · **dashboard site surfaces** (`sites/[id]/{settings,domains,access,feedback,publish,redirects,seo,analytics}` duplicate much of Site; `access` and `feedback` appear nowhere in this IA — decide which package owns each before building either).

---

## 6.5 Limited, coming-soon and deferred — where each lands

These exist in some form: stubbed, demo-only, gated, or saved-but-not-enforced. **They get a home now, before they are finished.** A feature that arrives without a pre-decided home gets bolted onto whatever surface is nearest — which is how the rail reached eleven tabs.

**Status is deliberately not stated here.** Every status claim in an earlier draft of this table was checked against the code and several were wrong. Status lives in `2026-07-18-editor-complete-state.md`; this table owns placement only.

| Feature | Target home |
|---|---|
| **Real-time team collaboration** | presence avatars → **topbar** · live cursors → **canvas** · live comments → **already the canvas comment mode** |
| **Third-party integrations** | **Site › DATA › Integrations** — a connection list, one row per service |
| **AI image generation** | **Media › Generate** · the Insert image element's empty state · a step in an AI panel run |
| **Advanced ecommerce** | **Insert › Ecommerce** (blocks) · **Content › Products** (the collection) · **Site › Integrations › Stripe** (keys and checkout) · inspector (per-block settings) |
| Whole-site AI draft | ⌘K brief → AI panel run → canvas result |
| Redirects · Headers · Localization | Site › DISTRIBUTION |
| Forms | Site › DATA › Forms |
| Figma token export | Brand › Import/export |
| Vue and Next.js export | Site › SHIP › Export |
| Custom domains | Site › DISTRIBUTION › Domains |
| Publish rollback | Site › SHIP › Publish history |
| Email providers | Site › DATA › Integrations |
| Plugin manager | no home — cut, or Site › SHIP if it becomes real |
| AllCSS raw editor | inspector, last section, Pro-gated — or delete |
| Animation timeline editor | inspector › Animation |
| Interaction reverse | inspector › Interactions |

### The rule this section encodes

**Nothing on this list earns a new region.** Collaboration lands in the topbar and canvas, integrations and email in Site, image generation in Media, ecommerce across Insert/Content/Site. If a future feature genuinely fits none of the nine regions, **that is the signal to revisit the IA — not to add a rail icon.**

**And nothing ships pretending to be finished:**
1. A saved-but-not-enforced setting carries a permanent, non-dismissible banner.
2. A coming-soon card with no build date gets cut, not displayed.
3. A feature that fakes its output — image generation returning stock photos, presence showing invented users — is either finished or removed. Faking is worse than absent, because it burns trust the honest features paid for.

---

## 7. Decisions, current

| # | Decision | Rationale |
|---|---|---|
| 1 | **Rail is tool-based, not job-based** | A builder is an editing cockpit, not a wizard. The designer bounces between insert, select, page-switch and style every few seconds. Job framing stays authoritative for roadmap and completeness — not for nav labels. |
| 2 | **Six rail items, frequency-ordered** | Canvas-interacting only. Settings and publish moved out, which is what got the rail from eleven tabs to six. |
| 3 | **Drill-in, not tabs, past three sections** | Arithmetic: 320px cannot express five segments, let alone nine tabs. |
| 4 | **Drawer transient by default, pinned by choice** | Keeps canvas width monotonic as the window narrows, and keeps the canvas full while you work. |
| 5 | **Inspector has no tab strip** | Tabs hid two-thirds of the inspector behind a click. One column, ordered per profile, is the "6 → 2" win. |
| 6 | **Templates dissolved; AI is a launcher; comments are a mode; versions live on the save pill** | Each was competing for a rail slot it did not earn. |
| 7 | **Client review page is desktop, and lives in the dashboard package** | The Vite editor has no server routes and cannot verify a token; the dashboard already ships the tokenized-route pattern. Desktop-only reaffirmed 2026-07-18. |
| 8 | **Client identity is hybrid** | Token grants access; name and email captured on first visit. No password, no account — but attribution survives for the audit trail. |
| 9 | **Portfolio is a region** | Every other region is scoped to one site; the user runs 4-20. Cross-client reuse, brand push and handover had no home, and cross-document transactions had no owner. This is what makes it an *agency* IA rather than an editor IA. |
| 10 | **The wedge gets one owned surface** | Sign-off status stays ambient, but the *work* of resolving a round of feedback lives on a conditional Review rail item. Distributing the verb across four regions meant no surface answered "what do I still owe the client?" |
| 11 | **Limited features get homes before they are built** | Collaboration, integrations, image generation and ecommerce all land inside existing regions (§6.5). None earns a new one. A feature arriving without a pre-decided home gets bolted onto whatever is nearest — that is how the rail reached eleven tabs. |
| 12 | **Site is a full-page takeover** | Fifteen destinations need depth and deep links; a modal cannot carry them, and they never touch the canvas. |

---

## 8. What Part 1 does not decide

Dimensions, states, copy and control anatomy — those are Parts 2+. This part answers only *where*.

Open questions that will change structure if they resolve differently:
1. **Integrations** — cut the six coming-soon cards or build one real integration. Affects whether DATA has one row or two.
2. **AllCSS** — Pro-gate and sanitise, or delete. Affects whether the inspector has 18 sections or 17.
3. **Plugin manager** — implemented, flag-dead, never used. Affects whether Site gains a row.
4. **Comment ↔ version ↔ element anchoring.** A client can comment at 11pm mid-edit. Does the review link render a snapshot or the live draft? If live, they comment on work that no longer exists; if a snapshot, their pins anchor to elements the current draft may have deleted. The IA has no concept of an **orphaned comment**, and "click a comment → canvas scrolls to its pin" has no target when the element is gone. This is an IA question, not a token-security one.
5. **Review history.** The pill and the Review panel carry *the current* round. Round 3 has no way to see rounds 1 and 2 — a review loop with no memory.
6. **Which package owns Site.** The dashboard already ships settings, domains, redirects, SEO, analytics and publish for a site; the editor's Site region would duplicate them. Pick one before building either.
7. **Inspector tabs — three sources, three answers.** This doc says no tabs; the screen specs say Look/Layout/Effects; the code says Style/Element/Effects. The no-tabs call stands, but the other two must be corrected.
8. **Reach strip** — "All like this" works; "This item" and "Whole site" are decorative today. Decide whether the target keeps all three.
9. **Templates need a library.** Portfolio now homes shared templates, but nothing yet specifies where you *see, rename, organise and delete* them. Insert's `▸ MINE` collapses once an agency has thirty saved sections.
