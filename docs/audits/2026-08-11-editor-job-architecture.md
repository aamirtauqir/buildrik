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

## 5. What is verified, and what is not

Honest scope, so the next pass does not re-trust this one:

**Verified by reading code this pass** — the 13-panel config and router; the
Settings `NAV` (14 entries, 3 groups, 2 workspace links); `HistoryView` (2 tabs);
`PublishHistory`'s two mount points; the role model and its four gates; the
Topbar props contract; the modal file list; `S4`'s absence; the 416-board
clustering.

**Not yet traced end-to-end** — J2, J3, J4, J5, J6, J7, J13 at the depth §2 gives
J10/J11/J12. They are consistent between the sources as far as the family counts
go, which is why they were not prioritised, but "counts agree" is not "flow
agrees" — that is the mistake Finding B was made of.

**Open decisions** — Phase 5's target file (Phase 1/2 gate, unchanged) · M2 ·
M3 · Finding E (`S4`).
