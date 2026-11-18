# R48 — Webflow-like workflows: module-wise gap report + Figma repair plan

14 October 2026. Owner direction (STATUS.md, R45): **keep the existing Buildrick UI, adopt Webflow-like editing workflows, targeted usability fixes allowed.** This report answers three questions module by module:

1. What does the editor code have today?
2. What is missing compared with Webflow's Designer?
3. What does Figma page **04 — PRODUCT DESIGN / Flow reconciliation** (`8463:2`) have, and what is wrong with it?

It ends with the Figma repair plan and the Module 1 (Style system) plan.

## Evidence levels — read before trusting a row

| Source | Date | Level |
|---|---|---|
| Code scan of `packages/editor/src`, `server/`, `prisma/schema.prisma` against 24 Webflow capabilities | 2026-10-14 | **Source-read only.** Nothing here was re-checked in the live app. "Present" means the code exists, not that it works. |
| Fresh Figma `get_metadata` on `8463:2` (1 call, read-only) | 2026-10-14 | Frame names/ids only. Frames were assigned to modules **by name**. Counts are frames, not user journeys. |
| R36 module acceptance, R47 duplication audit, walkthrough WF-01…09, R38–R45 QA | 2026-10-12…14 | Repo docs. All R38–R45 results are finite prototype samples; no real save/upload/publish/email ran. |
| Webflow capability baseline | general product knowledge + `WEBFLOW-FRAMER-GAP-ANALYSIS.md` (30 official sources, 10-10) | Documentation-level, not hands-on. |

Full page-04 frame list (724 frames, by module, with node ids): [evidence/page04-module-inventory-2026-10-14.md](evidence/page04-module-inventory-2026-10-14.md).

**Not verified in this report:** live behaviour of any row; page 01 and page 02 contents (only referenced through R47); pixel/visual fidelity of any board.

---

## 1. Summary

**What is strong already (keep it):** Layers/Navigator, SEO (meta, OG, canonical, sitemap, robots, 301 redirects), Forms (submissions, email/webhook, redirect, honeypot), design tokens (14 kinds, light/dark), AI.

**What makes Webflow "Webflow" and is missing here:**

| Rank | Gap | Why it matters |
|---|---|---|
| 1 | **Class-based styling.** Styles are written per element (`[data-buildrick-id]`), not per class. No shared class, combo class, "affects N elements", rename-everywhere or value-origin marker. | Style once and reuse everywhere — every other Webflow workflow sits on this. |
| 2 | **Breakpoints.** Only Desktop (base), Tablet ≤1023 and Mobile ≤767. No 1280/1440/1920 styling, no mobile-landscape (479), no custom breakpoints. "Wide 1920" only resizes the canvas. | Large-screen and small-phone layouts can't be styled. |
| 3 | **Component props / slots.** Variants + overrides exist; props (text/image/link/visibility), slots, true nesting and a cross-site library don't. | Components can't be content-driven building blocks. |
| 4 | **CMS collection list.** Filter/sort/offset exist in the engine but only `limit` is in the UI. No multi-reference, pagination or CMS search. | Blogs and listings can't be built properly. |
| 5 | **Interactions timeline.** 14 triggers + GSAP, but one preset per trigger. No multi-step timeline; nothing driven by scroll progress or cursor position. | Webflow's animation edge. |
| 6 | **Content-editor role.** EDITOR and DESIGNER have the same rank. No safe "client edits text/CMS only" mode, no page lock. | Agency handover. |
| 7 | **Publish.** Behind a flag; no staging→production promote, no selective page publish. | Release safety. |
| 8 | **Smaller authoring gaps.** No HTML embed element, visited/placeholder/::before/::after states, grid-area editor, aspect-ratio, backdrop-filter, 3D transforms, clamp units, or responsive srcset. | Day-to-day power-user friction. |
| 9 | **Localization.** Absent. | Separate project. |
| — | Ecommerce orders/checkout, memberships, A/B testing | Separate large projects. Not in this plan. |

**Page 04 in one paragraph.** 724 top-level frames now, versus 217 in the 10-12 walkthrough register, so 507 frames (R28–R45) were never registered. 43 PROPOSED frames (AI A01–12, Agents G01–15, Team C01–16; `8465:19–61`) are still linked from live screens. All 14 module gates are OPEN, and 498 of 532 Inspector controls have open contracts. Per R47 the shell departs from the original (page 01 `8280:2`): flat text navigation instead of rail + drawer, a 352 px Inspector instead of 300 px, Style/Settings/Interactions tabs instead of Style/Behaviour/Effects, and no page tabs or bottom Undo. Every module is also duplicated against page 02 (`8312:2`) in a separate node tree.

**Bug found while reading code (not live-verified):** `src/engine/commands/stylePeers.ts:79` builds selectors with `data-buildrik-id` (missing "c"). Everywhere else, including `StyleEngine.ts:205`, uses `data-buildrick-id`. As a result, "Apply style to all peers" for a **hover/focus/active** state reads an empty rule and copies nothing, or writes to a selector that matches no element. The normal state is unaffected because it goes through `setStyle`/`setBreakpointStyle`.

---

## 2. Module-wise

Each module uses the same layout: **Code today** · **Missing vs Webflow** · **Page 04** · **Page-04 problems** · **Fix / priority**.
Priority: **P0** = foundation, do first · **P1** = core Webflow workflow · **P2** = power-user · **P3** = separate project.

### 2.1 Editor and Layers
- **Code today:** layer tree with drag reorder/reparent, collapse, rename, hide/lock, search, context menu, move-to-page and keyboard navigation (`editor/panels/layers/LayerTreeItem.tsx:93`, `hooks/useLayerDrag.ts`).
- **Missing vs Webflow:** nothing major in the tree. Canvas foundation defects are still open: F-038 canvas resize broken, F-042 zoom coordinate space, MENU-01 arrow keys in the Layers menu.
- **Page 04:** 16 frames. Reorder/nest `8884:17236/17470/17704`; hidden-element recovery (R45).
- **Page-04 problems:** the biggest UI deviation (R47). Original Layers `8283:610` has its own header, search, 28 px rows and count; page 04 merges tool navigation into the tree. Page tabs and bottom zoom/Undo are missing.
- **Fix / priority:** **P0**. Fix F-038/F-042 in code. In Figma, rebuild from page-01 components; no new design is needed.

### 2.2 Inspector Style (includes Breakpoints and States)
- **Code today:**
  - **Styling:** per-element styles; CSS class chips with multi-add (`inspector/sections/CSSClassesSection.tsx`); one-shot "apply to all H3s" (`engine/commands/stylePeers.ts`).
  - **States:** normal/hover/focus/active/disabled, per breakpoint (`inspector/config/pseudoOverrides.ts:15`).
  - **Breakpoints:** 3 (`shared/constants/breakpoints.ts:14`).
  - **Layout:** flex, grid columns plus a custom track list, position offsets, min/max. Units: px, %, em, rem, vw, vh, auto.
  - **Effects:** 2D transforms, filters (4), blend, cursor, a single transition.
  - **Engine:** `StyleEngine` already stores arbitrary-selector rules with pseudo + media query, persists them (`exportStyles`/`importStyles`) and exports them (`toCSS`). `GlobalStyleManager` exists but has no UI consumer.
- **Missing vs Webflow:**
  - **Classes:** class-targeted styling, combo classes, "affects N", rename propagation, inherited/local origin per property.
  - **Breakpoints:** 1280/1440/1920 and 479, custom breakpoints.
  - **States:** visited, focus-within, placeholder, ::before/::after.
  - **Layout:** grid-area editor, aspect-ratio, clamp/ch/svh/dvh units.
  - **Effects:** backdrop-filter, 3D transforms + transform-origin, more filters, multiple transitions.
- **Page 04:** 77 frames.
  - Mobile override with origin + scoped reset: `8464:27`, `8465:7`, `8465:15`.
  - Class / combo / cascade sample: `8465:8`, `8465:16`, `8465:18`.
  - Hover: `8465:9`.
  - All are finite samples.
- **Page-04 problems:**
  - WF-01: the padding-left control edits the right side (`8465:6`).
  - WF-08: a Desktop style doesn't carry into the Mobile reset fixture.
  - Fit is routed to "Shared Style", unlike the original.
- **Fix / priority:** **P0 — Module 1** (see §4). Order: classes + value origin → breakpoints → states → layout/effects extras (P2).

### 2.3 Inspector Settings and Forms
- **Code today:**
  - **Forms:** 16 blocks; submissions stored; email/webhook/redirect/message on submit; honeypot (`prisma/schema.prisma:980`).
  - **Elements:** custom attributes; CMS binding section.
- **Missing vs Webflow:**
  - HTML embed element: only the unused type `"custom"` exists (`shared/types/element.ts:136`).
  - Captcha on forms (Turnstile is used for auth only).
  - Server storage for uploaded files is unproven.
  - Rich-text child-tag styling (h1–h6, p, a, blockquote inside rich text).
- **Page 04:** 106 frames. R41 Slider, R42 Form remote settings, R43 Select options, R44 Video ratio. CMS binding picker `8539:12670`.
- **Page-04 problems:**
  - 415 controls have unresolved Style vs Settings ownership.
  - 50 element-type Inspector screens are not in the walkthrough.
- **Fix / priority:** **P2.** Keep the R41–R44 behaviour and rebuild it on original components. Add the Embed element (small) and form captcha.

### 2.4 Interactions and existing AI
- **Code today:**
  - **Interactions:** 14 triggers, 40+ presets, lazy GSAP, preview, Lottie block (`engine/interactions/types.ts:14`).
  - **AI:** agent tab, site generation, alt text, brand extraction (dsAi flagged).
- **Missing vs Webflow:**
  - Multi-step timeline with keyframes.
  - Scroll-progress-linked animation.
  - Cursor-position-linked animation.
  - Scroll-driven Lottie.
- **Page 04:** 62 frames, 27 of them PROPOSED. Trigger → target → animation with preview: `8465:11`, `8841:14872`. **No timeline.** Only "On click" was played.
- **Page-04 problems:** PROPOSED AI/Agents frames are still linked from live screens.
- **Fix / priority:** **P1**, after Style system. Build a timeline (steps × target × property × time) on the existing GSAP runtime. Mark the PROPOSED frames `PLANNED ·` and unlink them.

### 2.5 Pages and Templates
- **Code today:** pages/folders lifecycle (duplicate, rename, Keep URL, delete, undo verified); per-page SEO and head code; templates.
- **Missing vs Webflow:**
  - Page-level lock.
  - Branching.
  - PAGE-01 shortcut wiring defect.
- **Page 04:** 66 frames. Folders, bulk actions, page SEO, template replace with backup + Undo.
- **Page-04 problems:**
  - Create/delete not proven.
  - Placeholder dialogs (WF-07).
  - Duplicated in page 02 (`8317:243948`, `8318:244145`, `8318:244368`).
- **Fix / priority:** **P2.** Mostly fine; replace placeholder dialogs with real ones.

### 2.6 CMS
- **Code today:**
  - **Fields:** 16 field types in the schema, 10 offered in the Add-field UI (`editor/cms/fieldTypes.ts:17`); single reference.
  - **Collection list:** limit; nested lists.
  - **Pages and data:** dynamic template pages, CSV import.
  - **Engine:** filter/sort/offset (`engine/cms/CMSBindingManager.ts:353`, `CollectionManager.ts:494`).
- **Missing vs Webflow:**
  - Filter/sort/offset in the UI.
  - Multi-reference field.
  - Conditional visibility by field (visibility is per breakpoint only).
  - Pagination.
  - CMS search.
  - The remaining 6 field types in the UI.
- **Page 04:** 85 frames. Field types, references, dynamic pages, conditional visibility `8748:13565`. The collection list has only limit + field mapping (`8843:31228`), **no filter/sort**.
- **Page-04 problems:**
  - WF-02 (High): opening Fields from Articles lands on Projects.
  - WF-03: wrong caller context.
  - Add/import/open-record are unwired.
- **Fix / priority:** **P1.** Fastest win in the report: the engine is already done, so filter/sort/offset UI is mostly chrome work. Then conditional visibility, then multi-reference.

### 2.7 Media
- **Code today:**
  - **Library:** nested folders, alt text (AI service), asset versions, image editor.
  - **Formats:** WebP/AVIF client optimization, SVG/Lottie.
- **Missing vs Webflow:**
  - Responsive `srcset`/`sizes` on export.
  - Background video.
  - RT-01: upload registration 500 → src lost on reload (audit 10-10).
- **Page 04:** 51 frames. Replace across site; alt text kept on replace.
- **Page-04 problems:**
  - WF-04: duplicate asset row.
  - WF-06: upload/URL never reach ready/fail.
  - Upload queue/replace/delete are placeholders.
- **Fix / priority:** **P0 for RT-01** (data loss). P2 for srcset/bg video.

### 2.8 Brand (design tokens / variables)
- **Code today:**
  - **Tokens:** 14 token kinds, aliases, usage map, linter (`engine/designSystem/types.ts:64`).
  - **Modes and reach:** light/dark/system; workspace push.
- **Missing vs Webflow:**
  - User-named variable collections.
  - Extra modes (brand modes).
  - Binding to any property: only ~20 are bindable (`shared/constants/tokenProperties.ts:13`). Width and line-height are not.
- **Page 04:** 91 frames. Variables, modes, classes, type styles with impact review.
- **Page-04 problems:** many actions have no reaction.
- **Fix / priority:** **P1.** Widen bindable properties together with Module 1 (class rules should accept token values).

### 2.9 Saved Components
- **Code today:** master/instance, override patches, variant axes, detach/detach-all, sync (`shared/types/components.ts:19`, `engine/components/ComponentManager.ts:424`). Stored per site (`prisma/schema.prisma:1191`).
- **Missing vs Webflow:**
  - **Props:** text, image, link, visibility, rich text.
  - **Slots.**
  - **True nesting:** a new instance is placed after, not inside (`ComponentInstances.ts:77`).
  - **Cross-site shared library.**
- **Page 04:** 15 frames. Overrides/reset/detach/master: `8507:248087`, `8543:9344/9426/9508`. **No component props.**
- **Page-04 problems:**
  - WF-05: text overlap.
  - No design entry ids in R36.
- **Fix / priority:** **P1.** Props first (they map onto the existing override patches), then slots, then the library.

### 2.10 Site Settings (includes Custom code, SEO, Localization)
- **Code today:**
  - **SEO:** full set, schema auto-generated (`engine/export/SEOInjector.ts`).
  - **Redirects:** 301/302 + CSV.
  - **Custom code:** site head/body code + global CSS.
  - **Language:** single site language only.
- **Missing vs Webflow:**
  - **Localization** (locales, translated content/slugs/SEO, hreflang).
  - Editable schema markup.
- **Page 04:** 40 frames. Webflow-style tabs: domains, redirects CSV, **locales**, custom code.
- **Page-04 problems:**
  - The locales tab designs a feature the code doesn't have. It must be tagged `PLANNED ·`.
  - Many generic placeholder dialogs (WF-07).
- **Fix / priority:** **P3 for localization** (separate project). P2 for placeholders.

### 2.11 History and Versions
- **Code today:** session undo, History tab, named versions with restore, version timeline.
- **Missing vs Webflow:** nothing major. HIST-01 comparison defect and CAN-03 cancellation are open.
- **Page 04:** 21 frames. Semantic/visual compare; scoped restore + Undo.
- **Page-04 problems:** restore/compare not established.
- **Fix / priority:** **P2.**

### 2.12 Review and Activity
- **Code today:**
  - **Review:** comments, review/approval requests, client review page.
  - **Activity:** activity log, notifications.
  - **Collab:** behind a flag (planned).
- **Missing vs Webflow:** RR-03 shows "No issues" after failed checks; RR-04 permission coupling.
- **Page 04:** 31 frames, 16 PROPOSED. Element-anchored comments exist **only** in PROPOSED frames (Team C01–C16 `8465:46–61`).
- **Page-04 problems:** send-for-review not wired.
- **Fix / priority:** **P2.** Tag PROPOSED as `PLANNED ·`.

### 2.13 Preview and Publish
- **Code today:**
  - **Publishing:** Vercel publish (publish flag), domains + DNS, scheduled publish, password, share links.
  - **Safety:** rollback via redeploy, pre-publish checks, approval gate.
  - **Export:** HTML/ZIP/React.
- **Missing vs Webflow:**
  - Staging→production promote.
  - Publish selected pages.
  - Branching.
  - Code view / copy CSS of the selected element.
  - Preview parity (F-026).
- **Page 04:** 27 frames. Checks/blockers/confirm/failure (`8662:*`). Staging partial: a Production / Preview-deployment field in `8539:12318`, **no promote step**.
- **Page-04 problems:** Preview shows an older static canvas.
- **Fix / priority:** **P1** for staging→promote (Vercel preview deployments already exist conceptually). P2 for selective publish.

### 2.14 Utilities and Workspace handoffs (includes Roles, Productivity)
- **Code today:**
  - **Roles:** OWNER/ADMIN/EDITOR/DESIGNER/VIEWER + per-site overrides (`server/services/permission.service.ts:31`); element lock.
  - **Productivity:** command palette, shortcuts, copy/paste styles, DS linter.
- **Missing vs Webflow:**
  - **Content-editor mode** (EDITOR = DESIGNER today).
  - Page lock.
  - Find & replace.
  - Style guide page.
  - A11y/SEO audit panel (pre-publish checks cover readiness only).
- **Page 04:** 36 frames. Roles Admin/Editor/Viewer; **no content-editor role**.
- **Page-04 problems:** 8 site-menu actions unwired or "Planned".
- **Fix / priority:**
  - **P1:** content-editor mode — split the EDITOR rank and restrict the inspector to content.
  - **P2:** find & replace, audit panel.

### Outside the 14 modules (P3, separate projects)
Ecommerce orders/inventory/checkout, memberships/gated content, Logic-style automation, A/B testing, a public Designer extension API.

---

## 3. Figma repair plan

**Root problems:**
1. **No single source of truth.** The same work exists on pages 01, 02 and 04.
2. **Page 04 departs from the original UI.** Flat navigation, generic controls (R47).
3. **Wrong acceptance measure.** Assertion counts were treated as acceptance, so all 14 gates stayed OPEN without owner sign-off.

**Plan (owner-recommended options; confirm before any Figma write):**

1. **Base = page 01 (`8280:2`).** Freeze it; it is the real editor.
2. **Archive, don't delete.** Rename pages 02 and 04 to `Archive · 02 …` / `Archive · 04 …`. Harvest only proven behaviour from them: R41 Slider, R42 Form, R43 Select, R44 Video ratio, R45 Visibility, the R36 image picker/return.
3. **Components first.** Build the original chrome (rail, left drawer, Layers, 300 px Inspector with Style/Behaviour/Effects tabs, topbar, page tabs, bottom zoom/Undo) as components from page 01. Every new board is made of instances, so drift can't come back.
4. **One new page: `Editor · Webflow workflows`**, with one section per module in §2 order. Each section has three columns:
   - **AS-IS:** the page-01 board, as an instance or copy.
   - **Gap:** a note card with the §2 rows and code refs.
   - **TO-BE:** the same screen with only the changed area different, tagged `CHANGED` / `NEW` / `PLANNED ·`.
5. **Flow strips, not galleries.** One strip per workflow, e.g. *select → create class → combo → "affects 12" → rename*. Only the states the flow needs: default, empty, error.
6. **PROPOSED frames.** The 43 frames become `PLANNED ·` (owner rule: flagged and planned features are designed, never "dead") and are unlinked from live screens.
7. **Acceptance.** The board sits next to a live screenshot at 1440×900. The owner signs off each module before the next one starts. Assertion/geometry counts are a regression net only.
8. **Budget.** The Figma MCP allows 200 calls/day, shared, which means roughly one or two modules per day. Writes are read back after each batch.

**Order:**
1. Style system — classes, origin, states
2. Breakpoints
3. Components props/slots
4. CMS collection list
5. Interactions timeline
6. Publish staging
7. Content-editor role
8. Rest

---

## 4. Module 1 plan — Style system (classes + value origin + states)

**Done-condition (observable, live app):**
1. Select a button and create class `btn-primary`; style it.
2. Apply `btn-primary` to a second button; the inspector shows "affects 2 elements" and both render the same computed styles.
3. Rename it to `btn-main`; both elements and the exported CSS use the new name.
4. Add combo class `is-large` on one button; only that one changes.
5. On Mobile, override padding on the class; the inspector shows the value origin (Mobile · class) and scoped Reset removes only that override; Undo restores it.
6. Hover state on the class works in canvas and in export.
7. All checks above are confirmed with `getComputedStyle`, not by eye.

**Engine (small — the store already exists):**
- **Class registry:** `id`, `name`, `rules`. It reuses `StyleEngine` rules keyed by `.name` selectors with `pseudo` + `mediaQuery`, and persists through the existing `exportStyles`/`importStyles`.
- **Decide `GlobalStyleManager`:** fold it into the registry or delete it. It has no UI consumer today and violates the no-dead-code rule.
- **Combo selector:** `.base.combo`.
- **Usage index:** class → element ids, which drives "affects N".
- **Rename:** one transaction that rewrites the selector key plus every element's class list.
- **Cascade reader:** returns `{value, origin: element|class|combo|token, breakpoint, state}` per property. It also fixes UX-10/25 (effective value wrong).
- **Fix the `stylePeers.ts:79` selector typo** in the same area.

**Inspector UI (existing chrome, no redesign):**
- **Selector field at the top of Style:** chips for the classes, plus an "Element (local)" option. The active chip is the edit target.
- **"Affects N elements"** line under the field, with "select all" from there.
- **Origin dot on every property label:** local / class / inherited / token. Clicking it shows the source, and there is a scoped Reset.
- **States dropdown** next to the selector; add focus-within, visited and placeholder, with ::before/::after as P2.

**Figma boards (on the new page, section 1):**
1. Selector field: empty, one class, combo.
2. Create class.
3. Affects N.
4. Rename class.
5. Origin indicators plus the reset popover.
6. State picker.
7. Mobile override on a class.

Each board is AS-IS → TO-BE from page-01 components.

**Risks:**
- **Migration:** existing per-element styles stay valid as "local" styles, so nothing needs converting. An optional "extract to class" action covers moving them over.
- **Export order:** class rules must precede element rules in `toCSS`, so local styles still win.
- **Interaction with components:** instance override patches are per element, so classes don't break them. This needs a test.

**Not covered here:** effort estimate in days; live verification of the current per-element pipeline before changes (do this first, per CLAUDE.md "live app is the verifier").
