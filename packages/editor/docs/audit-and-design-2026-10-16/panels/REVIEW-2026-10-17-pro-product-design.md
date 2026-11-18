# Panel docs 00–13 + FD-DYN-01 — pro-product-design review

Date 2026-10-17 · Mode: READ-ONLY doc review (no app run, no doc edited)
Lens: `pro-product-design` skill — professional checklist + builder-product-patterns
Scope: `panels/00…13`, `CMS-DYNAMIC-BINDING-DESIGN.md`, plus cross-check against `PRODUCT-DESIGN-BRIEF.md`, `REMAINING-IA-HANDOFF.md`, `ARCHITECTURE-DECISION.md`
Method: 5 independent reviewers (shell/nav · make loop · CMS/components · assets/brand/settings · cross-cutting). Each finding cites file § and quotes the doc.

## Verdict

**~147 findings: 5 Critical, ~60 Major, rest Minor/Polish.** The panel internals are strong (preservation maps, one-writer ownership, state tables). The gaps are around them:

1. **Data-loss / false-safety paths are still open** while panels say READY (5 Critical).
2. **No strategy layer** — no JTBD, core loop, activation moment or north-star metric anywhere; the docs trace to code defects and BD IDs, not user goals. No usability test or instrumentation is planned.
3. **Whole surfaces have no spec** — Templates, first run, Publish end-to-end, client sign-off, ⌘K palette, interactions, AI contract, plan limits, session expiry, multiplayer.
4. **"DESIGN READY" overstated** — 8 docs say READY in the header and "Independent review pending" in the footer; geometry NOT MEASURED; runtime NOT RUN.
5. **Shared contracts (00) themselves conflict** — Esc ladder exceptions, Back targets, reserved browser/OS shortcuts, noun drift.

Recommendation: before Figma, fix the Criticals, write a 1-page strategy, reconcile READY status, add a glossary + shortcut scope table to 00, and spec the 3 most important missing surfaces (Publish, first run, Templates).

---

## A. Critical (5)

| # | File § | Issue | Fix |
|---|---|---|---|
| C-1 | 00 SC-9 · 08 §5 | FI-03 image-loss fix depends on P1-D18 with **no fallback** ("— (data-loss fix depends on it)"), yet 08 is READY. | Interim guard: block/warn page save while an image is a local blob. Mark T-AS-04 BLOCKED, 08 "ready except FI-03". |
| C-2 | 00 SC-9 · 10 §5 | Settings fallback = **last write wins** — silent overwrite, which the handoff forbids. | Make it release-blocking, or warn on concurrent settings edits until the revision stamp ships. |
| C-3 | 10 §4/§7 Access | Password protection is "Applies on next publish" — the user thinks the site is private while it stays public. Same lag on turning it off. | Inline warning "Your site stays public until you publish" + Publish button + Overview "Needs attention". |
| C-4 | 07 §6 Fields | Field type change/delete is guarded by **bindings only**, not by stored record values — an unbound field with 500 values can be wiped. | "{N} records have values" preflight; type change = conversion with preview; deleted-field tombstone. |
| C-5 | 07 §8 vs §5/§6 | Deleting a **collection** has no recovery (records get exact Restore). The rules also conflict: a bound field can't be deleted, but a bound collection can. | Soft-delete collections with Restore; block delete while bound, or justify the difference. |

## B. Themes (Major issues grouped)

### 1. Strategy, validation, measurement — missing
- No persona decision: three different primary-user statements (BRIEF :45 "professional solo designers…", HANDOFF :9 roles list, DYN §1 "designer/freelancer"). → pick one.
- 0 hits for JTBD / core loop / activation / north-star across 18 docs. Panels' §3 lists code defects, not user goals. → strategy one-pager + "Serves job …" line per panel.
- No usability test planned ("no user interviews or usability study were conducted"); T-IA-01–10 specified, not executed. → 5-user test of the core loop before build.
- No instrumentation events defined. → funnel + core-loop events per panel.

### 2. Surfaces with no panel spec
Templates workspace interior (IAF-06 one line) · first run / activation (empty canvas "Existing CTA unchanged", 5 competing actions) · Publish end-to-end (12 "Kept: Everything in RT-10"; no diff since last publish, failure jump-to-fix, rollback) · client review `/review/<token>` (the end of the persona's loop) · ⌘K palette (10+ entry points, button removed, no spec) · interactions/animation ("Add interaction" in 3 menus, no surface) · AI contract (7+ entries, two different undo models) · plan limits / upgrade (5 different treatments) · session expiry / re-auth · multiplayer (only presence) · shortcuts sheet + Ctrl mapping · undo coverage matrix · breakpoint model explained to the user.

### 3. Status honesty
- Header "DESIGN READY (pass 2…)" vs footer "Independent review pending" in 03, 04, 05, 06, 07, 08, 09, 11. Panel 11 still mentions the removed "interim viewer group".
- SC-9 is missing deps that panels rely on: bulk-operation API, field-write receipts, slug-taken-on-restore, server 100-component cap, server filter/sort at publish (07 §14, 13 §5).
- `ARCHITECTURE-DECISION.md` is a stale competing direction (top workspace switcher, Inspector 336) and is not marked SUPERSEDED.

### 4. Object model / noun drift (IA)
- **Template** = page starter / section card / CMS collection template.
- **Block** = all 69 registry types / 8 section cards.
- **Library** = Assets and components; library membership contradicts between 03 §6.6 and 13 §4; Components manager has 3 names.
- **Component**: master / definition / saved master / Library Component; "Publish as v{n+1}" overloads site **publish**.
- **Workspace** = organization and module. "Versions ›" opens History › Saves. "Snapshot" has 3 meanings.
- Page root: "Body" crumb / no Layers row / "Page context" in the Inspector. "previewed" vs "current" vs "authored" breakpoint.
- "3 unpublished" (no noun; 11 itself removed "Unpublished" as misleading). Optimise/Optimize, Colours/Color.
→ **Add a glossary to 00 and make it win like the other SC rules.**

### 5. Navigation, Back, Esc contracts
- SC-1 makes topbar Preview "direct" → from CMS it returns to Editor, contradicting 01 §5.8 / T-TB-06 and IA-03. Site settings return contradicts T-IA-09.
- Back labels: "‹ Back to {origin}" vs "‹ Review" / "‹ Inspector" / "‹ Add".
- SC-2 Esc exceptions are undeclared: 06 C6 (focus to canvas vs no-op), 03 "clears then blurs", 10 code field "leaves", 12 first Esc. Canvas Esc clears selection; the builder convention is Esc → parent.
- No URL state for workspace/record/task → reload always lands on Editor; same-site notifications leave the editor through the exit guard (02 §10, 01 §5.7).
- About 17 destinations; 7 have no visible persistent entry point (Templates, Components, Activity, Issues…).

### 6. Shortcuts — conflicts and reserved keys
⌘H (macOS hides the app — used as the viewer History door) · ⌘1/⌘2 and ⌘⇧]/⌘⇧[ (browser tab switching) · ⌘R reload (Rulers) · ⌘P print · ⌘B Bold vs Badges · ⌘⇧X strikethrough vs X-Ray · ⌘⇧V paste-plain vs Paste HTML · ⌃⇧T Windows reopen-tab · **F6** is the only region-jump contract and the browser owns it · ~14 single-letter keys with no off switch (WCAG 2.1.4) · `?` assigned to both Help and the shortcuts dialog · ⇧L vs type-ahead.
→ Add **scope** (canvas / inline-text / field / global) + **platform mapping** columns to the SC-3 registry; rebind the reserved keys; add a single-key toggle.

### 7. Make loop (Add / Layers / Canvas / Inspector)
- **Breakpoint cascade undefined**: inheritance direction, override indicators, reset to inherited, warning when a structural change affects every breakpoint; width ranges per breakpoint; "Wide 1920" is breakpoint or preset?
- 1440 fixed frame → Fit ≈ 52% at laptop widths; text editing / handles at that zoom not considered.
- **Lock scope** (element vs descendants) defined only for inserts. Add disables *drag* too when the selection is locked.
- **Multi-select** missing: insertion target, toolbar, multi-resize, "Mixed" values.
- **⌘Z focus scoping** (field undo vs document undo) and post-undo selection undefined.
- Layers indent capped at 4 levels → depth 5–12 collapses visually.
- Group vs Wrap contradicts SC-3; Layers has no Ungroup.
- Keyboard resize "Tab enters handles" conflicts with "Tab cycles elements".
- At ≤1366, opening the Inspector overlay after every insert covers the new element.

### 8. Recovery gaps (undo over confirm)
Page delete = confirm only, no Undo/restore (11 §5) · CMS Restore only from the toast, no "Recently deleted", no bulk restore · component master delete detaches all instances, toast-only recovery, ⌘Z excluded · Brand "Revert per change" vs the undo stack undefined · Layers multi-delete confirm + Undo (inconsistent).

### 9. CMS and Components lifecycle
Drafts of a published record impossible (next publish ships last save) · Published switch: commits on toggle or on Save? · "Live until next publish" state missing · adding a required field silently drops published records · slug/URL change has no redirect/404 handling · conflict "Review" screen undefined; schema/settings conflicts not covered · no content-editor role (EDITOR can delete collections) · each CMS tab commits differently · "Record history per CMS rules" points at undefined rules · **Components × CMS** binding undefined · same-site override reconciliation undefined · nested components / cycles missing · Preview of a Draft record contradicts D5 · deleting a template page gets no pre-warning · CSV import has no states/limits.

### 10. Assets, Brand, Settings
Usage scan skips favicon/OG/Brand references → "No known placements" delete breaks them · two upload homes for favicon/OG · Place on canvas: insert vs replace contradiction · no team library · 100% quota / partial batch undefined · alt text never requested at upload, no Missing-alt filter, no publish check · Replace across site leaves CMS on the old file · font removal has no usage warning · custom font from Brand ≈ 6 steps · no contrast check on colour picks · classes (shared styles) edited without usage/warning · type styles read-only · "Changes apply as you edit" ambiguous about live · Esc in the code field vs SC-2 · role-unknown drafts can be lost · dirty guard skips Publish/Preview · 404 owner, sitemap, cookie consent missing · domain states incomplete (SSL, apex/www, taken).

### 11. Shell and narrow widths
At ≤1280 the task sheet / at 1281–1366 the overlay hides the element Issues "Fix ›" or Review jumps to · Exit during a running publish undefined · topbar CTA progress state undefined (12 vs 01) · status click opens History even on "Unsaved" · Pages row click navigates and closes the sheet (blocks ⌘D/⌫ by mouse) · Pages sheet modality undefined · bottom-bar presence on Templates/Components/Compare/Preview undefined · "Reconnecting…" hidden at ≤1280.

### 12. Accessibility
Live dot and review chip distinguished by colour only (WCAG 1.4.1) · site identity not focusable (tooltip-only info) · single-key shortcuts with no toggle (2.1.4) · chevron 20px target (2.5.8) · F6 · no live regions for CMS save/bulk results · disabled picker rows unannounced · rail groups without `role="group"` labels · no contrast check in Brand.

---

## C. What to keep (all reviewers agree)
- Preservation maps in every panel ("No capability removed"), Keep/Fix/Move/Change per item.
- FD-DYN-01 one-writer-per-value ownership + exhaustive §14 state table; failures never clear a stored binding; legacy conditions never auto-activate.
- 03 single insertion contract across 10 routes; toast only after a successful write.
- 04 separation of Dim / visibility / Lock; 05 resize Esc fix; exact return (page, selection, breakpoint, zoom).
- 02 active-state matrix + roving tabindex; 12 single `activeTask`, Inspector stays mounted, focus restore.
- 10 scope chip ("Live immediately" vs "next publish"), separate Checking-access state, no false "Saved".
- Honest fallback labels ("Restore as new record", NOT RUN sections).

## D. Suggested order
1. Close C-1…C-5 (owner decisions + interim guards).
2. Strategy one-pager (persona, 3 jobs, core loop, activation, NSM) + events list.
3. 00 additions: glossary, shortcut scope/platform table, Esc exceptions, Back rule for Preview / Site settings, lock scope, breakpoint cascade, undo coverage matrix, limit/upgrade contract.
4. Reconcile READY status in 8 docs; mark ARCHITECTURE-DECISION superseded; extend SC-9.
5. New specs: Publish end-to-end, first run, Templates (Panel 15), ⌘K, client review.
6. Then Figma.

---

## Appendix — full reviewer tables

Raw finding tables (IDs as returned by each reviewer) are kept in the session; the IDs below map to themes above.
- **Shell/nav (01, 02, 11, 12):** S-01…S-30 — 0 Critical, 13 Major.
- **Make loop (03–06):** R-01…R-30 — 0 Critical, 14 Major.
- **CMS / Components / FD-DYN-01:** 1…30 — 2 Critical (C-4, C-5), 19 Major.
- **Assets / Brand / Settings (08–10):** R-01…R-26 — 2 Critical (C-1, C-3), 14 Major.
- **Cross-cutting:** X01…X31 — 1 Critical (C-2 / overlaps C-1), 24 Major.

---

## E. Applied 2026-10-17 (owner: "han likh do")
| Recommendation | Where written |
|---|---|
| C-1 image loss interim guard; T-AS-04 BLOCKED; usage scan incl. Settings/Brand | 08 §5, §6; 00 SC-9 ⛔ |
| C-2 settings concurrent-edit banner + read-compare-write; dirty guard covers Publish/Preview | 10 §5; 00 SC-9 ⛔ |
| C-3 password "stays public until you publish" + Publish now; OD-C3 (apply immediately) left for owner | 10 §7 Access |
| C-4 stored-data protection, field tombstone, type conversion, required-field preflight | 07 §6; 00 SC-9 ⛔ |
| C-5 collection soft delete, blocked while bound, Recently deleted; slug → redirects note | 07 §8; 00 SC-9 ⛔ |
| Strategy one-pager (persona, 3 jobs, core loop, activation, NSM, events, validation plan) | `00-STRATEGY.md` |
| Back rule for topbar doors from a workspace; one back-label pattern | 00 SC-1 |
| Esc: canvas → parent; declared exceptions | 00 SC-2 |
| Group ≠ Wrap; Ungroup in Layers; Lock ⌘⇧L; Arrange ⌘⌥]/[; delete = Undo everywhere | 00 SC-3 |
| F6 fallback chord | 00 SC-5 |
| Draft record in Preview; custom width ≠ export | 00 SC-8 |
| SC-9 extended (8 new rows) + ⛔ release-blocking marker | 00 SC-9 |
| Glossary | 00 SC-11 |
| Shortcut scope, platform mapping, reserved-key rebinds, single-key toggle | 00 SC-12 |
| Breakpoint ranges + cascade + override dot/reset | 00 SC-13 |
| Lock scope (descendants), Add drag stays enabled | 00 SC-14 |
| Recently deleted 30 days; page/main-component/Brand revert recovery | 00 SC-15 |
| Status vocabulary SPEC COMPLETE / VERIFIED; all 15 docs relabelled; stale "review pending" footers fixed | 00 SC-16; every panel Status line |
| Field-scoped ⌘Z; multi-select rules | 00 SC-17 |
| One-line contracts: plan limits, AI, session expiry, ⌘K, interactions | 00 SC-18 |
| Narrow widths never cover the target; no auto-open Inspector overlay after insert | 00 SC-19 |
| ARCHITECTURE-DECISION.md marked SUPERSEDED; brief index wording | parent folder |
| Publish end-to-end spec (X08) | `14-PUBLISH.md` (FD-PNL-14) — plus 10 code defects found in §13; SC-9 rows P-1…P-6 |
| Templates (X07) and First run (X06) specs | `15-TEMPLATES.md`, `16-FIRST-RUN.md`; code defects in §11 of each |
| Remaining surfaces (X05, X09–X14, X20 etc.) | `17-CLIENT-REVIEW` … `25-ANALYTICS-EVENTS` (9 specs), each reviewed once, findings fixed; rules folded into 00 SC-2/5/9/10/11/12/15/18/20 |

**Not done:** OD-C3 password applies immediately · per-panel Minor/Polish items (Panel 00 overrides cover the contradictions; panel body text was not rewritten line by line) · usability tests (00-STRATEGY §7).

## F. Second pass and backlog (2026-10-17)
- Panels 17–25: pass-2 `design-qa-critic` reviews run; all blocking items fixed (incl. consistency with SC-20 trial lock, SC-21 no AI, SC-22 accepted decisions).
- Older panels 01–16: pending follow-ups applied (log in session); Panel 10/11 lock rows and 07 collection-undelete correction added.
- `ENGINEERING-BACKLOG-2026-10-17.md`: 172 tickets (P0 19 · P1 24 · P2 65 · P3 64) + 16 deferred with AI; first sprint = 10 guard/security tickets.
- Still not done: runtime verification of anything; Figma; pass-3 reviews.
