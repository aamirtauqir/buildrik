# Add + Templates Tab — Broken Flows Audit (B1-A)

Generated 2026-04-17 by a live dev-server audit on `http://localhost:5050/` using Playwright-driven browser navigation + visual inspection.

Part of the B1 execution plan (`~/.gstack/projects/buildrik/add-templates-execution-plan-20260416.md`). Feeds the must-fix list for B1-B (Add tab) and B1-C (Templates tab).

## Severity definitions (from design doc)

- **P1** — blocks the wedge user (solo designer fleeing Webflow/Framer) from completing a landing page. Drag does nothing, template apply errors, critical UX lies, design-system violations that hit primary surfaces.
- **P2** — wedge user can work around it but loses time, trust, or confidence.
- **P3** — polish / cosmetic / nice-to-have.

## Method

1. Dev server (`pnpm dev`, port 5050) running.
2. Navigated fresh session, `?blank=1` query param, then clicked "or start with a blank canvas →".
3. Observed Add tab default state, expanded "Basic" category, observed the alternate UI mode.
4. Clicked the Templates tab, observed template browse state.
5. Did NOT run drag-and-drop (limited by Playwright automation in this pass — that's a followup for manual testing).

**Scope NOT audited this pass:** drag-and-drop mechanics, template apply flow end-to-end, template preview modal, `ApplyProgressOverlay` states, undo after apply, real keyboard navigation. These need hands-on sessions.

---

## Findings — sorted by severity

### P1 — Design doc contradicts reality (architectural)

**File:line refs are best-guess paths; implementer verifies during B1-B/B1-C.**

#### P1-01: Add tab categories don't match the code's own canonical source

- **Observed:** Live UI shows **6 categories**: `Basic | Layout | Forms | Media | Navigation | Interactive`
- **Code says** (`editor/sidebar/tabs/elements/constants.ts::NEW_CATEGORY_ORDER`): **7 categories**: `Most Used | Layout | Basic | Typography | Media | Forms | Advanced`
- **Neither matches:**
  - Live has a `Navigation` category that's absent from `NEW_CATEGORY_ORDER`.
  - Live is missing `Most Used`, `Typography`, and `Advanced`.
- **Impact:** B1-B was designed around the 7-category `NEW_CATEGORY_ORDER` constant. The production UI is NOT reading that constant — it's sourced from somewhere else (or hardcoded). Building B1-B without reconciling this would have shipped a third variant.
- **Repro:** Open editor → Add tab → look at category list. Compare to `constants.ts`.
- **Owner:** B1-B implementer (first day's work must find the actual category source).

#### P1-02: "Basic" category has 11 elements, not 5

- **Observed:** Expanded Basic shows: `Heading, Text, Link, List, Button, Icon, Divider, Spacer, Label, Progress, Countdown` — 11 elements.
- **Design doc Element Inventory table said:** Basic = 5 elements (`button, card, divider, link, list`).
- **Actually:** `Heading, Text, Label` are in `Typography` per `BLOCK_DESCRIPTIONS`. `Progress, Countdown` are in `Advanced`. Live UI merges Typography + Advanced + Basic into one bucket. `card` is missing entirely from this category.
- **Impact:** Element Inventory in the design doc is stale/wrong. B1-B must re-derive from live data.
- **Repro:** Click "Basic" in Add tab, count cards in the grid.
- **Owner:** B1-B implementer.

#### P1-03: Two contradictory Add tab UIs exist in the code

- **Observed:** Default Add tab state is an **accordion** (Basic/Layout/Forms/Media/Navigation/Interactive as rows, all collapsed by default) with search + "Pro Tips" card + "Browse" label on top. Clicking a category header replaces the entire panel with a **different layout**: category name as a dropdown, 3-column grid of elements, other categories as remaining accordion rows below.
- **Impact:** Two different IAs ship in the same component. Design doc assumes one (collapsible categories with cards inside each category). B1-B must either consolidate or formally delete the unused one.
- **Repro:** Open Add tab default → screenshot. Click "Basic" → screenshot. Compare layouts.
- **Owner:** B1-B implementer.

#### P1-04: "Start with a blank canvas" is not blank

- **Observed:** Clicking the "or start with a blank canvas →" link on the onboarding screen loads the editor with **pre-populated content**: "Alex Chen" navbar, "Product Designer" H1, "Crafting digital experiences that people love..." paragraph, placeholder Work/About/Contact nav links.
- **Design doc:** wedge user (Webflow refugee) expects blank canvas to mean blank canvas. Pre-populated lorem content is an old prototype.
- **Impact:** Every new session starts with confusing ghost content. Designer must delete everything before they can start. Trust erosion on session 1.
- **Repro:** Fresh session → click "start with a blank canvas" → canvas has "Alex Chen" / "Product Designer" content.
- **Owner:** B1-B (or separate onboarding PR, depending on code location).

#### P1-05: Onboarding forces AI wizard before editor is reachable

- **Observed:** Default app entry loads an AI generation wizard ("Build a page in seconds — Describe what you need. AI does the rest.") with a Landing Page / Business / Style / Generate Page form. No way to skip to the editor except the tiny "or start with a blank canvas →" link.
- **Design doc wedge:** solo designer currently on Webflow/Framer. They don't want AI-generates-everything on first click — they want a canvas. Our own three-doors thesis says drag is a first-class mode, not a fallback to AI.
- **Impact:** The wedge user's first impression is a wrong-mode default. Pattern violates the "three doors, one room" thesis: AI is THE default door, drag is an afterthought link.
- **Repro:** Navigate to `http://localhost:5050/` → land on wizard, not editor.
- **Owner:** Onboarding decision — pre-B1-B conversation with founder.

#### P1-06: "Generate Page" button + sparkle pill use purple (violates DESIGN.md)

- **Observed:** On the onboarding wizard, the primary CTA "Generate Page" button is purple/violet. The sparkle/AI pill bottom-right of the editor is also purple. The "Modern" style card has a purple/violet border.
- **DESIGN.md (shipped in PR #20):** explicitly bans purple/violet/indigo accents. Single accent is cobalt `#2D6DFF`.
- **PR #20 migrated `themes/default.css` `--aqb-primary` tokens** to cobalt, but these surfaces are still rendering purple — they're reading a different token or hardcoded hex values.
- **Impact:** DESIGN.md is already out of sync with the live product on day one. Either these components have hardcoded colors, or use a secondary token that wasn't migrated.
- **Repro:** Open editor → observe primary CTA color. Should be `#2D6DFF`; is visibly purple.
- **Owner:** B1-B / design system follow-up. Grep for `#6366f1`, `#8b5cf6`, `#a78bfa`, `#818cf8`, `#4f46e5`, `#7c3aed` — any match outside the migration commit is a P1 fix.

#### P1-07: Templates tab takes full-width screen, not sidebar panel

- **Observed:** Clicking Templates tab **replaces the entire main area** (canvas + inspector both hidden). Templates fill ~100% of the viewport width. Looks like a modal or drawer.
- **Design doc spec:** Templates tab is a 280px sidebar panel. Same surface as Add tab.
- **Impact:** Design doc's "three doors, one room" coherence thesis is broken at the UI layer. Opening Templates loses canvas context. Designer can't drag a template onto canvas while seeing both; they're modal states, not paired.
- **Repro:** Click Templates tab → main area is fully replaced.
- **Owner:** B1-C implementer. Decision: preserve full-width or force sidebar mode? Design doc says sidebar, but 4-col grid of template cards in 280px width is tight — this might be a design-review conversation, not just a fix.

#### P1-08: Template cards are blank rectangles with emoji decorations

- **Observed:** Every template card is a dark rectangle (solid color or gradient) with:
  - A small emoji icon top-left (🎨, 🚀, ⚡, 🌙, ...)
  - A title + category label at bottom
  - NO preview image, NO screenshot, NO description
- **DESIGN.md rule:** "No emoji as design elements (rockets in headings, emoji as bullet points)." Direct violation.
- **Impact:** Designer can't tell which template matches their need without clicking into each one. Emoji use is an AI-slop signal (per design doc bans).
- **Repro:** Open Templates tab → look at cards.
- **Owner:** B1-C (emoji removal + preview images) or broader template-content initiative.

#### P1-09: Template tile backgrounds use purple/violet gradients (DESIGN.md violation)

- **Observed:** Template tiles for Startup, Blog, SaaS Landing use purple/violet gradient backgrounds (bright purple, muted purple, dark purple).
- **DESIGN.md:** "No purple/violet/indigo gradients. Ever."
- **Impact:** Same as P1-06 but on a different surface. Cobalt migration did not reach template preview rendering.
- **Repro:** Open Templates tab → observe "Startup" tile (bright purple), "Blog" (dark purple), "SaaS Landing" (dark purple).
- **Owner:** B1-C + design audit of template asset source.

### P2 — Friction + trust erosion

#### P2-01: "Pro Tips" card takes prime real estate above element grid

- **Observed:** In Add tab default state, a "💡 Pro Tips" card sits between the search box and the category list. Takes ~100px vertical space. Shows carousel of 5 tips with ‹/› nav + collapse + dismiss buttons.
- **Impact:** Designer scanning the Add tab sees tips before they see elements. Noise ahead of primary task. Wastes the most valuable pixel band in the sidebar.
- **Recommendation:** Move to a smaller "?" affordance, or show tips only once per session.
- **Owner:** B1-B implementer. Remove or demote.

#### P2-02: "Browse" label box is an ornamental category-list header

- **Observed:** In Add tab default state, the text "Browse" appears as a small boxed label (appears to be column-oriented text) directly above the accordion rows.
- **Impact:** Adds no information. "Obviously these are categories you can browse" is redundant. Violates DESIGN.md's "subtraction default" rule.
- **Recommendation:** Delete.
- **Owner:** B1-B implementer.

#### P2-03: Redundant "Elements / Sections" sub-tab inside Add tab

- **Observed:** Add tab has a secondary tab toggle: `Elements | Sections`. Currently on Elements. Sections is a separate view entirely.
- **Impact:** Unclear if Sections is the same as Templates or something different. Two ways to reach section-level content (Templates tab + Sections sub-tab). Mental model split.
- **Design doc:** "three doors" thesis (drag, templates, AI). Sections sub-tab is not mentioned — feels like a 4th door.
- **Owner:** Pre-B1-B design decision — consolidate with Templates tab, or preserve as a distinct affordance? Defer to plan-design-review or office-hours before coding.

#### P2-04: Add tab header has "Unpin" and "Close" buttons but no clear behavior on click

- **Observed:** Add tab has `📌 Unpin panel` (currently pressed/active) and `✕ Close panel` buttons top-right.
- **Impact:** Clicking Close dismisses the tab entirely. On a 2-tab (sidebar-editor) system this is disorienting — the rail icon re-opens it, but the flow is unclear.
- **Recommendation:** Verify via manual test: what does Close do? Is Unpin meaningful without a dock mode?
- **Owner:** B1-B implementer to verify + remove if dead.

#### P2-05: No template previews on hover — require full click to see content

- **Observed:** Hovering a template card shows no expanded preview, tooltip, or thumbnail.
- **Impact:** Forces click-through-and-back for each template the designer evaluates. High friction.
- **Recommendation:** Hover → show larger preview. Click → apply (or preview modal, if that's still the pattern).
- **Owner:** B1-C implementer.

#### P2-06: Category filter pills in Templates tab may not match content

- **Observed:** Pills: `All | Landing | Portfolio | SaaS | Blog | E-comm`. Cards show categories at bottom: "Landing", "Portfolio", "Ecommerce", "Saas", "Blog". Mismatch: pill says `E-comm` but card category is `Ecommerce`; pill says `SaaS` but card shows `Saas` (lowercase "aa").
- **Impact:** Inconsistent casing and naming. P2 polish.
- **Owner:** B1-C implementer — align casing between filter pills and card labels.

### P3 — Polish

#### P3-01: Favicon 404 on page load

- **Observed:** `http://localhost:5050/favicon.ico` returns 404 in every session.
- **Impact:** Browser console has a persistent error. Minor bad-citizen noise.
- **Repro:** Open editor → check dev console.
- **Owner:** Separate repo-hygiene PR.

#### P3-02: Category "Navigation" exists in UI but is not a top-level design-doc category

- **Observed:** Add tab has `Navigation` as a category (6th in order).
- **Design doc:** Navigation is a subset of Layout/Advanced in the design inventory.
- **Impact:** Might be intentional (navbar, breadcrumb, menu), but worth reconciling with the canonical category list when P1-01/P1-02 are resolved.
- **Owner:** B1-B implementer.

#### P3-03: Drag handle dots visual style

- **Observed:** Each element card has a `⋮⋮` (2x4 dot grid) at the top indicating drag affordance.
- **Impact:** Standard pattern. Fine. Call-out only because DESIGN.md spec'd cobalt selection ring — verify the focus/keyboard-selected state uses the accent token.
- **Owner:** B1-B implementer — add keyboard focus test.

---

## Metrics

| Severity | Count |
|---|---|
| P1 | 9 |
| P2 | 6 |
| P3 | 3 |
| **Total** | **18** |

## What this audit did NOT cover (manual testing required)

1. **Drag-and-drop mechanics.** Does dragging an element card to canvas actually add the element? What about drag-cancel mid-flight? Drop on invalid target?
2. **Keyboard navigation.** Design doc spec'd `/` focuses search, `↑/↓` navigates grid, `Enter` adds at selection. Live behavior unverified.
3. **Template apply flow end-to-end.** Click template → preview modal → apply → page state change → Cmd-Z restores.
4. **Template apply race** (P1 risk flagged in design doc). Apply template A, then immediately click apply on template B before A finishes.
5. **`ApplyProgressOverlay` error states.** Template apply with bad asset / 404 image / malformed data.
6. **Responsive behavior.** Viewport < 1024px behavior (expected: collapse to rail-icon mode per design doc, desktop-only strategy).

These are B1-C acceptance gates but are cheapest to verify by a human sitting at the keyboard. Include them in the designer validation session (DE-3 flow) too — real-user drag-drop observation will surface P1s that automated testing misses.

## Impact on B1 execution plan

1. **B1-A is DONE** (this doc).
2. **Pre-B1-B (~1-2 hours)** — reconcile P1-01, P1-02, P1-03 before any IA rebuild starts. Determine the actual category source on main and the actual element inventory. Update the design doc's Element Inventory section with reality.
3. **B1-B scope grows** to include P1-04 (blank canvas meaning), P1-06 (purple migration outside themes/default.css), P2-01, P2-02. Re-estimate from ~4h to ~6h.
4. **B1-C scope grows** to include P1-07 (sidebar vs full-width decision), P1-08 (template card content), P1-09 (purple gradients), P2-05, P2-06. Re-estimate from ~2h to ~4h.
5. **Design doc Element Inventory section is STALE** — needs a post-audit update before B1-B begins. This is a `status: needs-update` flag on the design doc.
6. **P1-05 (onboarding AI-first default)** may be out of scope for B1-B — it's an onboarding decision, not an Add/Templates tab decision. Surface in next office-hours.

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-17 | Audit run via Playwright-driven browser, not manual click-through | CC can script navigation + screenshots; drag-drop + keyboard tests deferred to manual session. Pragmatic split. |
| 2026-04-17 | 18 findings documented; no code changes yet | B1-A is pure documentation. Code fixes land in B1-B and B1-C. |
