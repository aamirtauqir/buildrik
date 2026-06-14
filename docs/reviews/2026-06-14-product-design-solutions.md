# Buildrik — Product-Design Solutions & Decisions (2026-06-14)

Companion to `2026-06-14-product-design-ia-review.md`. The review *diagnosed*; this doc *decides*. Every open decision and design proposal from the review is resolved here with one recommended answer, the SaaS standard behind it, the reasoning, and the tradeoff. Written from a senior product-designer's seat (10+ yr, builder-tool space). Recommendations are opinionated defaults; all are reversible unless flagged as a one-way door in §12.

> **v2 — incorporated an independent adversarial review (codex, senior-PD persona).** Changes from v1: (1) precedent claims corrected — progressive disclosure is the standard *principle*, but this is **not** literally "the Figma model" (Figma Dev Mode is a separate seat/interface); §1 rewritten. (2) **New §6.5 — Edit scope & causality**, the real beginner-killer in a visual builder (not control count). (3) D2 boundary refined — page/content-scoped → editor; site-ops/publishing infra → dashboard (§3). (4) D3 re-sequenced — inspector disclosure first (safe), but rail/settings disclosure only *after* IA dedup (§4). (5) AI moved to BUILD, not Pro (fixed a v1 contradiction). (6) single-metric replaced with a real instrument set (§13). (7) **New §11.5 — Migration**, critical at ~2 users. The codex verdict + each finding's resolution is in the Addendum at the end.

---

## 0. The lens — the SaaS/UX standards I'm deciding against

I'm not inventing taste. Every call below traces to an established principle:

- **Tesler's Law (conservation of complexity)** — a builder tool has irreducible complexity (the box model, breakpoints, tokens). You cannot delete it. You can only decide *who carries it.* The whole game is moving complexity off the beginner and onto the system/the Pro.
- **Progressive disclosure (Nielsen)** — show the 20% of controls 80% of users need; reveal the rest on demand. The default screen is the floor, not the ceiling.
- **Jakob's Law** — users spend most time in *other* tools. Match the mental models of Framer/Wix (beginners) and Webflow/Figma (pros). Don't invent novel paradigms for table-stakes interactions.
- **Hick's Law** — decision time grows with the number of choices. 11 rail tabs + 14 inspector sections on first paint = paralysis.
- **Information scent / one-home IA** — a user predicting where a setting lives must be right the first time. The same concept in 3 places destroys scent.
- **Recognition over recall** — consistent placement + a command palette beat "remember which panel that was in."
- **Time-to-value / the aha moment** — activation is the only metric that matters at this stage. Everything serves "first published site that looks right, fast."

---

## 1. The meta-decision (resolve this first — it reframes everything)

**The review proposed a hard binary `Simple ↔ Pro` switch. I'm revising that.** A hard switch is the *wrong* default mechanism, and a senior PD review must say so.

Why the hard binary is wrong:
- **It forces a self-identification a beginner can't make.** A first-time user doesn't know if they're "Simple" or "Pro." Asking them to pick a mode is asking them to predict their own future skill. Most pick wrong, then feel either dumb (chose Pro, drowned) or limited (chose Simple, hit a wall).
- **Tesler's Law says the complexity doesn't vanish — it hides behind a wall.** A hard Simple mode that *removes* the breakpoint pills and class editor means the moment a Simple user needs "make this smaller on phone," they hit a dead end and must consciously "become a Pro." That's a cliff, not a ramp.
- **The *principle* (progressive disclosure, not a binary capability toggle) is genuinely industry-standard** — but cite it honestly, not by overclaiming a specific product's mechanism:
  - **Framer** is the closest real analog: design-first canvas, direct manipulation, less class-management overhead than Webflow, advanced controls surfaced contextually rather than all-at-once. This is the strongest precedent for "calm by default."
  - **Notion / Linear**: minimal default surface, power revealed on demand (slash commands / ⌘K) — precedent for disclosure + command-palette, not for a mode.
  - **Figma Dev Mode** is *not* this model — it's a separate developer interface (its own seat type, inspect/handoff/code workflow, a true Design↔Dev mode switch). Don't claim "the Figma model"; the only borrow from Figma is "an *optional*, role-seeded escape hatch exists," not the density mechanism.
  - **Webflow** is the cautionary tale — little progressive disclosure, class/breakpoint complexity exposed up front, famously steep.
  - **Caveat (the honest version):** a visual builder's canvas is direct-manipulation, unlike a form-heavy SaaS — so "fewer panel controls" is *necessary but not sufficient*. The harder problem is edit scope/causality (see §6.5), which disclosure alone does not solve. The density model below is the right *starting* move, not the whole answer.

**THE DECISION: a two-layer model — progressive disclosure as the default, plus one explicit "Pro" escape hatch.**

```
  LAYER 1 (everyone, always): Progressive disclosure
    - Default surface = the 20% (common controls), advanced folds behind "More".
    - Complexity REVEALS in place when the user reaches for it (contextual),
      it is never WALLED OFF. A Simple user who clicks "size on phone" gets
      the breakpoint control inline — no mode change required.

  LAYER 2 (opt-in, sticky): "Pro" preference  (call it Pro, or "Advanced")
    - A single account-level toggle that flips the DEFAULT density to "expanded"
      everywhere (all inspector sections open, raw CSS + classes visible, all
      rail tabs, all settings). It changes DEFAULTS, it does not gate features.
    - Seeded by the onboarding role question. Auto-SUGGESTED (never auto-applied)
      when the user repeatedly reaches for advanced controls.
```

The difference from the review's proposal is decisive: **Pro is a density default, not a capability gate.** A Simple user is never blocked — they're just shown less by default and can always reach more. This is the progressive-disclosure standard (Framer/Notion/Linear shape, *not* literally Figma's Dev-Mode mechanism). Everything below assumes this revised model — **paired with §6.5, without which density alone underdelivers.**

This also fixes the review's own worry ("what happens when a Pro-built site is opened in Simple mode") — nothing breaks, because Simple never *removed* capability, it only collapsed density.

---

## 2. Decision D1 — who is the default optimized for?

**RECOMMENDATION: Simple-first, decisively. Default density = collapsed; Pro is opt-in.**

- **Principle**: Time-to-value + Jakob's Law. Your growth wedge is the beginner who bounced off Webflow. Framer ate Webflow's lunch with beginners by being calm-by-default. A developer will happily flip one toggle; a beginner who drowns on first paint never comes back. Optimize the default for the person who churns hardest.
- **Reasoning**: At ~2 users you have no developer base to protect yet. The asymmetry is stark — a Pro inconvenienced by one extra click costs you nothing (they stay); a beginner overwhelmed costs you the user (they leave). Always optimize the default for the higher-churn-risk persona.
- **Tradeoff**: Agencies/devs evaluating in the first 60 seconds might think it's "too basic." Mitigation: the onboarding role question routes a "Designer/Developer" answer straight to Pro density, so they never see the basic surface. You get both.

---

## 3. Decision D2 — the editor ↔ dashboard boundary

**RECOMMENDATION: adopt the boundary — but split on *content-scope vs operations-scope*, not a blunt "everything-about-this-site → editor" (v1 was too absolutist; the codex review was right here).**

> **The law (v2):** The **Editor** owns *content- and page-scoped* work — design, content, and config that belongs to a specific page or to what's on the canvas (per-page SEO, the form element's config, the AI/build surface). The **Dashboard** owns *site-operations and publishing-infrastructure* — things a user does *between* or *after* design sessions, often without touching the canvas: redirects, custom headers/CSP, site-wide SEO defaults, analytics ID setup, domains, the forms-submissions inbox, plus all account/workspace/team/billing.

Mnemonic (v2): **"Editor = author the page. Dashboard = operate the site + run the business."**

- **Principle**: One-home IA + *match the task's natural moment.* Per-page SEO is authored while you build that page → editor. A 301 redirect or a CSP header is an ops task done at the site level, often weeks later, never mid-design → dashboard. Forcing ops through a design surface (v1's mistake) is as wrong as forcing design through a settings form.
- **The precise dedup (v2 — resolving the review's 3-homes table):**

| Concept | DECISION (v2) |
|---------|----------|
| SEO — per page | **Editor** (Pages drawer → SEO), authored in build flow. |
| SEO — site defaults | **Dashboard** site-settings (an ops default), with the editor showing the *effective* value read-only. |
| Analytics | **Config in Dashboard** (ID setup is ops, done once). **View in Dashboard.** Editor shows status read-only. (v1 put config in editor — moved.) |
| Custom code / Headers / Redirects | **Dashboard** (publishing-infra ops, Pro/advanced area). Per-page `<head>` snippets MAY stay in the page drawer (content-scoped). (v1 put these in editor — moved.) |
| Forms | **Config in Editor** (the form element). **Submissions inbox in Dashboard.** |
| Site settings (name/slug/favicon) | **Dashboard** site-settings is the ops home; editor shows favicon/name inline for convenience, writing back to the same store. |
| Domains / Members / Billing | **Dashboard only.** Editor links out, labelled "opens dashboard ↗". |

- **The nuance that still holds**: don't *delete* duplicated entry points — **mirror them read-only + deep-link** (see §11.5 Migration). A dead tab breaks scent worse than a redirect.
- **Tradeoff**: page-vs-site SEO now has two homes by design (per-page in editor, defaults in dashboard) — but that's a *scope* distinction users understand (like CSS: element style vs site stylesheet), not the v1 problem of the *same* setting in 3 places. State the scope in the UI ("This page's SEO" vs "Site default SEO").

---

## 4. Decision D3 — build order

**RECOMMENDATION (v2): inspector disclosure first, IA dedup SECOND (before any rail/settings hiding), then rail/settings disclosure, then the Pro toggle, then code merges.**

The v1 order ("inspector → rail → dedup") was wrong, and the codex review caught why: **hiding rail tabs / settings behind "More" *before* fixing the multi-home problem makes "where is X?" worse** — the user can't tell if a feature is hidden, moved, or dashboard-only. Disclosure of a *duplicated/mislocated* surface compounds confusion. Disclosure of a *single-home* surface (the inspector — it isn't duplicated anywhere) is safe to do first.

```
  P1  Inspector progressive disclosure   <- SAFE first: inspector is single-home, not duplicated.
                                            Biggest felt "easy" win, helps 100%, no mode needed.
  P2  IA dedup to the D2 boundary        <- establish location-truth BEFORE hiding anything in
                                            the rail/settings (mirror-don't-404 per §11.5).
  P2b Edit-scope cues (§6.5)             <- ship alongside the inspector work; the real
                                            beginner-killer, independent of density.
  P3  Rail + settings progressive disclosure  <- only AFTER dedup, so "More" hides knowns, not unknowns.
  P4  Pro density toggle + onboarding seed + auto-suggest
  P5  Merge duplicated code (Components V1/V2, media editor, create-component)
  P6  Command palette as universal finder
```

- **Principle**: Ship things that need no user decision first (inspector disclosure, scope cues), and **never hide a thing until its location is true** (dedup before rail/settings "More").
- **Reasoning**: building the Pro toggle first gives a switch with nothing different on each side. But equally, hiding the rail before dedup gives a "More" menu that hides moved/duplicated features — users read that as "the feature is gone." Establish one-home truth, *then* compress density.

---

## 5. The mode system — full resolved spec

Putting §1 into concrete product terms.

### 5.1 Naming
**"Pro" / "Advanced"** for the opt-in density. Never label the human "Beginner" in the UI (condescending; violates design-for-trust). The default state is unnamed (it's just "the app"); the toggle reads **"Advanced controls"** or a **"Pro"** switch. Figma calls it "Dev Mode"; Linear "show advanced." Match that register.

### 5.2 Default + persistence + seed
- **Default**: collapsed/Simple density. Per **user** (a dev is a dev across all their sites), stored server-side on the user profile (promote the existing per-user `DSMode` localStorage to the canonical store so it syncs across devices).
- **Onboarding seed**: the role question already exists (`/onboarding/role`: Solo Builder / Team Lead / Designer). Wire it: Designer/Developer-leaning answers → Pro density on; others → off. **Use the signal you already collect** — today it's wasted.
- **Auto-suggest, never auto-switch**: when a Simple-density user performs N (say 3) advanced actions in a session (opens raw CSS, adds a class, edits a breakpoint override), show a one-time, dismissible toast: "Want more control by default? Turn on Advanced." Respecting agency = trust (design-for-trust principle). Auto-switching their UI out from under them is the cardinal sin.

### 5.3 What the density actually controls (consistent everywhere)
It changes **defaults**, not capability. Nothing is removed; advanced things are collapsed and reachable.

| Surface | Simple density (default) | Pro density |
|---------|--------------------------|-------------|
| Inspector | 6 core sections open, advanced folded behind "More", no raw-CSS/class editor shown (still reachable via "Edit code") | all 14 sections expanded, raw CSS + class editor inline |
| Rail | ~6 primary tabs visible, rest under a "More" affordance | all 11 tabs |
| Settings | General, SEO, Forms shown; plumbing (custom code, headers, redirects, integrations, localization) under "Advanced settings" | all expanded |
| Design tokens | curated swatches/scales, token IDs hidden | full token editor + IDs + usage map |
| Breakpoint/pseudo mechanics | the *control* always works inline; the override-indicator dots/pills are quieted in Simple, loud in Pro | full indicators |

Critical invariant (resolves the review's open worry): **Simple never removes a capability — it collapses density.** Opening a Pro-built site in Simple shows everything rendering correctly; the advanced rules are just behind "More". No data model fork, no "lite engine." (`DSMode` already proves display-only mode is safe.)

---

## 6. The inspector — resolved (the highest-leverage surface)

The inspector is where the beginner drowns. Resolution, matching Framer's style panel + Figma's design panel (the SaaS standards for this exact surface):

**Simple-density inspector — 6 sections, visual-first, zero CSS jargon:**
1. **Style** (the merged "Quick Actions"): fill, text color, size — direct, swatch-based.
2. **Text** (on text elements): font, size, weight, alignment — token pickers, no `letter-spacing` raw box by default.
3. **Spacing**: a visual padding/margin pad (the Figma/Framer box), not 12 numeric fields.
4. **Background**: color/image picker.
5. **Border & Corners**: visual.
6. **Responsive visibility**: show/hide per device (the D1 toggle, which now works) — phrased "Show on phone," not "`--hide-mobile`."

Each section has a quiet **"More"** disclosure for its advanced properties. A persistent, low-emphasis **"Edit code / Advanced"** link at the bottom is the escape hatch to classes/raw-CSS (reveals inline; or flips the user toward Pro via the auto-suggest).

**Pro-density inspector = today's full 14-section surface, all expanded.** Pros already like it; don't touch it.

- **Principle**: Hick's Law (6 visual choices vs 14 jargon sections) + Jakob's Law (Framer/Figma users expect a visual style panel, not a CSS form).
- **Reasoning**: this single split is ~60% of the perceived "ease" win for beginners and costs the Pro nothing.
- **SaaS standard applied**: direct manipulation > form-filling. A beginner changes color by clicking a swatch, not typing `#2D6DFF` into a `color` field.

---

## 6.5. Edit scope & causality — the REAL beginner-killer (the thing density alone doesn't fix)

The single most important addition to this doc (surfaced by the adversarial review, and correct): **in a visual builder, beginners don't churn because there are too many controls — they churn because they can't tell *what* they're editing or *why* a change behaved the way it did.** Every edit has a hidden scope:

```
  am I changing...   this ELEMENT only?
                     its CLASS  (→ every element with that class, site-wide)?
                     the COMPONENT  (→ every instance)?
                     this BREAKPOINT only  (→ phone but not desktop)?
                     this PAGE  vs  the whole SITE?
                     a design TOKEN  (→ everything bound to it)?
```

This is exactly where Webflow loses people: a beginner edits a heading, it changes on 14 other pages, and they have no idea why (they edited a *class*, not the *element*). Hiding controls does not fix this — it can make it *worse*, because the scope cues (the breakpoint pill, the "used on N elements" hint, the token-binding chip) are the very things a naive "Simple mode" would hide.

The product already has the raw materials (the inventory found breakpoint-override indicators, pseudo-state pills, token-binding chips, "used on X other elements" hints) — but they're treated as Pro/advanced decoration, not as the beginner's safety rail. Invert that. Scope clarity is for **everyone**; it's the opposite of a Pro feature.

**What to build (independent of, and as important as, the density work):**
1. **A persistent "what am I editing" line** at the top of the inspector, in plain words: *"Editing this button"* vs *"Editing all `.btn-primary` (12 elements)"* vs *"Editing the Card component (all 8 uses)"*. Always visible, both densities. This is the #1 scope cue.
2. **Propagation preview / warning before a wide change.** When an edit will affect more than the selected element (a class or component or token change), say so *before* it lands: *"This changes 12 elements. Just this one instead?"* with a one-click "detach / make it local." This is the safety net Webflow lacks.
3. **Loud responsive-state cue.** When editing on a non-default breakpoint, the whole inspector should visibly signal *"You're styling the Phone view"* (tint/banner), so a beginner never wonders why their desktop didn't change. The override dots exist; make them a banner in Simple, not a subtle dot.
4. **Inheritance messaging.** When a value is inherited (from base breakpoint, parent, or token) vs explicitly set here, show it ("inherited from Desktop" / "from token `--brand`"). Reset-to-inherited as a one-click.
5. **Undo/revert that's obvious and forgiving.** Undo is in the topbar; also surface a per-edit "revert this change" and make the History timeline reachable when a beginner says "what did I just do." Learnability comes from cheap, visible reversal.

- **Principle**: Tesler's Law again — the scope complexity is irreducible; the job is to *narrate* it for the beginner (cues + previews), not hide it. Recognition over recall (the user shouldn't have to *remember* they're in class-edit mode — the UI says so).
- **Why this outranks the density work in importance** (though it ships in parallel): a calm 6-section inspector that still silently edits a class and breaks 14 pages is *worse* than a busy inspector that tells you what you're about to do. Clarity of consequence beats fewer controls.

---

## 7. IA dedup — resolved structure

Beyond §3's table, the concrete navigation model:

**Editor rail, resolved into 3 honest zones with Simple/Pro density:**
```
  BUILD (always visible)      AI · Templates · Add · Pages · Media
  DESIGN (always visible)     Design (tokens) · Inspector (right)
  SHIP (always visible)       Publish
  --- under "More" in Simple, inline in Pro ---
  PRO                         Components · Layers · History · Settings(advanced)
```
- **AI lives in BUILD, not Pro** (v2 fix — v1 contradicted itself by listing AI under Pro while §8 calls it the beginner wedge). AI + Templates are the beginner's two "give me a starting point" paths and must be the *most* visible things in the rail, top of BUILD. This is the corrected, internally-consistent placement.

**Dashboard nav, resolved:** keep the 5 (Dashboard / Sites / Team / Billing / Settings). It's already clean and SaaS-standard. The fix is *content dedup* (§3), not nav restructure. Don't churn the dashboard nav — it isn't the problem.

- **Principle**: one-home + recognition. After dedup, a user can answer "where is X?" correctly on the first try.

---

## 8. Feature ledger — resolved with PD reasoning

Confirming/adjusting the review's keep/expand/reduce/merge with a designer's "does this earn its pixels" (Rams' subtraction) lens:

- **Templates — EXPAND, and make it the default new-site screen.** For a beginner, a blank canvas is a failure state (blank-page paralysis). SaaS standard (Canva, Framer, Notion templates): start from something, not nothing. This is your strongest activation lever.
- **AI generate — EXPAND + promote.** "Describe your site → get a draft" is the single highest time-to-value path for a non-designer. Surface it at new-site creation (it already exists there as Method B) AND keep the in-editor AI tab. This is your differentiation vs Webflow.
- **Add / Pages / Media — KEEP** (BUILD core).
- **Design tokens — KEEP, density-split** per §5.3.
- **Layers — REDUCE to Pro-density.** Beginners don't model a DOM tree (Jakob: Wix/Framer users select on canvas, not in a layer list). Pros want it. Pro-default.
- **Components — MERGE (kill the V1/V2 flag duplication, one impl) + Pro-density.** Reusable components are an inherently advanced mental model.
- **History — KEEP undo/redo in topbar for all; the full timeline tab is Pro-density.**
- **Settings — density-split** per §3/§5.3.
- **MERGE the real code duplication** (media editor modal+panel, two create-component modals) — these are pure tech-debt that also create subtle UX divergence. Not user-facing scope, but they cause the "inconsistent" feeling.
- **Stripe billing UI — keep hidden until real** (already correct). Never ship fake payment UI (design-for-trust).

---

## 9. Onboarding & first-run — the gap the review under-covered

A senior PD adds this: the IA fix is wasted if the first 60 seconds don't deliver an aha. SaaS standard (the activation playbook):

- **First-run = pick a path, not face a blank canvas:** Template / Describe-with-AI / Blank. (Already exists at `/onboarding/setup` + `/sites/new` — make it the unmissable default, not a step users skip.)
- **The aha = "my site exists and looks good" within ~2 minutes.** Template or AI gets them there; blank does not. Bias the default to template/AI.
- **Checklist for the second session** (the dashboard checklist already exists): edit content → change a color → publish → connect domain. Drives the habit loop.
- **Empty states are features** (the dashboard already does role-based empty states — good). Extend: the editor's first canvas should never be truly empty; seed a starter section.

---

## 10. Cross-cutting: command palette as the universal finder

Both editor and dashboard already have ⌘K. **Make it the answer to "where is X."** SaaS standard (Linear, Notion, Raycast): when IA is deep, recognition-via-search beats memorized navigation. Surface the hard-to-find power features there (save-as-component, token-replace, redirects, per the review's discoverability gaps). This *complements* progressive disclosure — Pros find anything instantly without the rail being cluttered for beginners.

---

## 11. What NOT to do (anti-patterns to refuse)

- **No hard "Beginner/Pro" radio wall.** (§1 — it's a cliff; use disclosure + opt-in density.)
- **No auto-switching the user's density.** Suggest, never impose.
- **No second "lite" engine / data fork.** Simple renders from the same state (Tesler: move complexity, don't duplicate it).
- **No dashboard-nav restructure.** It isn't broken; only its content is duplicated.
- **No fake/placeholder UI** (Stripe stays hidden until real).
- **No deleting tabs users navigate to from memory** — mirror + deep-link instead (§3).
- **No AI-slop microcopy.** "Show on phone," not "responsive visibility override." Plain verbs, user's words (Jakob).

---

## 11.5. Migration & disruption (critical at ~2 users — the codex review was right to flag this)

With a tiny user base, **one confused existing user outweighs all the theory in this doc.** Every IA move (dedup, rail compression, settings relocation) must ship with a migration layer, not a hard cutover:

- **Mirror, never 404.** Any tab/panel that moves leaves a stub at the old location: *"SEO defaults moved to Settings → site. Open →"*. Keep the stub for a defined grace period (e.g. 60 days), then remove.
- **"Where did this go?" affordance.** When a feature relocates, the command palette must resolve the *old* name to the *new* location (search "redirects" → jumps to the dashboard ops page even after the move).
- **Release notes / changelog in-app.** A small "what changed" note on next login for existing users. At 2 users you can literally tell them directly — do that too.
- **Density rollout is itself a migration.** Existing users have learned today's full surface. Defaulting them to Simple density would *hide* things they already use. Rule: **existing users keep their current (full) density; only NEW signups default to Simple.** Migrate the learned user gently (offer Simple, don't impose it).
- **Instrument the move (see §13)** so you can detect a spike in "couldn't find X" and roll back a specific relocation without reverting the whole arc.
- **Reversibility**: feature-flag each phase; every relocation is behind a flag so a confused-user signal can flip it off in minutes.

---

## 12. One-way doors — the only calls to sanity-check before building

Most of this is reversible (two-way doors — ship, measure, adjust). These three are stickier and worth a conscious yes:

- **The editor↔dashboard boundary (§3).** Deleting/mirroring the dashboard SEO/Settings tabs reshapes muscle memory + URLs. Reversible but disruptive to redo. Recommend: commit to it.
- **Promoting per-user density to server-side state.** A small data-model addition (user.uiDensity). Cheap, but it's a schema touch. Recommend: do it (localStorage-only won't survive device switches — bad for the Pro who works on two machines).
- **Making Template/AI the default new-site path over blank.** Changes the product's first impression. Recommend: yes (activation), but this is the one I'd literally watch a real user do before locking.

---

## 13. Sequenced roadmap + how you'll actually know it worked

```
  P1  Inspector progressive disclosure (6 visual sections + "More" + code escape)
  P1b Edit-scope cues (§6.5): "what am I editing" line, propagation warning,
      loud breakpoint banner, inheritance/reset, visible revert    <- ships with P1
  P2  IA dedup to the §3 boundary (mirror-don't-404, §11.5)         <- BEFORE rail hiding
  P3  Rail + settings progressive disclosure (after dedup)
  P4  Pro density toggle (server-side) + onboarding-role seed + auto-suggest
      (existing users keep full density; only new signups default Simple — §11.5)
  P5  Merge duplicate code (Components V1/V2, media editor, create-component)
  P6  Command palette as universal finder (resolves old→new names) + power features
  (parallel) Onboarding: Template/AI as default new-site path
```

**Measurement — not one metric, an instrument set (the codex review was right that "activation" alone is too neat):**
- **North star**: first-session publish rate — % of new signups who publish a site that looks right in session 1.
- **Leading / diagnostic** (these tell you *why* the number moved, and catch regressions):
  - time-to-first-successful-style-edit (did disclosure speed them up?)
  - advanced-control reveal rate (how often Simple users reach for "More" / Pro — calibrates the default split)
  - Pro-toggle adoption + the action that triggered the auto-suggest
  - **"couldn't find X" signal** — search-with-no-result + rage-clicks on relocated areas (catches a bad dedup/relocation per §11.5)
  - undo/revert spikes on a surface (a spike = users confused about an edit's *scope* → §6.5 is failing there)
  - responsive-edit task completion (did the breakpoint banner work?)
- **Why the set, not the single metric**: activation can rise for the wrong reason (e.g. you hid capability and beginners "succeed" at a thinner task), or stay flat while you fixed real confusion. The diagnostic metrics separate "reduced overwhelm" from "buried capability" — without them you're flying blind on whether disclosure helped or just hid.
- Prerequisite: this assumes product analytics/event instrumentation exists. If it doesn't, **adding it is P0 — you cannot run this redesign without being able to see if it worked.**

---

## VERDICT (v2)
The review's diagnosis was right; v1's prescription needed two corrections, both made here. **(1) Don't ship a hard Beginner/Pro wall — ship progressive disclosure (helps everyone, no mode) plus an opt-in Pro *density* default (seeded by onboarding).** **(2) Density alone is necessary-but-not-sufficient for a *visual* builder — the real beginner-killer is edit scope/causality (§6.5): not "too many controls" but "what am I editing and why did it propagate." Scope clarity is for everyone, and outranks density in importance even though it ships in parallel.** Sequence: inspector disclosure + scope cues first, then dedup the IA (before hiding anything in the rail), then the density toggle, with a real migration layer (§11.5) because at ~2 users one confused user outweighs the theory. No rewrite — disclosure + scope-narration + dedup + one density preference on an engine that already works.

---

## Addendum — independent adversarial review (codex, senior-PD persona) + resolutions

Ran codex as a brutal senior-PD adversary against v1. It surfaced 4 [P1] + 3 [P2]; most were valid and are now incorporated. Trail:

| # | Codex finding | Verdict | Resolution in v2 |
|---|---------------|---------|------------------|
| 1 | [P1] Overclaimed precedent — "the Figma model / the SaaS standard." Figma Dev Mode is a separate seat/interface, not a denser inspector. | ACCEPTED | §1 rewritten: principle (progressive disclosure) separated from mechanism; Framer named as the real analog; Figma claim corrected. |
| 2 | [P1] Biggest blind spot = edit scope & causality, not control count. Hiding controls can hide the model that explains propagation. | ACCEPTED (strongest catch) | New **§6.5** — scope cues, propagation warnings, breakpoint banner, inheritance/reset, visible revert. Reframed as for-everyone, outranking density. |
| 3 | [P1] D2 too absolutist — pulling site-ops (redirects/headers/analytics/site-SEO) into the editor forces ops through a design surface. | ACCEPTED | §3 re-cut to content/page-scope → editor; site-ops/publishing-infra → dashboard. |
| 4 | [P1] D3 order wrong — disclosure before dedup makes "where is X?" worse. | ACCEPTED (with nuance) | §4 re-sequenced: inspector disclosure first (single-home, safe), dedup before rail/settings hiding. |
| 5 | [P2] D1 simple-first plausible-not-proven + AI contradiction (Pro in §7 vs beginner-wedge in §8). | PARTIALLY ACCEPTED | AI contradiction fixed (AI → BUILD, §7). D1 kept as the recommended default but explicitly labelled an assumption to validate (onboarding-role seed + metrics de-risk it). |
| 6 | [P2] Single "activation" metric is theater. | ACCEPTED | §13 replaced with a north-star + diagnostic instrument set; flagged analytics as P0 prerequisite. |
| 7 | [P2] No migration/disruption plan. | ACCEPTED | New **§11.5** — mirror-don't-404, grace period, existing-users-keep-full-density, per-phase flags. |

Codex verdict (verbatim): *"the core direction is only half right. Rejecting a hard Beginner/Pro capability wall is the correct instinct. But this solutions doc overstates its precedent, picks too rigid an editor/dashboard boundary, and misses the real visual-builder problem: helping users understand the scope and consequences of their edits... I would not throw the direction away, but I would not ship from this doc as-is either; it needs a targeted rethink before it becomes roadmap."*

My judgment: codex was right on all four P1s. The v2 above is that targeted rethink — direction kept (progressive disclosure + opt-in density), but precedent corrected, boundary re-cut on content-vs-ops, sequencing fixed (dedup before hiding), and the real visual-builder problem (edit scope/causality, §6.5) promoted to first-class. This doc is now roadmap-ready; the one remaining unproven premise is D1 (simple-first default), which the instrument set (§13) is designed to validate rather than assume.
