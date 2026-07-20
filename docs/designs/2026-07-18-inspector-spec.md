# Inspector — Section Order + Control Anatomy

> The highest-traffic surface in the product, and the last one without a layout. `2026-07-18-editor-shell-wireframes.md` §5.6 removed the tab strip and set the "6 → 2" target; with tabs gone, **the linear order of the sections becomes the entire information architecture of the right column** — and it was never written. This file writes it, plus the anatomy of every control type.
>
> Unblocks S3.9 · S3.10 · S3.11 · component management (S3.5) · CMS binding (S3.12) · form settings · and the AI panel's host column.
>
> Frame inherited: **300w · header 48h · context bar 32h · section rows 32h · no tab strip.**

---

## 1. The column

```
┌─ 300 ──────────────────────┐
│ ⬚ Section            ⊹ ↑ ⋯│  48   icon · name · pick · select-parent · overflow
│ ‹ body › section           │  24   breadcrumb, 2 levels + ellipsis
├────────────────────────────┤
│ This ▾   Desktop ▾  Base ▾ │  32   THE context bar — replaces 3 strips
├────────────────────────────┤
│ ▾ Size                     │  32   section header, sticky on scroll
│    W  ┌──────┐ ⛓ ┌──────┐ │  32   control rows
│       └──────┘   └──────┘  │
│ ▾ Spacing                  │  32
│    ┌──────────────────┐    │
│    │   box model      │    │ 120
│    └──────────────────┘    │
│ ▸ Typography               │  32   collapsed
│ ▸ Background               │  32
│ ▸ Border                   │  32
│ ─────────────────────────  │
│ ▸ More settings         6  │  32   advanced, auto-opens if values exist
└────────────────────────────┘
```

**Usable width: 268** (300 − 16 − 16). Every control below fits that.

**Context bar** — the three old strips collapsed into one 32h row of three dropdowns:
- `This ▾` — reach: This item · All like this (N) · Whole site. Picking a non-default reach tints the whole column's left edge 2px amber, because you are now editing more than the selection.
- `Desktop ▾` — breakpoint. A dot on the chevron when this breakpoint carries overrides.
- `Base ▾` — pseudo-state: Base · hover · focus · active · disabled. Same override dot.

**Overridden property indicator** — any control whose value comes from a breakpoint or state override gets a 2px cobalt bar on its left edge and a `↺` reset affordance on hover. This is how a designer sees "this is not the base value" without opening anything.

---

## 2. Section order — per profile

18 sections in the registry; `Variant` mounts outside it. With tabs gone there is one column, so order = frequency for that element type. **Bold = open by default** (max 2, per the shell's collapse rule). Everything else collapsed.

| # | CONTAINER | TEXT | FLEX | GRID | MEDIA | BUTTON | INPUT |
|---|---|---|---|---|---|---|---|
| 1 | **Quick actions** | **Typography** | **Layout** | **Layout** | **Size** | **Typography** | **Typography** |
| 2 | **Size** | **Spacing** | **Flexbox** | **Grid** | **Spacing** | **Background** | **Border** |
| 3 | Spacing | Size | Size | Size | Border | Border | Spacing |
| 4 | Layout | Background | Spacing | Spacing | Corner radius | Corner radius | Size |
| 5 | Background | Border | Background | Background | Effects | Spacing | Background |
| 6 | Border | Corner radius | Border | Border | Link | Size | Corner radius |
| 7 | Corner radius | Effects | Corner radius | Corner radius | Interactions | Effects | Effects |
| 8 | Flexbox* | Link | Effects | Effects | Animation | Interactions | Element properties |
| 9 | Grid* | Interactions | Interactions | Interactions | Visibility | Animation | Interactions |
| 10 | Effects | Animation | Animation | Animation | Element properties | Link | Visibility |
| 11 | Interactions | Visibility | Visibility | Visibility | CSS classes | Visibility | CSS classes |
| 12 | Animation | Element properties | Element properties | Element properties | — | Element properties | — |
| 13 | Visibility | CSS classes | CSS classes | CSS classes | — | CSS classes | — |
| 14 | Element properties | — | — | — | — | — | — |
| 15 | CSS classes | — | — | — | — | — | — |

`*` renders only when the element is a flex/grid container or item (existing `cssContext` rule).
`AllCSS` appends to every profile **only in dev mode** — today that flag is hardcoded false, so it renders nowhere. Ship it Pro-gated or delete it; do not leave it dead.

**Rules that make the order hold:**
1. **A section that cannot apply is not rendered** — not greyed. `cssContext` already computes this (gap without flex, offsets without position). Hiding beats disabling in a single column, because the column length is the density problem.
2. **A section with a value never renders collapsed**, regardless of its default. If the element has a shadow, Effects is open.
3. **Sticky headers.** Scrolling a long column with 15 collapsed headers is the failure mode the tabs were hiding; sticky keeps your place.
4. **Two open by default, max.** More and the "6→2" win is lost.

**Acceptance test (from shell §5.6):** for width · height · padding · margin · gap · font-size · font-weight · colour · background · radius · border · display, the control is reachable in **≤2 interactions** from a fresh selection. Test on all 7 profiles.

---

## 3. Sections with no home until now

Four things §4.3 assigned to the inspector had no section. They do now:

| Feature | Section | Shape |
|---|---|---|
| **Component management** (variants · detach · reset) | **Variant** — pinned directly under the context bar when the selection is an instance | variant chips per property · `Detach` (Pro) · `Reset to master` with an overridden-count. ⚠ reset is broken today (`ComponentInstance.ts:72` `#/` vs `:174` `/elements/`) — the UI must not ship before the path fix, or it lies. |
| **Form settings** | **Element properties**, when the selection is a `form` | action · method · success behaviour · redirect URL · spam guard. `FormSettingsSection` already exists in `shared/forms`. |
| **CMS binding** | **Element properties** → `Bind to data ›` row | opens the BindingPopover (collection → field → record). Bound elements show a 🔗 chip in the header. |
| **A11y findings** | column footer, 32h | `⚠ 2 accessibility issues ›` → opens the footer Issues panel filtered to this element. Only renders when the element has findings. |

---

## 4. Control anatomy — 268 usable

Label column **88**, control column **172**, gap 8. Label 12px `--ink-soft`, right-aligned to its column edge.

```
1 · Number + unit          2 · Linked pair (W/H, gap)
  Width  ┌─────────┐         W ┌──────┐ ⛓ ┌──────┐
         │ 240  px▾│           │ 240  │   │ auto │
         └─────────┘           └──────┘   └──────┘
  input 172h32; unit is a       80 + 24 link + 80 = 184… → use 74/24/74
  suffix dropdown inside        chain lit = values mirror

3 · Segmented (icons only)   4 · Select
  Display ┌──┬──┬──┬──┬──┐     Position ┌──────────────┐
          │▭ │▤ │▦ │▫ │∅ │              │ relative   ▾ │
          └──┴──┴──┴──┴──┘              └──────────────┘
  5 × 34 = 170. Icons only —    full 172. Labels ellipsis.
  labels never fit at 5-up.

5 · Colour                    6 · Box model (spacing)
  Fill  ┌──┐┌──────────┐◈      ┌──────────────────────┐
        │▓ ││ #406ED6  │       │   ┌──────────────┐   │
        └──┘└──────────┘       │ 16│   ┌──────┐   │16 │  120h
  swatch 28 · hex 108 ·        │   │ 8 │ elem │ 8 │   │
  binding chip ◈ 24            │   │   └──────┘   │   │
  chip states: token(green)    │   └──────────────┘   │
  preset(blue) off-DS(amber)   │          16          │
                               └──────────────────────┘
                               margin outer / padding inner
                               click a number to edit; ⛓ links sides

7 · Slider + number           8 · Toggle row
  Opacity ├────●────┤ 80       Visible on mobile      ●──
          slider 120 + num 44  label flex · switch 36×20 right

9 · Preset grid (shadows,     10 · Chip list (CSS classes)
   filters, animations)          ┌────────┐┌──────┐ + Add
   ┌────┐┌────┐┌────┐            │ btn  ✕ ││ lg ✕ │
   │    ││    ││    │            └────────┘└──────┘
   └────┘└────┘└────┘            chip 28h · autocomplete on +
   3-up, cell 84×56, 8 gap

11 · Font picker              12 · Interaction row
   Family ┌──────────────┐       ⚡ Hover → Fade in      ⋯
          │ Inter Tight ▾│       trigger · preset · dur
          └──────────────┘       56h · ⋯ = edit/duplicate/
   opens drill-in: search ·      delete/preview
   category tabs · Google ·
   system · custom upload
```

**Every control obeys shell §5.8** for rest/hover/focus/disabled/loading — including the rule that a disabled control carries a reason tooltip (`cssContext` already supplies the reason string).

---

## 5. States of the column

| # | State | Column shows |
|---|---|---|
| 1 | **No selection** | centred empty state: "Select something on the canvas to edit it." Nothing else — no strips, no sections. |
| 2 | **Single selection** | header + breadcrumb + context bar + the profile's ordered sections |
| 3 | **Multi-select** | header reads `3 selected`; sections replaced by the batch panel — align/distribute (6 + 2) and the shared-property subset (bg · text colour · radius · padding · font-size). Mixed values render the placeholder `Mixed`, and editing one applies to all. |
| 4 | **Instance selected** | Variant section pins under the context bar |
| 5 | **Bound to CMS** | 🔗 chip in the header; bound fields render read-only with a "bound to {collection}.{field}" tooltip and an unbind action |
| 6 | **Breakpoint override active** | context bar dot; overridden controls carry the cobalt left bar + `↺` |
| 7 | **Pseudo-state active** | same treatment, and the column header tints to signal you are not editing Base |
| 8 | **Reach ≠ This item** | 2px amber left edge on the whole column + a persistent `Editing all 12 buttons` note under the context bar |
| 9 | **AI agent run** | the AI panel replaces the column with a `‹ Inspector` back row; the live selection is preserved and restored on return |
| 10 | **Loading** | header renders, sections skeleton |

---

## 6. What this deliberately does not solve

- **The 6→2 acceptance test has not been run.** It is a measurement, and it needs a build.
- **AllCSS** stays dead until the Pro-gate + sanitise decision is made (§6.5).
- **Reset to master** is specified but must not ship before the `ComponentInstance` path fix — a reset button that silently does nothing is worse than no button.
- **AI panel internals** — this file specs the column it borrows, not the panel.
- **Keyboard traversal** into and out of the column, and the focus order across the six regions, is still unwritten (shell §6.9).
