# Buildrik — Product-Design Solutions & Decisions (2026-06-14)

Companion to `2026-06-14-product-design-ia-review.md`. The review *diagnosed*; this doc *decides*. Every open decision and design proposal from the review is resolved here with one recommended answer, the SaaS standard behind it, the reasoning, and the tradeoff. Written from a senior product-designer's seat (10+ yr, builder-tool space). Recommendations are opinionated defaults; all are reversible unless flagged as a one-way door in §12.

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
- **Industry has already converged on the answer, and it isn't a binary toggle:** Notion (blank-simple, slash-command reveals power), Linear (clean default, ⌘K for everything), Framer (canvas stays simple; advanced controls *appear contextually*), Figma (one *optional* Dev Mode escape hatch, off by default, role-seeded). None ships a "Beginner Mode / Pro Mode" radio button as its primary IA. Webflow is the cautionary tale — no progressive disclosure, everything always visible, famously steep, high churn.

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

The difference from the review's proposal is decisive: **Pro is a density default, not a capability gate.** A Simple user is never blocked — they're just shown less by default and can always reach more. This is the Figma model, and it's the SaaS standard. Everything below assumes this revised model.

This also fixes the review's own worry ("what happens when a Pro-built site is opened in Simple mode") — nothing breaks, because Simple never *removed* capability, it only collapsed density.

---

## 2. Decision D1 — who is the default optimized for?

**RECOMMENDATION: Simple-first, decisively. Default density = collapsed; Pro is opt-in.**

- **Principle**: Time-to-value + Jakob's Law. Your growth wedge is the beginner who bounced off Webflow. Framer ate Webflow's lunch with beginners by being calm-by-default. A developer will happily flip one toggle; a beginner who drowns on first paint never comes back. Optimize the default for the person who churns hardest.
- **Reasoning**: At ~2 users you have no developer base to protect yet. The asymmetry is stark — a Pro inconvenienced by one extra click costs you nothing (they stay); a beginner overwhelmed costs you the user (they leave). Always optimize the default for the higher-churn-risk persona.
- **Tradeoff**: Agencies/devs evaluating in the first 60 seconds might think it's "too basic." Mitigation: the onboarding role question routes a "Designer/Developer" answer straight to Pro density, so they never see the basic surface. You get both.

---

## 3. Decision D2 — the editor ↔ dashboard boundary

**RECOMMENDATION: adopt the boundary as a hard law, and dedup to it.**

> **The law:** The **Editor** owns everything about *this site* (design, content, and the site's own config: SEO, forms config, analytics config, custom code, redirects, headers). The **Dashboard** owns everything about *the account and the business* (workspace, team, billing, plan, domains, cross-site management, and the *viewing* of analytics/forms data).

Mnemonic: **"Editor = make the thing. Dashboard = run the business."**

- **Principle**: One-home IA + don't-context-switch-mid-task. A user in flow building a page should set that page's SEO without leaving for the dashboard. A user managing billing should never be in the canvas.
- **The precise dedup** (resolving the review's 3-homes table):

| Concept | DECISION |
|---------|----------|
| SEO | **Config in Editor** (site-default in Settings, per-page in the Pages drawer — a clean 2-level model). **Delete** the dashboard site-detail SEO tab (replace with a one-line "Edit SEO in editor →" link). |
| Analytics | **Config in Editor** (set GA/Plausible IDs once). **View in Dashboard** (the data/charts). Remove analytics config from the Pages drawer. One config home, one view home. |
| Custom code | **Editor only** (site-wide in Settings, per-page in drawer). Pro-density. |
| Forms | **Config in Editor** (the form element's settings). **Submissions inbox in Dashboard** (it's an ops/business view, checked outside build flow). |
| Site settings (name/slug/favicon) | **Editor** is the authoring home. Dashboard site-detail Settings becomes a thin read-only summary + "Edit in editor". |
| Domains / Members / Billing | **Dashboard only.** Editor links out, clearly labelled "opens dashboard ↗". |

- **The nuance most people get wrong**: don't *delete* the dashboard SEO/Settings tabs outright — **replace them with read-only summaries that deep-link to the editor.** Users will still navigate there from muscle memory; a dead 404 or missing tab breaks scent worse than a redirect. Mirror, then point.
- **Tradeoff**: a small amount of "view here, edit there" indirection for analytics/forms. Acceptable — it matches every analytics product (you configure the pixel in your site, you read the report in a dashboard).

---

## 4. Decision D3 — build order

**RECOMMENDATION: progressive-disclosure of the inspector FIRST, then the rail, then IA dedup, then the Pro toggle, then code merges.**

This refines the review's "switch-first." The switch (Pro toggle) is actually *not* the first thing — progressive disclosure is, because it helps everyone immediately without anyone touching a setting.

```
  P1  Inspector progressive disclosure   <- biggest felt "easy" win, helps 100% of users, no mode needed
  P2  Rail progressive disclosure        <- collapse 11 tabs to a calm default + "More"
  P3  IA dedup (D2 boundary)             <- kills the "features make no sense" feeling
  P4  The Pro density toggle + onboarding seed + auto-suggest
  P5  Merge duplicated code (Components V1/V2, media editor, create-component)
  P6  Discoverability (command palette as universal finder)
```

- **Principle**: Sequence by *felt value per unit effort*, and ship things that need no user decision before things that do. Progressive disclosure (P1–P2) improves the product for every user the day it ships, with zero onboarding. The Pro toggle (P4) only matters once the disclosed defaults exist to toggle.
- **Reasoning**: If you build the Pro toggle first (the review's instinct), you've built a switch with nothing meaningfully different on each side yet. Build the *two densities* first (via disclosure), then the toggle that picks your default density becomes trivial.

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

## 7. IA dedup — resolved structure

Beyond §3's table, the concrete navigation model:

**Editor rail, resolved into 3 honest zones with Simple/Pro density:**
```
  BUILD (always visible)      Add · Templates · Pages · Media
  DESIGN (always visible)     Design (tokens) · Inspector (right)
  SHIP (always visible)       Publish
  --- under "More" in Simple, inline in Pro ---
  PRO                         AI · Components · Layers · History · Settings(plumbing)
```
- AI is debatable (see §8) — it may belong in BUILD for beginners as the "make it for me" path. Flag as the one rail call to A/B.

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

## 12. One-way doors — the only calls to sanity-check before building

Most of this is reversible (two-way doors — ship, measure, adjust). These three are stickier and worth a conscious yes:

- **The editor↔dashboard boundary (§3).** Deleting/mirroring the dashboard SEO/Settings tabs reshapes muscle memory + URLs. Reversible but disruptive to redo. Recommend: commit to it.
- **Promoting per-user density to server-side state.** A small data-model addition (user.uiDensity). Cheap, but it's a schema touch. Recommend: do it (localStorage-only won't survive device switches — bad for the Pro who works on two machines).
- **Making Template/AI the default new-site path over blank.** Changes the product's first impression. Recommend: yes (activation), but this is the one I'd literally watch a real user do before locking.

---

## 13. Sequenced roadmap + success metric

```
  P1  Inspector progressive disclosure (6 visual sections + "More" + code escape)
  P2  Rail progressive disclosure (BUILD/DESIGN/SHIP visible, PRO under "More")
  P3  IA dedup to the §3 boundary (mirror, don't 404)
  P4  Pro density toggle (server-side) + onboarding-role seed + auto-suggest
  P5  Merge duplicate code (Components V1/V2, media editor, create-component)
  P6  Command palette as universal finder + surface hidden power features
  (parallel) Onboarding: Template/AI as default new-site path
```

**The one metric that proves it worked: activation rate** — % of new signups who publish a site that looks right within their first session. If progressive disclosure + template-first onboarding move that number, the redesign succeeded. Everything else (NPS, feature usage) is secondary at this stage.

---

## VERDICT
The review's diagnosis was right; its prescription needed one senior correction: **don't ship a hard Beginner/Pro wall — ship progressive disclosure (helps everyone, no mode) plus an opt-in Pro *density* default (helps the dev, seeded by onboarding).** That single reframe turns "two products bolted together" into "one product that meets each user where they are," which is the actual SaaS standard (Figma/Framer/Notion/Linear all do exactly this; Webflow's failure to is the warning). Build it inspector-first (felt value, zero user decision required), dedup the IA to one home per concept, and make Template/AI the on-ramp. No rewrite — it's disclosure + dedup + one density preference on an engine that already works.
