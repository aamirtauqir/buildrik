# Buildrick editor vs Webflow — reverse-engineering audit (2026-10-20)

Baseline: `main` @ 19f964d5e. Phase 1 fix branch (`feat/phase1-s6-publish`) is **not** merged and was **not** assessed.
Method: Webflow reference from official sources (W), five source-code reverse-engineering passes (C1–C5, file:line), one live walk of 18 workflows on the running app (L, :3310, site `audit1020-webflow`).
Mode: AUDIT_AND_DESIGN — no application code changed.

Evidence:
- `evidence/W-webflow-reference.md` — 65 capability IDs, 57 confirmed / 8 partial, all sourced
- `evidence/C1-engine-style-system.md` — data model, classes, cascade, states, tokens, undo (6 bugs reproduced in a real Composer)
- `evidence/C2-canvas-selection-navigator.md` — canvas, selection, DnD, text, layers, shortcuts (2 bugs proven)
- `evidence/C3-inspector-style-panel.md` — every inspector section/control
- `evidence/C4-components-cms-pages-assets.md` — elements, components, CMS, pages, assets, forms
- `evidence/C5-interactions-publish-collab.md` — interactions, publish, versions, roles, collab, other
- `evidence/L-live-walk.md` — W1–W18 live verdicts; screenshots + published HTML in the session scratchpad (outside repo)

## 1. Answer in one paragraph

Buildrick **looks and moves like Webflow on the surface** — drag-add, Layers = DOM, breakpoint overrides, undo, reorder, CMS binding, autosave all work live. It does **not think like Webflow underneath**. Webflow is a visual CSS authoring tool: classes are the unit of styling, combo classes inherit, every value maps 1:1 to real CSS. Buildrick styles **each element individually** (`.buildrick-<id>` per element at export); classes are labels that carry no styles. That one model difference cascades into the missing style manager, inheritance indicators, reusable design, and clean exported CSS. Around it sit missing power features (timeline animations, CMS filter/sort, component props/slots, staging, content-editor role) and a set of real bugs, several of which lose user data.

## 2. Webflow core mental model — does Buildrick hold it?

| Webflow invariant | Buildrick | Evidence |
|---|---|---|
| Classes are the styling unit; shared class = shared change | **No** — per-element styles; classes are tags | C1 S01, C3, L W3 (2nd `hero-title` stayed 36px/slate) |
| Combo class inherits from base class | **No** | C1, L W3 |
| Desktop base, smaller breakpoints cascade down | **Yes** (3 tiers vs Webflow 4 + 3 optional large) | C1 S03, L W4 |
| States (hover/focus/pressed…) per selector | **Partial** — per element, 4 states | C1 S04, L W5 |
| Navigator = DOM tree | **Yes** | C2 C10, L W2 |
| Inspector values = real CSS, any unit/calc/var | **Partial** — calc/clamp/arbitrary var rejected; rem/% silently become px in spacing | C3, L W7 |
| Inheritance colour indicators | **Partial** — breakpoint/state/component shown; parent inheritance not | C1 S05 |
| Canvas renders like the real site | **Partial** — canvas is a div, not an iframe; custom `@media` likely follows the editor window | C2 C01 |
| Preview = published | **No** — Preview drops hover, interactions, and one colour differed | L W5/W15/W16 |
| Exported code is clean, readable HTML/CSS | **Partial** — real tags, no inline styles, but one generated class per element | C1, L W16 |

## 3. Gap matrix (verdict per capability)

Legend: ✅ matches · 🟡 partial · 🔁 different model · ❌ missing · ⛔ stub/flag-off. Sev = impact on a Webflow switcher (P0 blocks core workflow).

### Canvas & manipulation
| ID | Capability | Verdict | Sev | Note |
|---|---|---|---|---|
| C01 | Zoom/pan | 🟡 | P2 | no ⌘-wheel/pinch, no space-pan |
| C02 | Breakpoints | 🟡 | P1 | 3 tiers; switcher buried in footer/⌘K; no drag-resize |
| C03 | Selection | 🟡 | P1 | ⌘-click cycle advertised but broken (proven) |
| C04 | Drag-add | ✅ | P2 | |
| C05 | Move/reorder | ✅ live | P2 | cancelled ⌘-drag may leave a duplicate (suspected) |
| C06 | Inline text | 🟡 | P0 | **insert link replaces text with plain URL** (live); Esc discards edits; Clear formatting dead (proven); no Rich Text element |
| C07 | Copy/paste/duplicate | 🟡 | **P0** | duplicate loses tablet/mobile/hover styles (reproduced); clipboard in-memory only |
| C08 | Context menu | ✅ | P2 | |
| C09 | Shortcuts | 🔁 | P1 | ⌘E, ⌘⇧L, `?` dead; ⌘⇧P = palette not preview |
| C10 | Layers | ✅ | P1 | selecting off-screen layer does not scroll canvas |
| C11 | Undo/redo | ✅ | P2 | components/settings/CMS not on ⌘Z |
| C12 | Preview | 🟡 | P1 | scripts blocked → no interactions/hover |
| C13 | Overlays/guides | 🔁 (partly better) | P2 | |
| C14 | Command palette | ✅ | P2 | ⌘K not ⌘E |

### Style system & inspector
| ID | Capability | Verdict | Sev | Note |
|---|---|---|---|---|
| S01 | Class-based styling | ❌ | **P0** | root cause of most style gaps |
| S02 | Style panel sections | 🟡 | **P0** | Layout/Position only for containers; one bg layer, 2-stop gradients, no 3D/backdrop, no alpha colours |
| S03 | Breakpoint cascade | 🟡 | P1 | paste-styles on Tablet writes Desktop; Mobile read skips Tablet layer |
| S04 | States | 🟡 | P1 | hover/focus/active/disabled only |
| S05 | Value-source indicators | 🟡 | P1 | inspector showed 1a1a1a while canvas rendered #334155 (live) |
| S06 | Style manager | ❌ | P2 | |
| S07 | Variables/tokens | 🟡 (close) | P2 | 14 kinds, light/dark, `:root` export |
| S08 | Units/calc/var | 🟡 | P1 | rem/% → px in spacing box (live) |
| S09 | Grid editor | ❌ | P1 | column count only |
| S10 | Embed / custom attrs | 🟡 | P1 | no Embed element; attrs add-only, `data-`/`aria-` only, never listed |
| S11 | Copy/paste styles | 🟡 | — | Webflow itself lacks this |

### Structure, components, CMS
| ID | Capability | Verdict | Sev | Note |
|---|---|---|---|---|
| E01 | Element catalogue | 🟡 | P1 | no Rich Text, Embed, Lightbox, Dropdown; navbar no mobile menu; Tabs/Modal have no published script (suspected broken) |
| E02/E03 | Element settings, a11y | 🟡 | P1 | tag picker only for headings; link no section/page anchors |
| K01 | Components | 🔁 | P1 | edit instance → "Update from selection"; no isolated master canvas; overrides tracked by position |
| K02/K03 | Props / slots | ❌ | P1 | |
| K04 | Variants | 🟡 | P2 | engine only, no UI |
| K05 | Shared libraries | 🔁 | P2 | copy, not linked |
| M01 | Collections & fields | 🟡 | P1 | no multi-reference |
| M02 | Collection lists | 🟡 | **P0** | no filter/sort/offset/pagination (engine supports it, binding doesn't carry it) |
| M03 | Template pages | 🟡 | P1 | reference field prints raw id (suspected); duplicate slugs collide |
| M04 | Conditional visibility | ❌ | P1 | |
| M06 | Client content editing | ❌ | P1 | |
| M07 | Import/API | 🟡 | P2 | API tokens accept nothing |
| F01 | Forms | ✅ core | P2 | honeypot only, no file field |

### Pages, assets, interactions, publish, team
| ID | Capability | Verdict | Sev | Note |
|---|---|---|---|---|
| P01/P02 | Pages & SEO | ✅ live / 🟡 | P1 | **head code rejects valid `<meta>`** (confirmed); inline scripts stripped (GA/GTM) |
| P03 | Site settings | 🟡 | P1 | site password may silently not apply (suspected P0) |
| P04 | Assets | 🔁 | P1 | per-user library; no responsive/WebP; AI alt text auto-written (vs no-AI decision) |
| P05 | Fonts | 🟡 | P2 | 27 Google fonts |
| I01 | Interactions | 🟡 | P1 | 14 triggers/41 presets; scroll/mouse replay instead of scrub; not in Preview |
| I02 | Timeline editor | ❌ | P1 | |
| I03/I04 | GSAP / Lottie, Spline | 🟡 / ❌ | P2 | |
| X01 | Publish | 🔁 | P1 | always production; no staging, no per-page |
| X02 | Backups | 🟡 | P1 | no automatic time backups (interval setting unread) |
| X03 | Code export | ✅ mostly | P2 | |
| X04 | Domains | 🟡 | P1 | redirect domains serve duplicate site (suspected) |
| X05 | Pre-publish audit | 🟡 | P2 | |
| T01 | Roles | 🔁 | P1 | no content-only role; Editor = Designer |
| T02 | Branching | ❌ | P2 | Webflow: Team/Enterprise only |
| T03 | Comments/review | 🟡 | P2 | `/review/<token>` strong; no threads/@mentions |
| T04 | Simultaneous editing | 🔁 / ⛔ | P1 | whole-site conflict dialog even on different pages; collab flag-off (planned) |
| T05 | Client mode | ❌ | P1 | |
| O01 | Ecommerce | ⛔ stub | — | |
| O02 | Localization | ❌ | P2 | |
| O03 | Apps/API | 🟡 | P2 | |
| O04 | Analytics | 🟡 | P2 | |

**Tally (65 IDs, approximate):** ✅ 11 · 🟡 32 · 🔁 10 · ❌ 10 · ⛔ 2.

## 4. Bugs found (ranked)

Proven = reproduced by test or live. Suspected = from source reading.

| # | Bug | Status | Where |
|---|---|---|---|
| 1 | Duplicate/paste loses tablet, mobile and hover styles (canvas + publish) | proven (C1) | `ElementCRUD.ts:227-292` — fix exists on unmerged Phase 1 branch (BK, 10-14) |
| 2 | Insert link in text replaces selection with plain URL, no `<a>` | proven live (L W8) | |
| 3 | Spacing box applies `2rem`→2px, `10%`→10px | proven live (L W7) | `SpacingControls.tsx:86-90,148,172-175` |
| 4 | Transform/filter slider drops non-whitelisted functions (`translate(-50%,-50%)`) | suspected, data loss | `sections/effects/effectValues.ts` |
| 5 | >2-stop gradient overwritten with 2 stops on edit | suspected, data loss | `gradientHelpers.ts:46-49` |
| 6 | Page head code rejects valid `<meta>` → save fails | confirmed (regex) | `usePageSettings.ts:85-94` |
| 7 | Site password failure swallowed → public site believed protected | suspected | `publish.service.ts:995-1020` |
| 8 | Paste styles on Tablet writes Desktop | proven (C1) | `commandOperations.ts:323` |
| 9 | "Apply style to all" in a state copies nothing (`data-buildrik-id` typo) | proven (C1) | `stylePeers.ts:79` |
| 10 | Mobile style read skips Tablet layer | proven (C1) | `commandOperations.ts:254-262` |
| 11 | ⌘-click selection cycle never selects | proven (C2) | `useSelectionBehavior.ts:79,100,212,243` |
| 12 | Clear formatting does nothing | proven (C2) | |
| 13 | Esc discards inline text edits | proven live | |
| 14 | Tabs / Modal have no published runtime | suspected | |
| 15 | Multi-select: link/classes/interactions write first element only; ID written to all | suspected | C3 |
| 16 | Custom attributes never listed → can't edit/remove | suspected | `DataAttributeEditor.tsx:57-103` |
| 17 | Line height `1.5` on `normal` → `1.5px` | suspected | `InputControls.tsx:325-336` |
| 18 | Class suggestions call non-existent engine method | proven (C1/C3) | `CSSClassesSection.tsx:111-114` |
| 19 | Redirect domain never sent to Vercel as redirect | suspected | `domain.service.ts:406`, `lib/vercel.ts:335` |
| 20 | Scheduled-publish cron sends no pages → worker throws (no UI caller yet) | suspected | `cron/scheduled-publish/route.ts:38` |
| 21 | Deleted elements' style rules keep shipping in published CSS | proven (C1) | |
| 22 | "On scroll out" fires at load for below-fold; published runtime ignores reduced-motion | suspected | `interactionRuntime.ts:205` |
| 23 | Inspector colour ≠ rendered colour (1a1a1a vs #334155); Preview/publish render black | proven live | |
| 24 | "Start from Scratch" leaves you on sites list | proven live | |

## 5. What would make it "work like Webflow" — priority order

1. **Fix data-loss bugs first** (1, 3, 4, 5, 2, 13) — merge Phase 1 branch for #1 after re-verification.
2. **Decide the styling model (owner decision).** Either (a) adopt Webflow's class-first model (classes own styles, combo inheritance, style manager, inheritance indicators), or (b) keep per-element styling deliberately and position Buildrick as "Framer-like/simpler", dropping the pretence of classes. Half-way (class labels that do nothing) is the worst option — it misleads Webflow users (L W3).
3. **Unblock layout/position on every element** (S02 P0) and accept full CSS values (rem/%/calc/var).
4. **CMS list filter/sort/pagination** (M02 — engine already supports it).
5. **Preview fidelity** — run hover + interactions; canvas as iframe so `@media` matches device.
6. Missing elements: Rich Text, Embed, Lightbox, Dropdown, navbar mobile menu; runtimes for Tabs/Modal.
7. Then: component props/slots + isolated master editing, timeline animations, staging publish, content-editor role, automatic backups.

## 6. Not verified

- Webflow side checked from docs only, not inside a Webflow account.
- Code claims marked "suspected" were not reproduced.
- Live walk skipped: tablet-only overrides, combo classes (nothing to test), grid rows/areas, published CMS item pages, hover/click interaction triggers, real Vercel publish, cut/paste-HTML/multi-select/group/z-order, comments/review/history/brand/collab.
- Phase 1 branch fixes not evaluated.
- Side effect: live walk uploaded one 566 B PNG to the real Vercel Blob store (only upload path); test site `audit1020-webflow` left in local DB.
