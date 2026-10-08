# Module UX / IA audit — 2026-09-27

Build audited: `main` @ `8e9a3ccb2` (live dev server, `/edit/scratchver0000000000000001`, 1440×900, OWNER account).
Method: 7 parallel auditors, one per module group. Each read the code, walked the live app with headless Playwright
(measured with `getComputedStyle` / `elementFromPoint`, not eyeballed), and reconciled every relevant finding of the
2026-09-25 full audit (`docs/audits/2026-09-25-full-audit/`) as FIXED / STILL TRUE / CHANGED / REGRESSED.
Audit only — no code was changed. Nothing was published. All test data on the scratch site was reverted.

Lenses (founder's list): 1 Module cohesion · 2 Feature-module misfit · 3 Duplicate / redundant entry points ·
4 Scope leakage · 5 Discoverability · 6 Information scent · 7 Feature bloat / contextual noise · 8 Surface
correctness · 9 Navigation hierarchy · 10 Collaboration ownership · 11 Cognitive load.
Plus, where asked: form-validation matrices (Settings, CMS) and task flow maps (Brand, CMS).

Severity: **P0** blocks or misleads users · **P1** real friction · **P2** polish · **P3** minor.

| File | Module | Findings | P0 | P1 |
|---|---|---:|---:|---:|
| [01-inspector.md](01-inspector.md) | Inspector | 23 | 1 | 11 |
| [02-settings.md](02-settings.md) | Settings (editor + dashboard) | 29 | 0 | 13 |
| [03-brand.md](03-brand.md) | Brand | 22 | 4 | 11 |
| [04-cms.md](04-cms.md) | CMS | 23 | 0 | 7 |
| [05-build-panels.md](05-build-panels.md) | Add · Components · Templates · Assets · Layers · Pages | 45 | 0 | 14 |
| [06-collaboration.md](06-collaboration.md) | Comments · Review · Presence · Activity · History · Notifications · Share/Invite · Publish | 18 | 0 | 8 |
| [07-shell.md](07-shell.md) | Topbar · rail · ⌘K · canvas bars · menus · onboarding · all AI doors | 26 | 0 | 7 |
| **Total** | | **~186** | **5** | **~71** |

Screenshots and probe scripts: session scratchpad `…/scratchpad/audit/<module>/` (not committed; temp dir).

---

## 1. The verdict in one paragraph

The founder's read is right. The editor is not short of features — it is short of **ownership**. Almost every module
has the same three diseases: (a) the same job has 2–9 doors that were added by different lanes and never merged,
(b) things that define an element / site / collection are buried while rarely-used things sit on top, and
(c) two save models / two validation models / two vocabularies for one concept. Brand and Inspector are the worst
against a "simple like Figma" bar (Inspector ~4/10, Brand 4.1/10); Settings is the worst on validation (3/10);
Collaboration is the worst on ownership (nobody owns "what happened on this site").

## 2. P0 list (fix first — these mislead or block)

| ID | What the user experiences | Module |
|---|---|---|
| INS-01 | Inspector shows values the canvas doesn't render (button says blue fill / white text, renders transparent / grey). **Needs a clean reproduction** — other auditors were editing the same site. | Inspector |
| BRD-01 | Inspector colour picker (brand swatches) renders **behind the canvas** — invisible, unclickable. Binding an element to a brand colour is a dead end. | Brand ↔ Inspector |
| BRD-02 | Applying a Starter silently wipes all fonts, all spacing tokens and 9 colours; the review says "9 changes". | Brand |
| BRD-03 | Brand is a full page covering the canvas, and its "Live preview" does not show staged edits. You cannot see what you are changing. | Brand |
| BRD-05 | (R1, known) Elements inserted from Add use hex, not brand tokens — changing Primary doesn't change new buttons. Every token reads "unused". | Brand ↔ Add |

Near-P0: **INS-02** "All like this" edits every page (offers 112 headings on a 70-heading page; tooltip says "on this page").
**SET-09** Localization auto-redirect now ships a script that sends visitors to `/fr/` `/ar/` pages that are never published (REGRESSED).

## 3. Regressions in code merged today (2026-09-27)

| ID | What | From |
|---|---|---|
| PGS-01 | Pages dark bulk toolbar: Delete button overflows the panel (x 298–350, panel ends 340) — reads "Delet". | L3 merge |
| CMP-03 | Component detail Esc does not go back live (tests pass). Likely the engine's `deselect` Escape command marks the event handled first. Unproven. | L5 merge |

## 4. Cross-module patterns (the real root causes)

### P-1 · Duplicate doors that don't do the same thing
- **AI edit: 9 doors**, all open the same panel (harmless duplication, but 3 are within 50px for one selection). "Ask AI instead" in ⌘K drops the typed query. (SHL-03, SHL-13, INS-14)
- **Element menu: 3 doors, 2 different menus** — canvas More / right-click (9 rows) vs Inspector ⋯ (12 rows); share 5, differ on 9. Layers row menu is a 4th, different again. (SHL-02, LYR-01)
- **Preview**: 4 meanings; one ⌘K "Preview" opens a blank tab. **Export**: 5 doors, 2 ⌘K rows do nothing. (SHL-04)
- **Share**: 3 doors, 3 names; ⌘K "share" finds nothing. (COL-06)
- **Integrations**: 3 catalogs disagree (editor "coming soon" / Overview "3 connected" / dashboard live Connect); GA in 3 places, 1 real. (SET-12)
- **Settings surfaces**: Domains ×3, Indexing ×3, Language ×3, Redirects ×2, name/favicon/social/code ×2. (SET-15, SET-22)
- **Fonts**: Brand, Assets › Fonts, Inspector family picker. (BRD-15, AST-08)
- **Same block as Element + Block + Component** (13 of 14 built-in components duplicate Elements rows). (ADD-01)
- **Fields**: New-collection modal vs "+ Add field" — 5 vs 9 types, different key rules, no duplicate check in one. (CMS-03)

### P-2 · Important things buried, noise on top
- Heading level, alt text, video autoplay, input name/required → closed "Advanced" on the 2nd Inspector tab. (INS-03)
- Flex/Grid direction + align hidden by Beginner tier. (INS-10)
- Breakpoint switch 2 levels deep; bar never shows current device. (SHL-05)
- Permissions / Delete site reachable only by typing into ⌘K. (SHL-06)
- Components & Templates: only visible door is the last row of Add (y≈1740/1780 in an 800px panel). (CMP-01, TPL-01)
- Add: flat 54-row Elements list pushes Blocks, AI generate, Page templates below the fold; AI row vanishes when Elements is collapsed. (ADD-02, ADD-03)
- Brand: 11 nav rows + 11 token kinds hidden in a dropdown on the Spacing page. (BRD-09, BRD-11)
- All lifecycle/admin modules (Settings, History, Publish panel, Issues, Review) have no persistent labelled door. (SHL-15)

### P-3 · Two models for one concept
- **Save**: Brand = picker Apply → Save → "Apply 1 change"; Inspector "Update everywhere" = instant. Settings = footer Save for some screens, per-action for others, direct for Headers/Localization. (BRD-07, BRD-14, SET map)
- **Validation**: client and server disagree on 9 Settings fields; many fields have no rule on either side; CMS has no server validation of fields/records at all. (SET-01…SET-14, CMS §5)
- **Click semantics**: Add click inserts, Assets drawer click inserts, Library click selects, Components click opens detail. (AST-02, X-4)
- **Binding**: CMS inspector binding vs `{{item.key}}` text in lists. (CMS-05)
- **Multi-select**: 3 patterns (Layers checkboxes always, Pages select mode, Assets) + Inspector switches to a different panel with fake-looking placeholder values. (X-9, INS-11)

### P-4 · Status that contradicts itself
- One review round: chip "Waiting · Sent to your client" / panel "Not sent yet" / dashboard "Awaiting sign-off" / ⋯ "Re-send". (COL-01, SHL-10)
- "Publish anyway" as primary at rest, next to "Waiting"; its reason is in a tooltip. (COL-02, SHL-12)
- Save pill reads "History ›" — "Saved" survives only as a dot. (SHL-08, COL-10)
- Analytics Verify says "G-FAKE000000 is verified". (SET-05)
- Component counts: Add 6 vs Components panel 2. Asset counts: 30 vs 29. (ADD-05, AST-05)
- Every brand token says "unused". (BRD-06)
- Editor bell empty while dashboard bell shows 2 unread. (COL-05)

### P-5 · Scope leakage
- "All like this" crosses pages. (INS-02)
- `:hover` state + scope row shown on Settings/Effects tabs where nothing can vary by state. (INS-07)
- CMS binding offered on grids, forms, inputs, page body; Link + Visibility + Interactions on the page body. (INS-06)
- Workspace rows inside site Settings; Pages holds site SEO defaults + redirects. (SET-23, PGS-07)
- Colour-mode Light/Dark toggle is an editor preference that reads as a site setting. (BRD-17)

### P-6 · Nobody owns "what happened" and "what needs me"
Activity, History, Notifications, Review and dashboard Activity each hold a slice; none records canvas edits, review
sent, client approved, or changes requested. Activity rows dead-end in an empty History › Session. (COL-03, COL-04, COL-18)

## 5. "Simple like Figma" — target shapes (from the module reports)

- **Inspector** (01 §5): 2 tabs — *Design* and *Behaviour* (not "Settings"). Open "type block" first (Heading: level + text
  style; Image: source + alt; Input: type/name/placeholder/required; Flex: direction/align/gap). One editor per property.
  State/breakpoint chips only when non-default, Design tab only. No Beginner/Pro, no "Whole site" mode. Nothing-selected
  = Page panel. Multi-select = same panel with "Mixed". Heading 68 → ~20–25 controls; Input 116 → ~30.
- **Brand** (03 §5): panel beside a visible canvas (live repaint, no thumbnail preview). 4 sections: Colours · Fonts ·
  Shape & space · Styles. ~8 named colour slots, aliases hidden. Autosave + ⌘Z. Everything inserts token-bound.
  Starters = whole themes, previewed. Tasks (a)–(f): 8/7–10/5–6/impossible/stuck/3-mechanisms → 3/3/3/0/2/⌘Z.
- **CMS** (04 §6): one field-creation path (every collection gets name + slug + display field). Clickable "Used by".
  Record sheet that saves once. One binding picker (current item in lists incl. images; "this page's record" on a
  template page; "which record?" elsewhere). Template page as a Pages page type. Symmetric deletes. Server-side checks.
- **Settings** (02): one site-settings surface; Save disabled while any field is invalid; server message names the field;
  shared Zod schema drives client and server; dashboard-only fields (slug, password, canonical, robots) get editor doors
  or move; one Integrations catalog.
- **Collaboration** (06 §1): Activity owns every event; History = versions only ("Session" → "Undo"); Bell = my inbox incl.
  review/comment events; Review panel owns send/re-send/withdraw; dashboard Sharing owns links, editor modal is its front door.
- **Shell** (07): one element menu; one door per action on screen; breakpoint visible in the foot bar; persistent
  labelled doors for Settings / History / Publish / Review; ⌘K covers share/invite/version/help.

## 6. Suggested order of work (not a plan — a proposal)

1. **P0 + today's regressions:** BRD-01 (popover layer), INS-01 (reproduce cleanly first), BRD-02 (starter wipe),
   BRD-03 (Brand beside canvas), BRD-05 (token-bound defaults, R1), INS-02 (scope to page), SET-09 (stop emitting auto-redirect), PGS-01, CMP-03.
2. **Data-integrity P1s:** CMS-01 (blank records), CMS-06 (collection delete guard), CMS-07 (duplicate slugs),
   SET-01/02/03 (save despite errors, refused values looping), SET-04/08/11 (no-rule fields that reach published output),
   SET-10 (slug rename moves the Vercel project).
3. **Contradicting status:** COL-01/02, SHL-08, SET-05, BRD-06, ADD-05.
4. **Structural simplification (needs owner decisions):** Inspector 2-tab model; Brand panel + 4 sections; one element
   menu; Components/Templates/Settings/History doors; one Settings surface; Activity as the single event owner.

## 7. Not verified (across all modules)

- Anything requiring **Publish** (never clicked; real Vercel connection) — published output effects are from code.
- **Non-OWNER roles**, non-agency workspace (reviews off), FREE plan locks, collab flag ON.
- **Figma v3 boards** were not opened (Figma MCP not authenticated in-session); "simple like Figma" compares against
  Figma's own panel model, not the boards.
- Shared scratch site: 7 auditors wrote to it concurrently; several save-conflict dialogs were harness noise and were
  excluded. INS-01 in particular must be reproduced on a clean site before acting.
