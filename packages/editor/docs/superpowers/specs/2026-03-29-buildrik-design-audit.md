# Buildrik Wireframe — Production Handoff Audit

**File:** `/Users/shahg/Desktop/pencil/editer.pen`
**Date:** 2026-03-29
**Frames audited:** 84 frames across 14 modules
**Audience:** React/TypeScript developer building `src/editor/`
**Method:** Full visual screenshot pass + batch_get reads on flagged frames

---

## Severity Key

| Level | Meaning |
|-------|---------|
| 🔴 BLOCKER | Dev cannot implement correctly without resolution |
| 🟡 GAP | Missing state/content that makes a screen incomplete |
| ⚪ POLISH | Visual inconsistency or ambiguity — won't block but will cause rework |

---

## Summary Counts

| Severity | Count |
|----------|-------|
| 🔴 BLOCKER | 11 |
| 🟡 GAP | 14 |
| ⚪ POLISH | 8 |
| **Total** | **33** |

---

## 🔴 BLOCKERS

### B-01 · Two competing inspector designs exist
**Frames:** `5qjkQ`, `niyiH`, `Mk1L2`, `YBoj8`, `nkopD`, `jPkOS`, `l6Cy5` (old set)
vs `26XuR`, `ebEVP`, `gR1na`, `otRcF` (new set, frames 46–49)

The file contains two full inspector design generations. The old set (03, 20, 23, 24, 34, 35, 42) uses an inspector shell with `Add Elements` in the sidebar header and a narrower panel. The new set (46–49) uses a cleaner shell with proper `Inspector` topbar, tabbed Layout/Style/Effects structure, and complete section content.

**Fix required:** Mark frames 03/20/23/24/34/35/42 as `DEPRECATED` in the file via a note overlay. The 46–49 series is the canonical inspector implementation reference.

**Dev action:** Implement only from frames 46–49 (`26XuR`, `ebEVP`, `gR1na`, `otRcF`).

---

### B-02 · Publish Success state is ambiguous
**Frame:** `KBELS` (13 — Publish Success)

The frame shows the full published website content rendered inside the editor canvas (hero + cards), with a small "Your Site Is Live" notification card at the bottom center. It is unclear whether:
- (a) Publish Success replaces the editor entirely with a preview of the live site, OR
- (b) A notification overlay/card appears on top of the normal editor view

The current design appears to be (a), but the editor chrome (left rail) is visible, which suggests (b). The "Your Site Is Live" card shows a URL field and "Copy link" button but it's 320px wide and visually disconnected from the hero state.

**Fix required:** Add a design note or split into two clear sub-states:
- `13A` — Publish Success (editor view with success toast/banner)
- `13B` — Publish Success (preview of live site, separate context)

---

### B-03 · "Export Project" modal labeled as "Publishing In Progress"
**Frame:** `K928D` (32 — Publishing: In Progress)

The frame shows a modal titled **"Export Project"** with 4 progress bars: HTML/CSS, Images, Fonts, Scripts. The frame is labeled as "Publishing: In Progress" but Export and Publish are different operations. A React dev building `src/editor/` will not know whether to build:
- An export-to-files flow (downloads a zip), OR
- A publish-to-hosting flow (deploys to CDN)

**Fix required:** Either rename the modal to "Publishing..." or split into two separate frames for Export vs Publish flows.

---

### B-04 · Inspector Box has no dimension values
**Frame:** `YBoj8` (24 — Inspector: Box)

The LOCATION & SIZE section fields are blank — no X/Y/W/H example values. The BACKGROUND section exists with type chips (Solid/After/Grad/None) but the BORDER section at the bottom appears cut off.

**Fix required:** Add placeholder values to all inputs (e.g., X: 0, Y: 120, W: 800, H: 400) and ensure the border section is fully visible. Since B-01 deprecates this frame, the canonical reference is `ebEVP` — verify `ebEVP` has complete values before marking done.

---

### B-05 · CMS Edit Entry missing standard fields
**Frame:** `uN3tF` (44C — CMS: Edit Entry)

The entry editor shows Title and Body fields, but is missing:
- **Featured Image** upload field
- **URL Slug** field (e.g., `/blog/getting-started`)
- **Published Date** field (date picker)
- **Author** field

A CMS without slug/date/image fields is not implementable as a real content editor.

**Fix required:** Add these fields between the title and body in the entry editor layout.

---

### B-06 · CMS Panel entries overflow panel width
**Frame:** `11bGl` (08 — CMS Panel)

Nested collection entries render at full text width inside a ~110px panel. The entry names truncate or wrap in a way that makes the interaction pattern ambiguous. Dev cannot determine: does each row truncate with ellipsis, have a tooltip, or expand on hover?

**Fix required:** Show a zoomed view of a single collection item row with explicit truncation behavior noted.

---

### B-07 · CMS Empty State — canvas area undefined
**Frame:** `pBHvC` (18 — CMS Empty State)

The left panel shows the empty state ("Create your first collection" + CTA button) but the main canvas area (780×820px) is completely blank white. A dev doesn't know what to render there before any collection exists.

**Fix required:** Add content to the canvas area. Options: (a) instructional illustration + copy, (b) "No collection selected" centered message, (c) Getting Started guide cards.

---

### B-08 · Left rail absent in Breakpoint Editing frame
**Frame:** `Znv6u` (19 — Breakpoint Editing)

The breakpoint topbar (All/Small/Laptop/Tablet/Mobile/576px chips) is visible and the canvas shows a narrow column preview. But the left rail (60px icon navigation) is entirely absent. Dev cannot determine if the left rail is hidden intentionally in breakpoint editing mode or if it was forgotten.

**Fix required:** Add an explicit note or restore the left rail. If the rail IS hidden in breakpoint mode, annotate the frame: "Left rail hidden in breakpoint editing — editor enters viewport-focused mode."

---

### B-09 · Settings API Keys page has incomplete left nav
**Frame:** `AT0Fm` (39F — Settings: API Keys)

The left nav shows only: General, Domain (SITE group) + Custom Code, API Keys (DEVELOPER group). Missing from SITE group: SEO, Integrations, Export.

Compare to `fGhTW` (SEO page) and `x9WCc` (Integrations page) which correctly show all 5 SITE items.

**Fix required:** Update `AT0Fm` left nav to match canonical nav: General, Domain, SEO, Integrations, Export (SITE) + Custom Code, API Keys (DEVELOPER).

---

### B-10 · Settings Custom Code page has incomplete left nav
**Frame:** `v5WLP` (39E — Settings: Custom Code)

Same issue as B-09. Left nav shows General, Domain, Custom Code, API Keys — missing SEO, Integrations, Export from SITE group.

**Fix required:** Same as B-09 — update to full nav.

---

### B-11 · Components Panel has no "create component" affordance
**Frame:** `zvcio` (27 — Components Panel)

The components panel shows a list of existing components (NavSection, NavBar, Footer) but has no visible "+" or "Create component" button. Dev cannot implement the creation flow without knowing how components are created from this panel.

**Fix required:** Add a "+ New Component" button (or "Save selection as component" CTA) to the panel header.

---

## 🟡 GAPS

### G-01 · Templates Panel — cards are solid color, no structure preview
**Frame:** `eHMi7` (04 — Templates Panel)

Template cards show as flat colored rectangles (blue, green, pink, teal) with a name label. A dev doesn't know what kind of thumbnail component to render — is this a `<img>` of a screenshot, a skeleton block layout, or just a color swatch?

**Fix required:** Replace at least 2 template cards with a mini block-layout preview (a frame showing header + hero + features rows as grey boxes). Add a design note specifying the thumbnail type.

---

### G-02 · Templates Panel — no search bar
**Frame:** `eHMi7` (04 — Templates Panel)

The templates panel has filter tabs (All/Landing/Blog) but no search input. If the template library grows, search becomes necessary. Other panels (Add, Media, Components) all have search bars.

**Fix required:** Add a search bar below the filter tabs, matching the `SearchBar` component pattern from `BBjUx`.

---

### G-03 · Quick Settings vs Full Settings — relationship not defined
**Frame:** `hcxlF` (22 — Settings Panel)

`hcxlF` is a 110px sidebar panel with Site Name, Description, Favicon, Language and "Open Full Settings →" link. `VSDXS`/`fGhTW`/`LVzth` etc. are full-page settings views. A dev needs to know: does clicking Settings in the left rail open the sidebar panel (hcxlF) which then leads to full settings, OR does it navigate directly to the full settings page?

**Fix required:** Add a flow annotation between `hcxlF` and `VSDXS`. Or add a frame showing the transition: hcxlF panel → click "Open Full Settings" → full settings page replaces editor.

---

### G-04 · Pre-launch Checklist — item visual states unclear
**Frame:** `szUXT` (31 — Publish: Pre-launch Checklist)

The checklist items (Custom domain connected, Product ready, SEO, HTTPS, Mobile) show different content but their visual states (checked ✅, warning ⚠️, not started ○) are not clearly differentiated at the design level. The screenshot shows items but it's hard to tell which state each is in.

**Fix required:** Show 3 explicit states on the checklist: one item checked (green checkmark), one with warning (amber), one incomplete (grey). Label each state.

---

### G-05 · Preview — tablet breakpoint width undefined
**Frame:** `qkbct` (15 — Preview Full Screen)

The preview topbar shows device chips (Desktop/Tablet/Phone). Desktop and Phone are standard widths, but "Tablet" is ambiguous — is it 768px, 834px, 1024px?

**Fix required:** Add a design note or tooltip annotation on the Tablet chip specifying the breakpoint width (recommend 768px, matching Tailwind's `md`).

---

### G-06 · Media Upload — multi-file state missing
**Frame:** `lMRVv` (09B — Media: Upload in Progress)

Shows a single file upload progress bar. What happens with 5 concurrent uploads? Does it show 5 progress bars? A stacked counter? A single aggregate bar?

**Fix required:** Add a variant showing 3 simultaneous uploads (stacked progress bars or a "3 files uploading" summary with progress).

---

### G-07 · History Panel — item click interaction undefined
**Frame:** `xHDda` (05 — History Panel)

History items are listed but have no hover state and no visible affordance for clicking. A dev cannot determine: does clicking a history item restore to that point inline? Open a confirmation dialog? Show a diff?

**Fix required:** Add a hover state on one history item showing the "Restore" action or tooltip. Add a note: "Click to restore to this version."

---

### G-08 · Layers Panel — interaction affordance too small
**Frame:** `ENFlg` (02 — Layers Panel)

Eye and lock icons are present on each layer row but are very small (~12×12px). A dev implementing this panel needs to know: do these icons appear on hover only, or always? What's the click behavior (toggle visibility, toggle lock)?

**Fix required:** Add an annotation or a zoomed inset showing the layer row hover state with icon interactions labeled.

---

### G-09 · Breakpoint Editing — topbar chip widths undefined
**Frame:** `Znv6u` (19 — Breakpoint Editing)

The breakpoint chips show: All / Small / Laptop / Tablet / Mobile / 576px. The last chip appears to be a custom width input. Dev needs to know: what are the default widths for Small/Laptop/Tablet/Mobile?

**Fix required:** Add a tooltip/annotation on each chip specifying default px values (e.g., Mobile: 375px, Tablet: 768px, Laptop: 1024px, All: full).

---

### G-10 · CMS Collection Detail — "Select an entry" state needs content
**Frame:** `6FWDg` (44 — CMS: Collection Detail)

When no entry is selected, the canvas shows "Select an entry" empty state. This is fine. But what does the left panel look like when the collection itself is empty (0 entries)?

**Fix required:** The existing `pBHvC` handles this partially. Verify it's linked in the flow from `6FWDg` → delete all entries → `pBHvC`-style empty state.

---

### G-11 · AI Result Accept — what happens after "Accept"?
**Frame:** `aoXA0` (29 — AI Result: Accept)

The action bar shows AI generated / Undo / Regenerate / ✓ Accept. Clicking Accept presumably closes the bar and enters normal editing. But which frame shows the "after accept" state?

**Fix required:** Add a note on `aoXA0` pointing to the target frame after Accept is clicked (likely `BiN8p` — Sidebar Open with the generated content on canvas).

---

### G-12 · Save States — incomplete coverage
**Frame:** `uwGEf` (12 — Save States)

This frame (880×360, not a full 1440×900 screen) shows save state chips but lives outside the main module grid. Dev needs to know where save state chips appear in the actual editor topbar.

**Fix required:** Ensure at least 2 full editor frames show different save states in the topbar: one "Saved" and one "Saving..." state. The topbar states frame (`JDUwx`) should reference this.

---

### G-13 · Components Panel — no usage count or edit path
**Frame:** `zvcio` (27 — Components Panel)

Component items (NavSection, NavBar, Footer) show thumbnails and names but no usage count ("Used in 3 pages") and no "Edit component" action (pencil icon or right-click). Dev doesn't know if components are editable from this panel.

**Fix required:** Add a usage count label and an "Edit" affordance to at least one component row.

---

### G-14 · Right-click Context Menu — keyboard shortcut labels missing
**Frame:** `FpY6c` (30 — Right-click Context Menu)

The context menu shows actions (Copy, Paste, Duplicate, Delete, Edit, Group, Wrap in frame, Bring to front) but no keyboard shortcut labels on the right side. Standard context menus show shortcuts (e.g., Copy: ⌘C, Paste: ⌘V).

**Fix required:** Add keyboard shortcut labels to each menu item (right-aligned, muted color, 11px).

---

## ⚪ POLISH

### P-01 · Inspector tab active state inconsistent across frames
**Frames:** `otRcF` (49) vs `26XuR` (46)

In `otRcF`, the active tab appears to use a yellow/amber background. In `26XuR`, active tab uses the standard blue underline/chip. Pick one pattern and apply it consistently across all 4 inspector frames (46–49).

**Fix:** Use blue underline for active tab (matching the token `#2563EB`). Apply to all inspector tab rows.

---

### P-02 · Publish Success celebratory moment too subtle
**Frame:** `KBELS`

The "Your Site Is Live" card is 320px wide, centered at the bottom of the canvas. For what is arguably the most important user moment in the product (first publish), this is underwhelming. The card needs more visual weight.

**Fix:** Increase card to 480px, add a ✓ green icon, make the URL field more prominent (larger, copyable). Or explore a full-width success banner.

---

### P-03 · Orange frame border in Mobile Gate is an undefined token
**Frame:** `x27ZA` (21 — Mobile Gate)

The frame has an orange/amber border around the canvas area as a visual warning. Orange is not in the design token spec (`#2563EB`, `#111827`, `#374151`, `#6B7280`, `#E5E7EB`, `#F0F2F5`, `#FAFAFA`).

**Fix:** Either add `--warning: #F59E0B` as a design token, or change the mobile gate border to an existing warning pattern.

---

### P-04 · Left rail icon count inconsistent across frames
**Multiple frames**

Some frames show 5 left rail icons, others show 6. The canonical rail configuration (per `tabsConfig.ts`) has Add, Layers, Pages, Media in the top zone and Design, Settings in the bottom zone.

**Fix:** Audit all full-editor frames and ensure the left rail consistently shows 6 icons (4 top + 2 bottom + Help footer).

---

### P-05 · Template cards need category counts
**Frame:** `eHMi7` (04 — Templates Panel)

The filter tabs show "All / Landing / Blog" but no count badges (e.g., "All (18)", "Landing (7)"). Other SaaS tools show this for discoverability.

**Fix:** Add count badges to filter tabs (gray pill, e.g., `18`).

---

### P-06 · History items lack relative timestamps
**Frame:** `xHDda` (05 — History Panel)

History items show entry names but the timestamps are absent or very small. "2 minutes ago" or "3:42 PM" would help users know how far back a restore point is.

**Fix:** Add a relative timestamp (12px, `#9CA3AF`) below each history item title.

---

### P-07 · AI Generation Failed message too sparse
**Frame:** `BfJwY` (11B)

The error state shows the warning triangle and "Generation failed" title but the subtext is very small. The overall frame feels thin compared to the generating state (`zSiUu`).

**Fix:** Add a secondary suggestion: "Try rephrasing your prompt or use a template instead" with a "Browse Templates" ghost button as a fallback path.

---

### P-08 · Page Settings Modal — OG title and description truncation
**Frame:** `CaDI5` (29 — Page Settings Modal)

The OG description field shows a very long placeholder string that wraps outside the input border. This is a visual glitch in the wireframe.

**Fix:** Set the OG description to a reasonable 2-line example (max 160 chars) that stays within the input field bounds.

---

## Design Token Reference

All fixes must use these tokens:

| Token | Value | Usage |
|-------|-------|-------|
| primary | `#2563EB` | CTA buttons, active states, links |
| text | `#111827` | Primary text |
| text-secondary | `#374151` | Labels, secondary text |
| muted | `#6B7280` | Placeholder, help text |
| placeholder | `#9CA3AF` | Input placeholders, timestamps |
| canvas-bg | `#F0F2F5` | Canvas background |
| panel-bg | `#FAFAFA` | Sidebar/panel backgrounds |
| card | `#FFFFFF` | Card backgrounds, modals |
| border | `#E5E7EB` | Dividers, input borders |
| active-chip-bg | `#EFF6FF` | Selected filter chips |
| active-chip-border | `#DBEAFE` | Selected chip borders |
| *(add)* warning | `#F59E0B` | Mobile gate, warning states |
| *(add)* success | `#10B981` | Published status, success states |
| *(add)* error | `#EF4444` | Delete buttons, error states |

---

## Module Status Summary

| Module | Frames | BLOCKER | GAP | POLISH | Status |
|--------|--------|---------|-----|--------|--------|
| 1. Add Elements | BBjUx, llsxk | 0 | 0 | 0 | ✅ Complete |
| 2. Layers | ENFlg | 0 | 1 (G-08) | 0 | 🟡 Gap |
| 3. Inspector | 5qjkQ, niyiH, Mk1L2, YBoj8, 26XuR, ebEVP, gR1na, otRcF, nkopD, jPkOS, l6Cy5 | 2 (B-01, B-04) | 0 | 1 (P-01) | 🔴 Blocker |
| 4. Pages | LsKaJ | 0 | 0 | 0 | ✅ Complete |
| 5. Templates | eHMi7, GQCty, dxcN9, zfHWo | 0 | 2 (G-01, G-02) | 1 (P-05) | 🟡 Gap |
| 6. Media | fVg6O, lMRVv | 0 | 1 (G-06) | 0 | 🟡 Gap |
| 7. History | xHDda | 0 | 2 (G-07, P-06) | 1 (P-06) | 🟡 Gap |
| 8. Settings | hcxlF, VSDXS, LVzth, fGhTW, x9WCc, R0qMY, v5WLP, AT0Fm | 2 (B-09, B-10) | 1 (G-03) | 0 | 🔴 Blocker |
| 9. Publish | szUXT, K928D, KBELS, gXzzP, cUVnH, uumuy | 2 (B-02, B-03) | 1 (G-04) | 1 (P-02) | 🔴 Blocker |
| 10. Preview | qkbct | 0 | 1 (G-05) | 0 | 🟡 Gap |
| 11. Client Review | VIke4, PoFyh, t1rbN | 0 | 0 | 0 | ✅ Complete |
| 12. AI | bNn49, zSiUu, ddJgx, aoXA0, Ql3YU, BfJwY | 0 | 1 (G-11) | 1 (P-07) | 🟡 Gap |
| 13. CMS | 11bGl, pBHvC, UfSY2, 6FWDg, 3gXRe, uN3tF | 3 (B-05, B-06, B-07) | 2 (G-10, G-13) | 0 | 🔴 Blocker |
| 14. Canvas/Shell | Pro1P, BiN8p, N5ulh, Znv6u, x27ZA, JDUwx, FpY6c, CaDI5 | 1 (B-08) | 3 (G-09, G-12, G-14) | 3 (P-03, P-04, P-08) | 🔴 Blocker |

---

## Frames Verified Complete (no issues)

These frames are production-ready as-is:

- `LsKaJ` (07 — Pages Panel) — thumbnails, status badges, add page CTA ✅
- `GQCty` (04B — Template Preview) — overlay modal, pages list, CTA ✅
- `dxcN9` (04C — Template Applied) — template on canvas, undo toast ✅
- `gXzzP` (14 — Pre-publish Warnings) — modal, warning items, Cancel/Publish Anyway ✅
- `uumuy` (14B — Publish Error) — modal, error message, Try Again/View Errors ✅
- `VIke4` (17 — Client Review) — topbar, comments, approve button ✅
- `t1rbN` (17B — Client Review Approved) — approval banner, Publish now CTA ✅
- `PoFyh` (16 — Review Link Flow) — all 4 states (generating/ready/copied/error) ✅
- `bNn49` (10 — AI Entry Point) — creation options, AI toggle ✅
- `zSiUu` (11 — AI Generating) — skeleton, cancel, status ✅
- `ddJgx` (43 — AI Prompt Input) — textarea, suggestions, generate button ✅
- `aoXA0` (29 — AI Result Accept) — accept bar, layers, canvas — ⚠️ has open G-11 (needs post-accept annotation)
- `Ql3YU` (33 — AI Result Edit) — section editor, save theme ✅
- `UfSY2` (38 — CMS Create Collection) — modal, type picker, create button ✅
- `3gXRe` (44B — CMS Delete) — confirmation modal, cancel/delete ✅
- `VSDXS` (39 — Settings General) — all fields, nav, save ✅
- `LVzth` (45 — Settings Domain) — subdomain, custom domain, DNS config ✅
- `fGhTW` (39B — Settings SEO) — meta title, description, OG image ✅
- `x9WCc` (39C — Settings Integrations) — 4 integrations with toggles ✅
- `R0qMY` (39D — Settings Export) — HTML/CSS download, React export ✅
- `S6Yog` (41 — Design System Colors) — primary/secondary/accent/neutral palettes ✅
- `CaDI5` (29 — Page Settings Modal) — title, slug, OG, meta, robots toggle — ⚠️ has open P-08 (OG description overflow)
- `FpY6c` (30 — Right-click Context Menu) — all actions present — ⚠️ has open G-14 (no keyboard shortcuts)
- `fVg6O` (09 — Media Panel) — grid, file names, sizes, filters, search ✅

---

## Pass 2 — Pencil Fix Plan

After spec review and approval, apply fixes to `editer.pen` in this priority order:

**Sprint 1 — All Blockers (11 items): ✅ COMPLETE (2026-03-29)**
1. ✅ B-01: `[DEPRECATED]` red banners added to 5qjkQ/niyiH/Mk1L2/YBoj8/nkopD/jPkOS/l6Cy5; fill=#FEF2F2
2. ✅ B-02: Design note added to KBELS canvas clarifying toast-not-takeover pattern
3. ✅ B-03: K928D modal title changed to "Publishing..."
4. ✅ B-04: ebEVP already had W:320/H:200 — pre-verified, no fix needed
5. ✅ B-05: Featured Image, Slug, Published Date, Author fields added to uN3tF
6. ✅ B-06: Amber annotation + textGrowth:fixed-width set on post title nodes in 11bGl
7. ✅ B-07: CMS empty state added to pBHvC (database icon + title + subtext + CTA)
8. ✅ B-08: Design note added confirming rail IS present (212ZY) in Znv6u
9. ✅ B-09: SEO, Integrations, Export nav items added to AT0Fm SITE group
10. ✅ B-10: Pre-verified — v5WLP siteGrp already had all 5 SITE items
11. ✅ B-11: Pre-verified — zvcio sbHdr already had "+ New Component" button

**Sprint 2 — All Gaps (14 items): ✅ COMPLETE (2026-03-29)**
12. ✅ G-01: Portfolio Pro + SaaS Landing cards updated with block-layout stripe previews
13. ✅ G-02: Pre-existing — search bar (c9er0) already in templates panel
14. ✅ G-03: Flow annotation added to hcxlF canvas → "23 — Publish Ready (VSDXS)"
15. ✅ G-04: ci3 converted to amber warning state (Favicon missing) — 3 states now explicit
16. ✅ G-05: Tablet chip in qkbct updated "Tablet · 768px"; Phone "Phone · 375px"
17. ✅ G-06: 2 additional upload rows added to lMRVv (team-photo.png 32%, banner-v2.webp 8%)
18. ✅ G-07: hist2 in xHDda shows hover state (EFF6FF bg, blue border, Restore button visible)
19. ✅ G-08: layFeatures row in ENFlg updated to show hover state (F9FAFB bg + border)
20. ✅ G-09: desktopChip "Desktop · 1280px", tabletChip "Tablet · 768px" in Znv6u
21. ✅ G-10: Flow annotation added to 6FWDg canvas → pBHvC CMS Empty State
22. ✅ G-11: Flow annotation added to aoXA0 → "Transitions to 01 — Full Editor with AI blocks"
23. ✅ G-12: ENFlg topbar shows "● Saving..." (amber) vs xHDda "● Saved 2s ago"
24. ✅ G-13: "3 uses" count added to comp1 row in zvcio compList
25. ✅ G-14: ⌘⇧L (Lock), ⌘↑ (Bring Front), ⌘↓ (Send Back), ⌘⌥K (Create Comp) added

**Sprint 3 — Polish (8 items): ✅ COMPLETE (2026-03-29)**
26. ✅ P-01: Confirmed QVIwi = blue #2563EB (not amber); opacity on otRcF raised 0.35→0.5 + note added
27. ✅ P-02: KBELS success toast expanded 320→480px, height 72→96px, circle-check icon added
28. ✅ P-03: x27ZA warningBanner stroke updated #FDE68A → #F59E0B (canonical warning token)
29. ✅ P-04: Design note added to Znv6u canvas: canonical rail = 6 icons + Help
30. ✅ P-05: Filter tabs updated: "All (18)", "Landing (7)", "Blog (5)"
31. ✅ P-06: History timestamps updated with absolute times: "2 min ago · 4:10 PM" format
32. ✅ P-07: "Browse Templates" button added to BfJwY failBtns row (3rd option)
33. ✅ P-08: ifkEP set to textGrowth:fixed-width width:416; mhQQx clip:true
