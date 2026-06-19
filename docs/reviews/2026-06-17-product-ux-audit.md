# Buildrik — Product UX Audit & Feature Rationalization (2026-06-17)

**Method:** three independent lenses run on the full wireframe set (69 screens incl.
M-series) + `COVERAGE.md` (real inventory: 120+ tRPC procedures, 55 models) + the
2026-06-14 IA review: **codex** (UX/feature, file-grounded), **CEO/product** (priority +
courage-to-cut), **design** (IA/interaction/copy). They converged; this synthesizes them.

---

## TL;DR — the one finding that reframes everything

The product isn't badly built; it's **undifferentiated and un-subtracted.** Two layers:

1. **It shows the union of a beginner tool and a developer tool to everyone** → overcrowded.
   The M-series fixes this with one Simple↔Pro switch + one-home-per-concept. Good.
2. **But the M-series reorganizes 44 features without removing any.** A clean filing
   system for 44 features is still 44 features to maintain. The 5 features that are the
   *actual* agency wedge (the paying customer) sit in ~2 screens and are funded **last**.

> **You cannot organize your way out of feature obesity. The move is subtraction + funding the
> wedge, not more reorganization** — but **resolve canonical ownership FIRST** (codex audit-review):
> the wireframes still contradict each other on who owns SEO/Settings/Analytics/shared-DS, so
> cuts made before that are made against contradictions, not a stable model. And one problem the
> rebuild created — the **shared-DS change has no review contract** (push to N sites, override
> resolution) — is undesigned and is the fastest way to damage live client sites.

The 5 features that are 80% of agency value: **shared design system pushed across clients ·
the Clients layer · duplicate-as-template · the core build loop (Insert→Inspector→Publish) ·
white-label client handoff.** Everything else is IMPROVE-later or REMOVE.

---

## 1. Duplicate / overlapping features

| Concept | Where it's duplicated | Verdict |
|---|---|---|
| **Start a site** | `13-first-run` + `01-new-site` + `10` CTA + `02-ai-wizard` + `03-gallery` | **MERGE** `13`+`01` into one Start screen; AI/template are subflows of it |
| **SEO** | `d5-seo` + `14-site-settings` + `53-settings` + `50-pages` | **OWNERSHIP UNRESOLVED → decide first.** The wireframes contradict: `m0-spine` says editor-owned, but `d5`/`14`/`53`/`b0` still encode dashboard-owned site defaults. Pick editor-owned vs dashboard-owned, THEN one authoring home + one page override (`50-pages`). Not a clean MERGE yet — it's an unmade decision |
| **Analytics** | `19-analytics` + `14` "Analytics & integrations" + page-drawer config | **MERGE** → one config home (editor) + one reporting home (dashboard) |
| **Forms** | editor form block + `53` + `d2-forms` + `12` Overview | **MERGE** → author in editor, submissions in one dashboard inbox |
| **AI** | `02-ai-wizard` + `54-ai` rail + inspector/DS AI | **MERGE** → ONE assistant, multiple entry points (§5) — not three AI products |
| **Styling model** | `59-inspector` + `ds1` + `ds2` + `57-components` + `40`/`41` | **MERGE** → one Styles model, 3 reaches (`fix-styling-3reach`) |
| **Media** | `17-media` (dashboard) + `56-media` (editor) + `56c` editor (modal AND in-panel code) | **MERGE** → one store, two clearly-named doors; one editing path |
| **Publish** | topbar + `20-publish` + `12` site-detail status | **MERGE** → one editor action; dashboard shows status/history only |
| **Settings** | `b0` + `b1` + `18` + `14` + `53` + `c4` + `d5` — "settings" means 4 scopes | **MERGE** → enforce the 4-scope map (account/workspace/site/editor) everywhere |
| **Components** | V1 `ComponentsTab` + V2 `ComponentsPanelV2` (flag) + 2 create modals | **MERGE** → one impl, one create path, Pro-default |
| **Dashboard homes** | `10-dashboard` + `11-sites` + `12` | **MOSTLY OK (downgraded).** Codex check: `10`/`11`/`12` already differentiate resume vs manage vs one-site ops. Minor: keep tightening Home = resume/start only |

> **CAVEAT (codex audit-review):** distinguish **real duplication** from **intentional
> scope-split mirrors**. `53-settings` explicitly says "mirror, never 404" and `14-site-settings`
> says the split is "by scope, not duplication." Those are deliberate read-only mirrors with a
> deep-link, NOT dupes to delete — the pattern to *spread*, not kill. Real dupes (two authoring
> homes for the same write) = merge. Mirrors (one authoring home + a read-only pointer elsewhere)
> = keep. The audit's earlier draft conflated these; SEO/Analytics/Settings need the
> ownership decided before any "delete."

---

## 2. Wrong feature placement

| Feature | Wrong home (today) | Correct home |
|---|---|---|
| Site-default SEO | `d5-seo` / dashboard `14` | **Editor › Site** (authoring); page override stays `50-pages` |
| AI | permanent rail tab `54-ai` | **Start + Insert + inspector actions + ⌘K** (not a destination) |
| Templates / Add / Media as separate editor destinations | rail tabs | collapse into **Insert** |
| Design system as a separate area | `ds1`/`ds2` apart from inspector | one **Styles** home |
| History | rail tab `58-history` | **topbar / history drawer** |
| "Analytics & integrations" combined | `14-site-settings` | split: **Tracking** (site) vs **Integrations** (workspace) |
| Analytics config (provider IDs) | page drawer | **Editor › Site** (view stays dashboard) |
| Role-select / setup | `04`/`04b` before any value | **after the first draft exists**, folded into Start |
| Redirects / custom code | own screens / Simple surface | **Pro-only, inside Site settings** — not first-class |

---

## 3. User journey & flow problems

**First-timer confusion points:**
- Too many pre-value screens: `04` → `04b` → `13` → `01` before anything is built.
- Two dashboard homes (`10` vs `11`) — "where do I go?"
- Editor rail asks the user to choose between **implementation nouns** (Add/Templates/AI/Components) instead of one task.
- Scattered post-publish path (`20`, `22`, `12`, `19`) — no clear "what next."
- **Agency vs solo first-run not branched:** `13-first-run` says "build your first site" — but the canonical user (agency) wants *set up workspace → invite team → shared DS → create first client*. That flow doesn't exist. The empty Clients list (zero clients, day one) is undesigned.

**Unnecessary complexity:** new users must learn dashboard + site-detail + editor boundaries before anything is live. Onboarding (`04`/`04b`) too early.

**Ideal flow:**
`signup → ONE lightweight goal question → single Start screen (Describe with AI · Use a
template · Duplicate house template) → open draft directly in editor (seeded, never a void)
with the e3 checklist → Publish from topbar → land in site detail for domain/tracking/
share/forms → back to dashboard for the next site/client.`

Keep `02-ai-wizard`'s partial-salvage / retry / resume states — strongest flow in the product.

---

## 4. Information architecture (cleaner structure)

**Current problems:** dashboard mixes personal/workspace/site scopes; editor rail groups by
implementation; site settings mix authoring + delivery; "Settings" means four things; nav
doesn't adapt for solo vs agency; "Media" label collides across two scopes.

**Recommended grouping:**

- **Dashboard**
  - `Home` — resume work, unfinished AI jobs, start new site, post-publish checklist
  - `Clients / Sites` — all sites, folders, filters, duplicate-from-template (one grouping primitive, not two)
  - `Site detail` — Overview · Domains · Traffic · Forms inbox · Sharing · Delivery · History
  - `Asset library` — workspace media across sites (renamed from "Media" to kill the collision)
  - `Workspace` — Team · **Shared design system** · Integrations · API tokens · Billing · White-label
  - `Personal` — Account · Notifications · Help
- **Editor**
  - Topbar: breadcrumb · Simple/Pro · Preview · History · Publish · ⌘K · Device
  - `Insert` · `Pages` · `Styles` · `Site` (the 4-item rail — correct)

**Nav must adapt:** solo builders (no clients) must NOT see "Clients" / "Design system" as
permanent top-nav. Specify the collapsed solo state.

---

## 5. AI feature review — wedge or gadget?

**Current state: bolted-on gadget, fragmented 3 ways** — `02` wizard (creation), `54` rail
panel (propose→confirm→execute, the *good* primitive, live-proven), scattered inspector/DS AI.
Three surfaces that don't know about each other = the same Problem-A duplication, in the worst
place. The rebuild plan even contradicts itself (AI primary in M4, hidden in Pro in D5).

**Strategic reframe:** AI as the *beginner's* "make me a site" wedge competes with every
prompt-to-site toy and wins on nothing. **AI matters when it compresses the AGENCY's
repetitive labor:**
- **"Apply our house design system to this AI draft"** — AI generates structure, the *shared
  DS* skins it. Fuses the #1 wedge (shared DS) with AI. No generic tool can do this.
- **"Rebrand this client to these colors/fonts"** — bulk restyle via tokens. Speed for the agency.
- **AI as the populate step** in template→client: agency picks house template, AI fills
  client copy/images from a brief. Wizard becomes a workflow accelerator, not from-scratch gen.

**Redesign — one assistant, three jobs, one primitive:**
- **Create** (full site/page/section from a brief) · **Transform** (rewrite copy, restyle a
  section, make a group reusable, generate variants) · **Operate** (SEO defaults, alt text,
  FAQ, translations, publish checklist).
- **Entry points:** Start (primary CTA) · Insert / ⌘K ("Generate section/page") · Inspector
  (contextual chips on selection). No standalone rail tab.
- **Output contract:** scope label · affected count · preview diff · checkpoint name · Apply/Undo.
  Keep explicit confirm for privileged actions (publish). After Apply, say "applied — ⌘Z to revert."
- **Better buttons:** `Rewrite for trust` · `Shorten this` · `Make this section premium` ·
  `Generate page SEO` · `Add FAQ from this page` · `Swap hero image` · `Localize this page`.
- **AI panel empty state** (missing today): starter prompts, not a blank "Ask AI to change something."
- **AI wizard "what kind of site?"** is genre-framed (Business/Portfolio/Agency — ambiguous).
  Reframe to GOAL: "What do you want visitors to do?" (Contact/Book · Buy · Learn about me ·
  Read) — the AI needs the goal to generate correct CTAs.

**Verdict: REDESIGN, don't cut.** If you can't fund the DS-aware redesign now, **freeze AI
expansion** (honor the existing STOP+MEASURE gate) rather than ship a third disconnected bolt-on.

---

## 6. UX/UI for non-technical users

**Jargon to fix (survives into M-series):**

| Where | Before | After |
|---|---|---|
| Rail item | `Styles` | `Look` / `Theme` (designer word; Simple shows swatches+fonts) |
| Rail item | `Site` (Simple holds SEO/forms) | `Settings` / `Publish settings` |
| 3-reach | `Reusable block` | `All [12] like this` — lead with the count |
| Agency chips | `DS synced` / `DS override` | `Using shared theme` / `Custom theme` |
| Inspector group | `Pro — full control` | omit, or `More options` (don't imply Simple = not full control) |
| SEO (Simple) | `SEO defaults` | `How your site appears on Google` |

**Copy rewrites:**

| Screen | Before | After |
|---|---|---|
| `13-first-run` | "Let's build your first site" | "Your first site is one step away" |
| `m3-dashboard` | "Describe a site — AI builds it" | headline "Describe your site" + desc "A full draft with real pages, text, and images, in under a minute" |
| `m3-dashboard` | "Start something" | "Create a new site" |
| `m-agency` | "Duplicate" | "Copy to new client" |
| `02-ai-wizard` | "Start blank" | "Build from scratch" |
| `54-ai` | "Ask AI to change something…" | "Describe a change or ask a question…" + starter prompts |

**Non-technical defaults:** seeded starter page (never a void), calm first-run, no token
IDs/CSS/breakpoints in Simple, honest empty states (keep `19-analytics`' no-fake-charts).

---

## 7. Feature priority — KEEP / IMPROVE / MERGE / MOVE / REMOVE

**KEEP (fund it — the core + the wedge):** Insert/blocks · Templates · Pages · Inspector (mode-split) ·
**Shared DS / Clients layer / duplicate-as-template / white-label (the wedge)** · Components (Pro) ·
Layers (Pro) · Domains · Billing · Team/workspace · ⌘K · Share/access · Stock photos · Auth · Help (minimal) · Vercel integration.

**IMPROVE (core but underbuilt):** AI generation (handoff into editor) · Blank start (seed it) ·
Dashboard Home (resume/start only) · Site detail (ops only) · Integrations (split workspace vs tracking) ·
Collaboration *presence only* (don't overpromise multiplayer) · Notifications · Editor onboarding · Image editor (stop gold-plating).

**MERGE (dedup → one impl/home):** AI (3 surfaces → 1 assistant) · Styles+DS+presets+components (one model) ·
Media (one store/door) · Publish (one action) · Settings (4-scope) · SEO (one home + override) · Start screens.

**MOVE (right feature, wrong home):** SEO authoring → editor · History → topbar · Analytics config → editor ·
Forms config → editor / submissions → dashboard · Redirects → Pro site-settings.

**REMOVE / FREEZE (cut or hide-behind-flag until real demand — the courage list):**
> Basis note (codex audit-review): the engineering-state reasons below (dead engine LOC, OT
> bug count, backend-only) come from **prior-arc memory, not visible in the wireframes**. They're
> real but verify against current code before cutting; the wireframes only prove these are
> live, drawn surfaces. The *strategic* reason (not the agency wedge) stands on its own.
- **Interactions/animation (`e1`)** — half-dead in a prior arc (dead engine, CSS↔GSAP duality — memory `project_animation_audit_20260518`). Reviving = a quarter, uncorrelated with agency retention. **Freeze.**
- **Locales/translations (`e2`)** — bottomless subsystem, backend-only (per localization-decision memory), no agency has blocked. **Freeze.**
- **Export code/zip (`e4`)** — **negative-value**: the exit ramp off your hosted platform, *reduces* retention. **Cut** (strongest call — strategic, not memory-dependent).
- **Collaboration — MULTIPLAYER ONLY (`e5`)** — the real-time co-editing engine is engineering-blocked (6 P1 OT bugs, memory `project_collab_codex_review_20260612`). **Freeze the multiplayer engine. KEEP** the presence/share-state UI — `e5` is already honest "demo-only" presence, which is a legit agency→client review affordance. (Corrects the earlier draft's self-contradiction.)
- **API tokens (`c5`) + generic webhooks (Mailchimp/Zapier/Slack in `c4`)** — developer-platform features, no platform, no demand signal in these docs. **Freeze** (downgrade to IMPROVE-later if a paying agency names one).
- **DS tools (`ds3`) — cut SELECTIVELY.** **Freeze** lint + migration + Figma/multi-format export (framework-author tooling). **KEEP** starter themes + AI-generate-tokens + review/apply — those are part of the **shared-DS authoring loop** (the wedge), not dev tooling. (Corrects the earlier over-cut.)
- **Ecommerce stub** — delete the folder; don't imply a roadmap you won't fund.

**The one highest-leverage cut:** kill **Interactions + Locales + Export** as a single decisive
move and reallocate to the **cross-client shared-DS flow** (§ below). It's the cleanest case of
building the wrong thing well; Export is actively anti-retention. The signal: *Buildrik is the
agency's multi-client operating system, not a deeper single-site editor.*

---

## 8. Final recommended structure

**Sitemap:**

```
DASHBOARD (run the business)
├─ Home            resume · unfinished AI jobs · start new site · post-publish checklist
├─ Clients/Sites   all sites · folders · filters · duplicate-from-template
├─ Site detail     Overview · Domains · Traffic · Forms inbox · Sharing · Delivery · History
├─ Asset library   workspace media across sites
├─ Workspace       Team · SHARED DESIGN SYSTEM · Integrations · API tokens · Billing · White-label
└─ Personal        Account · Notifications · Help

EDITOR (make the thing)   — rail always 4, Pro deepens
├─ topbar          breadcrumb · Simple/Pro · Preview · History · Publish · ⌘K · Device
├─ Insert          blocks · templates · components · AI generate
├─ Pages           page tree · page settings · page SEO · <head> · layers (Pro)
├─ Styles          inspector · 3-reach (item/block/theme) · presets · tokens (Pro)
└─ Site            whole-site SEO · forms config · code/redirects/locales (Pro only)
```

**Best end-to-end flow:** `account → ONE goal question → Start → draft in editor → guided
edits → Publish (topbar) → site detail (domain/tracking/forms/share) → dashboard for next client.`

---

## CRITICAL cross-cutting findings (beyond the 8 — do these before building)

### A. The biggest UNSOLVED problem: the shared-DS change is a separate SCOPE with no review flow
The shared DS (the #1 wedge) lets an agency "Push update to 6 sites" (`m-agency`), and some
clients have a **local override** (Acme). The editor's reach model only goes up to "Site theme"
(`m-editor`) — it has no concept of "workspace-shared theme" at all. The user cannot answer
*"if I change this, which of my 30 clients' live sites just changed?"*

**Reframe (per codex audit-review):** this is NOT "the 3-reach model is wrong" and the fix is
NOT a 4th generic reach bolted onto every element. **A workspace-shared-DS change is a distinct
scope that needs its own change *contract* — separate from in-editor element styling.** It needs:
- a clear marker that you are editing the **shared workspace theme**, not one site;
- a **preview/diff** of what changes across the N affected sites before commit;
- explicit **override-resolution** ("Acme has a local override — keep it / overwrite it");
- a **per-site progress + partial-failure** state for the push ("4 of 6 pushed, 2 failed").
Without it the shared-DS wedge becomes the shared-DS footgun. This is the single most important
*new* thing to design, and it can't be wired into the per-element inspector — it's a workspace-
level action with its own surface.

### A2. The missed IA problem (codex audit-review): Simple/Pro is overloaded
`Simple ↔ Pro` is currently carrying **four jobs at once**: (1) persona/skill seed from
onboarding role (`04-role-select`), (2) the agency→client **handoff mode** (`m0-spine` calls
Simple "the client view"), (3) **capability reveal** (which surfaces show), and (4) implicitly,
**permissions** (what a handed-off client is *allowed* to change). These are different axes.
A client handed "Simple" is not the same as a beginner who picked Simple — one is a permission
boundary, the other a preference.

**DECIDED (2026-06-17, `m-ownership` call #4): un-overload it — two controls, not one.**
- **Simple ↔ Pro = a per-user PREFERENCE** — reversible anytime, just visual density (how much
  surface shows). It is never a permission.
- **The agency→client lock = a separate ROLE** (Viewer / Client-Editor / Designer / Admin), set
  on the invite, governing what is *editable* (content-only vs structure vs DS vs settings). A
  Client-Editor can be defaulted to Simple AND restricted to content — but those are two
  independent settings. This closes the latent security/permission gap.

**Other ownership calls DECIDED (`m-ownership`):** SEO = Editor-owned (scales via the 3-level
model in `m-seo`: site defaults → per-page override → collection pattern + an overview table);
Redirects = Dashboard/Delivery (host URL-routing, ops); Analytics = split by job (config→Editor,
reports→Dashboard). With these locked, §1's "duplicates" resolve to one authoring home + mirrors.

### B. Undefined interactions that will block or be guessed during build
1. **AI→editor handoff mode** — Simple or Pro after the wizard completes? (AI users never picked a role.)
2. **"Reusable block" confirmation UI** — "confirms the count first" has no designed surface (modal? inline? toast?). The moment a beginner breaks 12 things.
3. **"Push to N sites" async states** — loading / partial-failure / per-site error. The agency's highest-stakes button.
4. **First-run for agency** — empty Clients list + new-client-from-zero flow are undesigned.
5. **Inspector empty state** (nothing selected) — the state every session starts in. Not wireframed.
6. **Auto-suggest-Pro** — "looks like you want more control?" trigger/UI/dismiss all undefined.
7. **Solo vs agency nav adaptation** — how nav collapses with zero clients.
8. **Breadcrumb node click behaviors** — what `acme-main` vs `Acme` vs `Northwind` does.
9. **Simple flip with Pro-only content active** — what the user sees mid-edit.
10. **Media scope label collision** — dashboard "Media" vs editor contextual media.

### C. M-series residual gaps (it's a strong start, not done)
SEO still inconsistent across M0 vs fix-boundary/fix-settings-map · AI still unresolved
(rail tab vs inside-Insert) · Media unresolved · Styles still concept-heavy (ds1/ds2/57/40/41) ·
M3 under-specifies the non-editor product (notifications/help/account/tokens/4-scope settings) ·
site ops atomized across 12/14/15/19/d2/d3/d4/d5 · onboarding still too long unless 04/04b collapse.

---

## What to do before development continues (ordered — revised per codex audit-review)
1. **Resolve canonical OWNERSHIP first** (the codex correction). Decide one home for each
   contradicted concept — **SEO · Settings · Analytics · shared-DS/theme** — and mark which
   "duplicates" are actually intentional read-only mirrors (`53`/`14` pattern) to KEEP. Cuts and
   merges made before this are made against contradictions, not a stable model.
2. **Decide Simple/Pro's identity** (finding A2) — preference or permission? It can't be both.
3. **Design the shared-DS change contract** (finding A) — marker + preview + override-resolution +
   per-site push states. The wedge AND the biggest risk. Its own surface, not a 4th reach.
4. **Decide the cuts** (§7 REMOVE — verify the memory-sourced engineering facts against code first;
   Export is the one safe strategic cut). One decisive move once ownership is stable.
5. **Redesign AI as one DS-aware assistant** (§5) — or freeze it.
6. **Wireframe the 10 undefined interactions** (finding B) — before they're guessed in code.
7. **Apply the copy/jargon pass** (§6) — cheap, high ease-of-use return.
8. Only then resume building, wedge-first (Clients + shared DS), parity-last.

---

## Audit-review status (codex, 2026-06-17)
Codex reviewed this audit against the wireframes and found it **directionally right but not
act-on-verbatim** before the fixes now folded in above: (1) real-dup vs intentional-mirror
distinction added (the headline correction); (2) SEO/Settings ownership marked UNRESOLVED, not
settled; (3) Collaboration fixed — cut multiplayer engine only, KEEP presence; (4) ds3 fixed —
keep starter/AI-tokens/review-apply, freeze only lint/migrate/export; (5) memory-sourced cut
reasons flagged as verify-against-code; (6) cross-client reframed as a separate change-contract,
not a 4th reach; (7) Simple/Pro-overload added (A2); (8) action order now ownership-first.
With these folded in, the audit is sound to act on.
