# Panel 06 — Inspector: delta to keep FD-INS-02/03 consistent (FD-PNL-06)

Date 2026-10-17 · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with 3 blocking, fixed; non-blocking applied). Runtime NOT RUN. Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S8, P1, P7, P11, C7, V4, V5, V6, V7; FINAL §4 items 3 (Forms password, pageId fallback), 4 (spam scope chip), 8 (row anatomy, Mixed visual, control pointers), 12 (Forms build rows + visitor states); gap rows D2-13, T4-1, T4-2, T4-7, T4-8, T6-4, T6-5, T6-8, T6-9, T6-10, T6-15, T6-24, T6-26, T6-27, T6-28 (partly), T7-14, T7-30 (pointer), CS-01, CS-04, CS-12, CS-22; F-FM-01/02/05/07/08/12/15/20, F-ST-S47. Round 2: Q7, Q13 *(R-1018b)*.
Base (still authoritative; review passed): PRODUCT-DESIGN-BRIEF.md **FD-INS-02 / FD-INS-03** and annexes `evidence/inspector-2026-10-16/` (preservation map, integration closure, specimen). This document is an **overlay**: where a row below conflicts with the base or its annexes, **this overlay wins**; everything else in the base is unchanged. Locked: four tabs (INS-D01), 300px fixed (INS-D07), header slots.
Sources of change: CMS-DYNAMIC-BINDING-DESIGN.md (FD-DYN-01), panels 01–05. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17).

---

## 1. Contradictions resolved (base text → overlay)

Job: J1 Build *(R-1018)*

| # | Base row | Overlay |
|---|---|---|
| A1 | M07-99 "Content → CMS binding → Collection / Field / Preview / Disconnect" | **Redesign.** Section retired. Binding = bind icon on each property's own row in its owning tab (Content; Behavior › Link; Style › Fill background image; Content › Advanced attributes for `data-*`), bound-row chip, Binding subview with origin-named back, read-only **Dynamic bindings** summary at the top of Content. "Disconnect" renamed **Unbind**. P-M07-99 → T-DYN-03/11 |
| A2 | M07-100 "Defer … optional future CMS visibility condition" | **Move → Content › Conditions** (FD-DYN-01 §12, D3, D13). INS-D02 counts become **Keep 40 · Move 25 · Merge 2 · Redesign 17 · Fix 35 · Defer 3 · Restore 0** = 122 (M07-99 Move→Redesign; M07-100 Defer→Move). IP-G06 drops M07-100 from its deferral list |
| A3 | M07-111 "no invented filter/sort engine" | **Stays Move** (its existing source/limit row is unchanged and counted as before); filter, sort, skip, pagination are **new BD-20 scope outside the 122 rows**: Collection list group gains filter, sort (3 keys), skip, D10 pagination, empty block, status note "Drafts now show only on canvas" (FD-DYN-01 §11) |
| A4 | IC-07 "Future filter/sort/conditions are not assumed implemented" | **Extend IC-07:** source groups (this page's record / list item / specific record / Site / Page / Date / URL / Cookie), Format, If-empty fallback, D6 rich-text strip, several bindings per element, previewed record (§3 C1) |
| A5 | M07-28 "Click Bound → Content binding" | Header chip "N bindings" with Lucide `database` icon (no emoji — CS-22, T7-14 *(R-1018)*) → opens **Content › Dynamic bindings summary** (the index); each summary line opens its row in the owning tab. FD-DYN-01 §8.4 aligned |
| A6 | INS-D06 "require an explicit replacement/empty-value choice before disconnect" | The labelled button **"Unbind — leave empty"** (shown only when the shown value is empty) **is** the explicit choice; no extra confirm. "Unbind — keep '{value}'" otherwise |
| A7 | INS-D03 "Add follow-up … opens its exact tab/field" vs Panel 03 focus | After any Add insert: Inspector opens the tab per INS-D03 and **highlights** the relevant row (CMS-field inserts: the bound row in Content); **keyboard focus stays in Add** so repeated inserts work. Panel 03 §5 and FD-DYN-01 §9 aligned |
| A8 | M07-43 "common ancestor breadcrumbs" vs canvas toolbar "3 elements" | Both use **common-ancestor path + "· N elements"** (Panel 05 aligned) |
| A10 | M07-27 "Content → CMS binding; header → Bound status link" / P-M07-27 "Header Bound focuses existing binding" | **Keep, retargeted:** destination = property-row bindings (A1) + header chip → Content › Dynamic bindings summary (A5); P-M07-27 rewritten = T-ID-01 |
| A9 | INS-D03 Locked "Permitted inspection" vs canvas "locked → not selected" | Canvas click on a locked element still refuses selection (Panel 05 CV-08, unchanged); **inspection of a locked element is via its Layers row** (Panel 04 LY-14 does not refuse selection, and its footer shows "2 selected (1 locked)") — the guaranteed path; a canvas breadcrumb also works when a descendant is selected; Inspector shows existing locked state (inspection allowed, mutations blocked) |

**Global rename:** "Disconnect" → **Unbind** everywhere in the base and annexes (IC-07, M07-99 text, P-M07-99).
**Global rename *(R-1018 — T6-8, SC-11 US English)*:** tab label "Behaviour" → **Behavior** everywhere in the base, annexes and this overlay (SC-11 lists no exception for it); section label "Colour" → **Color**.

## 2. Required additions

| # | Where | Addition |
|---|---|---|
| B1 | INS-D01 header | Binding count chip lives in the **existing status-marks slot** (M07-28); list-child context "Inside list of Blog · Edit list ›" lives in the **existing property-scope row**. No new header row |
| B2 | M07-98 Link (Behavior) | Bind icon on URL / Open in new tab / Link to; destination "**This record's page**"; D4 disabled state + **Create collection page** modal returning focus to the Link row; "Not a valid URL" warning chip for text-field bindings |
| B3 | M07-56, M07-86, M07-106, BIC media/embed rows | Bind icons: image alt/title (P1); video/audio source, poster, embed URL (P4); Style › Fill background image (P4); `data-*` in Content › Advanced attributes (P4). Image inserted from Add → CMS fields auto-binds alt to the title field |
| B4 | M07-101 Visibility (Behavior) | Device visibility only; note "Data conditions: Content › Conditions — both must pass"; reachable from Layers "Hide on live site… →" (Panel 04 §6); Layers M/T/D markers read these flags |
| B5 | INS-D07 geometry | Bind icon 24×24 own trailing slot left of reset (input −28 or wraps); bound row 48h; **source picker 280w opens left of the Inspector over the canvas**, also when the Inspector is an overlay at ≤1366 (picker sits left of the 312 overlay; flips/clamps within the canvas column; T-DYN-19) |
| B6 | INS-D06 pickers, M07-56 | Image **Replace…** and **Style › Fill › Image** both open Panel 02's **temporary left Asset picker** (284w, replaces Add/Layers; header per Panel 08 §4.3; rail click cancels). Label "Replace…" everywhere |
| B7 | INS-D04 / INS-D11 Escape | Cross-ref Panel 05 resize contract: Esc cancels only the gesture, keyboard resize commits one step, never `history.undo()` |
| B8 | INS-D09 legacy | Legacy conditions shown "Not active — from old Conditions" with Activate / Keep inactive; never rewritten on read (FD-DYN-01 §12.4) |
| B9 | INS-D10 acceptance | Add T-DYN-03/05/11/12/13/15/16/17/19, T-LY-01/05, T-LR-11/12, T-CV-02/03/08; *(R-1018)* T-CV-16, T-ID-09…T-ID-16 |
| B10 *(R-1018 — D2-13, T6-4, T6-5, CS-04)* | SC-13 → Inspector mapping (three levels, M07-39 model) | **Context:** the existing property-scope row names the write layer ("Editing Tablet · Desktop stays the same") — one summary, never repeated per field. **Section:** header count "2 overrides on Tablet" (12/16/600 sentence case) when the section has overrides at the current layer. **Field:** blue **override dot** left of the label; hover/focus tooltip names the source ("Set on Tablet" / "Inherited from Desktop: 24 px"). **Per-property action** in the field's ⋯ / dot menu: label names the layer being removed — **"Remove Tablet override"** — and its tooltip names the value it falls back to ("Falls back to Desktop: 24 px"); one Undo step, no confirm. **First edit on Tablet/Mobile:** one-time inline note "Changes here apply to Tablet and Mobile. Desktop stays the same." Structure edits from the Inspector (delete, group, wrap) toast "… · applies to all breakpoints · Undo" when not on Desktop. SC-13's wording "Reset to {parent breakpoint}" is replaced by this label per CS-04 (SC-13 text owned by Panel 00) |
| B11 *(R-1018 — owner decision C7)* | Component instance overrides at Tablet / Mobile / hover | Editing an instance property at Tablet, Mobile or a state (hover, focus, active) is recorded as an **instance override** at that layer; the main component is untouched. Resolution order: main (Desktop → Tablet → Mobile, state layers) → instance overrides, cascading per SC-13. The field shows the same **override dot** plus layer label ("Tablet · hover"); "Remove Tablet override" removes only that layer's instance override and falls back to the main's value. The instance header shows "N overrides" (all layers) |
| B12 *(R-1018 — T6-26, DS §2.9)* | Mixed values (multi-select, SC-17) | Text/numeric fields show the placeholder **"Mixed"** in ink-muted italic (empty value, not amber); checkboxes and toggles show **indeterminate**; colour swatches show a **diagonal split** of two of the values; selects show "Mixed" as the placeholder option. Typing or picking writes the value to every selected element as **one Undo step**; Esc on an untouched Mixed field changes nothing. Mixed is readable without colour (text + shape) |
| B13 *(R-1018 — owner decision P7, T6-15)* | Beginner / Pro | **Pro everywhere; the Beginner path is removed.** The Inspector ignores any persisted Beginner flag and always renders the full (Pro) body; no mode control is shown. Nothing the user authored changes |
| B14 *(R-1018 — owner decision S2, CS-01, T6-28)* | Inspector confirms per SC-15 classes | **(a) Undo only:** Detach instance (toast "{Name} detached · Undo"), Update main from selection, element delete from the header ⋯ (SC-3). **(b) Consequence confirm** (states the consequence; default = Cancel): column reduction that **removes** contents ("Remove contents of column 3? 4 elements will be deleted." — "Move contents to the last column" stays the preserving choice with no dialog); component **Reset** that drops overrides ("Reset {Name}? 5 overrides will be removed."). **Inline warning, no dialog:** duplicate names. Form field type conversion (INS-D05) is classified by **BD-29, owner2026-10-19**: lossless = direct apply + Undo; removal of existing data/options = consequence confirm, default Cancel. INS-D05 / INV 1640 "each with a confirm" text is overridden by this row |
| B15 *(R-1018 — T6-9, T6-10, T6-27, FINAL §4 item 8; DS §4)* | Inspector row anatomy (INS-D07 gains it; BATCH-01A 96/8/164 numbers retired) | Field row **32** high; **label column 88**, gap 8, control fills the rest of the 300 column minus 12 + 12 section padding; the label **stacks above** the control when the control needs more than two inputs (box model, gradient, shadow) or its label would truncate. Section header 32; "Name +" empty row 32; More settings row 32. **Box-model spacing spots stay 16 px tall — recorded WCAG 2.5.8 exception** (each spot also editable through its numeric field). Numeric + unit, colour picker (280 popover), box-model and alignment (3×3, 28 cells) controls use the DS §4 component rows; they are **Gap — design first** before Inspector visual design (T7-30) |
| B16 *(R-1018 — owner decision P1)* | Existing e-commerce product blocks | Render as today; their text and images are editable through the normal Content rows; commerce-specific controls are absent and the body shows one neutral note "Commerce editing is planned" (no Upgrade, no link) |
| B17 *(R-1018 — owner decision P11)* | Content › Conditions and Collection list filters | The "contains any of" operator is **hidden** this version (multi-reference fields are deferred) |
| B18 *(R-1018 — V4–V7, DS §2.3/§2.10)* | Visual | Section headers 12/16/600 sentence case (V6); popovers 240/280/360 only — source picker 280 (B5) and colour picker 280 comply (V7); menus/popovers `shadow-drag` (V4); motion 100/160 only, section expand 160, no pulse, reduced motion → instant (V5) |

## 3. Gaps now defined

| # | Gap | Contract |
|---|---|---|
| C1 | Previewed record | Bound-row chips and the Binding subview "Preview" show the **canvas toolbar's previewed record** (FD-DYN-01 §13); Show drafts follows D5; a pinned "specific record" binding ignores the switcher |
| C2 | Tab switch while Binding subview open | Subview changes commit on change (no draft), so switching tab simply closes the subview; returning to that tab reopens the parent row (not the subview) with focus on the chip |
| C3 | Return from CMS "‹ Back to Heading" | Restores tab, section, scroll **and** the open Binding subview if it was open, focus on its Source control |
| C4 | Viewer role | Viewers keep the **existing viewer Inspector body** (INS-D03 "Role denied"); FD-DYN-01 §14's "read-only chips" applies only where that body already shows the property. No extra data exposed. FD-DYN-01 §14 aligned |
| C5 | Page appearance on a collection page | Page context shows "This page is the collection page for **Blog**" + **Open Dynamic pages ›** (CMS → collection → Dynamic pages, origin return); SEO/og:image patterns are edited there, not in Page settings (no second writer) |
| C6 | Escape with focus in Inspector (outside a field) | Field: revert draft (existing) → open popover/picker: close (existing) → subview: back to parent → otherwise **return focus to the canvas** (selection kept; never clears selection from the Inspector) |
| C7 | Header actions registry | The shared element-action registry (already used by the header) includes **Show in Layers (⇧L)**, **Lock / Unlock**, **Save as component…** (entry points detailed in Panel 13) — same labels as canvas/Layers menus |
| C8 | Fill › Image picker | Same temporary left Asset picker as Replace… (B6) |
| C9 | Live values during canvas gestures | Size/Position fields update live during drag/resize/keyboard resize, showing the **current breakpoint layer** as source; values commit with the gesture (one Undo step); Esc restores both canvas and fields |
| C10 | Background-image binding home | Bound row and Binding subview live in **Style › Fill** ("‹ Back to Style"); the Content summary only lists and links it (FD-DYN-01 §8.1 aligned) |
| C11 *(R-1018b, owner Q7)* | Landing of "Bind to CMS field…" from the canvas context menu, selection toolbar More or Inspector ⋯ (SC-3) | Opens **Inspector › Content** for the selected element with the **field (source) picker already open** (B5 geometry: 280 w, left of the Inspector) on the element's primary content row (text for text types, Image source for images *(DS)*). Choosing a field binds that row (one Undo step, U-3); Esc closes the picker and leaves focus on the row's bind icon. Elements with no bindable Content row: the action is disabled with its reason (SC-3 disabled rows). |
| C12 *(R-1018b, owner Q13)* | Icon control (icon element, button icon) | Opens **the one icon picker** (SC-33) as a 360 popover — the same picker Assets › Icons manages (Panel 08); no Inspector-only icon list. |

### 3.1 Forms — Behavior tab *(R-1018 — T4-1: Forms had no design owner; this overlay owns form building, Panel 10 owns the inbox)*
Sources: INV C1–C23, PDB INS-06 / INS-D05, REPORT M19–M21 form contract (historical, used for facts only), REMAINING-IA-HANDOFF FORM-01. Order inside Behavior per PDB:679: Link → Playback → **Form** → Visibility → Interactions. The stale "Native form transport stays in Submission → Advanced" (PDB:679) is withdrawn — no UI writes `formConfig` (INV C10, T4-15).

| # | Row | Contract |
|---|---|---|
| F1 | Fields list (form selected) | Rows "Name · Text · Required", drag + Move up/down to reorder, "+ Add field". **A row opens the field itself** (selects the child element and shows its own Inspector body) — the list and direct selection reach the **same canonical field controls**, so Type and Required have one writer (INS-D05; fixes INV C7/C8 double editing, F-FM-08) |
| F2 | Field types (Add field and the field's Type select) | Text, Email, Number, Textarea, Select, Checkbox, Radio, Switch, Slider, Date, Time, Color, Submit. **Password is not offered for new fields** (owner decision S8). Upload stays hidden until a real upload backend exists (INV C6) |
| F3 | Existing Password field (S8) | Keeps working (still renders and submits). Its Type shows "Password" and the field body shows a **warning banner** (warning tone, icon): **"Password values are stored and emailed as plain text"** with "Change type ›" (opens the Type select). Not dismissible while the type is Password |
| F4 | Label, placeholder, name (a11y — T4 Forms, F-FM-01/02/07) | **Label** edits a real visible `<label>` associated with the field (`for`/`id`); **Placeholder** is its own control (the as-built "Label" control that wrote `placeholder` is relabelled "Placeholder"); **Name** = the submission key, shown separately, unique within the form — a new field takes the next unused key, never reusing a deleted field's (`field-N` collision fix). New Form blocks and Contact Form insert with visible associated labels; existing unlabeled fields show an inline hint "No label — screen readers will announce the placeholder" with "Add label". Required fields are announced as required; error text is linked with `aria-describedby` |
| F5 | After submit (FORM-01) | Then: **Show message** (text) or **Redirect** (site page via the **same page picker as Link**, M07-98, or an absolute URL — T6-24). Saved by the forms service, outside document Undo, with the save states "Saving… · Saved · Couldn't save — Retry" (CS-12) |
| F6 | Send to (notification email) | ADMIN only (existing); others see the role refusal "Changing Send to needs Admin access" |
| F7 | **Spam protection** and the **success message** — scope chip *(T4-2, F-FM-12)* | Chip **"Applies on next publish"** beside the section title (replaces "Saved to your site straight away" — the honeypot and message reach the live site only after a republish) |
| F8 | Before first publish *(F-ST-S47)* | When the site (or this form) has never been published, the Form section shows a neutral note: "This form starts collecting submissions after you publish." Engineering dependency (SC-9 "Forms" (1)) *(R-1018)*: the server refuses submissions for a form that was never published, and a success redirect never targets an unpublished site |
| F9 | "Configure in Inspector ›" arrival *(T4-8, F-FM-20)* | From Site settings › Form submissions the Editor opens with the form selected and "‹ Back to Form submissions" (Panel 10 T-ST-07). **Fallback:** if the form is not on the open page — "{Form} isn't on this page" + **"Open page ›"** (opens the page that holds it and selects the form). Until `pageId` is persisted (SC-9 dependency, Panel 00) the editor finds the page by searching the site's pages for the form id; if none holds it: "This form is no longer on the site" + Back |
| F10 | Offline / viewer | Offline: service-saved rows (F5–F7) disabled "Needs a connection"; document rows (F1–F4) keep working. Viewer: existing viewer body (C4) |

**Visitor outcome states** (design-level copy for the published form; F-FM-15, F-FM-23) *(DS)*. Today every failure is a separate plain page and the visitor leaves the form; showing these **inline under the form** is NEW and needs the published runtime to handle the response (SC-9 "Forms" (2); until then today's separate plain result pages) *(R-1018)*. Copy is the site's default; the success message is editable (F5).

| Outcome | Shown to the visitor |
|---|---|
| Success | The form is replaced by the success message (or the redirect runs) |
| Validation error | Inline under each field, linked to it: "Enter {label}" (required) · "Enter a valid email address" · "Enter a number"; focus moves to the first invalid field |
| Network failure | Under the form: "Couldn't send — check your connection and try again." Typed values are kept |
| Spam-blocked (honeypot) | Same as success (never tells a bot it was caught) |
| Rate-limited (10 per minute) | "Too many attempts — please wait a minute and try again." Values kept |
| Plan cap reached | "This form isn't accepting submissions right now." (the owner-side notice is Panel 23's) |

## 4. Locked-decision check

| # | Issue | Resolution |
|---|---|---|
| D1 | Two ancestry controls: Inspector header breadcrumb (INS-D01) + canvas toolbar breadcrumbs (BD-10) | *(DS, standing instruction — owner may veto)* **Keep both, different jobs:** canvas toolbar = navigate ancestry (full path, clickable); Inspector header = **target identity** — it keeps its breadcrumb slot in a **compact form "… › parent › element"** (e.g. "… › Content › Heading"); "…" opens the **full-path menu** (preserves M07-22 / P-M07-22 overflow); multi-select shows "… › {common ancestor} · N elements"; long names ellipsize in the middle with the full name as title. No INS-D01 slot is removed |
| D2 | New header content | In existing slots only (B1) — complies |
| D3 | Four tabs | No fifth tab (FD-DYN-01 §6) — complies |
| D4 | 300px fixed | Picker floats over canvas; Asset picker uses the left slot — complies |

## 5. Edits made alongside this overlay
- FD-DYN-01 §8.1 (background image home), §8.4 (chip → summary), §9 (focus stays in Add), §14 (viewer rule) aligned.
- Panel 03 §5 "After" aligned to A7. Panel 05 multi-select breadcrumb aligned to A8.
- Brief FD-INS-02 package list gains a pointer to this overlay.

## 6. Acceptance added (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-ID-01 | Header chip "2 bindings" (database icon) opens the Content summary; summary line "Link URL" opens Behavior › Link with the chip focused |
| T-ID-02 | Collection page with Record switcher on Post 3 → bound chips show Post 3 values |
| T-ID-03 | Open Binding subview, switch to Style, back to Content → parent row with chip focused |
| T-ID-04 | From CMS "‹ Back to Heading" with subview previously open → subview restored |
| T-ID-05 | Viewer sees the existing viewer body; no binding editor exposed |
| T-ID-06 | Collection page context shows "Open Dynamic pages ›" and returns to page appearance |
| T-ID-07 | Esc with focus on an Inspector section header returns focus to canvas; selection unchanged |
| T-ID-08 | During keyboard resize, the Inspector's Width **field** updates live; Esc restores both |
| T-ID-09 *(R-1018 — B10)* | On Tablet set Padding 24 → field shows the override dot, section header "1 override on Tablet", tooltip "Set on Tablet"; "Remove Tablet override" restores the Desktop value in one Undo step; Desktop never changed |
| T-ID-10 *(R-1018 — B11, C7)* | Instance on Mobile, hover colour changed → main component unchanged; instance field shows dot + "Mobile · hover"; removing the override shows the main's value |
| T-ID-11 *(R-1018 — B12)* | Two headings with 24 and 32 font size → field shows "Mixed" in ink-muted italic; typing 28 sets both in one Undo step; two different colours show a split swatch; mixed checkbox is indeterminate |
| T-ID-12 *(R-1018 — B13)* | With a persisted Beginner flag the Inspector renders the full body; no mode control exists |
| T-ID-13 *(R-1018 — B14)* | Reduce a 3-column layout whose third column holds 4 elements and choose Remove contents → consequence dialog, default Cancel; Detach instance → no dialog, toast with Undo |
| T-ID-14 *(R-1018 — F2, F3)* | Add field / Type select offer no Password; a form that already has a Password field still submits and shows "Password values are stored and emailed as plain text" |
| T-ID-15 *(R-1018 — F4, F7)* | Field "Label" edit changes the visible associated label, not the placeholder; Spam protection shows "Applies on next publish"; deleting field 2 then adding a field never reuses its submission key |
| T-ID-16 *(R-1018 — F9)* | From Form submissions, "Configure in Inspector ›" for a form on another page shows "{Form} isn't on this page · Open page ›" and Open page selects the form |
| T-ID-17 *(R-1018b — Q7)* | Canvas right-click › Bind to CMS field… on a heading → Inspector › Content opens with the field picker open on the text row; choosing a field binds it; ⌘Z unbinds |
| T-ID-18 *(R-1018b — Q13)* | Inspector icon control and Assets › Icons open the same picker (same search, same selection) |

## 7. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime; annex JSON rows are superseded by this overlay but not rewritten (implementation must read both). 2026-10-18 amendments *(R-1018)* not independently reviewed. **Not applied** (need a choice nobody made): T4-13 per-form filter in the inbox (Panel 10); F-EN-A1.2 "type refined on load/paste" line (correct behaviour unknown); T6-6 "Apply style to all / Reset style" SC-3 rows and T6-25 ⌘\ (Panel 00); P6 classes selector and P4 variant authoring have no row in this overlay to change.


**2026-10-19 conversion decision (BD-29):** user confirmed “Haan, sirf data-loss par confirmation.” Lossless changes need no confirmation and create one Undo step. For data/options loss, show exact consequence and default Cancel. Preserve supported identity/references; unsupported safe conversion remains refused. Written classification settled; Figma conversion states and runtime validation retain separate evidence.
