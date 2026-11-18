# Panel 01 — Global topbar: functionality specification (FD-PNL-01)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY (documentation; no code, Figma or deploy)
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (owner decisions §11, 2026-10-17; independent `design-qa-critic` review: pass 1 PROPOSAL with B1–B3, pass 2 passed, last 3 minor notes fixed). Runtime (G8) NOT RUN; geometry NOT MEASURED. Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S3, P2, N4, V4, V5, V6, V7; gap rows D2-4, D2-5, D2-6, D2-8, D2-28, D2-33, T1-01, T1-03, T5-09, T7-20; CS-01, CS-02, CS-07, CS-10, CS-11, CS-15, CS-19, CS-22; SC-11 noun "area" for editor destinations ("workspace" kept only for the organization) *(R-1018)*. Round 2: Q1, Q2 (owner-confirmed), Q4, Q6, Q15 *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA (do not reopen): BD-01, BD-02, BD-06, BD-07/10, BD-14 (**Site settings labelled in topbar — LOCKED**), IA-01 surface table, GEO-01 (topbar 56h; compact ≤1280), IAF-01/14/15/16/17/19/20.
Source of current behaviour: code inventory 2026-10-17 (files below) + `docs/editor-feature-inventory-2026-10-16.md` §2, §3, §6.

---

## 1. Purpose and boundary

The topbar answers three questions from anywhere in the editor: **Which site am I in? What is its delivery state? How do I leave, preview, review or publish it?**

Job: J2 Get approval · J3 Publish and maintain (review chip, Preview, Publish; 00-STRATEGY §3) *(R-1018)*
Visual: SC-27 (DESIGN_SYSTEM_SPECIFICATION §2–§4); sentences SC-28 *(R-1018)*

| Belongs in topbar | Does NOT belong (owner) |
|---|---|
| Exit to dashboard, site identity, **Site settings** (BD-14) | Page identity/switching → **bottom bar Pages** (BD-02) |
| Review state + comment mode entry, presence, notifications | Save/sync status → **bottom bar status** (BD-02, IA surface table) |
| Preview site, primary release action (Send for review / Publish) | Undo/Redo, breadcrumbs, breakpoint, zoom → **canvas toolbar** (BD-07/10) |
| ⋯ Site menu (site-level secondary actions, exits) | AI, Issues, History panels → **right task host** (entries elsewhere) · Help → **rail utility** |

Same topbar in every area (Editor, CMS, Assets, Brand, Site settings, Templates, Components, Compare/Time Travel) — BD-06. Area identity is shown in each area's **local header**, not by changing the topbar.

## 2. Current implementation (source-read; runtime NOT RUN)

Files: `src/editor/shell/AquibraStudio.tsx:678-718` (banner), `shell/StudioHeader.tsx` (container/logic), `chrome-ui/Topbar.tsx` (render), `shell/SiteMenu.tsx`, `shell/NotificationPanel.tsx`, `chrome-ui/SaveStatus.tsx`, `chrome-ui/Presence.tsx`, `shell/lifecycle.ts`, `shell/hooks/useEditorShortcuts.ts`.

Current order (`Topbar.tsx:209-383`): **Exit · Site › Page crumb · Save pill · Review chip · Comments · (spacer) · Presence · Bell · Preview · Primary CTA · ⋯**

| ID | Item | Current behaviour (evidence) |
|---|---|---|
| TB-01 | Exit | "‹ Exit" → dashboard via exit guard (dirty / offline-risky / stranded-queue dialogs; `beforeunload`). View mode (EDITOR+): "‹ Back to editing" (`StudioHeader.tsx:457-571, 793`) |
| TB-02 | Site crumb | Accent button; opens left panel **Pages** tab; "Untitled site" fallback; plain text in view mode. No rename (`Topbar.tsx:222-269`, `AquibraStudio.tsx:699`) |
| TB-03 | Page crumb | Active page name or workspace label ("CMS"); click closes drawer (`StudioHeader.tsx:260-280`) |
| TB-04 | Save pill | offline > saving > conflict > error > unsaved > saved. Click: saved/saving/unsaved → History; error → retry save; conflict → conflict dialog; offline → tooltip only. Hidden in view mode. ⌘S save, ⌘H History (`StudioHeader.tsx:631-661`, `SaveStatus.tsx`) |
| TB-05 | Review chip | Only when `reviewsEnabled` (server). Not sent / Review / Waiting · {name} / Changes requested · N / Approved / Approved · edited since → opens Review (`StudioHeader.tsx:164-190`) |
| TB-06 | Comments | Icon toggle, pressed state, `ui:comment-mode`; key C; only with reviews (`Topbar.tsx:282-286`) |
| TB-07 | Presence | `collab` flag only; ≤2 avatars + "+N"; pill N editing / Reconnecting… / Offline; no click (`Presence.tsx`) |
| TB-08 | Bell | Unread badge (99+); toggles the notification panel (`size="panel"`, ~360; NOT MEASURED); refetch on focus; panel states loading/error/empty; 5 rows; Mark all read; View all activity › (`NotificationPanel.tsx`) |
| TB-09 | Preview | 76×32 text button; spinner; ⌘P; in view mode only for VIEWER (`StudioHeader.tsx:399-414, 747`) |
| TB-10 | Primary CTA | Verb from `lifecycle.ts`: Send for review / Open feedback / Publish / Publish changes; hidden when live & unchanged; "✓ Published" 2s; disabled reasons (flag off, viewer, offline, conflict, save failed, review waiting/unchecked); publish → gate dialogs (`StudioHeader.tsx:726-835`) |
| TB-11 | ⋯ Site menu | 260px, three groups (§6). View-mode variant (`SiteMenu.tsx:125-262`) |
| TB-12 | Announcements | Live regions for save/publish outcomes (`StudioHeader.tsx:197, 777`) |
| — | Not present | Site settings as visible button (only menu row ⌃,), command-palette button (removed deliberately), Issues chip (removed, L4-038), live chip (removed), account menu, Help, AI |
| — | Compact behaviour | Only a container-query timestamp hide that never fires (always clickable pill). **No overflow/compact layout exists** |

Tests: `chrome-ui/__tests__/Topbar.test.tsx` (23), `shell/__tests__/StudioHeader*.test.tsx` (89), `SiteMenu.*.test.tsx` (14), `NotificationPanel.test.tsx` (8), `SaveStatus.test.tsx` (5), `Presence.test.tsx` (5); e2e `exit-guard.spec.ts`, `boot-clean.spec.ts`.

## 3. Problems this redesign solves

1. **Site settings hidden** in ⋯ menu (only ⌃,) — BD-14 requires a visible labelled entry.
2. **Site name doubles as a Pages door** (inventory 2.2: hard to discover); Pages now lives in the bottom bar (BD-02).
3. **Page crumb duplicates** bottom-bar page identity and canvas-toolbar ancestry; in areas it duplicates the local header.
4. **Save status in topbar conflicts with BD-02** (bottom bar = status) and shows one ambiguous "Saved" for page, record, Brand and settings operations (IA §Latest refinements 5).
5. **No compact layout** — at narrow widths items only truncate; GEO-01 requires a defined ≤1280 composition.
6. Several states have no visible home (Issues count, live status) — kept as owner questions (§11), not silently restored.

## 4. Target composition

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Exit │ Bella Cucina ● [settings] Site settings │ ● Changes requested · 2 ›  [comments] │  [avatars] 2 editing  [bell]3  Preview  [!] Issues · 2  [ Publish changes ]  ⋯ │
└────────────────────────────────────────────────────────────────────────────────────────────┘
  LEFT: leave + identity + site admin    REVIEW GROUP                 RIGHT: people · delivery · more
```
*(R-1018: D2-5 — the old "● Waiting · Sara ›" chip state does not exist in §5.4; CS-22 — Lucide icon names in brackets, no emoji; N4 — Issues chip shown only while blocking errors exist.)*

| Zone (order) | Items | Change vs today |
|---|---|---|
| Left | TB-01 Exit · **Site name** (identity) · **⚙ Site settings** (new visible button) | Site name stops opening Pages; page crumb removed; Site settings added |
| Review group | TB-05 Review chip · TB-06 Comments | Unchanged behaviour; stays only when reviews enabled |
| Right | TB-07 Presence · TB-08 Bell · TB-09 Preview · **Issues chip (§5.9a, only while blocking errors exist)** · TB-10 Primary CTA · TB-11 ⋯ | Unchanged order; Issues chip restored left of Publish *(R-1018, N4)* |
| Removed from topbar | TB-03 page crumb → bottom Pages + canvas breadcrumbs; TB-04 save pill → **bottom bar status** (full behaviour moves, §7.4) | Relocation, no capability loss |

## 5. Control contracts

### 5.1 Exit (TB-01) — Keep
- Type: text button, **32h** *(R-1018, CS-07 / DS §2.8 — was 28h)*, label "‹ Exit" (edit) / "‹ Back to editing" (owner in view mode). Accessible name same as label.
- Action: guarded navigation (existing three cases, Save and leave 3 s limit, `beforeunload`); dialog copy and buttons per SC-24 (one unsaved-changes dialog, S3) — see §7.1 *(R-1018)*.
- Shortcut: none (unchanged). Never disabled.

### 5.2 Site name (TB-02) — Redesign
- Type: **non-interactive identity text** (not a button), 14/500, max width 240 (1440) / 160 (≤1280) / 120 (≤1024), ellipsis with full name in `title` and accessible description. "Untitled site" fallback kept.
- Followed by the 8px **live-status dot** (Q-TB4, §11): Live / Not published / Changes not published, text in tooltip and accessible name, never colour-only.
- Rationale: one meaning per element; Pages has its own labelled bottom entry; rename stays in Site settings → General (its existing owner).
- Preservation: the old "site name → Pages" door is replaced by the bottom-bar **Pages** entry (Panel 11); command palette "Pages" row retained.

### 5.3 Site settings (new visible entry, BD-14 LOCKED)
- Type: secondary button, 32h, gear icon + label **"Site settings"**; never icon-only at any supported width (IAF-01 H).
- Action: opens Site settings area — **overview on first entry** (brief :863), then the last-visited group with the persistence scope Panel 10 ST-02 owns (per site) *(R-1018, D2-33 — this panel no longer states its own "for the session" scope)*. Topbar entry shows active state while that area is open; rail shows no active marker then (IA-01).
- Origin return: header back "‹ Back to Editor · {page}" from Editor, or "‹ Back to {area}" (e.g. "‹ Back to CMS") from another area (SC-1; direct navigation, no origin frame) restores page, selection, breakpoint and canvas view (IA §Exact return). Dirty settings use the SC unsaved-changes guard (S3: Keep editing · Discard changes · Save and leave) *(R-1018)*.
- **No keyboard shortcut** *(R-1018b, owner Q4 — ⌘, opens the browser's own settings)*: access is this button and ⌘K ("Site settings"); the ⋯ menu row stays as a plain row with **no shortcut hint**; ⌃, / Ctrl+, and the single key S are retired (SC-12).
- Permission: visible to all; inside the area each group follows its existing per-screen role checks (`SettingsTab.tsx:684-689`, IAF-14/20). **Viewers:** the button is shown **disabled with reason** "Site settings needs Editor access" — no viewer route (today viewers have none; IAF-20 K, SC-6). The earlier proposed viewer read-only route is withdrawn.

### 5.4 Review chip (TB-05) — Keep
- Pill **32h** *(R-1018, CS-07 / DS §2.8 — was 24h)*, status dot + label (max 140, ellipsis) + "›". Tone never colour-only (dot + text). **States:** Not sent · Review · Sent · Opened · Changes requested · N · Approved · Approved · edited since · Link expired (needs R-12); there is no revoked chip — a revoked latest round reads as no current review (Not sent / Review). *(amended 2026-10-17 — source: Panel 17 §4.4 / SC-10)*
- Click → right task host **Review** (NAV-02), origin preserved. Hidden entirely when `reviewsEnabled` false (unchanged).

### 5.5 Comments (TB-06) — Keep
- Icon toggle 32×32, `aria-pressed`, label "Comments"; key C. Turns canvas comment mode on/off; mode also visible on canvas (cursor + exit hint). Only with reviews. In non-Editor areas (**NEW** behaviour): **disabled with tooltip "Open the Editor to comment"** (comment pins need the canvas).

### 5.6 Presence (TB-07) — Keep (flagged)
- `collab` flag only. ≤2 avatars + "+N" (avatar = name in tooltip/accessible list), connection pill. Click (**NEW**): opens the **People** popover listing who is here and their page; no permission or lock implied (IAF-19). Presence joins automatically on open (no "Start collaboration" step). Never steals focus. *(amended 2026-10-17 — source: Panel 21 §5.1 / SC-10)* **Offline:** the pill shows Offline but makes no announcement of its own — Panel 22 owns the one polite offline announcement *(R-1018, CS-10 — was "announced assertively")*.

### 5.7 Notifications (TB-08) — Keep
- Icon 32×32, label "Notifications" / "Notifications, N unread"; badge 99+. Count fetch failure shows **"Status unavailable"** tooltip, not zero (IAF-19 I).
- Popover 360w (max viewport−24), anchored right; states and rows as today; row click marks read then navigates through the exit guard; footer "View all activity ›" → Activity task. Escape/outside click closes; focus returns to bell.

> **Amended 2026-10-17 by Panel 22 §5.11:** row click — rows about this site open their in-editor target (Review task, Publish task outcome, Site settings › Form submissions) with no navigation and no exit guard; rows elsewhere open in a new tab ↗; a failed mark-read leaves the row unread with "Couldn't mark as read — Retry"; deleted / forbidden / unavailable targets show their line. **One list grouped "This site" then "Other sites"** — no "All" scope tab; other-site rows open in a new tab (Panel 22 §5.11, owner decision N6) *(R-1018)*.

### 5.8 Preview (TB-09) — Keep + fix
- Text button 76×32 "Preview", spinner while building, ⌘P. Opens full-work-area Preview (IAF-15).
- **Target (brief IA-07/:809):** Preview opens the **last active Editor page at the editor's current breakpoint** (breakpoint is editor-wide, Panel 05 §5) — from Editor that is the current page/breakpoint (**fixes inventory 8.2**, which always opened Desktop); from CMS/Assets/Brand/Site settings/Templates/Components it is still the last Editor page, never the highlighted CMS record.
- **Render parity (SC-8, owner Q6)** *(R-1018b)*: Preview must render as published (fonts, colors) — SC-9 "Preview/canvas render parity". Until it ships the Preview bar carries a neutral info line (DS §3 info banner: grey + icon) **"Fonts and colors may differ slightly until published"**; it is removed when the SC-9 row ships.
- **Unsaved Site settings (owner-confirmed Q2)** *(R-1018b)*: Preview (and Publish, §5.9) pressed with unsaved Site settings edits shows SC-24 "Save settings first?" — Keep editing · Publish without these changes · Save and continue (Panel 10 §5).
- **Width (SC-8):** Preview uses the current frame width (incl. a saved custom width) and Desktop 1440 (was 1320 — parity with authoring/export); a template page previews the canvas Record-switcher record.
- **Return:** the Preview bar's back button names the origin — "‹ Back to Editor", "‹ Back to CMS", "‹ Back to Brand", etc. — and restores that area, its selection/scroll and focus.
- View mode: Viewer keeps Preview (unchanged).

### 5.9 Primary CTA (TB-10) — Keep
- Primary button 32h; label = lifecycle verb; one blue CTA rule. Disabled = `aria-disabled`, focusable, tooltip with reason (existing list, existing order). Busy = spinner + `aria-busy`. **Amended by Panel 14 §4.2 (2026-10-17):** while a publish runs the CTA reads "Publishing n/N…" with a progressbar ring (not only a spinner); after a failure it reads "Publish failed" until the outcome is opened. Success = "✓ Published" 2s then recompute. **Motion** *(R-1018, V5 / CS-19)*: label changes are instant; the progress ring animates only without `prefers-reduced-motion` — reduced motion shows the static "Publishing n/N…" text with the ring's value and no spin.
- Routing: review verbs → Review task; publish → **one review-and-publish dialog** (errors, approval and facts as sections — Panel 14 §4.3, amended 2026-10-17) → Publish task progress.
- **From another area** *(R-1018b, owner Q15)*: in CMS, Assets, Brand, Site settings, Templates or Components the CTA opens the **Publish task in that area's task tray, in place** (SC-7) — no switch to Editor, no return chip; closing it leaves the area as it was. Unsaved Site settings edits first get SC-24 "Save settings first?" (owner-confirmed Q2).
- Hidden when live and unchanged (unchanged). Viewer: shown disabled "Publishing needs Editor access" *(R-1018, CS-11 role-refusal pattern — was "Viewers can't publish — ask an editor")*.

### 5.9a Issues chip — Restore, conditional *(R-1018, N4 — supersedes Q-TB3 "no topbar chip")*
- Shown **only while blocking errors exist** (the errors that gate Publish — Panel 14 errors section); warnings and tips never show it. Hidden, not disabled, at zero.
- Position: immediately **left of the primary CTA**. Type: secondary chip-button **32h**, warning icon + text "Issues · {N}" (N = blocking errors), error tone never colour-only (icon + text). Accessible name "Issues: {N} blocking publish".
- Click → right task host **Issues** (origin preserved; SC-7 — the task stays open beside the canvas). The ⋯ "Issues · N" row stays as the always-present route.
- Same for every role that sees the CTA (no new role rule). Never folds into overflow while shown; ≤1024 it shows icon + count only, full text in tooltip and accessible name (§8).
- Appears/disappears without animation (no pulse — V5).

### 5.10 ⋯ Site menu (TB-11) — Keep, regroup
See §6. Trigger **32×32** *(R-1018, CS-07 / T7-20 / DS §2.8 — was 28×28)*, label "Site menu", `aria-haspopup="menu"`, arrow-key navigation, Escape returns focus. **Menu: 280w** (popover-md, V7 — was 260), items 32, `shadow-drag` (V4), clamps to viewport − 16, opens with the base 160 fade (reduced motion: instant) *(R-1018)*.

## 6. ⋯ Site menu contents (target)
> **Menu header *(R-1018, D3-5 — matches Panel 18 §5.1 and Panel 23 §4)*:** the ⋯ menu header has a single occupant, **"Search ⌘K"**. The **plan chip is the first row directly under the header** (32 tall, full menu width) — "Pro trial · {n} days left" during the trial, "Free · Upgrade" after it (owner), plan name otherwise — opening Billing ↗ (SC-20). *(Amended 2026-10-17 text "the ⋯ menu header shows the plan chip" superseded.)*

| Group | Row | Action | Condition | Change |
|---|---|---|---|---|
| This site | Site settings (no shortcut — Q4 *(R-1018b)*) | Site settings area | — | Keep (alternate route) |
| | Export site… | Export dialog (§14 annex) | — | Keep *(R-1018, T5-09)* |
| | Duplicate site | **Consequence confirm** (SC-15 class b, S2): "Duplicate {site}?" — body states that a new site is created in this workspace from a copy of this one (plus the Free site-limit line when SC-20 applies); buttons **Cancel** (default) · **Duplicate** → toast "Site duplicated · Open" | siteId | Keep + Fix *(R-1018, S2 / D2-8 / T1-03 — the confirm is now a listed SC-15 class (b) item, not an override)* |
| | Issues | Issues task (count in row label "Issues · 3", not only tooltip) | — | Fix label |
| | Activity log | Activity task | — | Keep |
| | Share preview link | Share dialog | siteId | Keep |
| | Copy live URL · View live site ↗ | clipboard / new tab | live | Keep (View live moved into this group) |
| | Enter view mode | guarded toggle | EDITOR+ | Keep |
| Collaborate | People on this site… (opens the People popover; presence joins automatically) / Planned | — | collab flag | Change *(amended 2026-10-17 — source: Panel 21 §5.1 / SC-10)* — the group now holds only this row *(R-1018, D2-4)* |
| Help & tools | Keyboard shortcuts ⌘/ · Getting started | existing | not view mode for Getting started | Keep (grouped) — the "Command palette ⌘K" row is replaced by the menu header entry **"Search ⌘K"** *(amended 2026-10-17 — source: Panel 18 §9 / SC-10)* |
| Leaves the editor | Site health ↗ · Invite teammates ↗ (ADMIN) · Account settings ↗ | dashboard tabs | as today | Keep |
| Site *(R-1018, D2-4 — new group, last; danger rows)* | Unpublish site… | Publish task **typed confirm** (SC-15 class c) | live + ADMIN | Move (was in Collaborate) |
| | Archive site | Same action as Site settings › Danger zone (Panel 10); **Undo only** (SC-15 class a): toast "{Site} archived · Undo" (≥8 s) | role as Danger zone (Panel 10) | Door to existing action *(R-1018, S2)* |
| | Delete site… | Same action as Danger zone / Permissions; **typed confirm** (SC-15 class c) that **states the 30-day restore**: "You can restore it from Recently deleted in the dashboard for 30 days." The "{site} deleted" screen repeats that line (today it omits it, INV 11.10) | owner (as today) | Door to existing action + Fix copy *(R-1018, S2)* |
| View mode | Exit view mode / "View only — ask an editor…" | — | view mode | Keep |

Invite teammates stays in "Leaves the editor" because it opens the dashboard. Rows always close the menu first (existing). Group order: This site · Collaborate · Help & tools · Leaves the editor · Site; the Site group is hidden in view mode and omits rows the role can't use *(R-1018)*.

## 7. Flows

### 7.1 Leave the editor
Exit → (clean) dashboard. Otherwise one dialog — SC-24 (one unsaved-changes dialog, S3) *(R-1018, CS-02 / D2-28 / T1-01; was Stay / Leave anyway / Save & leave)*: title **"Leave without saving?"**, buttons **Keep editing** (default) · **Discard changes** · **Save and leave**. The body keeps today's per-case sentence:
- Dirty, online → Keep editing · Discard changes, plus **Save and leave** when the dirty owner has an explicit Save (Site settings, CMS record, Page settings — SC-24). Unsaved *page* edits also get **Save and leave** on Exit (an explicit ⌘S flush, 3 s limit) — now ruled in SC-24 "Exit with unsaved page edits" *(R-1018)*; **owner-confirmed 2026-10-18 (Q1)** *(R-1018b)*. Brand: the dialog shows only while a Brand save is pending or failed (SC-24 Brand form, Q3) *(R-1018b)*. Save and leave failing within 3 s keeps the user in the editor with the save-failed banner (unchanged).
- Offline with unsaved changes → Keep editing · Discard changes (no Save and leave — saving is impossible offline; existing body "Saving isn't possible right now — leaving loses this work…").
- Changes only on this device (queued sync) → Keep editing · Discard changes; body keeps the existing "N changes haven't reached the server yet…" sentence.

### 7.2 Open Site settings from any area
Topbar Site settings → area (overview on first entry, then last group) → edit staged fields → Save in group footer → header back "‹ Back to Editor · {page}" from Editor, or "‹ Back to {area}" (e.g. "‹ Back to CMS") from another area (SC-1; direct navigation, no origin frame) restores the origin state. Leaving with staged edits → SC-24 (S3) with Save and leave (Site settings has an explicit Save) *(R-1018)*.

### 7.3 Preview → share
Preview (last Editor page at its breakpoint) → local bar Desktop/Tablet/Mobile, page select → Share preview → dialog link/Copy → Close returns to Preview → origin-named back ("‹ Back to Editor" / "‹ Back to CMS" …, SC-1) restores the invoking area and focus.

### 7.4 Save status relocation (consequence of BD-02)
Everything TB-04 did moves to **bottom bar status** (Panel 11): same click targets, priority reordered so failure/conflict win (Panel 11 §8); per-owner detail depends on the receipt registry (Panel 00 SC-9) (History / retry / conflict dialog / offline tooltip), plus per-operation detail (Page saved, Record saving, Brand applied locally, Upload failed) per IA refinement 5. ⌘S unchanged; History is **H** + bottom status "Versions ›" (⌘H removed) *(amended 2026-10-17 — source: Panel 18 §14 / SC-12)*. Topbar shows **no** save indicator; the save-failed canvas banner and exit guard still guarantee the user cannot miss a failure.

### 7.5 Publish
CTA "Publish changes" → **Panel 14 review-and-publish dialog** (sections: changes · tips · errors "Fix issues first ›" / tick to publish with errors · approval / stale override ADMIN · release facts) → Publish task progress → toast "Published — site is live" + View live; CTA shows "✓ Published" 2s. Failure → toast with Try again; CTA shows "Publish failed" until the outcome is opened, then returns to its verb (Panel 14 §4.2).

### 7.6 Review
Review chip → Review task (round status, threads) → Close returns origin. CTA "Send for review" uses the same task. Comments toggle enters canvas pin mode; Escape exits mode.

## 8. Geometry (proposed; NOT MEASURED)

Height 56 (grows with enlarged text, never overlaps). Padding 12, gap 12 between groups, 8 within a group. Tokens: `--bk-size-topbar` 56 (as-built), existing button/pill sizes.

| Item | Width rule |
|---|---|
| Exit | hug (~64), 32h *(R-1018)* |
| Site name | max 240 / 160 (≤1280) / 120 (≤1024), ellipsis |
| Site settings | hug (~118), label never hidden |
| Review chip | hug, 32h, label max 140 → ≤1280 max 100 *(R-1018: 32h)* |
| Comments, Bell | 32 |
| Presence | ≤2 avatars + pill (~110) |
| Preview | 76 |
| Issues chip (only while blocking errors) | hug (~90); ≤1024 icon + count (~48) *(R-1018, N4)* |
| CTA | hug (~96–150 by verb) |
| ⋯ | 32 *(R-1018 — was 28)* |

Budget at 1440 (estimate, *R-1018* with the Issues chip and 32 ⋯): left ≈ 64+240+118 = 422, review ≈ 180+32 = 212, right ≈ 110+32+76+90+150+32 = 490, gaps ≈ 110 → ≈1234 < 1440. **Compact (≤1280, GEO-01):** site name 160; review chip label 100; Presence + Bell fold into a labelled **"People & notifications"** overflow button (32, badge shows unread count) — Site settings, Preview and CTA stay visible. **≤1024:** site name 120; review chip shows dot + "Review" only (full state in tooltip/accessible name). No primary destination moves into ⋯ at any width (GEO-01).

**Reduction order when items still do not fit (any width, incl. 200% text):** (1) site name to 120 min with ellipsis; (2) review chip to dot only (state in tooltip/accessible name); (3) Comments joins the People & notifications overflow; (4) the right zone wraps to a second 56px row (topbar grows in height per GEO-01; canvas loses that height, never a control). **Never hidden or icon-only:** Exit, Site settings (label), Preview, primary CTA, ⋯. **Never hidden while it applies:** the Issues chip (icon + count is its minimum) *(R-1018, N4)*. Validate at 1024×768, 1280×720, 1440×900, 1440×600 and 200% text.

## 9. States, roles, flags

| Condition | Topbar result |
|---|---|
| Loading role (null) | Do not gate (existing); CTA computes after role resolves |
| VIEWER, view mode | Exit, Site name + live dot, Site settings **disabled with reason**, Review chip (read-only status; opens Review read-only) and Comments when reviews are on (viewers may create site comments, IAF-19), Bell, Preview, disabled CTA, ⋯ view-mode menu (Panel 00 SC-6) |
| EDITOR/DESIGNER | All except ADMIN rows |
| ADMIN/OWNER | + Unpublish, Invite teammates |
| Owner in own view mode | "‹ Back to editing"; CTA hidden |
| `reviewsEnabled` false | No review chip, no Comments, no C key |
| `collab` flag off | No presence; menu row "People on this site… — Planned" disabled *(amended 2026-10-17 — source: Panel 21 §5.1 / SC-10)* |
| `publish` flag off | CTA disabled "Publishing isn't switched on for this workspace yet" (planned feature, not removed) |
| Offline | CTA disabled with "Needs a connection" *(R-1018, CS-10 — was "Can't publish while offline")*; bottom status shows "Offline — will save when back online"; the one polite announcement is Panel 22's |
| Blocking publish errors exist | Issues chip "Issues · N" left of the CTA (§5.9a); hidden at zero *(R-1018, N4)* |
| Non-Editor area | Topbar identical; Comments disabled with reason (NEW); Preview opens the last Editor page and returns to this area (§5.8) |
| Live status loading / fetch failed | Live dot shows hollow neutral "Status unavailable" (tooltip + accessible name) — never grey "Not published" by default |
| Modal open | Topbar inert behind modal (one foreground modal, IAF-01) |

Keyboard: F6 reaches topbar first (NAV-04), then the global banner slot while a banner shows (SC-5); Tab order follows visual order; shortcuts unchanged (⌘P, ⌘K, ⌘/, C, ⌘S — ⌃, removed, Site settings has no shortcut, owner Q4 *(R-1018b)*) except History: **H** + "Versions ›" — ⌘H removed (SC-12). All popovers return focus to their trigger. *(amended 2026-10-17 — source: Panel 18 §14, Panel 22 / SC-5, SC-12)*

## 10. Preservation map

| Old | New | Disposition |
|---|---|---|
| TB-01 Exit + guards | Same | Keep |
| TB-02 Site name → Pages | Identity text; Pages via bottom bar + ⌘K | Redesign (door moved) |
| TB-03 Page crumb | Bottom bar page entry; canvas-toolbar ancestry; area local headers | Move |
| TB-04 Save pill (6 states, click targets) | Bottom bar status, same states/targets + per-operation detail | Move |
| — Site settings (menu only) | Visible topbar button + menu row + ⌘K; no shortcut (Q4 *(R-1018b)*) | Move (BD-14) |
| TB-05/06 Review chip, Comments | Same | Keep (Comments disabled outside Editor) |
| TB-07 Presence | Same + click opens the People popover (§5.6); ≤1280 in overflow | Keep *(R-1018, D2-6 — "optional" dropped)* |
| TB-08 Bell + panel | Same; ≤1280 in overflow; "Status unavailable" not 0 | Keep + Fix |
| TB-09 Preview | Same; opens current breakpoint | Keep + Fix |
| TB-10 CTA + gates + reasons | Same | Keep |
| TB-11 Menu rows (19) | §6; Issues count in label. Saved-version History stays on its command entry (H, ⌘K — ⌘H removed *(amended 2026-10-17 — source: Panel 18 §14 / SC-12)*) and bottom status details per IAF-01 — no menu row | Keep + Fix |
| TB-12 Live regions | Same (save announcements move with status) | Keep |
| Removed earlier: live chip (green dot + domain) | 8px live-status dot beside site name; domain in tooltip | Restore (reduced, Q-TB4) |
| Removed earlier: Issues chip | Restored left of Publish **only while blocking errors exist** (§5.9a) | Restore, conditional *(R-1018, N4 — replaces "stay removed")* |
| Removed earlier: ⌘K button | Stays removed (deliberate; "Search ⌘K" menu header) | Keep removed |
| TB-11 Unpublish site (Collaborate group) · Danger zone archive/delete | ⋯ "Site" group: Unpublish site… · Archive site · Delete site… (doors to the existing actions) | Move + door *(R-1018, D2-4, S2)* |
| Export "Soon" tiles (Vue, Next.js) | Removed until planned (§14) | Remove *(R-1018, P2)* |

No capability is removed (the Vue/Next.js "Soon" tiles never worked — P2).

## 11. Owner decisions (2026-10-17 — owner accepted all recommendations: "recmanded answers per kam karoo")

1. **Q-TB1 — Save status leaves the topbar → APPROVED.** One status home in the bottom bar (§7.4); failures stay unmissable via the save-failed banner and exit guard.
2. **Q-TB2 — Site name stops opening Pages → APPROVED.** Identity text only (§5.2); Pages via bottom bar + ⌘K.
3. **Q-TB3 — Issues count → KEEP AS-IS (L4-038).** No topbar chip; count in the ⋯ "Issues · N" row label, CTA "… anyway", and the Publish errors gate. **Superseded 2026-10-18 by N4** *(R-1018)*: an Issues chip sits left of Publish **only while blocking errors exist** (§5.9a); the ⋯ row and the Publish errors gate stay.
4. **Q-TB4 — Live status → APPROVED.** 8px status dot after the site name: green "Live" when published (tooltip "Live at {domain} · last published {time}", accessible name "Site is live"); grey "Not published" when never published; amber "Changes not published" when live with unpublished changes; hollow neutral **"Status unavailable"** while loading or after a fetch failure (`hasUnpublishedChanges` unknown). Not a button; the ⋯ menu keeps View live / Copy live URL.

## 12. Acceptance (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-TB-01 | Site settings visible and labelled at 1024/1280/1440 and 200% text; opens area; Back restores page/selection/breakpoint/zoom |
| T-TB-02 | Exit with dirty / offline / queued states shows the right dialog; Save & leave failure keeps user in editor |
| T-TB-03 | Viewer sees Preview + disabled CTA with reason, Review chip + Comments when reviews are on; no ADMIN rows; Site settings button disabled with reason "Site settings needs Editor access" |
| T-TB-04 | CTA verb and disabled reasons match `lifecycle.ts` for each state; gate order unchanged, shown as sections of one dialog (Panel 14 §4.3); Running "Publishing n/N…" and Failed states per Panel 14 §4.2 |
| T-TB-05 | ≤1280: People & notifications overflow shows unread badge; no primary destination inside ⋯ |
| T-TB-06 | From Editor on Tablet, Preview opens Tablet on the current page; from CMS with a record highlighted, Preview opens the last Editor page and "‹ Back to CMS" restores the record and focus |
| T-TB-07 | Save states visible in bottom status with identical click targets; topbar has none |
| T-TB-08 | Notification count failure shows "Status unavailable", not 0; the panel is one list grouped "This site" then "Other sites" with no scope tabs (N6) *(R-1018)* |
| T-TB-09 | Keyboard: F6 lands on topbar; every popover returns focus to trigger; shortcuts unchanged |
| T-TB-10 | Topbar identical in Editor, CMS, Assets, Brand, Site settings, Templates, Components, Compare; Comments disabled outside Editor with reason |
| T-TB-12 | Live dot shows Live / Not published / Changes not published correctly after publish, unpublish and an edit; "Status unavailable" while loading and on fetch failure; state readable without colour |
| T-TB-11 | Existing tests (Topbar, StudioHeader, SiteMenu, NotificationPanel, SaveStatus, Presence, exit-guard e2e) updated in the same change as the redesign, not deleted |
| T-TB-13 *(R-1018)* | Exit, review chip and ⋯ trigger measure ≥32 px tall (⋯ 32×32); ⋯ menu measures 280 wide |
| T-TB-14 *(R-1018, N4)* | With 2 blocking errors the chip "Issues · 2" sits immediately left of the CTA and opens the Issues task; with warnings only, or after the errors are fixed, no chip renders |
| T-TB-15 *(R-1018, S2, D2-4)* | ⋯ groups in order This site · Collaborate · Help & tools · Leaves the editor · Site; Duplicate site opens a consequence confirm with Cancel focused; Archive site shows an Undo toast with no dialog; Delete site and Unpublish site need typed confirms and the Delete dialog states the 30-day restore |
| T-TB-16 *(R-1018, S3)* | Every exit/guard dialog reads "Leave without saving?" with Keep editing focused; Save and leave only appears when saving is possible |
| T-TB-17 *(R-1018, T5-09)* | Export acceptance T-EX-01…07 (§14) |
| T-TB-18 *(R-1018b, Q15)* | In CMS with a record open, Publish opens the Publish task in the CMS tray; closing it leaves the same record open; no Editor switch, no return chip |
| T-TB-19 *(R-1018b, Q4, Q6)* | ⌃, / Ctrl+, and S do not open Site settings; ⌘K "Site settings" does. Until SC-9 render parity ships, the Preview bar shows "Fonts and colors may differ slightly until published" |

## 13. Not verified
Runtime behaviour, measured widths, screen-reader output, collab presence with real users, publish with real Vercel. Figma boards deferred by owner.

## 14. Export site — annex *(R-1018, T5-09 / FINAL §4 item 12; IAF-15)*

Job: J3 Publish and maintain. Owner of the export module (INV X1–X7) until a separate panel exists. Behaviour source: `ExportModal.tsx`, `ExportOptions.tsx`, `engine/export/ExportEngine.ts`, `useExportHandlers.ts` (source-read; runtime NOT RUN).

| Topic | Contract |
|---|---|
| Entries | ⋯ This site › **Export site…**; ⌘K row "Export site…" (Panel 18); existing chord ⌘⇧E (INV 13.12 — SC-12 row "Export site…") *(R-1018)*. No rail item, no Site settings door (removed earlier, INV X1) |
| Host and geometry | Modal dialog **720** default, **480** min, **960** max (DS dialog sizes; 720 token per T7-19 / DS §2.12); width = min(720, viewport − 32); height ≤ viewport − 64. Header 48 with title "Export site" (16/24/600) + ✕; body scrolls; footer 48 sticky with Cancel · **Export** (primary). Radius 12 (G13); modal elevation per DS §2.5 |
| Tabs (order) | **Preview · Code · Options** (existing X3). Tabs 32, arrow keys move between tabs (roving), Tab moves into the panel |
| Formats | Radio group: **HTML · ZIP · React** (all existing — X2/X6, IAF-15 K "keep current formats"). The **Vue and Next.js "Soon" tiles are removed** until planned (P2); no "Soon"/"Coming soon" label anywhere (CS-15) |
| Options | Existing options and defaults unchanged (CSS mode, minify, reset, meta/viewport, CMS content mode — IAF-15 H). Desktop width 1440 (SC-8 parity) |
| Code tab | Read-only code view (Geist Mono 12, tabular); Copy button 32, keyboard reachable; "Copied" announced once |
| States | **Loading** (preview building): skeleton in Preview tab, Export enabled once the document is read. **Preparing**: "Preparing your export…", Export button busy (`aria-busy`, width kept), Cancel stays. **Ready**: "Export ready — file downloaded" (only after the file is produced — never claim a download that failed, T-IAF15-5). **Failed**: "Export failed — {reason}" + **Try again**; options kept. **Load error** (server): "Couldn't load the export preview — Retry". **Offline**: Preview and Code work from the open document; **Export disabled with "Needs a connection"** (ZIP fetches asset files); announcement owned by Panel 22 |
| Roles | As today (no new role rule) |
| Plan-locked site (P23, SC-20) | **Export stays allowed** on a site locked over the Free limit — the row is enabled and the dialog is identical; no Upgrade prompt inside it. On Free, site and page custom code are omitted from the export (P23 TR-7); the Options tab shows one neutral info line "Custom code isn't included on the Free plan" only when the site has custom code |
| Motion | Dialog opens with the base 160 fade; state changes (Preparing → Ready/Failed) swap text without animation; spinner → under `prefers-reduced-motion` a static "Preparing…" label (no spin). **Output parity (BK-013):** exported CSS carries the same reduced-motion guard as the published runtime, so exported sites respect `prefers-reduced-motion` exactly like published ones |
| Keyboard / focus | Opens with focus on the first tab; Esc closes (SC-2 step 2); focus returns to the ⋯ trigger or the palette |
| Undo | N/A (export writes nothing to the site) |

| ID | Pass condition |
|---|---|
| T-EX-01 | ⋯ Export site…, ⌘K "Export site…" and ⌘⇧E open the same dialog at 720 wide; at a 600-wide viewport it shrinks to 568 without horizontal scroll |
| T-EX-02 | Formats show HTML, ZIP, React only; no Vue/Next.js tiles and no "Soon" text |
| T-EX-03 | A failed export shows "Export failed — …" + Try again and never "file downloaded" |
| T-EX-04 | Offline: Preview and Code work; Export is disabled with "Needs a connection" |
| T-EX-05 | On a site locked over the Free limit, Export site… is enabled and the ZIP downloads |
| T-EX-06 | With reduced motion on, no spinner rotates; the exported CSS contains the reduced-motion guard (BK-013) |
| T-EX-07 | Esc closes the dialog and focus returns to its trigger |

Not verified: runtime, measured geometry, React output compatibility (IAF-15 M).
