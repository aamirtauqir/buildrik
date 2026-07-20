# Editor Shell — Annotated Wireframes (the frame every other screen lives in)

> The missing design artifact. The redesign doc (`2026-07-17-editor-product-redesign-complete.md` §4.3) settles **what goes where**; this settles **how big, what state, what it looks like**. Same bar as `2026-07-18-j5-signoff-wireframes.md`.
>
> **Why this file exists:** a designer audit found the redesign doc carried exactly one dimension across 912 lines ("4px base spacing") and left 41 of 47 screens undesignable. Most rail panels are the *same drawer with different cargo* — settle the frame once and they become designable together.
>
> **v2 (2026-07-18)** — rewritten after an adversarial audit found the v1 arithmetic wrong (the vertical band didn't fit the viewport, and the overlay rule freed no space). Every number below is checked.
>
> Craft values come from DESIGN.md (colour · type · spacing · motion · row density). Overrides are declared in §7.

---

## 1. Viewport + chrome arithmetic

**Design viewport 1440 × 900. Minimum supported 1280 × 720.**

### Horizontal

Persistent chrome is **rail 60 + inspector 300 = 360**. So:

```
canvas region = viewport width − 360
  1600 → 1240      1440 → 1080      1280 → 920
```

**The drawer is TRANSIENT by default and PINNED by choice.** This is the rule that makes the layout monotonic:

| Drawer mode | Behaviour | Canvas |
|---|---|---|
| **Transient** (default) | overlays the canvas from the rail edge; **auto-closes on the first canvas interaction** (click, drag, marquee) | stays `vw − 360` — occluded only while you are actively browsing the drawer |
| **Pinned** (⇥ in the drawer header) | pushes; canvas shrinks and stays shrunk | `vw − 360 − 320` |

- Canvas width is now **monotonic** in viewport width at every size, in both modes. (v1's rule flipped modes at 1440 and made a 1-px narrower window produce a 319-px wider canvas.)
- **Pin auto-releases below 1380.** Pinned canvas is `vw − 360 − 320`, so 1380 is the exact point it hits the 700 floor; at 1379 it is 699. (Was stated as 1360 — wrong by 20px.) A toast says why, once.
- While a transient drawer is open, the page frame **centres in the visible canvas area** (region minus the 320 overlay), so the drawer never occludes the frame's edge. v1 centred it in the full region, which hid ~32% of the frame's left side at 1280.

Worked cases:

| Viewport | Canvas, drawer transient | Canvas, drawer pinned |
|---|---|---|
| 1600 | 1240 | 920 |
| 1440 | 1080 | 760 |
| 1280 | 920 | *(pin auto-released)* |

### Vertical — 900 total

```
  56  topbar            (always)
  40  recovery banner   (conditional — after a crash/inactivity recovery only)
  36  page tabs         (conditional — only when the site has >1 page)
   ?  middle band       (rail · drawer · canvas · inspector)
  32  footer            (always)
```

| Conditionals showing | Middle band |
|---|---|
| neither | **812** |
| page tabs only *(the common case)* | **776** |
| banner only | 772 |
| both | 736 |

*(v1 claimed 768, which is none of these — it had silently dropped the footer.)*

---

## 2. The shell at 1440 × 900 — default state

Multi-page site, no recovery banner, drawer transient-and-open, nothing selected. Middle band **776**.

```
◄──────────────────────────────── 1440 ────────────────────────────────►
┌──────────────────────────────────────────────────────────────────────┐  ▲
│ ‹Exit BellaCucina  ●Saved2m  ◷Review  🔔 [ Send for review ]     ⋯ │  │ 56
├──────────────────────────────────────────────────────────────────────┤  ▼
│  Home ●  Menu   Contact   +                                          │    36
├────┬─────────────────┬────────────────────────────────┬──────────────┤  ▲
│ ⊞  │ INSERT       ⇥ ✕│                                │ ⬚ Section  ⋯ │  │
│ ▤  │ ┌─────────────┐ │                                │ ‹ body › sec │  │
│ ▦  │ │ 🔍 Search   │ │        ┌──────────────┐        │ ┌──────────┐ │  │
│ ▣  │ └─────────────┘ │        │              │        │ This▾ Desktop▾│  │
│ ◈  │ ▾ Basic      11 │        │  page frame  │        │ └──────────┘ │  │
│ ✦  │  ⬚ Container    │        │              │        │ Base ▾        │  │ 776
│    │  T  Text        │        │              │        │ ─────────────│  │
│    │  ▭ Button       │        │              │        │ Size         │  │
│    │ ▸ Media       9 │        └──────────────┘        │ Spacing      │  │
│ 60 │      320        │   ╭──────────────────────────╮ │ Typography   │  │
│    │   (overlay)     │   │ ⟲ ⟳ │▭ ▯ ▫│ ▷ │💬│⚙│100%│?│ │     300      │  │
│    │                 │   ╰──────────────────────────╯ │              │  ▼
├────┴─────────────────┴────────────────────────────────┴──────────────┤
│ ⚠ 2 issues    ● Synced    body › section › h1                        │    32
└──────────────────────────────────────────────────────────────────────┘
```

| Region | Size | Notes |
|---|---|---|
| Topbar | **56h** | groups flush 16 left / 16 right. **Seven items, left to right:** `‹ Exit` · site name · save-status pill → Versions · review-status pill → review bar (conditional — only while a review is live) · **notification bell 32 × 32 → 360w panel** (`floating-panels-spec.md` §6; unread = 8px accent dot top-right, no number under 10, `9+` above) · the CTA · `⋯`. The CTA is **state-dependent**: `[ Send for review ]` before a review, `[ Publish ]` once approved, **disabled with a "needs approval" tooltip** while `pending`/`changes-requested`. It is the only filled cobalt button in the shell chrome. |
| Recovery banner | **40h**, conditional | dismiss persists for the session |
| Page tabs | **36h**, conditional (>1 page) | scoped to the *working set*, not the site tree. Each tab: label + dirty-dot + close ✕; F2 renames; horizontal scroll past ~8. Spans the **canvas column only** — it must not read as global nav (see §5 A5). |
| Rail | **60w** | icon 24 in a 44 hit-target, 8 gap; active = 3px cobalt left bar + `--accent-tint` background + cobalt icon (DESIGN.md:272) |
| Drawer | **320w**, all six panels | header 44h (title · ⇥ pin · ✕); overlay by default, push when pinned |
| Canvas | fills — **1080** transient / **760** pinned | 24 padding; page frame centred in the *visible* area; shadow `0 1px 3px rgba(15,23,42,.08)` |
| Canvas toolbar | **floating pill 44h**, bottom-centred, 24 from the bottom | never consumes canvas height |
| Inspector | **300w** | header 48h · **one 32h context bar** (`This ▾ · Desktop ▾ · Base ▾`) · section rows 32h. **No tab strip** — §5.6 removes it; this row previously listed one and contradicted §5.6 in the same file. The ASCII above still draws the old 3-strip + tabs anatomy and is superseded by this row. |
| Footer | **32h** | status only |

---

## 3. The drawer — one frame, three cargo layouts

All six panels share the 320w frame and the 44h header. The **body** has three layouts; a panel picks one.

```
┌─ 320 ─────────────────┐
│ INSERT          ⇥  ✕ │  44  header — title · pin · close
├───────────────────────┤
│ (optional tab row)    │  36  only Brand and Content
├───────────────────────┤
│ 🔍 Search             │  36  only when the panel holds >20 items
├───────────────────────┤
│  … body …             │      one of the three layouts below
└───────────────────────┘
```

**Layout A — list** (Insert elements · Layers · Pages tree)
Rows **28h** for dense trees (DESIGN.md:242), **32h** for flat lists. Group header 32h with a right-aligned count. Tree indent 16/level, capped at 6 then ellipsized.

**Layout B — grid** (Media assets · Insert blocks + section templates + My Templates)
2 columns at 320w: cell 136 × 104 (136×76 thumb 4:3 + 2-line label), 16 gutter, 16 padding — 16+136+16+136+16 = 320 exactly. (Corrected 2026-07-19: said 140 × 96, which totals 328 and overflows the panel by 8px.). Icons render 6-up at 40 × 40.

**Layout C — table** (Pages › SEO listings)
Columns: page · title · meta-desc · score. Horizontal scroll inside the panel; the tree view is the default and the table is a view-toggle in the header.

> ⚠ **Superseded by `2026-07-18-drawer-cargo-sheets.md`.** That file makes two structural calls this table pre-dates:
> **(1) there is no tab row** — a 5-way switcher does not render at 320w (57px per segment), so panels use either a *grouped column* (Insert · Layers · Pages) or a *drill-in stack* (Brand · Content · Media detail), matching the locked drill-in sidebar preference;
> **(2) the 580px page-settings drawer becomes a modal**, leaving `canvas = vw − 360 − 320` intact.
> The per-panel table below is kept as the frame-level summary; the cargo sheets are authoritative for contents.

**Per-panel cargo and layout**

| Panel | Header extra | Body |
|---|---|---|
| Insert | — | grouped column: 5 collapsible groups (Elements · Blocks · Components · Templates · Mine); list rows or grid per group |
| Pages | view toggle | A (tree) ⇄ C (SEO listings) |
| Layers | — | A, 28h rows |
| Media | folder row + type pills | B (grid); drill-in for detail/stock/icons/versions |
| Content | — (drill-in) | root list: Collections + Data → drill into each |
| Brand | — (drill-in) | root list of **9** sections (tokens · presets · starters · classes · components · typography · colour-mode · lint · import/export); DS-mode toggle in the 44h header |

Scroll: body only; header, tabs and search stay pinned. Every panel needs an empty state (§6.1).

---

## 4. States of the shell

| # | State | What changes |
|---|---|---|
| 1 | **First run** | rail icons only, no drawer, canvas full-bleed, one-time coach over the 6 rail icons, empty-canvas CTA |
| 2 | **Returning (default)** | drawer open (transient) on the last-used panel; inspector shows "nothing selected". *Declared override of redesign §4.2 — see §5 A1.* |
| 3 | **Element selected** | inspector populates; selection box + label on canvas; selection toolbar floats above the element |
| 4 | **Multi-select** | inspector switches to the batch/align toolbar |
| 5 | **Drawer closed** | clicking the active rail icon toggles it shut; canvas regains 320 **only if the drawer was pinned** |
| 6 | **Comment mode** | canvas cursor becomes a pin; pins raise. **The rail and inspector stay fully live** — you can read a comment and fix it without leaving the mode. Pins stay visible while you edit. Esc or 💬 exits. *(Corrected 2026-07-19: this row dimmed rail + inspector to 60% non-interactive, contradicting PART-1 §3, which rules that out by name — being unable to act on "hero too dark" without exiting breaks the loop the product exists for.)* |
| 7 | **Preview** | all chrome except the topbar hides; a "Done" pill returns |
| 8 | **Review active** | the review-status pill expands into the review bar (44h, under the topbar, full width): open-count · next · compare · resend |
| 9 | **AI agent run** | AI panel takes the inspector's 300 column with a back arrow; the live selection is preserved and restored on return |
| 10 | **Offline** | save pill turns amber "Offline — changes queued"; CTA disables with a tooltip |
| 11 | **Saving / conflict** | pill cycles Saving → Saved; a conflict raises the modal |
| 12 | **Loading** | canvas skeleton; rail present but disabled; no drawer |

---

## 5. Ambiguities resolved (A1-A9)

| # | Was ambiguous | Resolved |
|---|---|---|
| A1 | rail default: icons-only vs drawer open | **First run = icons only. Returning = drawer open (transient) on the last-used panel.** ⚠ This **overrides** redesign §4.2 ("open → rail shows its 6 icons, canvas full"), which is itself self-inconsistent with its neighbouring line. This file wins; §4.2 should be updated. |
| A2 | does clicking the active icon close the drawer | **Yes — toggle.** Canvas regains width only when the drawer was pinned; a transient drawer was never taking width. |
| A3 | canvas toolbar position | **Floating pill, bottom-centred, 24 from the bottom.** Never consumes canvas height. |
| A4 | what "shares the right slot" means | **Replace with a back affordance**, selection preserved. At 1280 there is no room for two 300 columns. |
| A5 | page tabs missing from the shell picture | **Drawn — 36h, above the canvas column only** (not full-bleed across rail and inspector, which would read as global nav). Conditional on >1 page. |
| A6 | Insert catalog 48/63/7 vs 53/6 | **63 blocks / 7 categories** — `blockRegistry` is the SSOT; the 53-item BuildTab catalog is defect N2. Insert holds five content classes, so it is **segmented** (§3), not one flat list. |
| A7 | coach highlights 4 or 6 | **6** — though the real open question is the coach's step content and whether it blocks the canvas (still open, §6). |
| A8 | client review page accent | **`Client.brandColor` when set, else the product accent `#406ED6`** — *not* the editor's cobalt. S5.5 ships in the **dashboard** package, and white-labelling means the agency's colour outranks ours on a client-facing page. Contrast floor: if the brand colour fails 4.5:1 on white, keep it on the header only and use `#406ED6` for the primary button. *(Corrected 2026-07-19: this row said "else cobalt", which contradicted J5 §0 and predates the `#406ED6` product-accent adoption in `DESIGN.md`:11. J5 was right.)* |
| A9 | Media drawer vs full-page | **320 drawer (grid layout) + "Open full library"** for bulk work. |

---

## 5.5 Device frames + breakpoints — one set, picked

The page frame on canvas renders at a **device width**. The code carries two competing query sets (`§13b B9` in the master PRD: 1023/767 vs 991/575) and never picked. **Picked here — the 1023/767 set**, because it matches the common tablet/phone landscape boundary and is the set the canvas already uses:

| Device | Frame width | Breakpoint query | Rail icon |
|---|---|---|---|
| Wide | 1920 | `≥1440` | ▭▭ |
| Desktop *(default)* | 1440 | `≥1024` | ▭ |
| Tablet | 768 | `≤1023` | ▯ |
| Mobile | 375 | `≤767` | ▫ |

- **Zoom-to-fit** runs when the frame is wider than the canvas: `zoom = (canvas − 48) / frameWidth`, clamped to 25–100%. This is what makes Desktop (1440) and Wide (1920) usable inside a 760–1080 canvas.
- Manual zoom range **25–200%**, steps 25/50/75/100/125/150/200.
- Frame narrower than the canvas → render 1:1, centred, never upscale.
- Switching device never changes zoom mode; it re-runs fit if fit was active.

## 5.6 Inspector density — what "6 → 2" actually means

The roadmap's headline J3 task (S16) was never quantified. Quantified here.

**Today a user traverses up to 6 levels to reach one property:**

```
1 Tab strip        Look | Layout | Effects
2 Reach strip      This item · All like this · Whole site
3 Breakpoint pill  Desktop ▾
4 State pills      Base · hover · focus · active · disabled
5 Section header   ▸ Spacing            (collapsed by default)
6 Advanced group   ▸ More settings      (nested inside the section)
→   the control
```

**Target — 2 levels:**

```
1 Section          ▸ Spacing            (sticky header in one scrolling column)
→   the control
```

Achieved by, in order:
1. **Kill the tab strip.** One scrolling column with sticky section headers. Tabs hid two-thirds of the inspector behind a click and forced the "which tab was that in?" hunt.
2. **Collapse the three strips into one 32h context bar** — `This ▾ · Desktop ▾ · Base ▾`. Three dropdowns, one row, always visible. It is context, not navigation.
3. **Advanced groups auto-open** when the element already has a value there, and are hidden entirely when the property does not apply to this element type (the `cssContext` disabled-reasons already compute this).
4. **Sections render only for this element's profile** — already true (7 profiles); the density win is that with tabs gone, the profile filter is what shortens the column instead of the tab split.

**Section order per profile and the anatomy of every control now live in `2026-07-18-inspector-spec.md`.**

**Acceptance test:** for the 12 most-used properties (width, height, padding, margin, gap, font-size, font-weight, colour, background, radius, border, display) a user reaches the control in **≤2 interactions** from a fresh selection. Measure it before calling S16 done.

## 5.7 Empty states — the copy, written

An empty state is a feature. Each is: icon 32 muted · one line of what-this-is · one primary action. Copy is final, not placeholder.

| Surface | Line | Action |
|---|---|---|
| **Insert** (search, no hits) | "Nothing matches '{query}'." | Clear search |
| **Pages** (single page) | "This site has one page." | + Add page |
| **Layers** (empty page) | "This page is empty. Drop something on the canvas to see it here." | Open Insert |
| **Media** (no assets) | "No images or files yet." | Upload · Browse stock |
| **Content** (no collections) | "Collections turn a spreadsheet into pages — one page per row, updated when the data changes." | Create a collection |
| **Brand** (starter not applied) | "No brand set. Start from a theme or import your client's tokens." | Browse starters · Import |
| **Inspector** (no selection) | "Select something on the canvas to edit it." | — |
| **Issues panel** (clean) | "No issues. This page is ready to publish." | — |
| **Comments** (none) | "No comments yet. Turn on comment mode to leave one." | Enable 💬 |
| **Versions** (fresh site) | "No saved versions yet. Versions are created every time you publish, or whenever you name one." | Save a version |
| **Canvas** (blank page) | "Start with a template, or drop your first section." | Browse templates · Start blank |

**Content's line is load-bearing** — it is the only place a designer discovers that Buildrick does CMS at all, which is exactly why the panel is permanent rather than conditional (§4.3).

## 5.8 Control states — the five every control needs

The shell has 12 states; individual controls need five, and they were unspecified.

*(Corrected 2026-07-20: this said "four" and then listed five. The count matters —
a component set built to the heading ships without `loading`, which is the one
state a control needs while the thing it triggers is in flight.)*

| State | Treatment |
|---|---|
| **Rest** | 1px `--rule` border, `--wash` fill, `--ink` label |
| **Hover** | border → `--ink-soft`; no fill change; cursor pointer. No transition (DESIGN.md: minimal motion) |
| **Focus** | 2px cobalt ring, 2px offset, **visible on keyboard focus only** (`:focus-visible`). Never removed — this is the whole keyboard story |
| **Disabled** | 55% opacity, no border change, `cursor: not-allowed`, **and a tooltip giving the reason** — the `cssContext` disabled-reasons already exist, so "why is this greyed out" is answerable |
| **Loading** | inline 14px spinner replacing the control's icon; control stays laid out at the same size so nothing reflows |

Rule: a disabled control without a reason tooltip is a bug, not a state.

## 5.9 Z-index contract — ten layers

Below 1440 the drawer overlays the canvas while the toolbar pill floats over it; they can collide. Ten layers, fixed order, one place (five of them float; the rest are docked or content):

| z | Layer | Notes |
|---|---|---|
| 100 | Modals + confirms | scrim `rgba(15,23,42,.4)` |
| 90 | ⌘K palette | above everything except modals |
| 80 | Toasts / achievement prompts | bottom-right, stack up to 3 |
| 70 | Drawer *when overlaying* | below 1440 only; no scrim (canvas stays live) |
| 60 | Canvas toolbar pill | **yields to an overlaying drawer** — shifts right by the drawer width so it stays centred in the *visible* canvas |
| 50 | Floating selection toolbar | follows the selection |
| 40 | Comment pins | always above canvas content, below the selection toolbar |
| 30 | Canvas overlays (guides · rulers · smart-guides · measurements) | |
| 20 | Review bar | docked under the topbar, pushes content down — not floating |
| 10 | Page frame + content | |

## 6. Still missing before hi-fi

Closed since v2: device frames + breakpoints (§5.5) · "6→2" quantified (§5.6) · empty-state copy (§5.7) · control states (§5.8) · z-index contract (§5.9).

Remaining:

1. **Issues panel** — the footer pill opens it; layout, row shape and the three severity treatments are unspecified.
2. **Versions panel + Compare/diff** — redesign §4.3 calls this the actual wedge. No layout, no diff representation, no restore confirm.
3. **Review bar internals** — §4 State 8 gives it 44h and four controls; the controls are unsized.
4. **AI panel internals** — 300w and a back arrow is all that exists.
5. **Content stress** — 40-page tree, 200-node layer tree, long site name in the topbar, 12 overlapping comment pins, overflowing token names.
6. **Scrollbar treatment** across the three scroll regions.
7. **Site full-page shell** → now specified separately in `2026-07-18-site-fullpage-wireframes.md`.
8. **Permissions per surface** — `14-screen-specs.md` stamps "OW/AD/DE" almost everywhere with no differentiation. What can a DESIGNER not do?
9. **Focus order and keyboard traversal** across the six regions; comment mode by keyboard.

## 7. DESIGN.md — what still holds, what this file overrides

DESIGN.md remains SSOT for **colour, type, spacing, motion and row density values**. Adopted here: 28h dense tree rows (`:242`), 200ms panel-open motion (`:200`), active-rail treatment = 3px cobalt bar + accent tint (`:272`), 56h topbar (`:194`).

**Declared overrides — one:**

| Value | DESIGN.md | Here | Why |
|---|---|---|---|
| Panel width | 240 (nav) / 320 (authoring) `:230-236` | **320 for all six** | Pages must hold an SEO listings table and Layers a deep tree; 240 cannot carry either, and one width keeps every calculation in §1 valid. |

**DESIGN.md layout guidance that is now STALE** (do not build from it):

| DESIGN.md says | Reality after §4.3 |
|---|---|
| 11-tab sidebar (`:205-211`) — and its own Composition Map says 8 (`:257`), so it contradicts itself | 6 rail items |
| 3-zone rail Creation/Structure/Config (`:272`) | no zones; frequency-ordered |
| Composition Map includes Templates · Settings · History (`:257-268`) | all three retired from the rail |
| Width Rule puts Media and Design on **fullpage** (`:230-236`) | Brand is a 320 drawer; Media is a drawer + optional full-page |
| Shortcut map `A/T/M/Z/P/⇧A/D/S/U/H` (`:301`) | remapped: `A P L M D B` + `C` comment · `⌘P` preview · `⌘K` palette |

**Action:** scope DESIGN.md explicitly to tokens + craft values, and move its layout sections here. A designer following it today builds the previous editor.
