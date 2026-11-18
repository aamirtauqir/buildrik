# Panel 16 — First run in the editor: functionality specification (FD-PNL-16)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED.** Independent `design-qa-critic` review: pass 1 PROPOSAL with 7 blocking (B1–B7) + 11 notes; pass 2 PROPOSAL with 2 blocking (NEW-1, NEW-2) + 3 notes — all fixed 2026-10-17 (amended docs edited in the same change: Panel 05 §8 + CV-18, IAF-21 H note, SC-11). Runtime NOT RUN; geometry NOT MEASURED. Written from a code inventory (file:line below) for the product-design review gap X06. *(DS)* = designer-selected under owner instruction 2026-10-17 "han yeha bhee likh do". Panel 00 (incl. SC-11…SC-19) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): V5, R1; gap rows D3-3, T1-14, T2-25, T3-25, T1-15, D3-11, D3-19; CS-08, CS-09, CS-19, CS-14 (US spelling).

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: **IAF-21** (`evidence/ia-final-2026-10-16/module-specifications.md:1127-1181`), **00-STRATEGY §5–6** (activation = first canvas edit within 2 minutes, Preview in the first session; one path, not competing actions), Panel 05 §8 (empty canvas), Panel 02 (Help popover, RailCoach), Panel 15 (Templates).
Paths: `E/` = `packages/editor/src/`, `D/` = `packages/dashboard/`, others from repo root.

---

## 1. Purpose and boundary
Job: J1 Build — activation (first edit, first Preview) (00-STRATEGY §3, §5–6) *(R-1018)*

First run answers: **"What do I do first, and how do I see a result fast?"** — from the moment a new site opens in the editor to the first canvas edit, first Preview and (later) first publish.
- In: empty-canvas prompt, RailCoach, the **Getting started** checklist (one name everywhere — SC-11; was "Get started") and its achievement message, empty states of editor panels on a new site, Help entry, first-run events.
- Out: the dashboard wizard (`D/app/onboarding/*`) and dashboard checklist — listed only where they decide what the editor receives (§2 FR-01…04, §9).
- Learning progress is **not** launch readiness (IAF-21 A): checklist state never gates Publish.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
| ID | Area | Today |
|---|---|---|
| FR-01 | What the editor receives | Blank: one empty Home, no brand (`sites.service.ts:256-283`); Template: template pages; AI: N pages of `type:"container"` + `tagName:"section"` raw HTML, **no brand written** even though the wizard asked brand questions (`app/api/workers/ai-generate/[jobId]/route.ts:66-84,210-220`; `lib/onboarding/ai-input.ts:41-53`) |
| FR-02 | Wizard answers thrown away | Blank "Starting page" / "Layout starter" ignored (`D/app/onboarding/blank/page.tsx:52-54`; fields at `:106,112`) |
| FR-03 | Paths into the editor | wizard Ready → Open Editor; AI preview → Open in Editor; Skip setup → "My Site" blank (`use-onboarding-complete.ts:91-99`); dashboard /sites/new |
| FR-04 | Editor route | `/edit/:id`; viewer forced read-only (`/edit/[siteId]/page.tsx:58-68`) |
| FR-05 | Empty canvas prompt | "This page is empty" + 3 template cards (first 3 of `SITE_TEMPLATES`) + Browse all templates (primary) + Add a block + ✦ Describe your site + Start blank = **7 targets, 4 actions** (`CanvasEmptyCTA.tsx:64-131`); cards open the plain catalogue; `startedBlank` not persisted → prompt returns after reload (`Canvas.tsx:535`) |
| FR-06 | RailCoach | "Everything you build lives behind these six." … "Got it" (`RailCoach.tsx:82-97`); shown when 0 steps done and not dismissed; key `buildrick-onboarding-coach-dismissed` |
| FR-07 | Checklist | 7 steps (`onboardingSteps.ts:39-108`): Set your brand · Add your first page · Add a block · Connect first client · Send for review · Preview your site · Publish; minimized pill "N/7"; selecting an element minimizes it |
| FR-08 | Completion | outcome events (`OnboardingMount.tsx:53-152`); **Preview completes when its own button is pressed and also on closing preview** (`:63,230-231`; `AquibraStudio.tsx:284-287`) |
| FR-09 | Seeding | on load, steps seeded from site content (pages > 1, any `type==="section"`, review rounds) — each seed calls `completeStep`, which **opens the achievement popup** (`:154-193`; `useOnboardingOrchestrator.ts:283`); AI sections never match (`type:"container"`) |
| FR-10 | Achievement | modal dialog with backdrop + **focus trap**, auto-close 4 s (`AchievementPrompt.tsx`; `useOnboardingOrchestrator.ts:28,285-289`) |
| FR-11 | Dismiss / replay | ✕ → "Hide this?" Yes/No → `skipAll` **local only**; replay from Site menu ⋯ "Getting started" resets local; server union re-adds old ticks (`:208-227,303-327`) |
| FR-12 | Storage scope | localStorage keys global to the browser; server `editorTasks` per user (`onboarding.service.ts:137-148`) → a second account in the same browser inherits progress |
| FR-13 | Template apply | ends onboarding for good (`templatesStorage.ts:14-19`; Panel 15 TP-15) |
| FR-14 | Add tips | one tip per Add session after 800 ms, 4 total (`FirstUseTip.tsx`) |
| FR-15 | Help | rail Help → small keyboard legend; `?` → full sheet; Site menu "Keyboard shortcuts ⌘/" and "Getting started"; **no Learn/docs entry** |
| FR-16 | Empty states | Layers "No layers yet…", CMS explanation + Create a collection, Assets "No images or files yet." + Browse stock, Components "No components yet…" (see inventory) |
| FR-17 | Telemetry | **no first-edit / first-preview / first-publish events**; only an `editor.cold_load_ms` console line (`D/components/editor-route/EditorClient.tsx:22`) |
| FR-18 | Two checklists | dashboard 8 click-ticked tasks vs editor 7 outcome steps, unconnected |

## 3. Problems this design solves (00-STRATEGY activation)
1. The empty canvas offers 4 actions through 7 targets; none is clearly first, and the template cards don't open the template they name (FR-05).
2. False credit and interruptions: Preview counts without opening, seeded steps pop modal "Step complete" over the canvas, focus is stolen (FR-08/09/10).
3. Progress leaks across accounts; skip doesn't stick; replay is undone by the server (FR-11/12).
4. Answers the user gave (AI brand, blank layout) are dropped, so "Set your brand" is asked again (FR-01/02).
5. RailCoach describes six rail items; the rail has five (Panel 02).
6. Nothing measures activation (FR-17).

## 4. Target

### 4.1 Empty canvas prompt (amends Panel 05 §8 "unchanged" — 00-STRATEGY wins)
```
                      This page is empty
         Start from a template — edit anything after.
  ┌────────┐  ┌────────┐  ┌────────┐
  │ thumb  │  │ thumb  │  │ thumb  │      Browse all templates ›
  │SaaS    │  │Portfol.│  │Agency  │
  └────────┘  └────────┘  └────────┘
        or  [ + Add a section ]   [ ✦ Describe a section ]   ·  Start blank
```
(✦ Describe a section is **hidden in this version**, SC-21.)
- **One primary path** *(DS)*: the three template cards are the primary action; each opens **that template's preview** in Replacing mode for this page (Panel 15 §5.1, Fix FR-05). "Browse all templates ›" opens the catalogue.
- Secondary row: **+ Add a section** (opens Add › Sections, Panel 03) and **✦ Describe a section** (renamed from "Describe your site" — it generates one section, `Canvas.tsx:834-840`). **Hidden in this version (SC-21)** — the row is then "+ Add a section · Start blank". When AI returns (Panel 20): shown; until AI-D2 ships, pressing it while AI isn't configured shows Generate's error state with the copy "AI isn't set up on this server yet"; after AI-D2 it is **disabled with that reason** (Panel 20 §4.7 class table). *(amended 2026-10-17 — source: Panel 20 §10.2 / SC-10, SC-21)*
- **Start blank** stays as a text link and still opens Add (existing, `Canvas.tsx:842-845`); its choice is **persisted per page per user** in the user-namespaced local store (F-2), so the prompt doesn't return after reload on that page for that user; another user still sees the prompt.
- Cards: the existing first three templates (`CanvasEmptyCTA.tsx:65`). (A wizard-based choice was considered; the catalogue has a single category today — Panel 15 §4 — so there is nothing to match on.)
- Read-only / viewer: no prompt (existing).
- Board **4428:44164** shows Browse all as primary; the new hierarchy needs that board updated (dependency F-5).
- **Short-height layout** *(R-1018, T2-25 — today the CTA clips at 1280×720, INV 4.1 UX-01)*: the prompt is centred in the visible canvas area and **never clips**. When the three cards in one row plus heading and secondary row don't fit the visible canvas height (e.g. 1280×720), the cards switch to a **row of 2** (the third wraps below) with "Browse all templates ›" under the cards, and the prompt container **scrolls inside the canvas** (max height = visible canvas − 32); heading and the first card row are visible without scrolling. At ≤1280 width the same 2-up layout applies. Measure at 1280×720 and 1440×900 (not measured yet).

### 4.2 RailCoach (Keep + Fix copy)
"Everything you build is in this rail — **Add**, Layers, Assets, CMS and Brand. Pages are in the bar at the bottom." · **Got it**. Shown once per account (§5.3; server flag — F-2 covers RailCoach as well as the checklist), anchored to the rail; never over the canvas centre; dismissed by Got it, Esc, or the first canvas edit.

### 4.3 Getting started checklist (Keep 7 steps and their IDs, IAF-21 E/H/K; reorder + rules)
**All 7 step IDs are unchanged** (`onboardingSteps.ts`); only labels and order move, so server-confirmed completions carry over. Order follows the core loop *(DS — activation first)*.
| # | ID | Label | Completes when (user outcome — IAF-21 H) | Eligible when / reason if not | Button |
|---|---|---|---|---|---|
| 1 | `insert-section` | **Add your first section** | a user-started registered **section block** insert via Add (click, drag or keyboard) commits; **Generate a section** (Add or empty-canvas "Describe a section") counts once its insert commits — **inactive in this version: step 1 counts only section inserts and template applies (SC-21)** *(amended 2026-10-17 — source: SC-21)*; **a user-started page-template apply** (Panel 15) counts *(amends IAF-21 H — template apply is a user action and the activation path)*. Not: primitive Elements, paste, duplicate, history restore, project load/bootstrap, seeding | can edit the page / "You can't edit this site" | Add a section |
| 2 | `preview` | **Preview your site** | Preview has actually rendered (not the button press, not closing — Fix FR-08) | role can edit the site (a read-only role is not onboarded) | Open preview |
| 3 | `set-brand` | Set your brand | `BRAND_APPLIED` | Brand available to the role / "Brand needs Editor access" | Open Brand |
| 4 | `add-page` | Add your first page | `page:created` by the user (pages > 1) | can add pages / SC-18 pattern on Free after the trial (SC-20) | Open Pages |
| 5 | `send-review` | Send for review | `REVIEW_SENT` | reviews on for the site / "Reviews are off for this site" | Open Review |
| 6 | `connect-client` | Connect first client | invite confirmed | agency layer on / step not shown | Open Review |
| 7 | `publish` | Publish | publish job succeeded (`SITE_PUBLISHED`) | publish flag on and role can publish / existing Publish reason | Open Publish |
- Ineligible steps stay **visible with their reason** and are **left out of the count** (IAF-21 G/I, T-IAF21-2), except Connect client, which is hidden when the agency layer is off. Pill shows "completed eligible / eligible" (e.g. "2/5").
- **Zero eligible steps** (e.g. a role that can't edit): the checklist and pill are not shown — no "0/0" and no celebration.
- Placement: pill 32h, bottom-left, 12 px above the bottom bar and 12 px right of the rail (moved from the rail foot above Help, INV 12.2 — recorded in §8) *(R-1018, T1-15)*; the pill is a persistent control, not a notice — no first-run message uses the Panel 22 banner slot (CS-08) *(R-1018)*; never over the rail, Inspector or an open right task. ≤1366: pill collapses to a 32×32 icon with the count badge; the expanded list opens upward, max 360 h (SC-19: never covers the selected element — the canvas scrolls).
- **Seeding (Fix FR-09):** steps already true for the site are ticked **silently** — no achievement message; RailCoach still shows if the user has not dismissed it (condition = not dismissed, not "0 steps done"). Section detection also matches `tagName:"section"` containers (AI sites).

### 4.4 Achievement message (Fix FR-10)
**A persistent-class toast inside the Panel 22 §5.10 stack** *(R-1018, D3-3 / T1-14 / CS-09 — replaces "in the checklist's corner, 6 s, own `role=status`")*: "✓ {step} — Next: {next step} ›" · ✕. Position = the Panel 22 stack (**bottom-right** of the canvas column, 16 above the toast floor); it counts as **one of the ≤ 2 persistent** toasts (beyond that, Panel 22's "+N more" row) and never displaces an Undo toast. It has **no live region of its own** — Panel 22's single polite region announces it. It stays until ✕, until "Next ›" is used, or until the next achievement replaces it (same key). No backdrop, **no focus move**; keyboard users reach it through the toast region (F6, SC-5), and "Next ›" is also on the pill. Several completions in one moment merge into one toast ("✓ 2 steps done — Next: …"). Queued behind safety/permission dialogs and confirmations (IAF-21 overlay priority). When the final eligible step completes: "You've finished Getting started" + Close — it says "your site is live" only when the step just completed is Publish.

### 4.4a One coach surface at a time *(R-1018, T3-25 — INV A32 / L1-029 tip stacking)*
Coach surfaces are **RailCoach**, the **Add first-use tips** (FR-14, Panel 03 §10) and any **automatic** opening of the checklist list. **At most one is visible at a time.** Priority: RailCoach › Add first-use tip › automatic checklist open. A lower one waits (queued, not dropped) until the visible one is dismissed, and none appears while a dialog, an open menu or a user-opened checklist is on screen. The achievement toast is not a coach surface (it lives in the toast stack, §4.4); the empty-canvas prompt is page content, not a coach.

### 4.5 Help (Panel 02 §5 Help popover — content defined)
Rail Help popover (240) exactly as Panel 02 §5: **Keyboard shortcuts** (`?` / ⌘/ → full sheet) and **Getting started** (show/replay checklist) — no Learn row (Panel 02: no new help content invented). The tooltip says "Help" (Fix FR-15 wording).

### 4.6 Empty states on a new site (Keep; copy aligned to SC-11)
Layers "No elements yet — add a section to start this page" + **Add a section**; Assets keeps Browse stock + **Upload**; Components keeps its sentence (no new link — no help content exists to point to); CMS unchanged. Pages never empty (Home always exists).

## 5. Flows

### 5.1 First open, template site
Editor opens on Home → content exists → no empty prompt → checklist seeds step 1 silently → RailCoach once → user edits text → (event `first_canvas_edit`) → checklist nudges step 2 "Preview your site" (pill highlights, no popup).

### 5.2 First open, blank site
Empty prompt (§4.1) → user picks a card → template preview → Replace page → back in Editor with content → step 1 ticks (toast) → first edit → Preview → step 2.

### 5.3 Dismiss, replay, scope (Fix FR-11/12)
- ✕ on the checklist hides it immediately — **no confirm** (SC-15) — with a toast "Getting started hidden · Undo · bring it back from Help"; stored as server `dismissedAt` per user (engineering **F-2**); local cache keyed by user id.
- Replay (Help › Getting started) shows the checklist with server history intact — completed steps stay completed (IAF-21: dismiss only defers; replay keeps history). "Start over" is not offered.
- All local keys are namespaced by user id; a second account in the same browser starts fresh (engineering **F-2**).

### 5.4 AI site arrives (dependency on the dashboard) — legacy AI sites only this version *(R-1018, D3-11)*
The wizard AI path is hidden this version (Panel 20 §0, SC-21), so this flow applies only to **AI sites created before** it was hidden. F-3 is **deferred with AI**. Until F-3: step 3 copy reads "Set your brand — your AI draft used default colors". When AI returns: the wizard's brand answers are written as Brand tokens when the AI site is created (engineering **F-3**); then step 3 seeds silently.

## 6. States and permissions
| State | Behaviour |
|---|---|
| Viewer / read-only | no prompt, no coach, no checklist (existing) |
| Importing / loading project | nothing counts (existing) |
| AI unavailable | This version: "Describe a section" not shown (SC-21). When AI returns: shown, error copy "AI isn't set up on this server yet"; disabled with that reason after AI-D2 *(amended 2026-10-17 — source: Panel 20 / SC-21)* |
| Onboarding server unreachable | local cache works; ticks queue **under the user's namespace** and send later; a queued tick shows as done locally with no separate "pending" mark *(DS — IAF-21 I's pending mirror is not shown because learning state is not critical)*; no error shown |
| Motion *(R-1018, V5 / CS-19)* | the Getting-started pill **never pulses** (pulse removed for everyone, not only under reduced motion); "nudges" (§5.1) are a static highlight. The achievement toast follows the Panel 22 toast motion (DS motion tokens 100/160/240 only); **reduced motion → it appears with no transition** |

## 7. Metrics (00-STRATEGY §6 — events defined here; engineering **F-1**)
| Event | Fires when | Props |
|---|---|---|
| `editor_opened` | editor mounted with a site | site creation method, `first_open` (bool) |
| `first_canvas_edit` | first committed document change **by any user on this site, once per site** (Panel 25 §4.2; not template apply, not load) *(R-1018, D3-19)* | ms since editor_opened |
| `template_applied` | Panel 15 apply success | mode create/replace, built-in template id or the literal `saved` |
| `preview_opened` | Preview actually rendered | from (topbar/checklist/key) |
| `publish_succeeded` | job success | first_publish (bool) |
| `checklist_dismissed` / `checklist_step_completed` | as named | step id |
Activation report = % of new sites with `first_canvas_edit` ≤ 2 min and `preview_opened` in session 1.
- **Definitions:** `first_open` = the server has no earlier `editor_opened` for this user + site (source: the event store, F-1). **Session 1** = from the first `editor_opened` until 30 minutes of inactivity or editor close.
- **Data contract (part of F-1):** **no free text** — no page names, saved-template names, emails or content; saved templates are sent as `saved`; no events in view-only sessions. Decided (SC-22, Panel 25 OD-A2…A4): HMAC pseudonymous ids, 13-month retention, per-user opt-out built before launch (⛔ A-4). (Panel 10 Analytics is the published site's visitor tracking, not this.)

## 8. Preservation map
| Today | Target | Disposition |
|---|---|---|
| FR-05 prompt: cards, Browse all, Add a block, Describe your site, Start blank | all kept; cards primary and open their preview; "Add a block" → "Add a section"; "Describe your site" → "Describe a section" (hidden in this version, SC-21; shown when AI returns); Start blank persisted and still opens Add | Keep + Fix + Change (hierarchy, labels) |
| FR-06 RailCoach | kept, copy fixed, shown by dismissal not by count | Keep + Fix |
| FR-07 7 steps | same 7 (Connect client only when eligible), reordered; step "Add a block" → "Add your first section" | Keep + Change |
| FR-08 outcome completion | kept; Preview fixed; template apply counts for step 1 | Fix |
| FR-10 modal achievement | persistent-class toast in the Panel 22 stack (bottom-right, no own live region) | Change *(R-1018)* |
| Getting-started chip at the rail foot above Help (INV 12.2) | pill bottom-left above the bottom bar (§4.3) | Move *(R-1018, T1-15)* |
| Pill pulse | removed (V5) | Remove (motion only; no capability) *(R-1018)* |
| Coach surfaces stacking (RailCoach, Add tips) | one at a time (§4.4a) | Fix *(R-1018)* |
| FR-11 skip / replay | server-persisted; replay keeps history | Fix |
| FR-14 Add tips | unchanged | Keep |
| FR-15 Help legend + sheet + Site menu entries | Help popover (Panel 02) + sheet; Site menu entries kept | Keep |
| FR-13 template apply ends onboarding | no longer (Panel 15 §5.6) | Fix |
No capability removed.

## 9. Engineering dependencies (add to SC-9)
| ID | Dependency | Fallback |
|---|---|---|
| F-1 (= ⛔ A-1 — blocks Panel 25 events only; Panel 16 ships on the F-1 fallback) | analytics event pipeline (none exists) | events logged to console in dev only; no activation report |
| F-2 | server `dismissedAt` and RailCoach-seen flag per user + user-namespaced local cache (incl. Start blank per page, offline tick queue) | local dismissal; progress may leak across accounts in one browser |
| F-5 | Figma board 4428:44164 updated for the new empty-canvas hierarchy | board stays stale; this panel wins until updated |
| F-3 | write wizard brand answers as Brand tokens on AI site creation (**deferred with AI**, SC-21 *(R-1018)*); honour blank "Starting page / Layout starter" (FR-02) | step 3 copy notes default colors; blank layout answer ignored (wizard should stop asking — dashboard follow-up) |
| F-6 *(R-1018, R1)* | **User validation before first-run Figma** (owner R1, 2026-10-18): 5 user interviews now; a 5-user prototype test with the first Figma pass of this panel | the first-run Figma pass is not accepted until the test has run |

## 10. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-FR-01 | Blank site: empty prompt shows 3 cards as primary, Add a section, Start blank; clicking "Portfolio" opens Portfolio's preview in Replacing mode |
| T-FR-02 | Start blank → reload → prompt does not return on that page |
| T-FR-03 | Pressing the checklist's Open preview button without Preview rendering does not tick step 2; closing Preview does not tick it |
| T-FR-04 | Template site first open: step 1 ticks with **no** popup; RailCoach shows once |
| T-FR-05 | Achievement toast never moves focus; typing on the canvas continues during it; it sits bottom-right in the Panel 22 stack, stays until ✕ / Next / replaced, and with 2 persistent toasts already open it shows as "+1 more" *(R-1018)* |
| T-FR-06 | Hide checklist → reload / another device → still hidden; Help › Getting started brings it back with ticks intact |
| T-FR-07 | Second account in the same browser sees a fresh checklist |
| T-FR-08 | Agency layer off → pill shows N/6 and no Connect client step |
| T-FR-09 | AI site with section containers seeds step 1 |
| T-FR-10 | RailCoach copy names five rail items and the bottom-bar Pages |
| T-FR-11 | `first_canvas_edit` fires once per site with ms since open (F-1) |
| T-FR-12 | Applying a template ticks step 1 and does not end onboarding |
| T-FR-13 | Brand opened while a confirmation dialog is up: the achievement toast waits until the dialog closes (T-IAF21-5) |
| T-FR-14 | Checklist "Open Brand" with an unsaved Site settings draft runs the existing draft guard first (T-IAF21-6) |
| T-FR-15 | Esc dismisses RailCoach; the pill never pulses (any motion setting); reduced motion → toast appears with no transition *(R-1018)* |
| T-FR-16 | Screen reader announces "Add your first section done. Next: Preview your site" once, through Panel 22's polite region (the toast has no live region of its own), without focus moving *(R-1018)* |
| T-FR-17 | Viewer: no prompt, coach or checklist; role that can't edit → no pill (zero eligible) |
| T-FR-18 | Reviews off → "Send for review" visible with reason and not counted (pill N/5) |
| T-FR-19 | Offline tick → shown done; synced after reconnect under the same user |
| T-FR-20 | **This version:** "Describe a section" is absent from the empty-canvas prompt (SC-21). **When AI returns:** AI not configured → "AI isn't set up on this server yet" (error state; disabled with that reason after AI-D2); configured → generating a section ticks step 1 after the insert commits *(amended 2026-10-17 — source: Panel 20 §10.2 / SC-10, SC-21)* |
| T-FR-21 | Primitive Element insert, paste or duplicate does not tick step 1 |
| T-FR-22 | Analytics payloads contain no page names or saved-template names (F-1 contract) |
| T-FR-23 | At 1280×720 on an empty page: heading and the first row of cards are visible, cards are 2-up, the prompt scrolls inside the canvas and no control is clipped (T2-25) *(R-1018)* |
| T-FR-24 | First open on a new account: RailCoach shows; an Add first-use tip does not appear until RailCoach is dismissed (one coach surface at a time) *(R-1018)* |

## 11. Code defects found (engineering, not design)
1. Preview step completes on its own button press and on closing preview (`OnboardingMount.tsx:63,230-231`; `AquibraStudio.tsx:284-287`); test covers publish only (`OnboardingMount.signals.test.tsx:111-118`).
2. Seeded steps open the modal achievement popup and hide RailCoach (`OnboardingMount.tsx:169-173`; `useOnboardingOrchestrator.ts:283`) — likely, unconfirmed for template content.
3. AI sections (`type:"container"`, `tagName:"section"`) never match seeding (`route.ts:74-75` vs `OnboardingMount.tsx:172`).
4. Skip local only; replay undone by server union (`useOnboardingOrchestrator.ts:208-227,303-305`).
5. Template apply ends onboarding (`templatesStorage.ts:14-19`).
6. Dashboard: E1 "Back to setup" can create a second site (`ready/page.tsx:96`); raw `CRON_SECRET` error shown (`generating/page.tsx:16-21`); stale e2e "New client is the default" (`onboarding.spec.ts:171`).
7. Unused storage keys `buildrick-onboarding-modal`, `-tour-v2`, `-tour-step`, `-project-named`; SiteMenu comment mentions a tour that doesn't exist (`SiteMenu.tsx:19`).

## 12. Review and not verified
Independent review: pass 1 PROPOSAL (B1–B7, N1–N11), fixed 2026-10-17; 12 of 14 citations confirmed, 2 corrected (FR-02 lines, FR-17 file). Not verified: runtime, whether template content uses `type:"section"`, real first-edit times, 5-user first-run test (00-STRATEGY §7; now required before first-run Figma is accepted — R1, F-6 *(R-1018)*), short-height layout geometry.
