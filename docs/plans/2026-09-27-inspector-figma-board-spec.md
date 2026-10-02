# Inspector — Figma board spec (acceptance checklist)

Owner rule (2026-09-27): **the Figma design contains exactly the Inspector features and states that were audited
and approved — nothing added, nothing dropped.** Every board below lists what MUST appear, each item traced to its
decision. A board is accepted only when every MUST item is present and every MUST-NOT item is absent.

Sources: `2026-09-27-inspector-architecture-proposal.md` (Owner approvals Q1–Q8, R-DD-8/9/14/17/18, §17–§20) and
`2026-09-27-inspector-redesign.md` (DD-1…DD-22 where not superseded). Visual system: DESIGN.md + the Figma DS file
`g4GzQFqzNYz5sosz1QtZXC` (tokens `--bk-*`, chrome components). Target page: Editor v3 · IA `4418:45431`.
Reference prototype (behaviour, not visuals): `~/.gstack/projects/aamirtauqir-buildrik/designs/inspector-redesign-20260927/finalized.html`.

## Global frame (every board)

- Canvas at 1440×900 with the v3 editor shell; Inspector column **300px**, right side; the selected element visibly selected on the canvas.
- **Header** (DD-8b, R-DD-8, DD-7): breadcrumb path (clickable crumbs, middle collapses to "…" when long) · type icon + editable name · **✦ AI** chip (only AI door in the panel) · **⋯** · **✕ hide**.
- **Status marks** under the name, only when true: ◆ Component · ⌁ Collection.field (clickable; red "missing" variant) · 🔒 Locked (R-DD-17, DD-16, DD-18).
- **Tabs: Style · Behaviour · Effects** (DD-1, DD-4, Q1).
- **Context row** on Style and Effects only: "State: Base ▾" chip; breakpoint chip only when not Desktop (R-DD-14).
- Sections follow **define → shape → paint** (DD-15). Open rule (DD-11): type block open; valued sections open; empty addable sections = one header row with "+"; closed-with-value = one-line summary.
- Tokens only (`--bk-*`), Inter 12–13 labels, Geist Mono tabular values, weight ≤ 600, panel radius ≤ 4, 4px grid (DD-21).

### MUST NOT appear anywhere (removed by decision)
Beginner/Pro toggle (DD-5) · "Applies to" row / "This element · All like this · Whole site" (DD-6a, DD-6b) · "Improve with AI" in ⋯ (DD-7) · "Pick on canvas" / "Select parent" in ⋯ (DD-8b) · "Hide inspector" / Expand-Collapse all in ⋯ (R-DD-8) · Advanced text/label/content textareas (R-DD-9) · Advanced "Open In" / "Rel" (R-DD-9, moved to Link) · "ID & class" classes field (DD-9) · Spacing Gap / Row gap / Column gap (DD-9) · Layout Width/Height selects (DD-9) · padding/margin pairs (DD-9b) · CMS binding banner (R-DD-17) · separate multi-select batch panel (DD-12) · state/breakpoint banner on Behaviour (DD-14) · value-shaped placeholders like "000000" (DD-12) · CMS / Link / Visibility / Interactions on the page body (DD-10) · CMS binding on non-bindable types (DD-10) · "Container" label on checkbox, embeds, etc. (Q2).

### Deferred — do NOT design now
Comment count in header (Q6) · viewer read-only Inspector (Q3) · ecommerce product type block (Q7, separate arc).

---

## Boards

Legend: **S** Style · **B** Behaviour · **E** Effects. Each row = one board.

### 1. Selection types

| # | Board | MUST contain | Decisions |
|---|---|---|---|
| 1 | Heading · S | Type block "Heading": Level H1–H6 segmented, Text style select, "Edit text on canvas" button; Typography (font, size + line pair, weight, colour with token chip, align); Size (Width/Height Fixed·Fill·Hug); Spacing box diagram (margin outside, padding inside, 🔗 link); Fill "+" row; Border "+" row | DD-3, DD-15, R-DD-9, DD-9b, DD-11 |
| 2 | Heading · B | CMS binding (Static / From CMS, bindable); Visibility (Desktop · Tablet · Mobile); **Interactions** (list + "+ Add interaction"); CSS classes (chips + add input); Attributes closed with summary | Q1, DD-10, DD-9 |
| 3 | Heading · E | Opacity "+"; Shadow "+"; Filters "+"; Transform & motion "+"; Advanced closed (cursor, blend) — **no Interactions** | Q1, DD-9 |
| 4 | Text · S | Type block "Text": Text style + Edit text on canvas; then as #1 | DD-3, R-DD-9 |
| 5 | Button · S | Type block "Button": Edit text on canvas, Type (Button/Submit/Reset), Disabled checkbox (label beside box) | DD-3, X-8 |
| 6 | Button · B | Link section: Link to (None/Page/URL/Email/Phone/Anchor), Page select, Open in new tab, **Rel** field, hint "Changing Link to clears the old destination"; CMS binding; Visibility; Interactions; classes; attributes | R-DD-9, X-3 |
| 7 | Link · B | Link section with URL type selected (URL field, new tab, rel) | R-DD-9 |
| 8 | Image · S | Type block "Image": source row (thumb, file name, size, Replace), Alt text + missing-alt hint, Fit (Cover/Contain/Fill), Loading; Size; Spacing; Border; Fill | DD-3 |
| 9 | Video embed · S | Type block "Video embed": Video URL, "Detected: YouTube", Ratio 16:9/4:3/1:1, Autoplay / Muted / Show controls, **warning "Browsers block autoplay with sound… Turn on Muted"** | Q5, X-9 |
| 10 | Audio · S | Type block "Audio": source row + "Choose audio", Show controls, Loop, Autoplay | Q5 |
| 11 | Countdown · S | Type block: Ends at (date-time), "visitor's time zone" hint, When done (Show message / Hide), Message | Q5 |
| 12 | Progress · S | Type block: Value / Max pair, Show label | Q5 |
| 13 | Accordion · S | Type block: items list with "Open" per item, "Allow several open at once" | Q5 |
| 14 | Input · S | Type block "Input": Input type, Name, Placeholder, Default, Required, Disabled | DD-3, X-8 |
| 15 | Checkbox · S | Type block "Checkbox" (not "Container"): Edit text on canvas, Name, Checked by default, Required | Q2, P-13 |
| 16 | Flex · S | Type block "Flex": Direction (Row/Column), 3×3 Align grid + label, Wrap, Gap — always visible | DD-5, DD-9 |
| 17 | Container (grid) · S | Layout: Display Block/Flex/Grid/**None**, Columns + Gap when grid, Position; Size; Spacing; Fill; Border; "Text inside" closed with summary | R-DD-9, DD-10 |
| 18 | Section · B | Link section present (linkable); **no CMS binding** | DD-10 |
| 19 | Form · B | Fields list (drag handle, label, type, required) + "+ Add field"; After submit (Then, Message/Redirect, Send to) + note "Saved to your site straight away — not part of Undo. Changing Send to needs an admin." | DD-15, C-5 |
| 20 | Collection list · B | Collection select incl. "+ New collection…", Show N items, **"Open collection ›"** | §17.D |

### 2. States

| # | Board | MUST contain | Decisions |
|---|---|---|---|
| 21 | Nothing selected — Page panel | Header "Home · Page"; Fill (background), Size (max width), Typography (font, text colour), Spacing; link "SEO & social…" + "Your place here is kept"; no tabs | DD-13, P-5 |
| 22 | Multi-select (3 headings) | Bar: "3 selected · Headings", ✦ AI, ⋯, ✕; Align ×6, Distribute ×2 (disabled under 3), Group; same tabs; **"Mixed"** in fields that differ; note "Edits apply to all 3. One Undo…" | DD-12 |
| 23 | Locked element | 🔒 mark; line "Locked — unlock to edit · Unlock"; controls shown read-only (values legible, not dimmed) | DD-18, P-1 |
| 24 | CMS-bound heading · B | Header chip "⌁ Menu.name" (clickable); CMS binding: From CMS, Collection (+ New collection…), Field (filtered by type), Preview "Cacio e pepe (record 1 of 3)", **Open record ›**, **Unbind**, hint "Unbind keeps the text you see now" | R-DD-17, P-2 |
| 25 | CMS source missing · B | Red header chip "⌁ Specials.title · missing"; error box "Source missing — Collection “Specials” was deleted…" with Reconnect… / Unbind | R-DD-17 |
| 26 | Component instance · S | Header "◆ Component: Reservation banner"; component row: Variant select, "Edit master ›", ⋯ (Reset to master, Detach instance…); override dot on the changed field (padding) with "overrides master" text | DD-16, R-DD-14 |
| 27 | Button :hover · S | Context row chip "State: :hover ▾" (accent), "N :hover overrides · Reset"; override dots on changed fields | R-DD-14 |
| 28 | Heading on Tablet · S | Breakpoint chip "Tablet · 1 override" + Revert; dot on Size with "Overridden on Tablet" | R-DD-14 |
| 29 | Save conflict | Line "This site changed elsewhere — resolve to keep editing · Resolve"; controls read-only | Q4 |

### 3. Overlays and flows

| # | Board | MUST contain | Decisions |
|---|---|---|---|
| 30 | ⋯ menu | Duplicate ⌘D · Copy style ⌥⌘C · Paste style ⌥⌘V · Apply style to all {H3 headings} on this page (N) · Reset style · — · Save as component… · Lock · — · Delete ⌫ (danger). Nothing else. | R-DD-8, DD-6b |
| 31 | Apply-to-all dialog | Title "Apply this style to N H3 headings on Home?"; Copies / Keeps / Skipped rows; hint "save this as a text style in Brand"; Cancel / Apply to N; + toast "Applied to N H3 headings · Undo" | DD-6b |
| 32 | State menu | "Edit styles for": Base, :hover, :focus, :active, :disabled | R-DD-14 |
| 33 | Colour / token popover | Opens **beside the panel, over the canvas** (never clipped); brand colour list with token names + hex; "Add colours in Brand ›" link | P-4 |
| 34 | Field error | Size field with red border + line "Use a number or a unit like 24px, 2rem, auto." | DD-19 |
| 35 | AI column | Right column replaced by AI: "‹ Inspector" back, scope "Scope: Heading", prompt box, suggestions; note returning keeps tab/scroll/state | DD-7, P-6, P-7 |
| 36 | Inspector hidden | Canvas full width, "Show inspector" button, ⌘\ hint | R-DD-8 |

## Acceptance procedure

1. For each board, tick every MUST item and confirm no MUST-NOT item appears (screenshot per board).
2. Record node ids in `scripts/conformance/boards.json` (family "Inspector v4") so the build loop can compare board vs live.
3. Owner review of the full set before any code change.
