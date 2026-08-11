# Editor ⇄ Figma reconciliation — Phase 3 (job architecture) + Phase 4 (minimal screen inventory)

Continues [`2026-08-11-editor-figma-reconciliation.md`](./2026-08-11-editor-figma-reconciliation.md)
(Phases 1–2). Same method: every claim is read out of code or out of
`scripts/conformance/boards.json`, and a claim that turns out wrong is corrected
in place with the correction visible. Phase 1/2's Finding B was corrected that
way today — see §0.

Both phases here are **file-agnostic**. They describe the Editor's jobs and the
minimum set of screens those jobs need; they hold whichever Figma file Phase 5
lands in. The open gate from Phase 1/2 still blocks Phase 5 only.

---

## 0. What the Phase 1/2 pass got wrong, and why it matters

**Finding B is withdrawn.** It said the Settings panel had zero Figma boards.
It has fourteen — family `S7`.

The lookup was keyed on family *name*. Twelve panels share their name with their
family (`Insert`, `Layers`, `Pages`, `Media`, `Content`, `Brand`, …), so a
name-keyed join worked twelve times and returned an honest-looking `0` on the
thirteenth, because `S7` is named after the flow rather than the panel.

The lesson is narrow and worth stating: **a join key that works for the majority
will report the minority as absent, not as unmatched.** The rest of this document
therefore joins on *job*, never on name — which is also what Phase 3 asks for.

---

## 1. The job inventory — 13 jobs, derived not invented

The brief forbids inventing jobs. Each job below is named by the surfaces that
already implement or draw it, with the evidence attached. Two sources contribute:

- **The Figma S-spine** (`S1`, `S2`, `S3`, `S5`, `S6`, `S7`) — already
  journey-shaped, already job-named.
- **The panel families** (`Brand` 28, `Media` 26, `Inspector` 21, `Layers` 18,
  `Content` 15 …) — job-shaped but numbered by surface, not by journey.

Neither source is a complete job map alone. The S-spine covers 6 journeys and
omits the two largest families in the file; the panel families cover surfaces but
not the cross-panel journeys (opening a site touches no panel at all).

| # | Job | Figma evidence | Code evidence | Panels involved |
|---|---|---|---|---|
| **J1** | Open or resume a site | `S1 flows` 28 · `Shell states` 13 · `Exit` 2 | `AquibraStudio.tsx`, `RecoveryBanner`, `LoadErrorBanner`, `ConflictModal` | none — shell only |
| **J2** | Add content to a page | `Insert` 13 · `Templates` 11 · `Components` 8 · `Media` 26 · `S3.1`/`S3.2` | `BuildTab`, `TemplatesTab`, `ComponentsTab`, `MediaTab` | add · templates · components · assets |
| **J3** | Arrange page structure | `Layers` 18 · `Pages` 13 · `S3.3` | `LayersTab`, `PagesTab`, `PageTabBar`, `StructurePopover` | layers · pages |
| **J4** | Style an element | `Inspector` 21 · `Canvas` 7 · `S3.11` | 15 `inspector/sections/*` + 7 sub-dirs | inspector (not a rail panel) |
| **J5** | Manage the brand system | `Brand` 28 | `DesignSystemTab`, `editor/design-system/` | design |
| **J6** | Bind dynamic data | `Content` 15 · `Commerce` 3 `[not-implemented]` | `ContentTab`, `CMSCollectionSetupModal`, `CMSRecordsModal` | content |
| **J7** | Check breakpoints & preview | `Preview` 7 · `S3.4` · `S3.8` | `PreviewOverlay`, topbar `onPreview` | none — shell only |
| **J8** | Review & approve | `Review panel` 13 · `S5 flows` 26 · `Compare` 8 · `Orphan comments` 3 | `ReviewTab`, `SendForReview`, `CommentLayer`, `StaleApprovalModal` | review |
| **J9** | Resolve issues before shipping | `Issues` 5 · `Publish · pre-checks` ×2 | `IssuesPanel`, topbar `issues` chip | none — shell only |
| **J10** | Publish & deploy | `Publish` 13 · `S6 flows` 7 | `PublishTab`, `PublishConfirmModal`, `usePublishJob` | publish |
| **J11** | Recover previous work | `History` 16 + 7 `[design-ahead]` · `S1.2` | `HistoryTab`, `PublishHistory`, `composer.history` | history |
| **J12** | Configure the site | `S7` 14 · `Shell · Project settings (modal)` | `SettingsTab` (14-entry `NAV`) | settings |
| **J13** | Navigate & stay informed | `CmdK` 7 · `Notifications` 6 · `S3.10` · `S3.14` | `CommandPalette`, `NotificationPanel`, `useEditorShortcuts` | none — shell only |

**Jobs do not map 1:1 onto panels, and that is the finding.** Four jobs (J1, J7,
J9, J13) use no left panel at all. One job (J2) spans four panels. One panel
(settings) serves exactly one job. A rail built from panels will therefore never
express the job architecture on its own — the topbar, the canvas and the shell
carry a third of the product's jobs.

### 1.1 `S2` is not an Editor job

All 11 `S2` boards carry the literal prefix `[dashboard-flow]`
(`S2.1 · brief`, `S2.2 · generating`, `S2.3 · result`, `S2.4 · unavailable`,
`S2.5 · chat · reject`). AI *site generation* is a dashboard onboarding job. The
Editor's AI surface is the separate `AI` family (11 boards: idle, planning,
thinking, running, scoped, step-gate, step-failed, done, stopped, error-quota,
not-configured), which is an *assistant inside* J2/J4 rather than a job of its
own — it has no entry point, no exit point and no success state of its own; it
always terminates in an element edit.

So the AI panel is deliberately **not** J14. It is a modality that J2 and J4 both
open. This is also what the code says: `tool: "assistant"`, `placement: "topbar"`
(`tabsConfig.ts:341`) — a contextual surface, not a destination.

### 1.2 Finding E — there is no `S4`

`grep -c 'S4' boards.json` → **0**. The spine runs S1, S2, S3, S5, S6, S7.

I am not going to guess what S4 was. What can be said from evidence: the gap sits
exactly where the two largest unnumbered families would go (`Brand` 28 and
`Media` 26 — J5 and the library half of J2), and those are the only jobs of
comparable size with no journey boards. Either S4 was deleted, or it was never
drawn, or the numbering was never meant to be dense.

→ **Class 9 · needs clarification.** One founder sentence closes it. It does not
block Phases 3–4 and it does not block Phase 5.

---

## 2. Job anatomy — the three jobs with a live conflict

The brief requires entry point, intent, permissions, start state, primary path,
decision points, alternative paths, validation, loading, success, error/recovery,
exit and next action for every job. Writing all thirteen at that depth before any
of them is settled would be transcription, not design. The three below are
written in full **because they are the three that conflict** — J11, J12 and J10
disagree between code and Figma about where the same capability lives. The
remaining ten are consistent enough to be written against a settled IA, and are
scheduled behind these.

### J11 · Recover previous work — **the tab set conflicts**

| | Code | Figma |
|---|---|---|
| Tabs | `HistoryView = "saves" \| "changes"` (`tabs/history/types.ts:8`) | `Saves` · `Published` · `Backups` `[design-ahead]` |
| "Changes" | a **tab**, sibling to Saves | a **state**: `History · Saves · changes` |
| "Published" | **absent from the panel** | 6 boards under `History · Published` |

→ **Finding D (class 2).** Two disagreements, and they resolve in opposite
directions:

1. **Changes → state, not tab.** Figma already models it as
   `History · Saves · changes`, one of nine states under `History · Saves`. This
   is exactly Phase 4's own rule (§4) — a view over the same list, same entry
   point, same permissions, no distinct user decision. **Figma is right. Fold the
   Changes tab into a filter on Saves.**
2. **Published → belongs here.** Figma gives it 6 boards under History. Code has
   no Published tab at all. See Finding C.

**Recommended canonical J11:** History = `Saves` (with a changes filter) ·
`Published` · `Backups` (design-ahead, preserved per rule 4).

- **Entry point** · topbar ⋯ → "Version history"; shortcut `H`; `⌘H`
  (`useEditorShortcuts.ts:114`)
- **Intent** · "get back to a version that worked"
- **Permissions** · read = any role; **rollback = ADMIN**
  (`PublishHistory.tsx:53`, `roleAtLeast(role,"ADMIN") !== false`). `null` role
  means unknown → do not gate; the server enforces (`RoleService.ts:26-28`)
- **Start state** · `History · Saves` (or `· loading`, `· empty`, `· load-error`)
- **Decision points** · restore a save · time-travel · roll back a deploy
- **Validation** · `restore-confirm` before any restore; `roll-back confirm`
  before a deploy rollback; both destructive
- **Loading** · `restoring` / `redeploying`
- **Success** · `restored` — next action returns to canvas with the restored tree
- **Error / recovery** · `failed`, `restore-failed`, `pruned-notice` (the version
  is gone, not merely unreachable — a different message)
- **Exit** · panel close → canvas

### J12 · Configure the site — 14 code screens, 13 boards

- **Entry point** · topbar ⋯ → "Site settings"; shortcut `S`. `mode: "fullpage"`
  (`tabsConfig.ts:219`) — routes through `FullPageRouter`, not the drawer
- **Intent** · "make the site's own settings right", not "edit the page"
- **Permissions** · Domains is role-gated (`DomainsScreen.tsx:67`); `Custom code`
  is Pro-gated (`S7 · Settings · Custom code · locked (Pro)`). The board
  `[superseded 2026-08-07 — Pro lock moved to Custom code] S7 · Settings ·
  Headers · locked (Pro)` records that the lock **moved off Headers**; the file
  already carries the correction, so do not re-lock Headers
- **Groups** · `SITE` (general, branding, seo) · `DISTRIBUTION` (publish-history,
  export, domains, analytics, localization) · `PLUMBING` (custom-code, redirects,
  headers, forms, integrations, webhooks) — `SettingsTab.tsx:76-94`
- **Exit points that leave the Editor** · `WORKSPACE_LINKS` — Members, Billing —
  open dashboard URLs in a new tab (`SettingsTab.tsx:122-125`). The comment there
  records that day-1 shipped 8 such links and only 3 had real backing pages;
  **do not draw workspace links Figma-side without checking the dashboard route
  exists.** A 404 behind a settings row is worse than an absent row
- **Delta vs Figma** · exactly one screen: `publish-history` → Finding C

### J10 · Publish & deploy — where `PublishHistory` actually lives

→ **Finding C (class 2).** `PublishHistory` is **one component with two code
mount points**, and Figma puts the job at a **third** location:

| Location | Evidence |
|---|---|
| Publish panel | `PublishTab.tsx:451` — `<PublishHistory siteId onRollbackStarted>` |
| Settings › Publish history | `SettingsTab.tsx:694-696` — `<PublishHistory siteId>` |
| **History › Published** | Figma: 6 boards, `History · Published · …` |

No code duplication here — the component is shared, which is correct. The
duplication is **in the information architecture**: the same job answers to three
addresses, and the two code addresses are the two Figma does *not* draw.

**Recommendation (rule 2 — Figma owns IA; rule 1 — code owns capability):**
`History › Published` is the canonical home, because "which version is live and
can I go back" is a recovery question and users already look for versions under
History. Keep the Publish panel's embedded list — it is post-publish context at
the moment of publishing, a different question ("did mine land?"), not a second
home. **Drop `publish-history` from the Settings nav.** That resolves Finding C
and closes the last 14-vs-13 gap in J12 with the same edit.

This is a founder call, not a code call — it changes navigation. Flagged, not
executed.

---

## 3. Permissions model — one table, five roles

`RoleService.ts:13-20`. Ranks: `VIEWER 0 · EDITOR 1 · DESIGNER 1 · ADMIN 2 ·
OWNER 3`. **EDITOR and DESIGNER are the same rank** — a role gate cannot
distinguish them, so any board that draws a DESIGNER-only capability is drawing
something the code cannot enforce. The file has `Reference · Permissions —
DESIGNER` and `Reference · Permissions — VIEWER` boards; the DESIGNER one needs
checking against this rank table during Phase 5.

Verified gates:

| Gate | Minimum | Code |
|---|---|---|
| Apply a template | ADMIN | `TemplatesTab.tsx:162` |
| Roll back a deploy | ADMIN | `PublishHistory.tsx:53` |
| Domains | role-gated | `DomainsScreen.tsx:67` |
| Read-only chrome | `VIEWER` | `StudioHeader.tsx:190` |

**Two invariants the design must respect**, both stated in the code:

1. **Denied controls render disabled with the reason attached, never hidden**
   (`RoleService.ts:2-4`). So there is no "VIEWER variant with the button
   removed" — there is a disabled state plus a reason string. The topbar already
   carries `readOnlyReason` and `publishBlockedReason` for exactly this.
2. **`null` role is "unknown", never a grant and never a lock** — the chrome
   stays as-is and the server enforces (`useEditorRole.ts:3-5`). So there is no
   third visual state for "role unknown"; it renders like the permitted state.

---

## 4. Phase 4 — minimal screen inventory

### 4.1 The test, applied

Before a separate screen: can this be a state, section, tab, drawer, nested
panel, popover, context menu, modal, inline edit, progressive disclosure, or a
component variant? A separate screen only for a genuinely distinct **step,
context, permission boundary, or user decision**.

### 4.2 What the 416 boards already are

Clustered programmatically by name stem:

- **339 distinct screen roots**; 25 clusters hold more than one board
- **77 boards are states of another board**, not screens
- The largest state-clusters are already correctly modelled:
  `History · Saves` (9 states), `Inspector · profile` (7 element profiles),
  `[design-ahead] History · Backups` (6), `History · Published` (5),
  `Media · drill-in` (5), `Media · fullpage` (5), `Brand · presets` (4)

→ **Class 5 (duplicated within Figma) = 0 true duplicates.** Every multi-board
cluster resolves to one screen plus states. The file was built state-first, which
is the discipline Phase 4 asks for — it does not need a de-duplication pass. This
supersedes the Phase 1/2 row that listed class 5 as "pending".

Two clusters are worth naming because they look like duplicates and are not:

| Cluster | Verdict |
|---|---|
| `Media · drill-in ×5` + `Media · fullpage ×5` + `Media · modal ×3` | **Three contexts, one library.** Panel (pick), fullpage (manage), modal (choose-for-element / replace-across-site). Different entry point, different permission surface, different exit. Genuinely three screens, not one screen thrice. Board `Media drill-ins — the five destinations` documents the panel set deliberately |
| `S3.6 · media ×4` (`editing`, `optimizing`, `image-editor (modal)`, `optimise (drill-in)`) | **One modal + one drill-in + two loading states.** `ImageEditorModal` is real code (`media/ImageEditorModal.tsx`, shipped in the rail-drawer arc). Collapses 4 boards → 2 screens |

### 4.3 Merge decisions — the four that change the product

| # | Merge | Basis | Status |
|---|---|---|---|
| M1 | History `Changes` tab → a **filter state** on Saves | Figma already draws it as `History · Saves · changes`; same list, same entry, same permission | **Recommended** — code change |
| M2 | `publish-history` **out of** the Settings nav | One job, three addresses (Finding C). History › Published is canonical | **Founder call** — changes navigation |
| M3 | Two `CreateComponentModal` → one canonical | Class 6, Phase 1/2 §1.4. 180-line (`ComponentsTab`) vs 260-line (`StudioModals`), same user job | **Founder call** — untouched pending approval |
| M4 | `Publish · pre-checks` + `· blocked` → one screen, two states | Same screen, blocked is a validation outcome | Already state-shaped in Figma; code should match |

**Not merged, on purpose:** `ecommerce/CollectionSetupModal` vs
`shell/modals/CMSCollectionSetupModal` — recorded in Phase 1/2 §1.4 as adjacent,
not duplicate. Restated here so M-numbering does not look incomplete.

### 4.4 Figma-only extensions — preserve, do not implement (rule 4)

| Extension | Boards | Note |
|---|---|---|
| `History · Backups` | 7 | full state set already drawn (creating/restoring/restored/restore-failed/empty/restore-confirm) |
| `Preview · performance audit` | 4 | plus 3 `[not-implemented]` Preview boards (a11y checker, interaction test, share link) |
| `S6.5 scheduled-publish` | 4 | incl. `cancel-confirm` and `invalid-date` |
| `S5.7`–`S5.9` | 3 | comment micro-states, multiplayer cursors, share-permissions modal |
| `Shell state 13 · Presence` | 1 | multiplayer |
| `S7.1 site-health-monitor` | 2 | |
| `Commerce` | 3 | `[not-implemented]` |

**Multiplayer is drawn in four places and is blocked in code.** The collab arc is
DEMO-ONLY pending OT/CRDT. These boards stay (rule 4: a Figma-only extension is a
planned extension, not a defect) but must be labelled as unimplemented so nobody
schedules them off the board count.

---

## 5. Second pass — two more jobs traced, three more findings

§2 covered the three jobs that conflict. This pass traced the two largest
families to their code, because "the counts agree" is precisely the reasoning
that produced Finding B.

### J4 · Style an element — **7/7 exact, verified**

`Inspector · profile · …` draws seven element profiles: BUTTON,
**CONTAINER (fallback)**, FLEX, GRID, INPUT, MEDIA, TEXT.

`inspector/config/elementProfiles.ts` declares exactly seven:
`CONTAINER_PROFILE` (:50), `TEXT_PROFILE` (:70), `FLEX_PROFILE` (:88),
`GRID_PROFILE` (:108), `MEDIA_PROFILE` (:128), `BUTTON_PROFILE` (:137),
`INPUT_PROFILE` (:156) — and `getProfileFor` falls back to `CONTAINER_PROFILE`
for unmapped types (:179), which is what the board's parenthetical
"(fallback)" records.

→ **Finding F (class 1, verified — not assumed).** Seven profiles, same seven
names, same fallback semantics, the annotation carried across. This is the one
surface in the file where a board documents an *implementation invariant* rather
than a layout, and it is correct. Nothing to reconcile.

The profile map is also the extension point the code names: "adding support for a
new element type is one entry in PROFILES, not a code change"
(`elementProfiles.ts:12`). So an eighth profile is a data row, not a redesign —
worth knowing before Phase 5 draws a board per profile.

### J5 · Manage the brand system — **the navigation models disagree**

> **Corrected 2026-08-12.** This section first read "4 tabs, 28 boards, correctly
> state-shaped", which conflated two different claims. *Component coverage* does
> agree — nearly every board has a code home, and the table below still holds.
> *Navigation* does not agree at all, and I asserted the first while implying the
> second. Board `152:2` was read afterwards and settles it. See Finding H.

`DesignSystemTab.tsx:82-88` — four sections: **Tokens · Styles · Components ·
Export**. The 28 `Brand ·` boards are states and sub-screens of those four, not
28 screens:

| Code | Boards it accounts for |
|---|---|
| `TokensSection` / `TokensRouter` / `TokenDetailView` / `TokenReplaceModal` | `tokens`, `tokens · add`, `tokens · replace`, `token-detail` |
| `StylesRouter` + `PRESET_CATEGORIES` (11) + `PresetBindingRow` / `PresetDetailPane` | `presets`, `· bound`, `· draft`, `· unbound` |
| `StarterGalleryModal` / `StarterGalleryMount` | `starters`, `starters · applied` |
| `DSLintBanner` / `DSLintMount` | `lint`, `lint · suppressed`, `lint-warnings` |
| `ExportSection` / `ExportDropdown` / `ImportCard` | `export · error / exported / imported`, `import-export` |
| `ComponentsSection` | `components` |
| `ColorModeToggle` / `ColorModeIconCycle` | `colour-mode` |
| `DraftChip` / `TabGuardModal` | `dirty` |
| `modals/ReviewModal` | `review-changes (modal)` |
| shell load path | `root`, `empty`, `loading`, `load-error` |

**A Phase 4 win worth naming.** There are **11 preset categories** in code
(`StylePresetRegistryContext.tsx:18-21` — button, card, form, link, badge, alert,
tooltip, modal, nav, table, layout). Figma drew them as **four states of one
screen**, not eleven screens. That is the §4.1 test applied correctly by whoever
drew it, and it is why the Brand family is 28 boards instead of ~60.

→ **`Brand · pro-locked`.** `UpgradeModal` is mounted once, globally, at
`AquibraStudio.tsx:616`, and the file already has `Shell · Upgrade modal (403
gate)` for it. So `pro-locked` is almost certainly Brand rendering that shared
gate rather than a Brand-specific screen — but no Brand-specific trigger was
located in `design-system/`, so this is stated as the likely reading, not a
verified one.

### Finding G — RESOLVED. `Brand · classes` is a site-wide class manager

Board `153:2` read 2026-08-12. It draws a **drill-in** (breadcrumb `‹ Classes`)
listing the site's CSS classes with a **usage count per class** and a `⋯` row
menu:

```
.btn-primary   used 12×      ⋯
.card          used  8×      ⋯
.section       used 22×      ⋯
.nav-link      used  6×      ⋯
.badge         used  4×      ⋯
```

**This is not the inspector surface.** `CSSClassesSection` edits the classes *on
the selected element*; it has no reason to know that `.section` is used 22 times
across the site. The usage count is the discriminator, and it is decisive.

→ **Class 4 · Figma-only extension. Preserve, do not implement (rule 4).** No
site-wide class registry exists in code — `classRegistry` / `allClasses` /
`siteClasses` / `classUsage` all return zero hits across `src/`. The adjacent
capability *does* exist for tokens (`TokenUsageChip`, `TokenDetailView`), so the
mechanism to count usage is already proven on a sibling concept; classes simply
never got it.

This was recorded yesterday as "feature to build, or board to move" — it is the
former. **One board read turned an unresolved question into a scoped feature.**

### Finding H — Brand's navigation model differs (class 2, structural)

Board `152:2` (`Brand · root`) is **not a tab bar**. It is a **nine-row drill-in
list**, each row with a count and a `›` chevron:

| Figma `Brand · root` row | Count | Code home | Code's shape |
|---|---|---|---|
| Tokens | 14 | `TokensSection` | **tab** |
| Presets | 18 | `StylesRouter` (11 categories) | inside the **Styles tab** |
| Starters | 6 | `StarterGalleryModal` | a **modal** |
| **Classes** | 12 | — | **absent** (Finding G) |
| Components | 27 | `ComponentsSection` | **tab** |
| Typography | — | `ui/type/` | inside the **Tokens tab** |
| Colour mode | — | `ColorModeToggle` | a **toggle** |
| Lint | 3 | `DSLintBanner` | a **banner** |
| Import / export | — | `ExportSection` + `ImportCard` | **tab** ("Export") |

Nine peer destinations in Figma; in code, four tabs plus a modal, a toggle and a
banner. Same capabilities, different mental model: Figma treats Brand as a
**directory you drill into**, code treats it as a **workspace you tab across**.

Two independent reasons this resolves toward Figma:

1. **Rule 2** — Figma is source of truth for navigation patterns and IA.
2. **The standing drill-in decision** — the sidebar is locked to drill-in stack
   nav. Brand's tab bar is the older pattern, surviving because nothing forced
   the question.

→ **Recommended: Brand root becomes the nine-row drill-in.** That single change
also promotes Starters, Colour mode and Lint from incidental chrome (a modal, a
toggle, a banner) to first-class destinations with a stable address — which is
what their board counts already assume (`starters` ×2, `lint` ×3, `colour-mode`
×1 cannot be reached as states of a banner).

**This is the largest single IA delta found so far**, and it was invisible to
every count-based check: the family count matched, the component coverage
matched, and the navigation was still wrong. Same failure shape as Finding B, one
level up.

### J2 · Add content — partially traced

Four panels, four families (Insert 13 · Templates 11 · Components 8 · Media 26),
plus `S3.1`/`S3.2` for the drag-and-drop half. The one permission fact confirmed:
**applying a template requires ADMIN** (`TemplatesTab.tsx:162`), which is a
notably high bar for what reads as a routine authoring action, and it is not
drawn on any Templates board. Flagged for Phase 5; the remaining J2 tracing is
scheduled behind the M2/M3 decisions because both change where components live.

---

## 6. What is verified, and what is not

Honest scope, so the next pass does not re-trust this one:

**Verified by reading code this pass** — the 13-panel config and router; the
Settings `NAV` (14 entries, 3 groups, 2 workspace links); `HistoryView` (2 tabs);
`PublishHistory`'s two mount points; the role model and its four gates; the
Topbar props contract; the modal file list; `S4`'s absence; the 416-board
clustering; the 7 inspector element profiles and their fallback; the 4 Brand
sections and the 11 preset categories behind them.

**Not yet traced end-to-end** — J3, J6, J7, J13, and the authoring half of J2, at
the depth §2 gives J10/J11/J12. Their family counts agree across the sources,
which is why they were not prioritised — but "counts agree" is not "flow agrees",
and that is exactly what Finding B was made of.

**Open decisions** — Phase 5's target file (Phase 1/2 gate, unchanged) · M2
(`publish-history` out of Settings) · M3 (canonical `CreateComponentModal`) ·
M5 (Brand root → drill-in) · Finding E (`S4`).

### Findings ledger

| | Finding | Class | Status |
|---|---|---|---|
| A | `review` entry point undocumented in `tabsConfig` | doc drift | Phase 1/2 |
| B | ~~Settings has no Figma family~~ | — | **withdrawn** — it is `S7`, 14 boards |
| C | `PublishHistory`: one job, three addresses | 2 | founder call (M2) |
| D | History tab set: `Changes` is a state, not a tab | 2 | recommended (M1) |
| E | No `S4` in the spine | 9 | needs one sentence |
| F | Inspector profiles 7/7, fallback included | 1 | **verified, nothing to do** |
| G | `Brand · classes` = site-wide class manager | **4** | **resolved** — Figma-only, preserve |
| H | Brand root: 9-row drill-in vs 4-tab bar | **2** | recommended (M5) — largest IA delta |

### Merge / change decisions

| # | Change | Basis | Status |
|---|---|---|---|
| M1 | History `Changes` tab → filter state on Saves | Finding D | **shipped** `a5607bfc` |
| M2 | `publish-history` out of the Settings nav | Finding C | **shipped** `a5607bfc` |
| M3 | Two `CreateComponentModal` → one canonical | Phase 1/2 §1.4 | open — founder call |
| M4 | `Publish · pre-checks` + `· blocked` → one screen, two states | §4.2 | open — code should match |
| M5 | Brand root → drill-in list | Finding H + standing drill-in decision | **partly shipped** `06142b1e` |

**M5 shipped the navigation model and the board's labels.** Five destinations
are live — Tokens · Presets · Components · **Lint** · Import / export.

**Lint shipped separately (`8764ffb9`)** and is the only row carrying a count,
because it is the only row with a real number to hand. `useDSLint` was extracted
so the banner, the row count and the destination read one debounced computation
rather than three that could disagree. The board draws `Fix ›` / `Open` per row
and **neither shipped**: `DSLinter.lint()` returns
`{ rule, severity, tokenId, message }` with no suggested replacement, so a Fix
button would have nothing to apply. A test asserts the section renders zero
buttons, so a later change cannot quietly add one. It also wired
`DSLintBanner`'s `onReviewAll` — a dead prop that `DesignSystemTab` never
passed, meaning the banner's "Review all" button had never once rendered.

Four rows remain unbuilt: **Classes** (Figma-only, rule 4 — Finding G),
**Colour mode**, **Typography** (`TypeTokenList` needs the token plumbing
`TokensSection` does internally), **Starters** (a modal, not a destination).

→ **Colour mode's reason, corrected twice. The record of both stands.**
First I wrote that its "tokens with no dark value" query does not exist. Then
that `DSLinter`'s `missing-dark` rule *is* that query. **Neither is right.**
`missing-dark` is **conditional** — `DSLinter.ts:141` only raises it when the
project already holds at least one `darkValue`, so a project with none produces
zero findings and the board's `NO DARK VALUE · 4` list would render empty at
exactly the moment it matters most. The unconditional query is the one
`ColorTokenList.tsx:243` already computes.

The real blocker was never the query — it was the write path, and it was worse
than missing. See Finding J.

### Finding J — the Dark value field discarded what you typed (fixed, `8b3df719`)

`TokenDetailView`'s dark-value input had an **empty `onBlur`**, commented
*"T8 ships only the local input — engine-side dark commit is a separate
follow-up (D4)"*. Type a dark value, blur, and it was gone. No error, no hint,
no trace.

That comment had stopped being true. `useColorTokens.updateToken` already
accepted a third `darkValue` argument — with a no-op guard, and a deliberate
decision not to push a dark-only edit onto the undo stack — added for the
token-import path. **The engine could commit dark values the whole time; the UI
seam was held shut by a comment describing a limitation that had already been
lifted.**

This is the fourth dead path this arc has turned up, and the first that loses
user input rather than merely failing to navigate:

| | Path | Symptom |
|---|---|---|
| — | `_leftPanelSubTab` | sub-tab deep links opened the right panel at the wrong screen |
| I | `onOpenPlugins` | targets a `plugins` screen absent from the Settings NAV |
| — | `onReviewAll` | never passed, so the banner's "Review all" never rendered |
| **J** | `TokenDetailView` dark `onBlur` | **typed input silently discarded** |

All four were TypeScript-clean. Types cannot see an empty handler, a discarded
destructure, or a prop nobody passes — only reading the path end to end does.
Colour mode is now unblocked.

**Two consequences M5 surfaced, both real:**

1. Switching sections is now two moves, and the unsaved-changes guard fires on
   the first — leaving dirty work behind is the thing it exists to catch.
2. The per-section dirty dot was permanently visible in the tab bar. On a
   drill-in it lives on the root row, and the root is unreachable while dirty.
   The always-visible in-section signal is the footer (`N previewing` / `All
   changes saved`). Nothing was lost, but the signal moved, and any board that
   assumes a persistent per-section dot needs to know that.

**M2 fixed a live bug on the way.** `openLeftPanelToTab(tab, subTab)` stored the
sub-tab, passed it to `StudioPanels` — which destructured it to
`_leftPanelSubTab` and never used it. Every sub-tab deep link opened the right
panel at the wrong screen, so the ⋯ menu's "Publish history" never reached
Publish history even before this change. Now wired end to end.

→ **Finding I (dead deep link, unfixed).** `onOpenPlugins` deep-links to
`("settings", "plugins")`, and `plugins` is not one of the Settings `NAV` ids.
Even with the plumbing repaired it resolves to nothing. Left alone because it is
outside the approved changes.
