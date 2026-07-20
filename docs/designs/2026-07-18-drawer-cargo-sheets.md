# Rail Drawer — Cargo Sheets (what actually goes inside each of the six panels)

> `2026-07-18-editor-shell-wireframes.md` specs the drawer **frame**. A readiness audit found that settling the frame unblocked almost nothing, because *"the six panels are the same drawer with different cargo — true of the frame, false of the cargo."* This file specs the cargo: one page per panel, row anatomy, structure, sub-surfaces, bulk bars, states.
>
> Unblocks ~14 screens: S3.2 · S3.3 · S3.6 · S3.7 · S3.8 · S3.12 · S3.12b · S3.15 · S4.1-S4.6.
>
> Frame inherited from the shell doc: **320w · header 44h · rows 28h dense / 32h standard · body scrolls, header pinned.**

---

## 0. Two structural decisions this file makes

Both were open blockers; both are now closed.

### D-A · The 580px page-settings drawer becomes a MODAL

Ch.14 S3.7 specs a 580px page-settings drawer. The shell has exactly one drawer and it is 320. A second width invalidates `canvas = vw − 360 − 320`.

**Call: page settings is a 580w modal**, opened from a page row (⌘, or the row's ⋯ → Settings). It is a focused form on one object with a clear enter/exit — modal is the correct shape, and it leaves the shell arithmetic untouched.

### D-B · No tab rows in the drawer — drill-in instead

The shell frame offered a 36h tab row "only for Brand and Content." That does not survive contact:
- Insert needs 5 sub-surfaces. At 288px usable, five segments = **57px each** — "Components" and "Templates" do not render.
- Brand needs 9. Hopeless at any segment size.

**Call: drop the tab row.** Two patterns replace it, and neither costs header width:

| Pattern | Used by | Shape |
|---|---|---|
| **Grouped column** | Insert · Layers · Pages | One scrolling column; sub-surfaces are collapsible top-level groups. Insert's five "classes" become five groups — the switcher disappears entirely. |
| **Drill-in stack** | Brand · Content · Media detail | Root list of sections → tap → the panel pushes to that section with a **36h back row** (`‹ Brand · Tokens`). Matches the locked drill-in sidebar preference and scales to 9 sections. |

Drill-in header, when pushed:
```
┌─ 320 ─────────────────┐
│ BRAND           ⇥  ✕ │  44
│ ‹ Tokens              │  36   back row — only when drilled in
├───────────────────────┤
```

---

## 1. Insert — grouped column, five groups, no switcher

```
┌─ 320 ─────────────────────┐
│ INSERT              ⇥  ✕ │  44
│ 🔍 Search elements    ⌘F │  36
├───────────────────────────┤
│ ▾ ELEMENTS            48 │  32   group header (caps 11px, count right)
│   ⬚  Container           │  32   ← row: icon 16 · gap 8 · label · drag handle on hover
│   T   Text               │  32
│   ▭  Button              │  32
│ ▸ BLOCKS              63 │  32   collapsed → expands to GRID
│ ▸ COMPONENTS          27 │  32   → GRID
│ ▸ TEMPLATES           10 │  32   → GRID (section templates)
│ ▸ MINE                 4 │  32   → GRID (user-saved)
├───────────────────────────┤
│ 💡 Tip 2/5          ‹ › ✕│  40   TipsFooter, dismissible, persists
└───────────────────────────┘
```

- **Row (list groups)** — 288 usable: icon 16 · gap 8 · label (flex, ellipsis) · on hover a 16 drag affordance right-aligned. Click inserts at the selection; drag inserts at the drop point.
- **Grid (thumbnail groups)** — 2 columns, cell **136 × 104** (136×76 thumb 4:3 + 2-line label), 16 gutter, 16 padding. Blocks render their 7 categories as sub-headers *inside* the expanded group.
- **Disabled "Soon"** — 45% opacity, no drag, tooltip naming what's missing.
- **Recent** — a 6th group `▾ RECENT 8`, pinned to the top, populated after first use. This is where the currently-dead favourites plumbing (defect N3) lands, or it gets cut.
- **Paste HTML** — a 32h row at the very bottom of the column: `⌥ Paste HTML…` → opens the paste modal.
- **Search** — filters across all five groups at once; results render flat with a group label per row; empty copy from shell §5.7.

**States:** default · group-expanded · searching · no-results · dragging · disabled-item · tip-dismissed.

---

## 2. Pages — grouped column + folders, table as a view swap

```
┌─ 320 ─────────────────────┐
│ PAGES               ⇥  ✕ │  44
│ 🔍 Search       ⊞ Listings│  36   search (≥5 pages) + view toggle → table
├───────────────────────────┤
│ ☐ ▾ 📁 Marketing       3 │  32   folder row: checkbox · chevron · icon · name · count
│ ☐   ⌂ Home            ● │  32   page row: checkbox · icon · name · home ⌂ · dirty ●
│ ☐   Menu                 │  32
│ ☐   Contact              │  32
│ ☐ ▸ 📁 Legal           2 │  32
│ ☐   About                │  32
├───────────────────────────┤
│ + Add page               │  36
└───────────────────────────┘
```

- **Row anatomy** (288 usable): checkbox 16 · gap 8 · indent 16/level (folders nest 1 level only) · icon 16 · gap 8 · name (flex) · home ⌂ 16 · dirty ● 8. Hover reveals ⋯ (6 actions: Rename F2 · Duplicate ⌘D · Set homepage · Copy link · Settings ⌘, · Delete).
- **Folders are one level.** Deeper nesting is not supported and the drop is rejected with a tooltip.
- **Bulk bar** — appears at the bottom of the panel when ≥1 checkbox is set, 44h, replacing "Add page": `3 selected · Duplicate · Move to… · Delete`. Delete-all spares the home page and says so.
- **Listings view** (⊞ toggle) — swaps the body for the SEO table. At 320 the table scrolls horizontally; columns: page · title · description · score. This view is the reason the panel earns a full-page escape: `Open full listings` at the bottom.
- **Page settings** → **580w modal** (D-A), tabs SEO · Social · Advanced, autosave 500ms + ⌘S, unsaved-guard on close.

**States:** tree · folders-collapsed · searching · bulk-select · empty (one page) · load-error + retry · listings.

---

## 3. Layers — the tightest row in the product

```
┌─ 320 ─────────────────────┐
│ LAYERS              ⇥  ✕ │  44
│ 🔍 Search        ⊞ ⊟ ⚙  │  36   search · expand-all · collapse-all · display settings
├───────────────────────────┤
│ ▾ ⬚ Section          👁 🔒│  28   ← 28h dense rows (DESIGN.md:242)
│   ▾ ⬚ Container      👁 🔒│  28
│     T Heading        👁 🔒│  28
│     ▭ Button         👁 🔒│  28
│ ▸ ⬚ Footer           👁 🔒│  28
├───────────────────────────┤
│ 12 layers                 │  28   count footer
└───────────────────────────┘
```

**Row arithmetic at depth 5 (the cap):** 288 usable − 80 indent − 16 chevron − 16 icon − 8 gap − 48 (two 24 toggles) = **120px for the name**. Ellipsis after that. Indent caps at 5 levels; deeper nodes render at level 5 with a `⋯` depth badge and full path on hover.

- Visibility 👁 and lock 🔒 appear **on hover or when active** — not always, or the name column dies.
- **Drag** — 2px cobalt insertion line; invalid drops show the DragTooltip reason (nesting rules) and no line.
- **Selected** row = accent tint + cobalt left bar 2px. **Hidden** = 45% opacity. **Locked** = lock filled, row non-draggable.
- Context menu: Rename · Group · Lock/Unlock · Delete.

**States:** tree · filtered · dragging · invalid-drop · hidden · locked · multi-select · empty (shell §5.7 copy).

---

## 4. Media — root grid, drill-in for everything else

The audit found the grid accommodated ~1 of 11 features. Fixed with drill-in.

```
ROOT                            DRILL-IN (asset detail)
┌─ 320 ─────────────────┐      ┌─ 320 ─────────────────┐
│ MEDIA           ⇥  ✕ │      │ MEDIA           ⇥  ✕ │
│ 🔍 Search             │      │ ‹ hero-dark.jpg       │  36
├───────────────────────┤      ├───────────────────────┤
│ 📁 All ▾   ⊞ ⊟  ↑    │  32  │      [ preview ]       │ 160
│ ▣ img  ▣ vid  ▣ svg   │  32  │ 2400×1600 · 840 KB     │
├───────────────────────┤      │ ─────────────────────  │
│ ┌─────┐ ┌─────┐       │      │ Alt text              │
│ │ img │ │ img │       │ 104  │ ┌───────────────────┐ │
│ └─────┘ └─────┘       │      │ │ Dark restaurant…  │ │
│  hero    menu-01      │      │ └───────────────────┘ │
│ ┌─────┐ ┌─────┐       │      │ ✨ Generate            │
│ │ img │ │ img │       │      │ ─────────────────────  │
│ └─────┘ └─────┘       │      │ Used in 3 places    ›  │  32
├───────────────────────┤      │ Versions (4)        ›  │  32
│ ↑ Upload   ☁ Stock    │  44  │ Edit image          ›  │  32
└───────────────────────┘      │ Optimise            ›  │  32
                               │ Replace across site ›  │  32
                               └───────────────────────┘
```

- **Grid** — 2 cols, cell **136 × 104** (136×76 thumb + 2-line name), 16 gutter. Source badge (STOCK/AI) bottom-left of the thumb.
- **Folder row** (32h) — `📁 All ▾` opens the folder tree as a dropdown, plus smart folders **Recent · Used · Unused**. Not a breadcrumb strip; the audit was right that a strip is a different object.
- **Type pills** (32h) — image · video · svg · icon, each with a count; multi-select filter.
- **Drill-in destinations** — five, each pushing with a 32h back row. Two were previously named without geometry and are specified below (**Stock browser**, **Versions**, **Used-in**); a designer cannot place a screen from a feature list.

  - **Asset detail** — above.
  - **Icon picker** — 370 icons / 17 categories: category list → grid 6-up at 40 × 40 · search · recent 12.
  - **Stock browser** — search row 36h (sticky) · **filter row 32h** carrying three dropdowns (`Orientation ▾` · `Colour ▾` · `Type ▾`), each 88w, 8 gap, horizontally scrollable rather than wrapping to a second row. Results reuse **Layout B** exactly — 2 cols, cell 136 × 104, 16 gutter — so the eye does not relearn a grid one level down. Provider credit 24h under each cell (`Pexels · A. Nowak`), required by both providers' terms. **Infinite scroll, not pagination** (a 320w column has no room for a pager), loading 8 more at a time with a 32h spinner row; a `Load more` button appears after 3 auto-loads so the scroll is escapable. Selecting a cell inserts and returns to the Media root with the new asset selected.
  - **Versions** — rows **56h**: version dot · relative time · author · size delta (`+12 KB`), with the current version pinned at the top carrying a 3px accent left bar. Row `⋯` = Restore · Download · Delete. Restore confirms inline in the row (32h `Restore? ( Cancel ) [ Restore ]`) rather than opening a modal — a drill-in that spawns a modal has lost the plot.
  - **Used-in** — rows **44h**: page name · section breadcrumb (`Home › hero`) · `Jump ›`. Grouped by page with a 28h group header carrying a count. Jumping closes the drawer, selects the element and scrolls the canvas to it. **Empty state is load-bearing here** — "Not used on any page" is the answer that makes deleting safe, so it gets the full empty treatment, not a dash.
- **Modals, not drill-in** (they need width): Image editor (crop/rotate/flip · adjust · 6 filter presets · resize) · Optimise (quality slider · format · estimated saving) · Replace-across (per-page selective).
- **Upload** — the footer button plus drag-onto-panel; a 44h progress row per file, retry on failure. **Quota bar** appears above the footer at >80% used.
- **Bulk** — checkbox on thumb hover; bar replaces the footer: `4 selected · Move to… · Delete`.

**States:** grid · filtered · folder-scoped · uploading · upload-failed · quota-warn · quota-full · bulk-select · drill-in ×5 · empty (shell §5.7).

---

## 5. Content — drill-in, two roots

```
ROOT                            DRILL-IN (a collection)
┌─ 320 ─────────────────┐      ┌─ 320 ─────────────────┐
│ CONTENT         ⇥  ✕ │      │ CONTENT         ⇥  ✕ │
├───────────────────────┤      │ ‹ Menu items          │  36
│ COLLECTIONS         2 │  32  ├───────────────────────┤
│  ▤ Menu items    24 › │  32  │ 24 records   + Add    │  32
│  ▤ Team           6 › │  32  │ ─────────────────────  │
│  + New collection     │  32  │ ● Margherita       ›  │  32  ● published
│                       │      │ ○ Quattro Formaggi ›  │  32  ○ draft
│ DATA                  │  32  │ ● Diavola          ›  │  32
│  ⚡ Sources        1 › │  32  ├───────────────────────┤
│  {} Variables     4 › │  32  │ Fields (8)          ›  │  32
│  ⚖ Conditions     2 › │  32  │ Dynamic pages       ›  │  32
└───────────────────────┘      └───────────────────────┘
```

- Two root groups: **Collections** (the CMS) and **Data** (sources · global variables · conditions — the DataManager half that had no UI).
- Record rows carry a **publish dot**: ● published · ○ draft. Per-record publish/unpublish lives in the record drill-in.
- **Modals** (need width): collection setup (2-step: name+type → fields, with the dynamic-page-per-entry option) · record editor (field-driven form).
- **Dynamic pages** row is the front-door the redesign said was missing: shows which page template renders this collection, or offers to create one.
- Empty copy from shell §5.7 — load-bearing, it is the only place CMS is discovered.

**States:** root · empty (no collections) · collection · record · fields · data-sources · variables · conditions · unsaved-record.

---

## 6. Brand — drill-in, nine sections, no tabs

This is the panel that proved tabs impossible. Root is a list; every section drills in.

```
ROOT                            DRILL-IN (Tokens → a token)
┌─ 320 ─────────────────┐      ┌─ 320 ─────────────────┐
│ BRAND     ◐ Pro  ⇥  ✕ │  44  │ BRAND           ⇥  ✕ │
├───────────────────────┤      │ ‹ Tokens · color      │  36
│ ▦ Tokens        14  › │  32  ├───────────────────────┤
│ ◫ Presets       18  › │  32  │ ● primary             │  32
│ ✧ Starters       6  › │  32  │   #2D6DFF             │
│ ⬚ Classes       12  › │  32  │ ● surface             │  32
│ ⬡ Components    27  › │  32  │ ● ink                 │  32
│ Aa Typography       › │  32  │ ─────────────────────  │
│ ◐ Colour mode       › │  32  │ Used in 34 places   ›  │  32
│ ⚠ Lint           3  › │  32  │ Rename safely       ›  │  32
│ ↥ Import / export   › │  32  │ Fix contrast        ›  │  32
└───────────────────────┘      └───────────────────────┘
```

- **DS-mode toggle** (`◐ Pro`) sits in the 44h header, right of the title — it changes what the whole panel shows, so it belongs to the panel, not a section.
- **Nine sections**, each a 32h row with a count and a chevron. This is why drill-in wins: nine tabs is impossible, nine rows is ordinary.
- **Tokens** → kind list (14) → token list → token detail (value · dark value · **used-in** · **safe rename** · **fix contrast**). This is where round-2 #7 and #8 land.
- **Lint** carries a count badge and lists issues with one-click auto-fix where a nearest token exists.
- **Typography** → three stacked blocks in one drill-in, not three more levels. **Active fonts** — rows 56h: family name in the family itself at 16px · role chips (`Display` · `Body` · `Mono`) · weight count · `⋯` (Replace · Remove). **Add** — a 44h row `+ Add a font` opening a 36h search over Google Fonts; results are rows 56h rendering the family name in its own face, with a 32h weight multi-select revealed on the row once picked. **Custom upload** — a 72h dashed drop zone (`Drop .woff2, or browse`), then a 44h progress row per file and a 32h error row per rejection naming the reason (format · size · licence not confirmed). ⚠ Foundry-licence confirmation is a checkbox on upload, not a footnote.
- **Colour mode** → light/dark preview toggle + the dark-missing list.
- **Starters** → 6-card gallery (drill-in, not the old modal); applying warns that it overwrites tokens.
- **Components** → the DS component list + **Generate with AI** (AIPromptModal) as a row at the bottom.
- **Import / export** → two labelled groups in one drill-in. **Export** — four rows 48h (CSS · JSON · Tailwind · Figma), each with format name, a one-line description, and a right-aligned `Copy` + `Download` pair; the Figma row is disabled with the reason inline (`Coming soon — export JSON and use the Figma Variables importer`), never hidden. Above them, a 32h `Dark strategy ▾` (media-query · data-attribute · off) because it changes what every export emits. **Import** — a 72h drop zone accepting `.css` / `.json` (incl. Figma Variables JSON), then a **diff preview before anything is written**: rows 44h `token · current → incoming`, with unchanged tokens collapsed behind a `+ 34 unchanged` row, and a footer `( Cancel ) [ Import 12 tokens ]`. An import that silently overwrites a brand is the same damage class as an unguarded brand push.

**States:** root · any of 9 sections · token detail · dirty (save bar 44h at the bottom: `Discard · Save`) · lint-warnings · pro-locked rows (beginner DS-mode).

---

## 6.5 · Review — the conditional seventh panel

**Only exists while a review is live.** A seventh rail icon appears at the bottom, below a divider, and disappears when the review closes (`PART-1` §2). Same 320w drawer frame, Layout A.

This is the wedge's address. Sign-off *status* stays ambient — topbar pill, canvas pins, the green anchor in Versions. Sign-off *work* lives here, and it answers one question: **what do I still owe the client before I re-send?**

```
┌─ 320 ─────────────────┐
│ REVIEW          ⇥  ✕ │  44
├───────────────────────┤
│ ▓▓▓▓▓▓▓░░░  9 of 12   │  44   progress + count
│ Sent 2d ago · Sara    │  28   who and when
├───────────────────────┤
│ ⚠ DETACHED         2 ›│  32   ← pinned top when >0
├───────────────────────┤
│ OPEN                3 │  28
│ ● "hero too dark"     │  64
│   Sara · Home · 2d  ›│
│ ● "wrong phone no."   │  64
│   Sara · Contact · 2d›│
│ ○ MENU              1 │  28   grouped by page
│ ● "add gluten icons"  │  64
├───────────────────────┤
│ RESOLVED            9 ›│  32   collapsed
├───────────────────────┤
│ ‹ Round 2 of 3      › │  32   round history
├───────────────────────┤
│ [ Compare with v3 ]   │  40
│ [ Re-send for review ]│  44
└───────────────────────┘
```

- **Progress bar 44h** — `9 of 12 resolved`. The one number that says whether you can re-send.
- **Comment row 64h** — status dot · quoted text (2 lines, ellipsized) · author · page · relative time · `›`. Clicking selects the element on canvas, scrolls to it and opens the thread. **External authors are marked** (`Sara · client`) per contract 1.2 — "who said this" is the first thing you need when scanning feedback.
- **Grouped by page**, 28h headers with counts, because fixing is page-by-page work.
- **Resolved collapses** to one 32h row. Nine resolved comments are noise until you need them.
- **Detached group pins to the top when non-empty** (contract 6.4) — comments whose target element was deleted. They carry the text they were anchored to (`…on: "Book a table"`). Never deleted; several of them usually means a section was rebuilt rather than edited.
- **`n` / `p` jump to the next and previous open comment** without leaving the canvas — the fix-one-scroll-to-next loop is the panel's whole job. The row list scrolls in step.
- **`Compare with v3`** opens the Compare view against the approved version (`floating-panels-spec.md` §3). It sits here as well as on the approved row in Versions, because "what changed since they approved" is asked from both directions.
- **Round history 32h** — `‹ Round 2 of 3 ›` steps back through previous rounds, each read-only, showing that round's comments and what resolved them. Without it, round 3 cannot see rounds 1 and 2, and a client who repeats feedback looks unreasonable when they are not. Current round is the default; older rounds carry a 28h `Round 1 · resolved 2d ago · read-only` header.
- **`⋯` in the panel header — `Revoke link`.** Ends the review immediately and kills the token (contract 1.4). Confirms, because a revoked link cannot be un-revoked: *"Sara will lose access immediately. You can send a new link any time."*
- **`Re-send for review`** is enabled at any time, not gated on 12-of-12 — sometimes you re-send with two open on purpose. But below 100% it confirms: *"3 comments are still open. Re-send anyway?"*
- **Re-sending issues a new token and revokes the old one** (contract 1.4). Say so on the confirm, or a client on the old link hits a dead page with no explanation.

**States:** open · all-resolved · detached-present · resolved-expanded · older-round (read-only) · re-send-confirm · re-sending · revoke-confirm · revoked · review-closed (panel and rail icon both vanish — with a toast, or the disappearance reads as a bug) · empty (`PENDING`, no comments yet — "Sara has not commented yet. You will be notified.").

---

## 7. What this file does NOT cover

- **Inspector** — separate spec needed (ordered section list per profile + control anatomy). Highest-traffic surface; the shell doc's §2-vs-§5.6 contradiction is now fixed but the section order is still unwritten.
- **The modal kit** — the modals this file reaches for (paste HTML · page settings · collection setup · record editor · optimise images · template apply) are all instances of the one frame in `2026-07-18-floating-panels-spec.md` §7, which is the SSOT for the set and its three widths. Image editor and replace-across are **takeovers, not modals** — they carry their own chrome.
- **The four floating panels** — ⌘K palette · Versions+Compare · Issues panel · AI panel.
- **Content stress** — 40-page tree, 200-node layer tree, 12 overlapping pins.
