# Buildrik — Product-Design & IA Review (2026-06-14)

CEO / product-designer review of the **existing** product (editor + dashboard). Grounded in a full file-referenced IA inventory of both surfaces — not memory, not assumptions. Where a recommendation needs a strategy call the founder must make, it is flagged as a DECISION, not silently decided.

Method: two inventory passes mapped every rail tab, panel, inspector section, modal, dashboard route, and settings screen. The diagnosis below is built from what is actually in the code.

---

## 1. The core diagnosis — why it feels "bolted-on"

The features aren't individually bad. The product *feels* incoherent because of four structural problems the inventory makes undeniable:

### Problem A — The same concept lives in 2–3 different places
There is no rule for "where does X live," so the same job is scattered:

| Concept | Place 1 | Place 2 | Place 3 |
|---------|---------|---------|---------|
| **SEO** | Dashboard → site-detail → SEO tab | Editor → Settings → SEO | Editor → Pages → page-settings drawer → SEO |
| **Analytics** | Dashboard → site-detail → Analytics tab | Editor → Settings → Analytics | Editor → Pages drawer → Analytics |
| **Custom code** | Editor → Settings → Custom Code | Editor → Pages drawer → Custom code | — |
| **Forms** | Editor → Settings → Forms | Dashboard → site-detail → Overview (submissions inline) | — |
| **Site settings** | Dashboard → site-detail → Settings | Editor → Settings → General | — |
| **Publish** | Dashboard → site-detail → Publish | Editor → Topbar Publish | Editor → Publish tab |

A user who wants to set SEO has to guess between three doors. That is the "added randomly" feeling, precisely.

### Problem B — The editor↔dashboard boundary is undefined
Domains, Members, Billing are dashboard-only (the editor deep-links out). But SEO, Analytics, Forms, site Settings exist in **both** the editor and the dashboard. There is no stated principle for what belongs where, so both grew copies.

### Problem C — The "beginner vs developer" idea already exists, but as 3 disconnected fragments
The product already tries to do what the founder is asking for — it just never unified it:
- `DSMode` — beginner/pro toggle, but scoped only to the Design-System tab + a few inspector labels; persisted in localStorage per-user (`DSModeContext.tsx`).
- Topbar **Dev mode** — a separate toggle that controls CSS visibility + unlocks the "All CSS" inspector section.
- Per-section **"advanced disclosure"** — each inspector section independently hides its advanced properties.

Three different "show me more" mechanisms, none aware of each other. There is no single switch that says "I am a beginner" or "I am a developer" across the whole product.

### Problem D — Raw surface overload, ungated
Editor: 11 rail tabs + ~14 inspector sections (Layout alone exposes 26 properties) + ~20 modals + a 10-screen Settings panel. Dashboard: 5 nav + 6 site-tabs + 8 settings pages. For a first-time builder, everything is visible at once. For a developer, the "quick" simplified controls are redundant noise. Nothing adapts to who is looking.

### Plus: genuine duplication (real bolted-on code)
- **Components**: two implementations (V1 `ComponentsTab` + V2 `ComponentsPanelV2`) behind `VITE_FEATURE_COMPONENTS_V2`.
- **Media editor**: a full-page modal path AND an in-panel path (divergent code).
- **Create component**: two modals (`CreateComponentModal` in shell + `SaveAsComponentModal` in sidebar).
- **Publish**: had two state machines (unified in this session's B1 fix — the pattern to repeat).

---

## 2. Model the user — two real personas (not assumptions, archetypes the product visibly serves)

The product is a Webflow/Framer-style builder. Its surface reveals it's trying to serve two people at once without admitting it:

### Persona 1 — "The Builder" (beginner / non-technical)
- **Goal**: pick a template or describe a site, change text + images + colors, publish to a domain. Done.
- **Mental model**: *Pages → sections → edit what I see → publish.* Visual, direct-manipulation. Thinks in "make this bigger / this color / hide on phone," not in `padding-inline`, `z-index`, or CSS classes.
- **What helps them**: templates, AI generate, drag blocks, color/font pickers, a short inspector, a confident publish button, sensible defaults.
- **What hurts them**: CSS classes, raw CSS, breakpoint-override mechanics, pseudo-state pills, headers/CSP, redirects, design-token IDs, a 26-property layout panel, 11 rail icons. Every one of these is currently shown to them by default.

### Persona 2 — "The Pro" (developer / designer / agency)
- **Goal**: pixel control, reusable components + design tokens, responsive overrides, interactions, custom code, then ship.
- **Mental model**: *Elements → styles → states → breakpoints → dev settings → publish.* Thinks in the box model, classes, tokens.
- **What helps them**: full inspector, CSS classes + raw CSS, breakpoints + pseudo-states, design tokens with IDs, custom code/headers/redirects, keyboard-first, no hand-holding.
- **What hurts them**: "are you sure you want to leave the design system?" warnings, hidden properties they have to expand every time, duplicated "quick" controls, modal hunts for power features.

**The insight**: these two need *different products from the same engine.* Today both see the union of everything, so the Builder is overwhelmed and the Pro is nagged. That is the design failure underneath the founder's complaint.

---

## 3. The spine of the fix — ONE product-wide mode switch: **Simple ↔ Pro**

Collapse the three fragmented "advanced" signals (DSMode, Dev mode, per-section disclosure) into a single, explicit, product-wide switch. This is the highest-leverage change; nearly everything else hangs off it.

Design rules (naming chosen to avoid condescension — "Simple/Pro" matches Figma dev-mode, Notion, Linear; never label a human "beginner" in the UI):

- **One switch**, top-level in the editor (next to the user/account control), mirrored in the dashboard.
- **Persisted per-user, not per-project** — a developer is a developer in every site. (Today DSMode is already per-user localStorage; promote it to the canonical store.)
- **Default = Simple** for new accounts. **Onboarding role-select already asks** "Solo Builder / Team Lead / Designer" (`/onboarding/role`) — wire that answer to the default mode (Designer/dev → Pro, others → Simple). Stop wasting that signal.
- **Auto-suggest Pro, never auto-switch**: when a Simple user does a developer action (adds a CSS class, opens raw CSS, edits a breakpoint override), offer a one-time "Looks like you want more control — switch to Pro?" Reversible, non-blocking.
- It governs, *consistently*, three layers:

```
                         SIMPLE                          PRO
  Rail tabs        Add, Templates, Pages,          + AI, Components, Layers,
                   Media, Design(lite), Publish      Design(full), Settings(full),
                                                      History
  Inspector        Quick Actions, Typography,       all 14 sections + All CSS +
                   Spacing, Background,              CSS Classes + breakpoint &
                   Border/Radius, Visibility         pseudo-state mechanics + dev
                   (visual pickers, no raw CSS,      affordances
                    no class editor)
  Settings         General, SEO, Forms              + Custom Code, Headers,
                                                      Redirects, Integrations,
                                                      Localization
  Design (tokens)  curated swatches/scales,         full token editor with IDs,
                   no token IDs, no usage-map        usage map, replace, AI prompt
```

- **Delete** the standalone topbar Dev-mode toggle and the standalone DSMode toggle — they become this one switch.
- Critical: Simple mode **hides, never deletes**. The engine is identical; switching to Pro reveals everything instantly with zero data change (DSMode already proves this is safe — it's display-only today).

This single change makes the Builder's product feel like Wix/Framer (calm, few choices) and the Pro's product feel like Webflow (full power), from one codebase.

---

## 4. IA restructure — one home per concept

Fix Problem A + B by stating the boundary and deduping to it.

**The boundary rule (recommended):**
> **Editor** owns everything about *this site's design and content* — including its SEO, forms, analytics config, custom code. **Dashboard** owns everything about *the business* — account, workspace, team, billing, domains, plan, cross-site management.

Concretely:
- **SEO** → site-level defaults live in **Editor → Settings → SEO**; per-page overrides live in **Pages drawer → SEO**. **Delete** the dashboard site-detail SEO tab (or make it a read-only mirror with a "Edit in editor" link). One authoring home, one override home — a clean two-level model, not three copies.
- **Analytics** → *configuring* the GA/Plausible IDs lives in Editor → Settings (one place). *Viewing* analytics lives in Dashboard → site-detail → Analytics (one place). Stop showing analytics config in the page drawer.
- **Custom code** → site-wide in Editor → Settings (Pro only); per-page in Pages drawer (Pro only). Remove from wherever it's duplicated.
- **Forms** → submissions inbox in **one** place (recommend Dashboard site-detail, since it's a business/ops view), form *config* in the editor. Today it's split confusingly.
- **Domains / Members / Billing** → stay dashboard-only. The editor's "Workspace" deep-links are fine but should be clearly labeled "opens dashboard ↗" so the boundary is felt, not surprising.

Net: every concept gets exactly one authoring home (+ at most one override home for page-level things). The "three doors for SEO" problem disappears.

---

## 5. Feature ledger — keep / expand / reduce / merge / move

Grounded, opinionated calls on the real features:

| Feature | Verdict | Why |
|---------|---------|-----|
| Templates | **EXPAND** | The Builder's primary on-ramp. Make it (or AI) the default first screen for a new blank site. Richer categories, live preview. |
| AI generate / AI tab | **EXPAND** | The "just make it for me" path — the strongest beginner wedge. Surface it earlier; it's currently buried as rail tab #2 with an empty state. |
| Add (blocks) | **KEEP** | Core. Flat 100-element grid is fine now; add sub-grouping only past ~150 (noted scalability risk). |
| Pages | **KEEP** | Core. But move the 9-screen settings drawer's Pro screens behind Simple/Pro. |
| Media | **KEEP + MERGE** | Collapse the modal-vs-panel dual code path into one. |
| Design / tokens | **KEEP, split by mode** | Simple = curated swatches; Pro = full token editor. This is what DSMode was reaching for — finish it as part of the global switch. |
| Layers | **REDUCE (Pro-default)** | Beginners don't think in DOM trees. Hide in Simple; keep for Pro. |
| Components | **MERGE + REDUCE** | Kill the V1/V2 flag duplication (one impl). Pro-default — components are a power-user concept. |
| Settings (editor) | **SPLIT by mode** | General/SEO/Forms in Simple; Custom Code/Headers/Redirects/Integrations/Localization in Pro. |
| Inspector "All CSS", CSS Classes | **REDUCE (Pro-only)** | Already dev-mode-gated; fold into the unified Pro switch. |
| Publish | **KEEP** | Now unified (B1). The pre-publish checklist builds trust — good for beginners. |
| History | **REDUCE (Pro-leaning)** | Undo/redo stays in topbar for everyone; the full timeline tab is Pro. |
| Components: two create modals | **MERGE** | Pick one create-component path. |
| Dashboard site-detail SEO/Settings tabs | **MOVE/CUT** | Dedup against the editor per §4. |
| Stripe billing UI (interval switch, payment method) | **KEEP hidden until real** | Already correctly stubbed/hidden ("payment processing coming soon"). Don't ship fake payment UI. |

---

## 6. The inspector, redesigned per mode (the most-touched surface)

The inspector is where the Builder drowns and the Pro gets nagged. Concretely:

**Simple inspector** (visual-first, ~6 sections, zero jargon):
- Quick Actions (size, position, colors) — kept
- Text (font, size, weight, color, align) — token pickers only, no raw values
- Spacing (visual padding/margin pad editor)
- Background (color/image picker)
- Border + Corners (visual)
- Visibility (show / hide on phone-tablet-desktop — the D1 toggle, which now works)
- NO: CSS classes, All CSS, z-index, float, breakpoint-override pills, pseudo-state pills, 26-property advanced tables.
- Breakpoint switching still exists (desktop/tablet/phone) but as "how it looks on phone," not "override mechanics."

**Pro inspector** (today's full surface):
- All 14 sections, advanced tables, All CSS, CSS Classes, breakpoint-override indicators, pseudo-state pills, token IDs, dev affordances. Unchanged from today — the Pro already likes this.

This single split is probably 60% of the perceived "ease of use" win for beginners.

---

## 7. Prioritized roadmap (phases — boil one lake at a time)

1. **Phase 1 — Unify the mode switch (the spine).** Merge DSMode + Dev-mode + disclosure into one per-user `Simple ↔ Pro` setting; wire onboarding role → default; auto-suggest Pro on dev actions. *Largest UX win, medium effort.*
2. **Phase 2 — Gate the inspector by mode.** Simple = 6 visual sections; Pro = full. *Highest beginner-ease payoff.*
3. **Phase 3 — Gate the rail + settings by mode.** Simple shows ~6 tabs / 3 settings screens; Pro shows all.
4. **Phase 4 — IA dedup.** Pick the editor↔dashboard boundary (§4); collapse SEO/Analytics/Forms to one home + one override home; delete the duplicate dashboard tabs.
5. **Phase 5 — Merge the duplicated code.** Components V1/V2, media editor dual-path, create-component modals.
6. **Phase 6 — Discoverability.** Editor command palette as the universal finder; surface save-as-component, token-replace, redirects there. Auto-suggest Pro hooks.

Each phase is shippable and reversible (feature-flag the mode rollout). Nothing here is a rewrite — it's gating + deduping an engine that already works.

---

## 8. Anti-slop guardrails (the founder asked for this explicitly)
- **No invented personas / metrics.** The two personas are derived from features the product already ships (templates+AI = Builder; classes+tokens+custom-code = Pro).
- **Hide, never fork.** Simple mode must render from the same engine state as Pro (DSMode already does this) — no second data model, no "lite engine."
- **Don't auto-switch a user's mode.** Suggest, let them choose. Respecting agency = trust.
- **Don't ship fake UI.** The Stripe stubs are correctly hidden today; keep that discipline for any new mode-gated feature — gate the UI, don't fake the backend.
- **One label, everywhere.** Simple/Pro must mean the same thing in editor, inspector, settings, dashboard. The current 3-way fragmentation is exactly the slop to remove.

---

## 9. Decisions the founder must make (not assumed)

These are genuine strategy calls the review cannot make alone:

- **D1 — Primary audience.** Optimize the *default* experience for the Builder (Simple-first, devs opt into Pro) or the Pro (power-first)? This sets the default mode + onboarding. Recommendation: Simple-first default — beginners churn fastest from overload; devs happily flip one switch.
- **D2 — Editor↔dashboard boundary.** Adopt the §4 rule (editor owns site design+content config; dashboard owns the business) and delete the duplicate dashboard SEO/Settings tabs? Recommendation: yes — it's the single biggest dedup.
- **D3 — Build order.** Start with the mode-switch spine (Phases 1–3) which is the felt win, or the IA dedup (Phase 4) first? Recommendation: spine first — it's what the user *feels* as "easy to use."

---

## VERDICT
The product isn't badly built — it's **undifferentiated**: it shows the union of a beginner tool and a developer tool to everyone, and lets the same concept grow three homes. The fix is not more features (or fewer) — it's **one Simple↔Pro switch that already half-exists**, plus a stated editor↔dashboard boundary that deletes the duplication. Do the switch first (Phases 1–3): it converts an overwhelming surface into two coherent products from one engine, and it's the exact thing the founder is asking for. Then dedup the IA. No rewrite required.
