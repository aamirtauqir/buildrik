# D3 — Per-screen design-spec audit, panels 14–25

Auditor task D3 · 2026-10-18 · AUDIT ONLY (spec level; no hi-fi exists, nothing run). Paths: P = `docs/audit-and-design-2026-10-16/panels`.

## Scope read

| File | Lines read | Mode |
|---|---|---|
| P/00-SHARED-CONTRACTS.md | 1–361 (full) | full read |
| P/00-STRATEGY.md | 1–49 (full) | full read |
| P/14-PUBLISH.md | 1–313 (full) | full read |
| P/15-TEMPLATES.md | 1–211 (full) | full read |
| P/16-FIRST-RUN.md | 1–194 (full) | full read |
| P/17-CLIENT-REVIEW.md | 1–289 (full) | full read |
| P/18-COMMAND-PALETTE-AND-HELP.md | 1–340 (full) | full read |
| P/19-INTERACTIONS.md | 1–295 (full) | full read |
| P/20-AI.md | 1–312 (full) | full read (DEFERRED; audited for deferral only) |
| P/21-COLLABORATION.md | 1–276 (full) | full read |
| P/22-GLOBAL-STATES.md | 1–328 (full) | full read |
| P/23-PLANS-AND-TRIAL.md | 1–430 (full) | full read |
| P/24-UNDO-COVERAGE.md | 1–375 (full) | full read |
| P/25-ANALYTICS-EVENTS.md | 1–271 (full) | full read |
| P/01…13, ENGINEERING-BACKLOG, REVIEW | grep only: `\bAI\b`, `Generate`, `assistant`, `✦`, `Ask AI`, `Write with AI`, `dsAi`, `alt`, `SC-21`, `milestone`, `summary`, `unknown`, `menu header`; spot reads 12:96,107,142; 09:88,115; 08:75 | AI-leak sweep + cross-checks |

Skipped: INV, RL, DESIGN.md, ARCHITECTURE-DECISION.md. D3 is a spec-coherence audit of 14–25; code-inventory coverage belongs to other tasks. No claim below depends on them.

Note on readiness labels: SC-16 (`00 §SC-16`) **retires "DESIGN READY"**. The ladder is SPEC COMPLETE → VERIFIED. In the column "missing for DESIGN READY" I list what is still missing for VERIFIED and for a designer to start hi-fi.

---

## Screen spec audit

### 14 Publish
| Field | Finding |
|---|---|
| Documented purpose | "What will go live, is it safe, and did it work?" (14 §1) |
| Job served | Job 3 "publish safely"; north star (14 §3, 00-STRATEGY §6) |
| Location / host + geometry | Right task 360 (Panel 12 host), header 48, footer 48; review-and-publish dialog 720 bounded; topbar CTA states (14 §4.1–4.3, §8). NOT MEASURED |
| Primary action | Footer "Publish changes" (lifecycle verb), then dialog "Publish" (14 §4.1, §4.3) |
| Controls listed | **Y**: status card, What will change, Checks + Fix ›, Approval, Goes to, footer CTA, header ⋯ (All releases, Unpublish), dialog sections 1–5. Mock §4.1 omits the ⋯ described in text (14:89) |
| States present | empty (no changes / first publish §5.1), loading (Checking… §6), error (checks failed, §7 failure table), permission (viewer/EDITOR/ADMIN §6), offline (§6, running "Reconnecting…"), success (§5.5), partial ("live but recording failed" §5.5; "Edits this session" fallback §4.1), locked-on-Free (§6) |
| States missing | long-content: only "long domains wrap" (§8); many-items: no overflow or limit for the Checks list (13+ rows), and the change list "See all ›" target is not fixed (§4.1 vs §5.1 "rows open Compare") |
| Context menus | Header ⋯ (14:89); no row menus |
| Keyboard / focus spec | Y (§8: U opens; focus to header, first unchecked box, outcome heading; no publish key) |
| a11y spec | Y (aria-disabled + reason, progressbar values, polite/assertive split, glyph states) |
| Undo / history spec | P. Not undoable by design; recovery = republish (§5.6, 24 row 46). Unpublish uses a typed confirm |
| Adjacent screens & return | Fix › in Editor keeps the task, no chip; Fix › elsewhere opens that area with Publish in the tray, back per SC-1 (§5.2, SC-7); History › Published; Review gate banner → Open Review; Site settings › Domains |
| Readiness label vs content | "SPEC COMPLETE · blocked by P-1, FI-03, Access gate; plan rows TR-7, TR-12". Content matches. ⛔ rows are named |
| Missing for VERIFIED / hi-fi | P-1 ⛔ shipped; no Figma board; Checks overflow rule; "See all ›" destination; geometry measured |

### 15 Templates
| Field | Finding |
|---|---|
| Documented purpose | "Which ready-made page layout, and does it go to a new page or this page?" (15 §1) |
| Job served | Job 1 (15 §3) |
| Location / host + geometry | In-shell **area**: header 56, local nav 240, cards 226 + 16 gap; ≤1280 nav collapses to a dropdown; preview fills the work area (15 §4, §7) |
| Primary action | Mode-matched: Create page / Replace {page} in the preview header (15 §4.1) |
| Controls listed | **Y**: back, title + site, search, Show filter, Recent, mode bar + Change ›, grid cards, preview devices, Used on, header ⋯ Reload, Saved card ⋯ Rename/Delete |
| States present | loading (skeleton), empty (no match; empty Saved), partial (saved syncing/failed), error (render error, apply failure §5.2, stale target §5.2a), permission (EDITOR+, viewer, unknown role), offline (assumption §6), success (toast §5.2), running/timeout (§5.4), Pro/plan (§6) |
| States missing | long-content (long template or page names in the mode bar and cards) not specified; many-items only via the category rule (≥12, §4) — no grid paging or virtualisation note for 12+ iframes (flagged as unverified render cost in §12) |
| Context menus | Saved card ⋯ (Rename after T-3, Delete); header ⋯ (Reload catalogue) |
| Keyboard / focus spec | Y (§7: focus into search, preview primary, Back restores card focus; Esc ladder §4.1) |
| a11y spec | Y (card group not nested buttons, accessible name formula, inert thumbnails, radiogroup, polite counts) |
| Undo / history spec | Y: Replace = backup + Undo; Create Undo after T-4 (confirm until then); saved-template delete Undo — but the mechanism over a hard server delete is unspecified (see D3-24) |
| Adjacent screens & return | One door contract with origin-based Back (§5.1 table): Pages, Add, empty canvas, ⌘K, T |
| Readiness label vs content | "SPEC COMPLETE · not VERIFIED", but T-TP-13 (Pro templates) depends on ⛔ P-TRIAL with no "blocked by" (D3-18) |
| Missing for VERIFIED / hi-fi | T-5 Figma board 4418:54134 update; T-1/T-2/T-4; offline behaviour (an assumption, and it contradicts 22 — D3-2) |

### 16 First run
| Field | Finding |
|---|---|
| Documented purpose | "What do I do first, and how do I see a result fast?" (16 §1) |
| Job served | Activation (00-STRATEGY §5); job 1 |
| Location / host + geometry | Empty-canvas prompt (canvas centre); RailCoach anchored to the rail; checklist pill 32h at bottom-left, 12 above the bottom bar, 12 right of the rail; list ≤360h upward; ≤1366 collapses to a 32×32 icon (16 §4.1–4.3) |
| Primary action | Template card → that template's preview (16 §4.1) |
| Controls listed | **Y**: 3 cards, Browse all, + Add a section, Start blank (Describe hidden by SC-21), RailCoach Got it, 7-step checklist with buttons, pill, toast "Next ›", Help popover rows |
| States present | empty (subject), loading (nothing counts), partial (eligible count, ineligible with reason), error (onboarding server unreachable), permission (viewer, zero eligible), offline (tick queue), success (achievement, finished), reduced motion |
| States missing | long-content and many-items N/A. AI-unavailable is a decided hide (SC-21) |
| Context menus | None |
| Keyboard / focus spec | Y (no focus move; toast reachable in the bottom-bar F6 region; Esc dismisses RailCoach) |
| a11y spec | Y (`role=status` polite, announcement text T-FR-16) — but it conflicts with 22's toast live-region rule (D3-3) |
| Undo / history spec | Y (dismiss = toast Undo; no confirm, SC-15; 24 row 56) |
| Adjacent screens & return | Cards → 15 preview (Back "‹ Back to Editor · {page}"); Add a section → 03; checklist buttons → Brand, Pages, Review, Publish; Help → 18 popover |
| Readiness label vs content | "SPEC COMPLETE · not VERIFIED". F-1 = ⛔ A-1 is declared as "blocks Panel 25 events only" (SC-9). Consistent |
| Missing for VERIFIED / hi-fi | F-5 Figma board 4428:44164; F-2 server dismissal; 5-user test (00-STRATEGY §7); toast-stack rule reconciled with 22 |

### 17 Client review
| Field | Finding |
|---|---|
| Documented purpose | Designer: "what does my client think, am I cleared"; client: "what am I looking at, how do I comment and approve" (17 §1) |
| Job served | Job 2 "Get approval" (17 header) |
| Location / host + geometry | Dashboard page `/review/<token>`: header 56 (phone 48), side 360, footer 64 sticky, no horizontal scroll from 320 to 1920. Editor Review task 360, rows 32/48 (17 §4.1–4.3, §8) |
| Primary action | Client: Approve Round n (with code, OD-R7). Designer: footer "Send Round n+1 to {client}" (17 §4.3) |
| Controls listed | **Y**: device switch, Add comment / crosshair, pins, comments panel + filter, general note, footer actions; task round card, Client/Team/All filter, audience toggle, composer, Next ›, Locate ›, Resolve, ⋯ actions |
| States present | Client page: loading, identify, open, no snapshot, answered, dead (4 kinds), already answered, offline, rate-limited (17 §6). Task: loading, error, never-sent, all-resolved, revoked, expired, viewer read-only, locked-on-Free |
| States missing | long-content: comment ≤2000 is set, but truncation in task rows and client list rows is not. many-items: filter + page grouping exist; no list cap or paging for long threads (P) |
| Context menus | Review task ⋯ (Compare rounds, Round history, Open link, Re-send, Revoke) (CR-14 kept) |
| Keyboard / focus spec | Y (keyboard crosshair 8/40 px, Enter/Esc, scoped C key + toggle, Approve confirm traps/returns focus) |
| a11y spec | Y (landmarks, pins as buttons linked to rows, crosshair position announcement, polite/assertive split) |
| Undo / history spec | Y (resolve → toast Undo OD-U7; revoke = declared SC-15 confirm; approval not withdrawable OD-R6) |
| Adjacent screens & return | Edit {element} → canvas chip "‹ Back to Review" (SC-7); Publish gate banner and Approval row (14); bell rows (22 §5.11); Locate › (SC-19) |
| Readiness label vs content | "SPEC COMPLETE · blocked by R-4, R-11" — matches SC-9 ⛔ rows |
| Missing for VERIFIED / hi-fi | No Figma boards for §4.1–4.3 (17 §14); R-2/R-3 for pins and replies; OD-R4 security review; real-device pan/pinch |

### 18 Command palette, shortcuts sheet, Help
| Field | Finding |
|---|---|
| Documented purpose | "How do I get to it, and what keys does it have?" (18 §1) |
| Job served | All three; "Build fast" most (18 §3) |
| Location / host + geometry | Palette 640w, top 48, max-h min(800, 100vh−96), rows 32, footer 32. Sheet 720 bounded, header 56, max-h 80vh. Help popover 240 (18 §8) |
| Primary action | Enter runs the highlighted row (18 §5.5) |
| Controls listed | **Y**: input, scope chip, groups in canonical order, nested levels, Show all, footer hints; sheet search, platform toggle, single-key toggle, BASICS; Help 2 rows |
| States present | empty (first use, no match), loading (components, records), partial (group fetch failed), error (action fails after Run), permission (viewer, view mode, locked on Free), offline, modal open, session expired, success (focus to destination) |
| States missing | long-content: rows wrap at 200% only (P); long result lists are handled by ≤5 per group + Show all (Y) |
| Context menus | None (palette is itself a command surface) |
| Keyboard / focus spec | Y (most complete in the set: ↑↓, →, Backspace levels, Esc at any level, Tab not on rows, focus return) |
| a11y spec | Y (combobox/listbox, aria-activedescendant, reason ≥4.5:1, count announced, single-key toggle WCAG 2.1.4) |
| Undo / history spec | Y (Clear history: E-5 confirm until K-8, then Undo; destructive actions via Undo) |
| Adjacent screens & return | Areas via SC-1 direct entry; tasks per Panel 12; templates → 15 preview; Help → 16 checklist |
| Readiness label vs content | "SPEC COMPLETE · blocked by P-TRIAL (T-CP-07 only)" — matches |
| Missing for VERIFIED / hi-fi | No target Figma boards; three-browser key acceptance (Ctrl+K on Windows); K-1/K-2 |

### 19 Interactions
| Field | Finding |
|---|---|
| Documented purpose | "What moves on my visitor's page, when, and will it look the same live?" (19 §1) |
| Job served | Job 1 "Build"; job 3 (19 §3) |
| Location / host + geometry | Inspector › Behaviour section, 300 wide, rows 32, Play 24×24, picker 2 columns (19 §4.1, §8) |
| Primary action | "+ Add interaction" → preset (19 §4.2) |
| Controls listed | **Y**: row (play/trigger/effect/state/drill), Add picker (7 presets + custom triggers), editor fields (Trigger, Effect, Animate, Timing, Repeat, When, Reverse, Plays on), ⋯ (Duplicate/Disable/Delete/Preview reduced motion), CSS animation editor |
| States present | empty (no interactions), permission (locked, site locked, viewer, multi-select), error (unknown trigger, target missing, hidden at breakpoint), legacy, success (toast, Play finished), plan (no gate) |
| States missing | **loading** (none), **offline** (none — probably N/A, not stated), many-items (list scroll and order not specified beyond "no reorder"; a >20 Tip exists), long-content (long names) N |
| Context menus | Editor ⋯ (19 §4.3) |
| Keyboard / focus spec | Y (Esc ladder §4.2, focus after add/delete, arrows in picker groups) |
| a11y spec | Y (named controls, aria-pressed, announcements; customer-output WCAG 2.2.2/2.3.1/2.3.3 rules) |
| Undo / history spec | Y (one step per discrete choice; commit on Enter/blur; delete toast Undo) |
| Adjacent screens & return | Entries from SC-3 surfaces + ⌘K; Pick on canvas uses the source-picking banner (05 §8); Issues and Publish rows → the row (§5.8) |
| Readiness label vs content | "SPEC COMPLETE · blocked by IXD-3, IXD-4" — matches. But 00-STRATEGY §8 still lists "interactions authoring" as Later (D3-12) |
| Missing for VERIFIED / hi-fi | Figma boards not opened (4428:142686 / 4418:109686); IXD-3/IXD-4 ⛔; preset and threshold values are *(DS)*, not validated |

### 20 AI — DEFERRED (SC-21)
| Field | Finding |
|---|---|
| Documented purpose | One AI contract (20 §1) — kept for the future "Build" tab |
| Job served | Job 1 accelerator (20 header) |
| Location / host + geometry | Hosts of others (AI task 360, Generate 284) (20 §8) |
| Status vs content | Header "DEFERRED — not in this version" + §0 mechanism (flag `NEXT_PUBLIC_FEATURE_AI` off, background hooks unmounted, wizard AI path hidden, AI-D1 role check still ships). **Deferral is cleanly stated in 20 itself and in SC-21.** OD-AI-1…4 deferred with the panel (20:308-311) |
| Leaks into other panels' this-version specs | 3 Major, 5 Minor — see the table below |

**AI-leak sweep (grep of all of P; lines already marked SC-21/inactive/hidden excluded):**

| # | File:line | Text | Verdict |
|---|---|---|---|
| L1 | 12-RIGHT-TASK-HOST.md:142 (T-RT-09) | "Saves inline compare still shows Visual/Semantic/**AI summary**" | **LEAK (Major)** — the acceptance test asserts a hidden AI surface; contradicts 12:96 ("AI summary is hidden in this version") and SC-21 ("History AI summary" hidden) |
| L2 | 12-RIGHT-TASK-HOST.md:96 | History target keeps "**milestone banner**" | **Probable leak (UNKNOWN)** — AI-12 milestone suggestion is a background AI hook that is not mounted while the flag is off (20 §0, SC-21). If this banner is the AI suggestion card, it must be marked hidden |
| L3 | 23-PLANS-AND-TRIAL.md:124 (§4.5) | Upgrade dialog "Benefit rows are generated from `PLAN_LIMITS` FREE→PRO deltas" | **LEAK (Major)** — PL-01 deltas include AI prompts/day 10→200 and AI generations/month 3→20 (23:22). There is no exclusion rule, and SC-21 hides "AI copy in plan/upgrade dialogs". The mock omits AI, but the generation rule would print it |
| L4 | 09-BRAND.md:88 | "Brand from logo/URL" kept as an active subtask | **Ambiguous (Minor)** — 20 §1 says it is not AI, but 20 §4.7 says "dsAi flag off → From logo/URL hidden", and SC-21 hides "Brand DS-AI entries". Whether it ships this version is undecided |
| L5 | 16-FIRST-RUN.md:110-111, 155 (F-3), 168 (T-FR-09) | "AI site arrives" flow and seeding | **Scope gap (Minor)** — the wizard AI path is hidden (AI-14, 20 §0), so no new AI sites arrive this version. The flow is still needed for legacy AI sites, but it is not marked as such |
| L6 | 12-RIGHT-TASK-HOST.md:107 | State row "AI not configured / quota — existing error states" | **Minor** — the file has an SC-21 header, but the row is not marked inactive |
| L7 | 12-RIGHT-TASK-HOST.md:70; 22-GLOBAL-STATES.md:140 | "all **six** tasks" | **Minor** — five tasks ship this version (AI hidden) |
| L8 | 00-SHARED-CONTRACTS.md:181 (SC-10 AI row), :228-229 (SC-11 "AI prompt", "AI site draft") | glossary and amendment rows | **Minor** — not marked inactive; other SC rows (SC-3, SC-12, SC-18) are |
| L9 | 13-COMPONENTS.md:28 | "AI `save-as-component`" door (today row) | Not a leak (today inventory, header present). The SC-21 hidden-entry list (00:337) does not name this door |
| L10 | 08-ASSETS.md (whole file) | No SC-21 header; one inline mark at :75 | OK. Background auto alt text (AI-09) is never mentioned in 08's upload flow, so no leak |
| — | 01:22,46; 03; 05:42; 18 CP-06/CP-10; 24 rows 48–50; 25 §4.6, `via ai`, `ai_quota` | — | Correctly marked, or today-only inventory rows |

### 21 Collaboration
| Field | Finding |
|---|---|
| Documented purpose | "Who else is here, what are they touching, is my work safe?" (21 §1) |
| Job served | Secondary user (agency teammates); jobs 1 and 3 (21 §3) |
| Location / host + geometry | Topbar presence cluster + People popover 320, rows 40; canvas outlines, cursors, tags; Follow frame + bar; Inspector line; typing confirm (21 §4, §8) |
| Primary action | Follow / Go there (People); passive presence otherwise |
| Controls listed | **Y**: cluster, pill, People rows, Follow, Go there, Hide my cursor, Manage members, Follow Stop, Wait / Edit anyway |
| States present | empty (solo), loading (Finding people…), partial (Phase A/B), error (Couldn't load people), permission (viewer before/after MP-7, EDITOR, ADMIN, plan-locked), offline/reconnect/resync/revoked (§5.6), many-items (10-cursor cap, room cap 25), success (join/leave announcements) |
| States missing | long-content (long names; duplicate names handled by surname initial) P |
| Context menus | None |
| Keyboard / focus spec | Y (Esc closes People, focus returns; Esc stops Follow, SC-2; Wait default focus) |
| a11y spec | Y (People is the screen-reader path; identity never colour-only; batched announcements) — but Offline is assertive here vs polite in 22 (D3-15) |
| Undo / history spec | Y (own changes only, skip on peer change, MP-8) |
| Adjacent screens & return | Go there = SC-1 direct navigation; Panel 10 banner layer 2; Panel 07 record banner; Panel 22 §5.5/5.7 access surfaces |
| Readiness label vs content | "SPEC COMPLETE · blocked by Phase A ⛔ MP-3/4/5, Phase B ⛔ MP-1/2/6/8" — matches. 00-STRATEGY §8 lists multiplayer as Later (D3-12) |
| Missing for VERIFIED / hi-fi | No Figma for People/Follow (21 §16); all MP ⛔ rows |

### 22 Global states
| Field | Finding |
|---|---|
| Documented purpose | "Is my work safe, can I keep working, what next?" (22 §1) |
| Job served | Supporting job "never lose work" (22 header) |
| Location / host + geometry | Severity ladder L1–L6 (22 §4.1): full-screen card 480; dialogs 480/720; **global banner slot** under the topbar, 40 min, full width, pushing content down; toasts 460; "N more" popover 360 (22 §4.2, §8) |
| Primary action | Per state (Sign in, Download a copy, Reload editor, Edit here…) |
| Controls listed | **Y**: banner + actions + "N more", card actions, dialog actions, toast rules, bell row behaviour |
| States present | All nine dimensions (the panel's subject): loading/boot, load failed, session, offline / can't reach, save failed, conflict, permission lost, deleted, version skew, crash, tabs, narrow/phone/browser, locked on Free |
| States missing | — (most complete). Trial-ended notice from 23 is absent from the banner list (D3-4) |
| Context menus | None |
| Keyboard / focus spec | Y (banners never move focus; dialogs focus primary; Esc per SC-2; F6 includes the banner slot) |
| a11y spec | Y (single `role=alert` owner; banners announce via pipes; never colour-only; 200% wrap) |
| Undo / history spec | P (recovery copy, Download a copy, Reload confirm; discard kept copy = SC-15 exception) |
| Adjacent screens & return | 11 §8 status opens dialogs; bell rows open in place (SC-1/SC-7); 14 P-3 resume |
| Readiness label vs content | "SPEC COMPLETE · blocked by G-2, G-12" — matches |
| Missing for VERIFIED / hi-fi | G-1…G-12; reconcile the toast rule with 16 and the banner list with 21/23 |

### 23 Plans and trial
| Field | Finding |
|---|---|
| Documented purpose | "What does my plan let me do here, and what if I go past it?" (23 §1) |
| Job served | Job 3; job 1 for limits (23 §3) |
| Location / host + geometry | ⋯ menu header chip row 32; Site settings Overview card max 720; Upgrade dialog 480; limit lines 12px; "Choose what stays active" (dashboard, size not given) (23 §4, §5.5a, §8) |
| Primary action | OWNER: "Choose Pro in Billing ↗"; others: "Ask the workspace owner to upgrade" |
| Controls listed | **Y**: chip states table, Pro chip, limit line, locked row, Upgrade dialog, trial-ended notice, active-set screen, Publish plan rows |
| States present | loading/unknown plan, permission (OWNER/others/viewer, role+plan), locked, trial live/ended, paid states incl. PAST_DUE/cancel/Business, offline, demo |
| States missing | many-items: "Choose what stays active" with many sites/pages has no search or scroll rule (P); empty N/A |
| Context menus | None (chip popover for non-owners) |
| Keyboard / focus spec | P (dialog focus → title, Esc; nothing for the active-set screen) |
| a11y spec | Y (aria-describedby limit line, aria-disabled, glyph + text, 4.5:1 tones) — trial notice `role=status` conflicts with 22 §8 (D3-4) |
| Undo / history spec | P (active-set save confirm; no undo stated; remove-protection has no Undo by design) |
| Adjacent screens & return | Billing in a new tab (IAF-14 G), refresh on focus (TR-3); 14 §5.2 rows; 22 banner 4b; 15 Pro templates |
| Readiness label vs content | "SPEC COMPLETE · blocked by TR-1, TR-2, TR-6, TR-7, TR-12, Access gate" — matches |
| Missing for VERIFIED / hi-fi | Stripe test-mode check (48 h rule); active-set screen geometry; AI exclusion rule for benefit rows (L3) |

### 24 Undo coverage
| Field | Finding |
|---|---|
| Documented purpose | "If I regret this, how do I get it back, and does ⌘Z do it?" (24 §1) |
| Job served | Supporting "never lose work"; health signal undo-after-delete (24 header) |
| Location / host + geometry | Cross-panel contract + one surface: Recently deleted (Pages sheet 560/720; Components detail column), rows 32; Undo/Redo 32×32 (24 §4.8, §8) |
| Primary action | Restore (Recently deleted); ⌘Z |
| Controls listed | **Y** for Recently deleted (entry, rows, Restore, bulk, Delete permanently, empty); matrix of 56 operations |
| States present | empty, loading, error, offline, permission (viewer, EDITOR, ADMIN+), read-only, refused undo, collab, plan lock, partial (component re-link) |
| States missing | long-content (long page or component names in rows) N |
| Context menus | Row ⋯ Delete permanently (ADMIN+) |
| Keyboard / focus spec | Y (listbox multi-select Space/⇧↑↓; focus after Restore; area-aware ⌘Z table §4.3) |
| a11y spec | Y |
| Undo / history spec | Y (subject) |
| Adjacent screens & return | "‹ Back to Pages" / "‹ Back to Components" (SC-1); "Open Editor to undo" (§4.3); History › Session labels (12 RT-12) |
| Readiness label vs content | "SPEC COMPLETE · blocked by U-1 (rows 20/23 …; MP-8)" — matches |
| Missing for VERIFIED / hi-fi | U-1 ⛔ interim guard; U-7 page soft delete (Page has no `deletedAt`); no Figma for Recently deleted |

### 25 Analytics events
| Field | Finding |
|---|---|
| Documented purpose | Single list of product events (25 §1) |
| Job served | All three (metrics, 00-STRATEGY §6) |
| Location / host + geometry | Not a UI; one row in Account settings › Privacy (25 §6.4) |
| Primary action | N/A (opt-out toggle) |
| Controls listed | P — opt-out row copy given; no layout |
| States | N/A for UI; delivery offline queue, de-dup, drop-and-count (25 §6.5, T-AN-14) |
| Context menus / keyboard / a11y | N/A |
| Undo / history spec | N/A |
| Adjacent screens & return | Account settings › Privacy (dashboard) |
| Readiness label vs content | "SPEC COMPLETE · blocked by A-1, A-3, A-4" — matches |
| Missing for VERIFIED / hi-fi | `publish_blocked` enum missing the motion row (D3-1); stale owner column (D3-14); legal gate |

---

## Interaction & state matrix (14–25)

| Interaction / flow | Trigger | Feedback | Success | Failure / recovery | Undo | Panel § |
|---|---|---|---|---|---|---|
| Publish site | CTA / footer → dialog | "Saving…" → "Saved {time}" → "Publishing n/N…" ring + step list | "Your changes are live…" + toast View live | §7 reason table; live site named unchanged; Try again / View log | None (republish) | 14 §5.3–5.5 |
| Fix a check | Check row Fix › | Opens target, task kept / tray | Checks re-run | No owner → "How to fix" line | — | 14 §5.2 |
| Publish start timeout | No job id | "Checking whether the publish started…" | Resumes running view | "Publishing didn't start. Nothing changed." | — | 14 §5.4 |
| Poll lost | 3 poll failures | "Checking status…" 5 s × 1 min | Resumes | "We lost track… Check status" | — | 14 §5.4 |
| Republish release | History row | Confirm (facts) | New release | "no longer stored" disabled | — | 14 §5.6 |
| Unpublish | ⋯ (ADMIN) | Typed confirm | Toast "Site unpublished · Publish again" | — | Confirm (SC-15) | 14 §5.7 |
| Open Templates | 7 doors | Mode bar Creating/Replacing | Catalogue/preview | Stale target refusal | — | 15 §5.1, §5.2a |
| Create page from template | Preview › Create page | Progress overlay (4 stages) | Editor on new page + toast | T-1 copy; "Taking longer…" | Toast Undo after T-4; confirm until then | 15 §5.2, §5.4 |
| Replace page | Preview › Replace | Confirm + backup | Toast "replaced · Backup… · Undo" | Backup-failure dialog | Toast Undo / ⌘Z | 15 §5.3 |
| Delete saved template | Saved card ⋯ | Toast | Removed | Mechanism unspecified (D3-24) | Toast Undo | 15 §5.5 |
| Empty-canvas start | Card click | Preview in Replacing | Content on page; step 1 ticks | — | Replace Undo | 16 §4.1, §5.2 |
| Checklist step complete | Outcome event | Non-modal toast "✓ step — Next ›" | Pill count | Offline → queued | — | 16 §4.3–4.4 |
| Dismiss checklist | ✕ | Toast "hidden · Undo · bring it back from Help" | Hidden (server) | — | Toast Undo | 16 §5.3 |
| Send review round | Send for review | Snapshot render → outcome modal | Link + email | Render fail keeps dialog: Try again / Send without preview | — | 17 §5.1 |
| Client comment | Add comment / crosshair / C | Anchored composer | Pin + list row | "Not sent… Send again" | — | 17 §4.1, §5.3 |
| Client approve | Approve Round n | Confirm + emailed code | Approved card + receipt | Already answered; offline disabled | None (OD-R6) | 17 §5.3 |
| Revoke link | ⋯ | Confirm | Chip → Not sent/Review | — | Confirm (SC-15 exception) | 17 §5.2 |
| Resolve comment | ✓ | Pending until ack | Resolved | — | Toast Undo (OD-U7) | 17 §5.4 |
| Open palette | ⌘K / ⌘⇧P / ⋯ "Search ⌘K" | Field commit first (SC-17) | Palette, scoped chip | Invalid field → stays | — | 18 §5.1 |
| Run command | Enter | Closes; focus to destination | Recent updated | Toast "Couldn't {action} — {reason} · Retry" | Per action | 18 §5.5 |
| Disabled row Enter | Enter | Assertive reason; stays open | — | — | — | 18 §5.6 |
| Toggle single keys | Sheet toggle | Rows show "off" | Keys stop | — | Toggle back | 18 §5.9 |
| Add interaction (preset) | + Add / SC-3 / ⌘K | Row added, focus, plays once (not under reduced motion) | Toast "Interaction added · Undo" | Root/multi/locked disabled with reason | Toast Undo / ⌘Z | 19 §4.2, §5.1 |
| Edit timing | Field type | Draft | Commit on Enter/blur = 1 step | Esc reverts | ⌘Z | 19 §5.2 |
| Play | ▶ | "Playing…" / "Finished" | Animates once | Hidden at breakpoint → disabled | Transient | 19 §5.3 |
| Delete interaction | ⋯ Delete | Toast | Removed, focus next | — | Toast Undo | 19 §5.2 |
| Join presence | Open editor (flag on) | Pill "N here" | Roster | "Couldn't load people — Retry" | — | 21 §5.1 |
| Follow | People › Follow / tag | Border + "Following Ana · Stop" | View tracks | Stops on Esc/edit/leave with reason | — | 21 §4.4 |
| Type in a peer-edited text | Double-click | Confirm "Ana is typing here" | Edit anyway | Wait | — | 21 §4.3 |
| Peer saved (Phase A) | MP-12 | Banner "Ana saved changes · Get latest" | Backup then reload | Without MP-12: ConflictModal | — | 21 §5.2 |
| Session expiry | 401 | Dialog / banner | Auto resend (G-2) | Different account → Download | — | 22 §5.2 |
| Offline | `offline` | Banner 6 + status | "Back online — changes saved" | Partial → Save failed | — | 22 §5.3 |
| Conflict | SAVE_CONFLICT | 720 dialog | Download / Reload (confirm) / Overwrite (confirm) | Backup failure keeps dialog | — | 22 §5.4 |
| Permission lost | FORBIDDEN / focus read | Banner 5, view mode | — | Download changes | — | 22 §5.5 |
| Crash | Boundary | Card with computed safety line | Reload | Download a copy first | — | 22 §5.9 |
| Other tab | BroadcastChannel | Banner 7 | Edit here takes over | Other tab save fails → stays editable | — | 22 §5.12 |
| Hit a plan limit | Action at limit | Disabled + "{used} of {limit} on {plan}" | Upgrade (OWNER) | "Ask the workspace owner" | — | 23 §4.4 |
| Upgrade | Upgrade dialog | Billing in new tab | Locks lift on focus (TR-3) | "Upgraded? Reload to unlock" | — | 23 §4.5, §5.7 |
| Trial ends | `trialEndsAt` | Notice under topbar | — | Over-limit items lock | Choose what stays active | 23 §5.5 |
| Remove protection and publish | Blocking row | Confirm names domain | Public site + badge | "protection was removed… live site still protected" · Restore protection | None | 23 §5.6 |
| Area-aware ⌘Z | ⌘Z outside Editor/Brand | Area toast action or "Nothing to undo here — Open Editor to undo" | — | — | — | 24 §4.3 |
| Restore deleted page/component | Recently deleted › Restore | Toast "About restored · Open" | Same ID/slug | Slug taken → new slug; offline disabled | — | 24 §4.8 |
| Opt-out of telemetry | Account › Privacy toggle | — | No events stored | Publish events until A-5 | Toggle back | 25 §6.4 |

---

## Shared-pattern consistency matrix

Legend: ✓ specified and consistent with 00 · ≠ divergence (see note) · — not applicable · ? not specified.

| Pattern | 14 | 15 | 16 | 17 | 18 | 19 | 21 | 22 | 23 | 24 | 25 | Divergence notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Panel header | ✓ task 48 + "‹ Back to Inspector" + ✕ + ⋯ | ✓ area 56, SC-1 back | — | ✓ task 48 (client page 56/48) | ≠ palette input 48 / sheet 56 | ✓ Inspector drill "‹ Back to Interactions" | ≠ popover title + ✕ | ≠ card title 16/600 | ? dialog title only | ✓ subview back "‹ Back to Pages" | — | Host-specific sizes are justified. 14 §4.1 mock omits the ⋯ its text names |
| Search | — | ✓ search + Esc clear/blur (added to SC-2) | — | — | ✓ palette; sheet search | — | — | — | ? (active set) | ? (Recently deleted none) | — | Recently deleted and the active-set screen have no search for long lists |
| List row | ✓ check row + Fix › | ✓ card 226 | ✓ step row | ✓ rows 32 / 48 | ✓ 32 | ✓ 32 | ≠ 40 | — | ✓ chip row 32 | ✓ 32 | — | People rows 40 vs 32 elsewhere (two-line content; acceptable) |
| Empty | ✓ "No changes since v12" | ✓ no match / Saved | ✓ (subject) | ✓ never-sent, "Check back here" | ✓ first use / no results | ✓ collapsed section | ✓ solo = no cluster | — | — | ✓ "Nothing deleted in the last 30 days" | — | Consistent sentence style |
| Loading | ✓ skeleton rows "Checking…" | ✓ skeleton grid | ✓ nothing counts | ✓ "Checking your access…" | ✓ "Loading…" (no flash <300 ms) | ? none | ✓ "Finding people…" | ✓ shell skeleton "Opening {site}…" | ✓ unknown = unlocked-pending | ✓ skeleton rows | — | 19 has no loading state. 23's unknown-plan rule cites an outdated unknown-role precedent (D3-25) |
| Error banner | ✓ gate banner above Checks | ✓ inline "Couldn't load saved templates — Retry" | — | ✓ "Couldn't load this review round" | ✓ group line + Retry | ≠ inline row line only | ✓ "Couldn't load people — Retry" | ✓ global slot (owner) | ≠ trial notice under topbar outside 22's slot list | ✓ "Couldn't load deleted pages — Retry" | — | 23 and 21 add topbar-level banners missing from 22's priority list (D3-4, D3-21) |
| Confirm dialog | ≠ republish confirm; ✓ unpublish typed | ≠ Replace confirm; create confirm until T-4 | ✓ none | ✓ revoke (SC-15) | ✓ E-5 only | ✓ none | ≠ typing "Wait / Edit anyway" (advisory) | ≠ Reload latest + Overwrite confirm | ≠ remove-protection confirm; active-set save confirm | ✓ permanent delete only | — | SC-15 says "any other confirm is overridden"; 14, 15, 22, 23 keep confirms not in its list (D3-6) |
| Destructive / undo toast | — | ✓ ≥8 s, pause | ≠ achievement toast 6 s, stacked above Undo toasts | ✓ resolve Undo | ✓ "History cleared · Undo" | ✓ | ✓ "changed Padding after you · Undo" | ✓ rule owner (≤1 transient) | — | ✓ disabled Undo once superseded | — | 16 stacking and live region vs 22 §5.10 (D3-3) |
| Context menu | ✓ header ⋯ | ✓ card ⋯, header ⋯ | — | ✓ task ⋯ | — | ✓ editor ⋯ | — | — | — | ✓ row ⋯ | — | Labels draw from local actions; no SC-3 element menu involved |
| Bulk bar | — | — | — | — | — | — | — | — | ≠ checkbox list (active set) | ✓ multi-select bulk Restore | — | Bulk patterns in Pages/CMS (11/07) not referenced by 24 §4.8 or 23 §5.5a |
| Footer actions | ✓ 48 + reason line | ≠ actions in preview header | — | ≠ composer + "Send Round" 2-row footer | ✓ hint footer 32 | — | — | ✓ dialog footers | ✓ dialog Not now / Choose Pro | — | — | 17 two-row footer vs Panel 12 "footer 48" (D3-27) |
| Tabs / segmented | — | ✓ Show filter (radio), devices radiogroup | — | ✓ Client/Team/All, Team only/To client, devices | ✓ platform toggle | ✓ Repeat/When radios | — | — | — | — | — | — |
| Host type | right task | area | canvas overlay + pill | right task + external page | modal (no dim) + sheet + popover | Inspector section | topbar popover + canvas | global slot / card / dialog | menu header + dialog + dashboard page | sheet subview | dashboard row | Consistent with IA-01 |
| Save model | job + flush first | document (normal queue) | server per user (F-2) | server per action | Recent localStorage → per user+site | document, commit on blur | presence ephemeral; save unchanged | SC-4 status | server (webhook only) | stack / server | server | Consistent |
| Naming (SC-11) | ✓ "release" | ✓ "Page template" | ✓ "Getting started", "section" | ✓ "Round n" | ✓ SC-11 nouns, no "Open" prefix | ✓ | ✓ area names | ✓ "Site" not project | ✓ Free/Pro/Business | ✓ | ≠ owner "12 Review" | Role-refusal and offline wordings diverge across panels (D3-16, D3-17) |

**Divergences from 00-SHARED-CONTRACTS:** SC-15 confirm list (D3-6); SC-6 reason wording "{Area} needs Editor access" vs 14/15/22 variants (D3-16); SC-21 hidden list vs 12 T-RT-09 and 23 §4.5 (D3-7, D3-9); SC-20/SC-18 ⋯ menu header has two occupants (D3-5); SC-5 banner slot vs extra banners in 21 and 23 (D3-4, D3-21).

---

## Principle observations

| PID | Module / panel | Observation (spec level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P01 | 14 | Four dialogs collapse into one sectioned dialog; only applicable sections show | Low | 14 §4.3 | PASS-SPEC |
| P01 | 22 | Severity ladder L1–L6 sends each condition to one surface; banner cap "N more" | Low | 22 §4.1–4.2 | PASS-SPEC |
| P02 | 16 | 7 targets → one primary path (cards) + 2 secondary | Low | 16 §4.1 | PASS-SPEC |
| P02 | 18 | ≤5 rows per group + Show all; opening list no longer floods with pages | Low | 18 §4.1, §5.3 | PASS-SPEC |
| P03 | 17 | Pins 24 with 32/44 hit areas; phone targets ≥44 | Low | 17 §8, §4.2 | PASS-SPEC |
| P03 | 19 | Play target 24×24 inside 32 rows at 300 width; dense | Med | 19 §8 | NEEDS REVISION — confirm hit area ≥24 with spacing (WCAG 2.5.8) |
| P04 | 19 | Presets first; trigger list Common/More; Plays on shown only after IXD-6 | Low | 19 §4.2–4.3 | PASS-SPEC |
| P04 | 23 | Limit lines appear only at ≥80% or at the limit | Low | 23 §4.4 | PASS-SPEC |
| P05 | 18 | Disabled rows stay visible with reason; selection group named after the selection | Low | 18 §4.1, §5.6 | PASS-SPEC |
| P06 | 24 | One stack per site; ⌘Z never changes a hidden document from other areas | Low | 24 §4.2–4.3 | PASS-SPEC |
| P06 | 21 | "editing" never "locked"; presence ≠ lock | Low | 21 §4.3 | PASS-SPEC |
| P07 | 18 | ⌘K, ↑↓/↵, Backspace-out-of-level follow palette conventions (Figma, Linear) | Low | 18 §5.4 | PASS-SPEC |
| P07 | 15 | Templates area matches Webflow/Framer noun and in-shell model | Low | 15 §1, §4 | PASS-SPEC |
| P08 | 14 | Flush saves before publish moves complexity off the user | Low | 14 §5.3 | PASS-SPEC |
| P09 | 21 | Phase B "about 2 s" stated; cursor ≥100 ms send | Low | 21 §4.1, §6 | PASS-SPEC (unverified) |
| P09 | 15 | 15 s auto-fail replaced by "Taking longer than usual… Keep waiting" | Low | 15 §5.4 | PASS-SPEC |
| P11 | 14 | Checks grouped Blocking then Tips with header counts | Low | 14 §4.1 | PASS-SPEC |
| P12 | 17 | Comments grouped by page; earlier-round comments list-only | Low | 17 §4.1, §4.3 | PASS-SPEC |
| P16 | 14–25 | Geometry in 4/8 multiples (32/40/48/56, 240/300/320/360/480/640/720) | Low | 14 §8, 18 §8, 22 §8 | PASS-SPEC (NOT MEASURED) |
| P18 | 18 | Reason text ≥4.5:1, row not faded as a whole | Low | 18 §5.6 | PASS-SPEC |
| P18 | 21 | Tag text 4.5:1 on tone; 5 tones repeat, so name tag is always on | Low | 21 §4.2 | PASS-SPEC |
| P20 | 22, 16, 23 | Three different topbar-adjacent notice positions (banner slot, pill corner, "notice under the topbar") | Med | 22 §4.2, 16 §4.4, 23 §5.5 | NEEDS REVISION (D3-3, D3-4) |
| P21 | 19 | Play semantics table covers 10 edge situations | Low | 19 §5.3 | PASS-SPEC |
| P22 | 14 | Disabled CTA focusable with reason line | Low | 14 §4.1 | PASS-SPEC |
| P23 | 14 | Topbar "Publishing 2/5…" progress, Failed state, assertive only for failure | Low | 14 §4.2, §8 | PASS-SPEC |
| P23 | 17 | Designer feedback depends on R-4 ⛔; interim copy "Check back here" + 60 s refresh | Med | 17 §5.6 | BLOCKED (R-4) |
| P24 | 14 | Server enforcement of Blocking rows (P-1) | High until shipped | 14 §5.2, §11 | BLOCKED (P-1) |
| P24 | 19 | Flash clamp 0.4 s; Blocking 2.2.2 row | Low | 19 §4.3, §5.8 | PASS-SPEC |
| P25 | 22 | Failed backup keeps conflict and local copy; Reload always confirms | Low | 22 §5.4 | PASS-SPEC |
| P25 | 15 | Create failure truthful; Retry imports into the same page | Low | 15 §5.2 | PASS-SPEC |
| P26 | 18 | Palette door only in ⋯ header, sheet header, footer (no topbar button, OD-18-3); ⋯ header also hosts the trial chip | Med | 18 §5.1, 23 §4.2 | NEEDS REVISION (D3-5) |
| P27 | 15 | One door contract carries name, mode and origin, so no re-entry | Low | 15 §5.1 | PASS-SPEC |
| P28 | 19 | Preset auto-plays once, skipped under OS reduced motion | Low | 19 §4.2 | PASS-SPEC |
| P29 | 18 | Scope chip "In {Area}" pre-applied by origin | Low | 18 §5.1 | PASS-SPEC |
| P31 | 14–25 | Role-refusal and offline sentences differ per panel | Med | D3-16, D3-17 | NEEDS REVISION |
| P31 | 22 vs 16 | Toast stacking rules differ | Med | 22 §5.10 vs 16 §4.4 | NEEDS REVISION (D3-3) |
| P32 | 00-STRATEGY | §8 scope list ("Later: interactions, multiplayer") lags 19/21 SPEC COMPLETE | Low | 00-STRATEGY §8 | NEEDS REVISION (D3-12) |
| P33 | 15, 18, 24 | SC-1 back labels used throughout ("‹ Back to Pages / Add / Editor · {page}") | Low | 15 §5.1, 24 §4.8 | PASS-SPEC |
| P34 | 17 | Client page responsive 320–1920, 1:1 pan mode on phones | Low | 17 §4.2 | PASS-SPEC |
| P34 | 22 | Narrow banner never blocks (200% zoom); phone by pointer + screen width | Low | 22 §5.13 | PASS-SPEC |
| P35 | 23 | One Pro chip replaces four treatments | Low | 23 §4.3 | PASS-SPEC |
| P36 | 23 | Pro chip uses the purple ramp (DESIGN.md allowlist for PRO only) | Low | 23 §4.3 | PASS-SPEC |
| P37 | 14 | Status / Changes / Checks / Approval / Goes to order follows the decision | Low | 14 §4.1 | PASS-SPEC |
| P38 | 17 | Client page lists 9 states incl. already-answered and rate-limited | Low | 17 §6 | PASS-SPEC |
| P38 | 19 | No loading or offline state for Interactions | Low | 19 §6 | NEEDS REVISION (state N/A should be stated) |
| P39 | 18 | Single-key toggle (WCAG 2.1.4); options not Tab stops | Low | 18 §5.9, §8 | PASS-SPEC |
| P39 | 19 | Customer-output reduced motion, 2.2.2, 2.3.1 | High until IXD-4 | 19 §5.5, §11 | BLOCKED (IXD-4 interim guard mandatory) |
| P39 | 21 vs 22 | Offline assertive (21) vs polite (22) — double announcement | Med | 21 §5.6/§8, 22 §8 | NEEDS REVISION (D3-15) |
| P40 | 14–25 | Every panel has a §13 code-defect list and preservation map ("No capability removed") | Low | e.g. 14 §9, §13 | PASS-SPEC |

---

## Contradictions & gaps

| ID | Type | Statement A (cite) | Statement B / what is missing (cite) | Severity | Proposed resolution |
|---|---|---|---|---|---|
| D3-1 | contradiction | 14 §5.2 has a Blocking row "Motion that never stops on an automatic trigger (WCAG 2.2.2)"; 19 §5.8 adds it to Publish | 25 §4.4 `publish_blocked.check_ids` closed enum lists only `vercel_connected, pages_ready, collection_lists, site_size, password_on_free, unresolved_images` (+ hard blockers). 25 says "Panel 14 owns the list", and T-AN-19 requires one value per Blocking row | Major | Add `motion_wcag_2_2_2` (or similar) to the enum |
| D3-2 | contradiction | 15 §6 Offline: "Create/Replace edit the document and save through the normal queue" (marked assumption) | 22 §5.3: "Needs a connection: … **Templates apply** … disabled with 'Needs a connection'" | Major | Choose one. 22's rule is safer: the backup checkpoint needs the server (15 §6 admits this) |
| D3-3 | contradiction | 16 §4.4: achievement toast in the checklist corner (bottom-left), 6 s, own `role=status aria-live=polite`, "stacked above Undo toasts … without covering them" | 22 §5.10: "≤1 transient + ≤2 persistent" (newest transient replaces), position bottom-right above the toast floor, "toasts stop owning a live region" | Major | Make the achievement a persistent-class toast in the 22 stack, or exempt it explicitly in 22 §5.10; one live pipe |
| D3-4 | contradiction | 23 §5.5: trial-ended "non-modal notice under the topbar … ✕"; 23 §8 `role=status` | 22 §4.2 banner priority list has no trial-ended entry; 22 §6 "trial reminders stay notifications + email, not banners"; 22 §8 "banners carry no live role" | Major | Add "Trial ended" to the 22 §4.2 list (info tone, dismissible per user per workspace) and drop `role=status` |
| D3-5 | ambiguity | SC-20 / 23 §4.2 / 01:128: ⋯ menu header shows the plan chip | SC-18 / 18 §5.1 / 01:142: ⋯ menu header entry "Search ⌘K" | Minor | Define the header as two rows (Search ⌘K, then plan chip) or put Search in the header and the chip as the first row |
| D3-6 | contradiction | SC-15: confirms only for the listed cases; "Any other confirm in panel text is overridden" (00:275-276; 24 §4.9) | Confirms not on the list: republish confirm (14 §5.6); Replace page confirm (15 §5.3; create confirm until T-4 is in SC-10 but not SC-15); Reload latest + Overwrite confirms (22 §5.4); "Remove protection and publish" confirm (23 §5.6); active-set Save confirm (23 §5.5a) | Major | Extend the SC-15 list with consequence confirms (replace, reload/overwrite, protection removal, active set, republish), or remove them from the panels |
| D3-7 | contradiction (AI leak) | SC-21 hides "History AI summary"; 12:96 "AI summary is hidden in this version" | 12:142 T-RT-09 "Saves inline compare still shows Visual/Semantic/AI summary" | Major | Rewrite T-RT-09 to Visual/Semantic only; AI variant marked inactive |
| D3-8 | ambiguity (AI leak) | 20 §0 / SC-21: `useAutoMilestone` (AI-12 milestone suggestion) is not mounted while the flag is off | 12:96 History target keeps "milestone banner" with no SC-21 mark | Minor (UNKNOWN whether the banner is the AI card) | State whether the milestone banner is AI-12; if so, mark it hidden |
| D3-9 | contradiction (AI leak) | SC-21: hide "AI copy in plan/upgrade dialogs"; 23 §14 pass-2 B3 "AI removed from the Upgrade dialog" | 23 §4.5 rule "Benefit rows are generated from PLAN_LIMITS FREE→PRO deltas"; PL-01 includes AI prompts/day and AI generations/month | Major | Add an exclusion clause: AI keys excluded while SC-21 is active |
| D3-10 | ambiguity | 09:88 keeps "Brand from logo/URL" as a subtask; 20 §1 "not AI" | SC-21 hides "Brand DS-AI entries"; 20 §4.7 "dsAi flag off → From logo/URL hidden (existing)"; root CLAUDE.md `NEXT_PUBLIC_FEATURE_DS_AI` = No | Minor | Decide whether From logo/URL ships this version; if yes, decouple it from `dsAi` |
| D3-11 | stale / scope | 16 §5.4, F-3, T-FR-09: "AI site arrives" flow | 20 §0: the wizard AI path (AI-14) is hidden | Minor | Mark it as legacy-AI-site only this version; F-3 deferred with AI |
| D3-12 | stale | 00-STRATEGY §8: "Later: interactions authoring, AI contract detail, multiplayer editing" | 19 and 21 are SPEC COMPLETE with full scope; 21 is flag-gated, 19 has no deferral | Minor | Update §8 scope and ordering; state whether 19 ships this version |
| D3-13 | stale | 00-STRATEGY §4: "Review task (Panel 12) … Publish task (Panel 12)" | 14 and 17 replaced the RT-10/RT-11 interiors | Minor | Point §4 to 14 and 17 |
| D3-14 | stale | 25 §4.3: Owner column "12 Review" for every review event | 17 owns client review end to end (17 header, SC-10 rows) | Minor | Owner → 17 |
| D3-15 | contradiction | 21 §5.6 / §8: Offline pill announced **assertive** | 22 §8: banners 4–10 (incl. 6 Offline) via the **polite** pipe | Minor | One announcement owner for offline (22 pipe); presence pill silent when the banner shows |
| D3-16 | consistency | SC-6 pattern "{Area} needs Editor access" (18 §7) | 14 §6 "Viewers can't publish — ask an editor"; 15 §6 "Viewers can't change pages"; 22 §5.11 "Form submissions need Editor access"; 18 "Editing needs Editor access" | Minor | Add a role-reason row to SC-11 / SC-18 with the canonical forms |
| D3-17 | consistency | 22 §5.3 "Needs a connection" | 14 "Can't publish while offline"; 18 "Can't do this while offline"; 24 "Can't restore while offline"; 17 client "You're offline — reconnect to approve or send" | Minor | One offline reason pattern in 00 |
| D3-18 | stale label | SC-16: a panel with an open ⛔ dependency shows "blocked by" | 15 status "SPEC COMPLETE · not VERIFIED" while T-TP-13 needs ⛔ P-TRIAL; 18 labels the same case "blocked by P-TRIAL (T-CP-07 only)" | Minor | 15 → "blocked by P-TRIAL (T-TP-13 only)" |
| D3-19 | ambiguity | 16 §7 `first_canvas_edit` "first committed document change **by the user** on this site" | 25 §4.2 "by **any** user, once per site"; 16 T-FR-11 "once per site" | Minor | Align 16 §7 wording to 25 |
| D3-20 | stale (AI) | 12:70, 22 §5.9 "all six tasks" | SC-21 hides the AI task → 5 tasks ship | Minor | "all tasks (six; five while SC-21)" |
| D3-21 | missing | 21 §5.2 banners "Ana saved changes · Get latest", "Ana applied the starter…" | 22 §4.2 banner priority list has no slot for them | Minor | Add a "Teammate change" entry (info) or declare them canvas-level |
| D3-22 | missing | 19 §5.4 IXD-3: Preview and `/share/<token>` run the interaction runtime | 17 §4.1 client snapshot `sandbox=""` (scripts off); not stated that interactions never play for the client approving | Minor | State it on the client page ("Animations don't play in review") or include `/review` under IXD-3 |
| D3-23 | consistency | 22 §7 Locked-on-Free banner actions: Upgrade / Ask the owner | 23 §5.5 Sites row banner: "Upgrade to edit and publish · Choose what stays active (owner)" | Minor | One banner sentence and action set; 22 §7 adopts 23's owner action |
| D3-24 | missing | 15 §5.5 saved template Delete "(Undo toast)" via `userTemplates.delete`; 24 row 44 "Delete → toast Undo" | UserTemplate has no `deletedAt` (24 UN-15); a hard delete means Undo must re-create (new ID) or use a grace window — unspecified | Minor | Specify grace-delete (as assets) or re-create with honest copy (24 §4.4) |
| D3-25 | stale citation | 23 §6 plan unknown → "unlocked-but-pending … same rule as unknown role, `SettingsTab.tsx:679-688`" | 10 §6 / 15 §6 changed the unknown-role rule to "unknown ≠ grant" (writes disabled) | Minor | Keep the plan rule (the server decides) but remove the outdated role precedent |
| D3-26 | missing | 14 §4.1 Checks list (13+ rows) and "See all ›" | No overflow or cap rule; "See all ›" destination not stated (vs 14 §5.1 rows open Compare) | Minor | Cap shown rows + "Show all n"; name the See all target |
| D3-27 | ambiguity | 12 footer 48 "only for tasks with actions" | 17 §4.3 shows a two-row footer (composer + "Send Round n+1") | Minor | State the footer height for two-row tasks |
| D3-28 | missing | 23 §5.5a "Choose what stays active" (sites + pages per site) | No search, sort or long-list rule; width not given | Minor | Add list rules (search above 20 rows, sort by edited date) |
| D3-29 | missing | 19 §6 states table | No loading or offline row (even "N/A") | Minor | Add an explicit N/A or behaviour |
| D3-30 | consistency (AI) | SC-3, SC-12, SC-18 AI rows marked inactive | SC-10 row 181 and SC-11 rows "AI prompt" / "AI site draft" (00:228-229) not marked | Minor | Mark them inactive (SC-21) |

---

## Consistency notes

- **Panel headers:** right tasks (14, 17) use header 48 + "‹ Back to Inspector" (only when the Inspector was visible) + ⋯ + ✕, per SC-1/RT. Areas (15) use 56 with the SC-1 back slot. Recently deleted (24) uses a subview back. Consistent with SC-1; 14 §4.1's mock omits the ⋯.
- **Menus:** header ⋯ menus carry area-level, rarely used actions (14 All releases/Unpublish, 15 Reload, 17 Re-send/Revoke). Item ⋯ menus carry item actions (15 Saved card, 19 interaction, 24 row). No panel in 14–25 redefines the SC-3 element registry; 19 extends it (Add interaction in Inspector ⋯) via the SC-10 row.
- **Modals and dialogs:** widths are 480 (question, 22/23), 720 (review/conflict/bounded, 14/15/18/22) and 640 (palette, no dim). Every Esc follows SC-2, except declared ones (Play running, prompt fields inactive).
- **Empty / loading / error:** sentence style is uniform ("Couldn't {x} — Retry"). Loading has three forms: skeleton (14, 15, 24), text (17 "Checking your access…", 21 "Finding people…", 18 "Loading…"), and permissive-unknown (23). 19 has none.
- **Confirmations:** see D3-6 — 5 panels keep confirms outside SC-15's closed list.
- **Undo:** the toast Undo ≥8 s rule and "disabled once superseded" (24 §4.4) are referenced by 15, 16, 19. 16's achievement toast at 6 s is not a recovery toast, so it is exempt, but its stacking conflicts with 22.
- **Shortcuts:** no panel in 14–25 adds a key except 18 (`/`, ⌘K scope) and 17 (client-page-local C). 14, 19, 21, 24 state "no new shortcuts". All refer to SC-12 for platform mapping.
- **Widths:** 360 tasks (14, 17), 240 local nav/popover (15, 18), 300 Inspector (19), 320 People (21), 360 "N more" (22). No conflicts found.
- **Naming:** SC-11 nouns are applied (release, Page template, Getting started, Round n, Free/Pro/Business). Remaining drift: role-reason and offline-reason sentences (D3-16, D3-17); "Recently deleted" is consistent in 14–25.
- **Status labels:** all 11 active panels use "SPEC COMPLETE … not VERIFIED" per SC-16; none uses the retired "DESIGN READY". 15 is the one panel whose label omits a ⛔ dependency that applies to it (D3-18).
- **AI deferral:** cleanly stated in 20 §0 and SC-21, and in the per-panel headers (01, 02, 03, 05, 09, 11, 12, 13, 16, 18, 22, 24, 25). The remaining leaks are 12 T-RT-09 (Major), 23 §4.5 benefit generation rule (Major), 12 milestone banner (UNKNOWN), plus Minor items L4–L8.
