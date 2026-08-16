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

**Open decisions** — ~~Phase 5's target file~~ **CLOSED 2026-08-11: `g4Gz`** · M2
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

---

## 7. B1 — J3 · Arrange elements and layers, traced live

Executed against `g4Gz` as the confirmed target, per
`docs/plans/2026-08-11-editor-figma-phase5-plan.md`.

### 7.1 What the panel actually offers

`role="tree"` / `role="treeitem"`, with a header carrying **Expand all layers ·
Collapse all layers · Layer display settings** and a per-row **Hide element ·
Lock element**. Footer counts layers.

| Board | State | Live |
|---|---|---|
| 142:2 | tree | ✅ 3 treeitems after two inserts |
| 143:179 | hidden | ✅ per-row Hide |
| 143:237 | locked | ✅ per-row Lock |
| 1082:4527 | context-menu | ✅ Rename · Duplicate · Delete |
| 1171:4829 | display-settings | ✅ ⚙ opens |
| 1082:4640 | expanded | ✅ expand-all / collapse-all present |

Six of the eighteen Layers boards walked, no page errors. **Not yet walked:**
dragging, invalid-drop, multi-select, filtered, no-results, empty, loading,
load-error, renaming, component-instance, scroll-overflow, list-view. Counting
them as covered would be the Finding-B mistake again, so they are listed as
outstanding.

Expand-all and collapse-all both reported 3 treeitems — the fixture was a
container with two flat children, so there was nothing nested to collapse. The
control exists; its behaviour is **unverified**.

### 7.2 Finding K — a closed panel still takes clicks (minor, real)

The sidebar panel when closed measures **1px wide, `opacity: 0`,
`aria-hidden="true"` — and keeps `pointer-events: auto`.** An element that is
invisible and hidden from assistive tech should not be hit-testable. The blast
radius is one pixel at x=60, which is why nothing has noticed, but the rule it
breaks is not a small one.

### 7.3 Four harness traps, recorded so the next pass does not re-pay them

This trace produced three false "the product is broken" readings before it
produced one true finding. Each is a property of driving THIS app:

1. **Clicking a rail button that is already active CLOSES the drawer.** Insert
   is the default tab, so "open Insert, then click a row" opens nothing and
   closes everything. Assert `!className.includes("--closed")` before acting.
2. **The rail tooltip (`Insert · A`) intercepts clicks** on rows beneath it.
3. **`click({ force: true })` makes trap 2 worse, not better** — it skips the
   actionability check and dispatches at the coordinates anyway, so the click
   lands on the tooltip. A forced click is not a workaround for an interceptor;
   it is a way to click the wrong thing silently.
4. **`[data-element-id]` does not exist.** Canvas elements carry
   **`data-buildrick-id`**. A wrong selector reads as "nothing was inserted".

With all four cleared, click-to-insert was confirmed working: Heading 1→2,
Button 2→3, with `Inserted: Button` / `Button selected` toasts. The prop chain
behind it is intact — `StudioPanels:355 → LeftSidebar:602 → TabRouter:127 →
BuildTab:44 → useBuildTab`.

---

## 8. B6 answers — and two of my own findings corrected

Founder answered the batch on 2026-08-11. Recorded with what the investigation
found, because two of the four questions were built on my own bad premise.

### M4 — one screen, two states. **Answered: one screen.**
`Publish · pre-checks` and `Publish · blocked` are one moment — the check ran and
the answer was no. Two frames would give one moment two addresses, which is the
mistake Finding C already documents for `PublishHistory`.

### Finding E — **WITHDRAWN. `S4` exists.** Same failure as Finding B.
Ten frames on page `1:3`:

`S4.1 · Tokens — add / replace` · `S4.2 · Presets — bound / unbound / draft` ·
`S4.3 · Starters — applied` · `S4.4 · DS lint — suppressed` ·
`S4.5 · Import/export — exported / imported / error`

**S4 is the Brand / design-system flow** — the same five destinations M5 shipped
as Brand's drill-in. It read as missing because the audit searched the `family`
field, and S-numbers are *flow* names, not family names. Settings hid under `S7`
for the identical reason. Two findings, one root cause: **a name-keyed lookup
against the wrong field, twice.**

→ **Finding L (real, and the reason the question was worth asking).** The file
carries **two S4 numbering schemes**. The frames above are Brand. But four
caption frames under the same number describe Preview:

`caption/S4.1 - share-preview-link` · `caption/S4.2 - preview-interaction-test` ·
`caption/S4.4 - accessibility-checker` · `caption/S4.5 - performance-lighthouse`

One of the two is mis-numbered. **Recommendation: S4 stays Brand** — ten frames
against four captions, and it matches the shipped drill-in. The four Preview
captions should renumber into the Preview family. Founder to confirm.

### M3 — canonical `CreateComponentModal`. **Answered: my call.** Recommendation:

They are not two copies. They are two architectures, and the cleaner one is the
weaker one:

| | `component-library/` (180) | `shell/modals/` (260) |
|---|---|---|
| shape | presentational — props in, payload out, no engine | connected — takes `composer` + `elementId` |
| fields | name · group | name · **description · category · tags** |
| variants | — | **variant sets** (`VARIANT_PRESETS`) |
| validation | disables submit on empty name | toasts on empty name and invalid state |
| prefill | `selectionContext.extractedBindings` — the **T12** flow, shows a binding count | `prefillFromDs` boolean |

**Canonical = `shell/modals/` (260).** It is a superset on product capability, and
the brief forbids simplifying away working functionality — dropping variant sets,
description, category and tags to keep the tidier file would do exactly that.

**But it is not a clean superset.** The 180-line one owns the T12 per-selection
binding pre-fill (`tokenBindingResolver.resolveForElements()` → a
`"elementId:prop" → tokenId` map, with the count shown to the user). The 260-line
one's `prefillFromDs` is a different feature — prefill from the design system, no
per-selection extraction, no count.

So consolidation is three steps, in order, and **not** a delete-and-repoint:
1. port `selectionContext` + its binding count into the 260-line modal;
2. repoint `ComponentsTab` at it (it passes a selection, so the `elementId` prop
   needs to accept the same shape A's caller supplies);
3. delete the 180-line file.

Step 1 before step 2, or the T12 flow ships broken. Not started — this is the
recommendation, not the change.

### Brand's three unbuilt rows — **Answered: build all three.**
Colour mode · Typography · Starters. `Classes` stays unbuilt (Figma-only, rule 4).
Order by readiness: **Starters** (a modal, smallest) → **Colour mode** (query
already exists at `ColorTokenList.tsx:243`; write path fixed in Finding J) →
**Typography** (needs the token plumbing `TokensSection` keeps internal).

---

## 9. Investigation — is the dropped-prop bug a species or a specimen?

Asked after fixing it: ComponentsTab passed its header "+" to
`PanelFrame.Header` as children, and that component takes its action slot as an
`actions` prop and never renders children. The button had never rendered, in any
mode. Three shapes could hide the same failure, so all three were swept.

### Shape 1 — a slot-prop component handed children

Ten chrome-ui components declare a named slot (`actions`, `footer`, `trailing`,
`leading`). Three of them never render `children` at all: `CommentRow`,
`FormatRow`, `VersionRow`. **Every call site of all three is self-closing**, so
nothing is being dropped. `PanelFrame.Header` has eighteen call sites and
seventeen are self-closing; ComponentsTab's four were the only ones.

→ **One instance, now fixed. Not a species.**

### Shape 2 — an optional callback nothing ever passes

**Corrected 2026-08-16.** The first pass of this sweep matched only the JSX
attribute form (`onX={`) and reported 24. That missed every prop passed as an
object property — which is how the inspector's section registry passes them
(`registry/visual.tsx`: `onAdvancedToggle: ctx.onAdvancedToggle`). Re-run
counting both forms: **194 optional `on*` props declared, 30 passed by nobody.**

`onAdvancedToggle` was in the wrong list. It is fully wired, and verified live:
selecting a Container and clicking the advanced disclosure ("Position, overflow
& visibility") takes the inspector from 52 to 76 controls, the control relabels
to "Less", clicking that returns to 52, and the open state survives
deselect/reselect. Nothing to fix.

Of the 30 that survive, most are library-shaped optional hooks in type files and
canvas hooks — `onChunk`, `onProgress`, `onMiss`, `onResize`, `onDropTargetChange`
— not UI. The ones that reach a rendered control, and what each does when the
prop is absent:

| Prop | Component | Behaviour when absent |
|---|---|---|
| `onBindRequest` | `DSBindingChip` | hint hidden — `showBindHint` requires it |
| `onJumpToDesign` | `DSStatusChip` | chip renders inert — `clickable = !!prop` |
| `onSecondary` | `StickyFooter` | button not rendered |
| `onCMSChange` | `ExportOptions` | block gated on `hasCMSBindings && onCMSChange` |
| `onDetached` | `DetachInstanceButton` | detach still runs; only the notify is skipped |
| `onSuggestionUsed` | `SmartSuggestions` | suggestion still applies; analytics notify skipped |
| `onThumbnailExtracted` | `VideoPreview` | extraction skipped by the same guard |
| `onWaitlist` | `LockedScreen` | **not gated** — but its whole branch is dead (below) |
| `onOpenSettings` | `SelectionLabel` | gear not rendered — **removed** |
| `onPreviewRetry` | `TemplateDetail` | retry not rendered — **removed** |

`onWaitlist` is the one that looked like a live dead button: `LockedScreen:48`
renders `<LockedBtn onClick={onWaitlist}>` with no guard on the handler. It is
saved only by an accident — the button is gated on `waitlistLabel`, and the
entire `coming-soon` variant that supplies it is never constructed.
`SettingsTab:601` passes `variant={requiredPlan}`, and `"coming-soon"` appears
nowhere in the repo as a value, only in the type union. So the branch, its
emoji, its title and its button are all unreachable. Note the contrast inside
the same file: the pro/enterprise path handles an absent `onUpgrade` by opening
the dashboard billing URL. One path has a fallback, the other has a bug that
cannot fire yet.

**The two removed** were removed rather than wired because there was nothing to
wire them to. `SelectionLabel` renders only while resizing or multi-selecting;
there is no collapsible inspector to open and no programmatic inspector-tab
switch, so its "Element settings" gear had no target and a gear appearing
mid-drag is not the fix. `TemplateDetail`'s preview is `template.gradient` — a
CSS gradient off a static module array, synchronous, so it cannot load and
cannot fail; a Retry button there is error handling for a scenario that cannot
happen.

**A real gap this surfaced:** the boards specify `Templates · loading`
(778:4102, skeleton cards) and `Templates · load-error` (781:4372, "Couldn't
load templates." / "You can keep building from Insert." / "Try again"). Both are
gallery-**list** states, not detail-preview states, and `SITE_TEMPLATES` is a
static module array that cannot fail. They need a server-backed catalog before
they can mean anything. Recorded, not faked.

### Shape 3 — a guard naming an API that does not exist

The fixed bug guarded on `composer.elements["getComponents"]`, a method that
exists nowhere. Swept for the same pattern: **it was the only string-indexed
`typeof … === "function"` guard in the repo.** Of the thirteen method names
guarded the ordinary way, four are absent from the engine — `build`,
`elementFromPoint`, `elementsFromPoint`, `scrollIntoView` — and all four are DOM
APIs being feature-detected, which is correct.

→ **One instance, now fixed.**

### Conclusion

The ComponentsTab defect was a specimen, not a species. Saying so matters: the
easy write-up would have implied the codebase is riddled with dropped props, and
the sweep says it is not. What the sweep surfaced instead is a different
list: affordances that exist in code and cannot be reached. Two are now deleted;
the `coming-soon` LockedScreen variant is the remaining one, and it carries an
ungated handler that will misfire the day someone constructs that variant.

---

## 10. Why none of this was ever caught — the gate never ran the check

Every finding in §9 was found by hand. That is the actual bug. This section is
the root-cause investigation into why a repo with sixteen CI gates let a header
button that never rendered, a canvas gear with no consumer, and a template retry
for an impossible failure all ship and sit.

### The check exists and works

`scripts/audit/ssot-scan.mjs` has had a dead-export check since the 2026-05-08
DS SSOT arc. It is category **6** of eight (`scanAntiPatterns`, `SCANS[5]`).

### The gate asks for four of the eight

`scripts/check-ds-ssot.mjs:19` invoked the scanner as:

```js
execFileSync('node', [SCANNER, '--json', '--category=1,2,3,4'], …)
```

Categories 5, 6, 7 and 8 had never run in CI. Not WARN-mode. Not baselined.
**Not run.**

### Proof, not inference

Planted `export const PROBE_NOBODY_IMPORTS_THIS = 42` in `editor/shell/`:

| | before |
|---|---|
| scanner, category 6 | reports it (2 hits) |
| `gate:ds-ssot` | `[ok] DS SSOT gate green` |
| `npx tsc --noEmit` | silent |

The check saw it. The gate did not ask. This is the exact failure shape recorded
in `feedback_gate_negative_test_or_it_lies` — a gate nobody watched fail.

### Why it was left out: the check was too noisy to enforce

Running category 6 on the tree returned **542** violations, of which 509 were
dead exports in product code. Classified by declaration kind:

| kind | count |
|---|---|
| `export type` / `export interface` | **407** |
| `export const` / `function` / `class` | 84 |
| unclassified | 18 |

Four out of five were **type-only exports** — `export interface SpacingSectionProps`
sitting beside `export const SpacingSection: React.FC<SpacingSectionProps>`.
That is idiomatic TypeScript: a component's props type is part of its contract
whether or not another file imports it today, and the check's own advice
("delete unused export") is wrong for it. Burying 84 real dead values under 407
false ones is a good explanation for why this category sat outside the gate for
three months instead of being drained.

### The fix

1. **Sharpened the check** — type-only declarations and `*.generated.*` files are
   no longer reported, and violations now carry real line numbers instead of a
   hardcoded `line: 1`. **542 → 118.**
2. **Wired the gate** to `--category=1,2,3,4,5,6,7,8`.
3. **Seeded the baseline** at the current 118 + 12 legacyResiduals. This is an
   explicit grandfather, stated here because the category has never run: the
   floor stops new dead exports, it does not claim the old ones are fine.
4. **Negative test, both directions** — a planted dead `const`/`function` now
   fails the gate with correct line numbers; a planted dead `interface` does not.

### What the newly-visible list points at

93 dead runtime exports remain in product code. Three are not cruft — they are
symptoms with a live defect behind them, and deleting them would have been the
symptom fix the Iron Law warns about:

- **`shared/constants/layout.ts`** — 8 of its 10 constants (`RAIL_W`,
  `INSPECTOR_W`, `TOPBAR_H`, `HEADER_H`, `TOOLBAR_H`, `FOOTER_H`, `ROW_SM`,
  `ROW_MD`) have no importer, while the file's own docstring says every chrome
  dimension "must come from here". They are not deletable: ESLint
  `buildrik/no-magic-layout-literals` (`eslint.config.mjs:181`, warn) points
  offenders *at* this file. They are un-migrated targets, not dead code — and
  chasing them surfaced two real bugs in the CSS that actually ships those
  numbers (below).
- **`editor/sidebar/useSidebarState.ts`** — the whole hook is unused, which is
  consistent with its three never-passed callbacks in §9.
- **`editor/canvas/controls/CommandPalette.tsx` → `useCommandPalette`** — unused,
  while the boards specify `Canvas · command palette (⌘⇧P)` (1177:4804). Worth a
  look before anyone deletes it.

### Two live defects found behind the layout constants

`editor/rail/LayoutShell.css` is where the chrome dimensions actually ship.

**1. The footer grid track was bound to the row token.**

```css
--layout-footer-height: var(--bk-size-row);   /* was */
--layout-footer-height: var(--bk-size-footer); /* now */
```

`--bk-size-footer` exists (32px) and the footer element already sizes off it.
Both tokens are 32px today so nothing moves, but the grid track that reserves
the footer and the element inside it were reading different tokens — a row
density change would have slid one out from under the other.

**2. Twenty-five fallback literals contradicted the tokens they back up.**

| variable | token | fallback said |
|---|---|---|
| `--layout-drawer-width` | 320px | 280px |
| `--layout-inspector-width` | 300px | 280px |
| `--layout-rail-width` | 60px | 56px *and* 60px |
| `--layout-footer-height` | 32px | **40px** |

These fire only if the token fails to load, so nothing renders wrong today —
which is precisely the problem. They encode the pre-2026-07-24 layout, so a
token-load failure would have degraded silently to the old dimensions instead of
breaking visibly, and the footer fallback shipped the one value DESIGN.md calls
out by name: "never 40" is load-bearing. Same shape as
`feedback_dev_configured_never_to_fail`. All four now match their tokens.

Live-verified after the change: rail 60, drawer 320, inspector 300, topbar 56,
footer 32; rail element 60px wide, footer element 32px tall. Unchanged, as
expected — the fallbacks never fired.

### `LockedScreen`'s coming-soon variant — a dead branch hiding a live defect

`variant="coming-soon"` rendered `<LockedBtn onClick={onWaitlist}>` with **no
guard on the handler** — the one genuinely ungated dead control in the sweep.
It never fired only because nothing constructs the variant: the sole call site is
`SettingsTab:601` (`variant={requiredPlan}`) and `SCREEN_PLAN_REQUIREMENTS` is
typed `Record<string, "pro" | "enterprise">`. Unreachable by type, not by luck.
Contrast the pro/enterprise path in the same file, which handles an absent
`onUpgrade` by opening the dashboard billing URL.

Removed, and `LockedVariant` narrowed to `"pro" | "enterprise"` so the type now
matches what can actually arrive. Its four tests went with it — and they are the
third instance this week of a suite passing over unreachable code because **the
test supplied the input that no call site passes** (`previewState` in
`TemplateDetail`, `variant="coming-soon"` here).

---

## 11. The drain, and the five blind spots it walked into

§10 turned the dead-export check on and grandfathered 118 violations. This is
what happened when the grandfathered pile was actually worked. **542 → 11.**

The headline is not the number. It is that **four of the five reductions came
from fixing the scanner, not from deleting code** — and that the first thing
checked, before deleting anything, was whether the list was true.

### Spot-check before you delete

`PagesTab` and `LibraryManager` were on the list. Both are live. TabRouter does
`React.lazy(() => import("./tabs/pages/PagesTab"))`, FullPageRouter does
`import("../media/LibraryManager").then((m) => ({ default: m.LibraryManager }))`,
and the check walked only static `ImportDeclaration` nodes. Deleting from the
report as written would have removed the Pages panel and the media library.

### The five blind spots, in the order they surfaced

| # | Blind spot | Cost |
|---|---|---|
| 1 | Type-only exports counted as dead code | 407 false (fixed in §10) |
| 2 | Dynamic `import()` invisible | 7 false, incl. Pages + Media |
| 3 | `e2e/probe` and `demo` not treated as consumers | 1 false — `PagesLoadingSkeleton`, built to board 774:4044 and mounted only by the probe until Pages goes async |
| 4 | Namespace imports (`import * as X`) invisible | 19 false, incl. all 11 CMS storage functions |
| 5 | Delegation to a module-private receiver called a pass-through | 14 false |

**Blind spot 4 was invisible until real cruft was removed.** Deleting the unused
`export * as CollectionStorage` alias in `engine/cms/index.ts` — a genuine
middle-man, since `CollectionManager` and `cmsSync` both import the module
directly — immediately reported eleven CMS storage functions the app calls
constantly. The alias had been masking the gap. Removing cruft made the report
worse before it made it better, which is worth expecting rather than panicking
about.

### What was genuinely drained

- **24 declarations deleted** — seven speculative `openai.ts` helpers (only
  `generateContent` has a caller), the unused storage/storageMigration
  wrappers, `autoScroll`'s pair, and orphan constants.
- **36 symbols un-exported** — used inside their own file, so only the `export`
  keyword was dead. `applySetStyle.ts` is the clearest: all ten flagged names
  are called by `applyAiEdit` a few lines down, and `applyAiEdit` is the only
  thing any consumer imports. Deleting them would have been wrong.
- **4 files deleted** — `useSidebarState.ts` (LeftSidebar keeps its own state),
  `UserSavedSection.tsx` (half of `ComponentsPanelV2`, deleted with the
  `COMPONENTS_V2` flag and left behind), `SvgIcon.tsx` (the catalog carries zero
  `html:` keys today), `settings/styles/index.ts` (inline-style objects
  superseded by `tw:`). Plus the stale `ComponentsPanelV2` mock in
  `TabRouter.mapping.test.tsx`, mocking a module that no longer exists.
- **3 dead aliases in barrels** — `parseHTMLToNodes`, `PresenceAvatars`,
  `export * as CollectionStorage`.

### What was deliberately kept, and now says so

- **`ExportDropdown`** — the one remaining product dead export. The Brand
  import/export flow is boarded at 153:120, 306:2232, 306:2265, 306:2298 and
  none of its other four pieces exist. Built ahead, not left behind; the file
  now carries that note, the way `PagesStateBlocks` already did. **The
  difference between the two states is only ever whether someone wrote it
  down.**
- **`isInteractiveType` / `isLandmarkType` / `canHaveChildren`** — still flagged,
  honestly: their Sets are exported, so a caller could use them directly. The
  founder kept them on 2026-05-08 because the names document intent at the call
  site. That reasoning now sits next to the code, not only in CLAUDE.md's
  cleanup history.
- **The eight `layout.ts` constants** — resolved by blind-spot-4's fix, not by
  deletion. Their consumer is the contract test that asserts each against
  DESIGN.md via `import * as layout`. ESLint `no-magic-layout-literals` also
  points offenders at that file, so they are un-migrated targets.

### Where it landed

`antiPatterns` **542 → 11**: eight dead exports (seven in test helpers, one the
annotated `ExportDropdown`) and the three settled predicates. The negative test
still fails on a planted dead `const`, and now correctly passes a planted dead
`interface` and a namespace-imported symbol. `verify:ds` green; 8189 tests pass.

---

## 12. The Templates load-error, and a claim I had to withdraw

§9 recorded the boarded `Templates · loading` (778:4102) and
`Templates · load-error` (781:4372) as **unbuildable** — "they need a
server-backed catalog before they can mean anything."

**That was wrong, and the mistake is worth more than the fix.**

I checked `SITE_TEMPLATES`, saw a static module array that cannot fail,
concluded there is no async load, and stopped. One file away,
`services/templateSync.ts` exports `hydrateUserTemplatesFromServer()` — a real
tRPC fetch of the workspace's saved templates that `AquibraStudio` has been
firing on every editor open since 2026-06-24. The catalog is half static and
half server-backed, and I generalised from the half I looked at.

### The defect underneath

The hydrate caught, `console.warn`'d and returned. A workspace whose saved
templates failed to load looked exactly like one that has none. The *mirror*
direction of this same wire (editor → server) had this fixed in E7 — the file's
own comment says so: "A failed mirror used to be console.warn'd and then dropped
forever… Now it queues + notifies + retries." The *hydrate* direction kept the
bug the mirror was fixed for.

It now reports `idle | loading | error | ready` through a subscribe channel,
using the same shape as the `SyncRetryQueue` already in that file.

### Where the board was followed, and where it was not

The block's look is the board's: red line, muted line, blue "Try again".

Its **placement is not**. The board draws the error replacing the gallery; this
renders it *above* the list. Per the founder's precedence rule — visual to the
board, behaviour to the code contract — a full-panel error would hide twelve
built-in templates that are a static array and cannot have failed, which makes
the board's own copy, **"You can keep building from Insert."**, a false
statement about the panel printing it. The copy is only true because the list
survives; obeying the layout literally would have falsified the words.

### Why the loading board is still not built

Not effort. Board 778:4102 draws a skeleton replacing the gallery, and the
gallery is never empty while loading — the built-ins are synchronous. **A
skeleton over content that already exists is the same lie as the full-panel
error.** Its one honest home is the *My Templates* filter when the local list is
empty AND the hydrate is in flight; that is where it belongs if someone wants
it, and it is a different surface from the board's frame.

### Verified

Live at 1440×900 with only the `userTemplates` request failing: the block shows
the board's three lines, four built-in templates still list underneath, and
"Try again" re-fires the fetch (1 request → 2). **Not verified live:** the block
clearing on a *successful* retry — that needs a real dashboard response, so a
unit test covers it instead.

---

## 13. Media boards walked live — six of twenty-nine

Board 146:32 (`Media · drill-in · versions`) had sat in the arc as "needs live
eye-verification" for weeks. It is the most expensive board in the family to
reach, and that is why: it needs a dashboard session, a **server-backed** asset,
and seeded restore points. The chain that finally worked:

1. dashboard `npm run dev` at :3000 against local Postgres
2. a magic-link token minted for a real workspace member (`generateToken`,
   identifier = USER ID) → `/auth/callback?token=…`
3. `storageState` saved once and reused, because `verifyMagicLink` is
   rate-limited to 5 per 15 minutes and I burned mine — the counter lives in
   `rate_limit_buckets`, keyed `::1:auth.verifyMagicLink`
4. the editor at `:5050/?siteId=…`, which reaches the dashboard through Vite's
   proxy so the cookie flows
5. three `media_asset_versions` rows seeded for the one asset that has a
   `serverId` — a local upload never gets one, and `AssetDetailOverlay` returns
   an empty list without it

### What matched

| board | verdict |
|---|---|
| 146:32 versions | matched **after a fix** (below) |
| 1163:13695 fullpage context menu | matched — order, 180px, 8px radius, red Delete |
| 1159:4593 fullpage library | matched — folders rail, Import URL / Upload / Add from stock, 2·3·4 column control, `used ×8`, quota footer |
| 144:2 grid | matched — header, search, `All ▾` + view/sort icons, four type pills, 2-col tiles, Upload/Stock/Icons footer |
| 782:4353 no-results | matched — "Nothing matches '…'." |
| 145:359 empty | matched — "No images or files yet." / Upload / Browse stock |

**The context menu is the load-bearing one.** It is the component whose
stylesheet was deleted this morning on the grounds that its "flowbite beats
`tw:`" claim was false. Seeing it render at 180px with an 8px radius and a red
Delete, in the running app, is what closes that loop — the CSS drain that
unblocked the push is verified on the exact surface that claimed it couldn't
work.

### The fix 146:32 needed

`formatRelativeTime(ts)` was called with no options, so `fallback` defaulted to
`"date"` and every version older than 24h printed `8/15/2026`. The board draws
`2d ago`, in a 320 panel whose row already carries a size delta and a `⋯`.

Fixed with a new `daysShort` fallback. The first attempt instead made the
existing `days` branch respect `format` — which broke three tests, correctly:
`format` also governs minutes and hours, and StudioHeader / NotificationPanel /
SaveStatus want short minutes with long days. They were depending on both halves
of the inconsistency.

After: `now · current` / `2d ago · +12 KB` / `5d ago · −4 KB` /
`12d ago · original`, which is the board's row set exactly. The restore band
matches too — "Restore?" / Cancel / Restore, 32px, bg-subtle, inline under its
row per board 146:64.

**A false bug I nearly filed:** the rows first read 1d/4d/11d, one short of the
board. That was my seed writing local wall-clock into a `timestamp without time
zone` column the app fills with UTC through Prisma — a +05:00 shift. Re-seeded
with `now() at time zone 'utc'` and the labels landed exactly. Seeded data is
part of the harness, and the harness is guilty until proven otherwise.

### Two deltas left open on 146:32

- **Per-version author.** The board prints a name under each timestamp ("Ali",
  "Sara"). `media_asset_versions` has no author column and `listAssetVersions`
  returns the raw rows, so there is no data behind it. Needs a schema decision.
- **Expand affordance in the drill-in header.** The board keeps `⛶` beside `✕`
  on every drill-in screen; the live drill-in shows only `✕`. Not fixed on
  purpose: `onOpenLibrary` takes `{ searchQuery, folderId }` and no asset, so
  `⛶` from a versions view would drop the user at the library root having lost
  their place — worse than its absence. Wiring it needs an asset-focus
  parameter first.

### The full walk — 22 of 29

| # | board | verdict |
|---|---|---|
| 1 | 144:2 grid | match |
| 2 | 145:2 filtered | match |
| 3 | 145:49 folder-scoped | match — "No assets matching this filter." |
| 4 | 145:199 quota-warn | match — "Almost full (86%)", "Optimise images to free space ›" |
| 5 | 145:250 quota-full | match — "Storage full … upload is off until you free space" |
| 6 | 145:300 drawer bulk-select | match — "1 selected · Move to… · Delete · Done" |
| 7 | 145:359 empty | match |
| 8 | 146:2 asset-detail | match — Alt text + ✨ Generate, five rows incl. "Versions 4 ›" |
| 9 | 146:32 versions | match **after a fix** |
| 10 | 146:68 used-in | match — "Not used on any page" / "Deleting this file won't change anything on your site." |
| 11 | 147:2 icon-picker | match — "‹ Icons", "17 categories" |
| 12 | 147:55 stock-browser | match — Orientation / Colour / Type, "Search to browse free photos." |
| 13 | 453:3931 load-error | match — "Couldn't load your media." / "Try again" |
| 14 | 782:4353 no-results | match — "Nothing matches '…'." |
| 15 | 1159:4593 fullpage library | match |
| 16 | 1162:4617 fullpage empty | match |
| 17 | 1163:4641 list-view · bulk | match — Name / Type / Size / Usage |
| 18 | 1163:13695 fullpage context-menu | match — 180px, 8px radius, red Delete |
| 19 | 1175:4827 delete-confirm | **bug found** (below) |
| 20 | 1205:4804 import-url | match |
| 21 | 1205:4816 import-url invalid | match — red border, disabled Import |
| 22 | 1205:4829 new-folder inline | match — "Enter to create · Esc to cancel" |

### Three bugs the walk found, all fixed

1. **Versions printed a date where the board draws "2d ago."**
   `formatRelativeTime` was called with no options, so anything past 24h fell to
   `toLocaleDateString()`. New `daysShort` fallback.
2. **"Delete 1 files?"** — the delete confirm's title branched on `isBulk`
   ("came from selection mode") instead of the count, and printed the plural
   directly above a warning reading "1 file is currently used on the canvas."
   Both existing tests stepped over it: one covers isBulk false, the other
   covers bulk(21), which is plural either way.
3. **One quota, two allowances.** The drawer read "4.3 GB of 5 GB used" while
   the fullpage footer read "4 GB / 4.66 GB" — a decimal formatter beside a
   1024-based one. Plans are sold in decimal GB, so the decimal one is now
   exported as `formatQuotaSize` and both surfaces use it.

### Two false bugs avoided

- Versions first read **1d / 4d / 11d**, one short of the board. That was my
  seed writing local wall-clock into a `timestamp without time zone` column the
  app fills with UTC — a +05:00 shift, not a defect.
- Uploading with the blob token absent reports "uploaded ✓" while the server
  400s, which looked like a silent failure. It is not: `MediaManager` keeps a
  retry queue with a `localOnly` flag, and `LibraryManager.tsx:430` surfaces
  **"This device only"** in the library footer.

### Not verified — seven, each with a reason

| board | why not |
|---|---|
| 777:4093 loading | transient; the panel hydrates faster than a screenshot can catch |
| 145:96 uploading | the in-flight progress state never renders long enough — the local IndexedDB write completes immediately |
| 145:148 upload-failed | the local write **succeeds** even when the server 400s, so the failed state does not render |
| 1163:13948 drag-over uploading | a synthetic `DragEvent` does not trigger the drop highlight; needs a real OS-level drag |
| 1164:4713 modal picker | the picker trigger was not located from the inspector's Background section |
| 1164:4738 replace-across | needs a successful blob upload of the replacement — `BLOB_READ_WRITE_TOKEN` is absent from `.env.local`, so `/api/asset-upload` returns 400 |
| 1174:4849 replace-across results | same blocker as above |

The last three are one environment fix away: setting `BLOB_READ_WRITE_TOKEN`
locally would make uploads real, which unlocks replace-across, its result
states, and a genuine uploading/upload-failed pair.

### A second pass — the first eleven

| board | verdict |
|---|---|
| 1205:4804 import-url | matched — "Import from URL", MEDIA URL label, Cancel / Import |
| 1205:4816 import-url invalid | matched — red border, "That is not a web address. It needs to start with http:// or https://.", **Import disabled** |
| 1163:4641 fullpage list-view · bulk-select | matched — bulk bar "1 selected · Move to folder... · Download · Delete · ✕ Clear"; columns Name / Type / Size / Usage; row IMG · 1.21 KB · used ×8 |
| 145:2 filtered / type pills | matched via the grid walk |
| 145:359 empty | matched |

Both import-url boards are also same-day work (`ImportUrlModal.tsx`), so this is
the second surface built this morning and confirmed in the running app rather
than only in tests.

### Not verified

**Eighteen of the twenty-nine Media boards were not walked**, among them the
upload/quota family (145:96 uploading, 145:148 upload-failed, 145:199 quota-warn,
145:250 quota-full), the drill-ins for icon-picker (147:2), stock-browser
(147:55) and used-in (146:68), the modal picker (1164:4713), replace-across
(1164:4738) and its result states (1174:4849), load-error (453:3931), loading
(777:4093) and drag-over uploading (1163:13948).

Also not observed: the `STOCK` / `AI` provenance badges, which exist in
`AssetCell.tsx:43-44` but had no asset with that provenance to render on; and
the `>20` type-DELETE variant of 1175:4827, which needs more than twenty assets
in the library to trigger.
