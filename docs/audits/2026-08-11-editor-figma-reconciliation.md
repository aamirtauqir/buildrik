# Editor ⇄ Figma reconciliation — Phase 1/2

Started 2026-08-11. Target Figma file **not yet decided** — see "Open gate" at
the end. Everything in this document is source-agnostic: it is an inventory of
the codebase and of `g4GzQFqzNYz5sosz1QtZXC`, and holds whichever file the
design lands in.

Method: every claim below is read out of the code or out of `boards.json`, not
inferred from a name. Where a claim was wrong on the first pass it is corrected
in place with the correction noted, because a matrix that quietly fixes itself
is a matrix nobody can audit.

---

## 1. Codebase surface inventory

### 1.1 Panels — 13, and the three numbers that disagree

| Source | Count | What it is |
|---|---|---|
| `TabRouter.tsx` cases | 13 | what can render |
| `GROUPED_TABS_CONFIG` | 13 | what is configured |
| `RAIL_FIGMA` | **6** | what the rail draws |

Router ↔ config is an exact 13/13 match — no orphan case, no orphan config.

**Correction:** an earlier pass of this audit said "11 configured panels". That
came from `tabsConfig.ts`'s own header comment, which reads *"11 sidebar panel
definitions"* while the array beneath it holds 13. The comment is stale; the
array is right.

The 13: `add · templates · ai · layers · pages · components · assets ·
publish · history · review · content · settings · design`.

### 1.2 The rail draws 6 — deliberately, against a board

`RAIL_FIGMA` is one group of six: **Insert · Layers · Pages · Media · Content ·
Brand**, matching `S1 · Editor — ASSEMBLED` (node 52:2, rail frame 52:6). The
seven panels that leave the rail all keep verified entry points:

| Panel | Entry point | Verified |
|---|---|---|
| ai | canvas selection ✨ + ⌘K | documented in `tabsConfig.ts` |
| templates | Pages "From template" + ⌘K + `T` | documented |
| components | `⇧A` + ⌘K | documented |
| settings | topbar ⋯ → Site settings | documented |
| publish | topbar Publish | documented |
| history | topbar ⋯ → Version history | documented |
| **review** | `AquibraStudio.tsx:416` `openLeftPanelToTab("review")`; canvas comment → `CommentLayer.tsx:396` emits `ui:switch-tab` | **found by grep — missing from that doc block** |

→ **Finding A (doc drift, minor).** The off-rail list in `tabsConfig.ts` names
six of the seven. `review` is reachable but undocumented there.

### 1.3 Three rail render modes

`editorViewMode.ts` resolves `railMode` from the `?rail=` query param; default
`figma`, with `e3` switching on `fourToolRail`. So the zone rail (legacy) and
the tool rail (E3) are experimental modes behind a URL flag, not dead code.

→ **Class 8, experimental not obsolete.** No action without approval. (The
baseline lane's museum inventory captured both live at `?rail=e3` / `?rail=legacy`,
which corroborates this.)

### 1.4 Modals — 34 files, 0 orphans

Every modal has at least one consumer outside itself; nothing is stranded.
Two pairs needed a closer look:

| Pair | Verdict |
|---|---|
| `component-library/CreateComponentModal` (180 lines, used by `ComponentsTab`) vs `shell/modals/CreateComponentModal` (260 lines, used by `StudioModals`) | **Class 6 — duplicated in the codebase.** Same name, same user job, two implementations, two consumers. Needs a canonical pick. **Not touched without approval.** |
| `ecommerce/CollectionSetupModal` vs `shell/modals/CMSCollectionSetupModal` | **Not a duplicate.** The first prompts to create a Products collection when an e-commerce block is dropped; the second is the generic CMS collection wizard. Different trigger, different payload. Adjacent outcome only — recorded so nobody "consolidates" them later. |

---

## 2. Figma inventory — `g4GzQFqzNYz5sosz1QtZXC`

416 boards across 41 families, `generatedAt` 2026-08-08.

### 2.1 Panel → family coverage

| Code surface | Figma family | Boards |
|---|---|---|
| add | Insert | 13 |
| templates | Templates | 11 |
| ai | AI | 11 |
| layers | Layers | 18 |
| pages | Pages | 13 |
| components | Components | 8 |
| assets | Media | 26 |
| publish | Publish | 13 |
| history | History | 23 |
| review | Review panel | 13 |
| content | Content | 15 |
| settings | **`S7`** | **14** |
| design | Brand | 28 |

→ ~~**Finding B (class 3 — code-only).** `SettingsTab` is a live, configured,
reachable panel with **no Figma family**.~~

**Finding B — WITHDRAWN 2026-08-11 (Phase 3 pass). It was wrong.**

The Settings panel *is* drawn. It is family **`S7`**, 14 boards: `S7 · Settings ·
General · Branding · SEO · Analytics · Localization · Domains · Export · Forms ·
Headers · Integrations · Redirects · Webhooks · Custom code`, plus
`Custom code · locked (Pro)`.

The first pass searched for a family **named after the panel**, and `S7` is named
after the **flow**. Every other panel happens to share its name with its family,
so a name-keyed lookup worked twelve times and failed silently on the thirteenth.
That is the failure mode this document was written to avoid — a count that reads
as a gap because of how the question was asked.

The real delta is **one screen, not thirteen**: code's `NAV`
(`SettingsTab.tsx:76-94`) has **14** entries, `S7` has 13 sub-screens. The extra
is `publish-history` — see **Finding C** in the Phase 3/4 document, where it turns
out to be a placement conflict rather than a missing board.

Class for Settings therefore moves **3 → 2** (present in both, inconsistent).

### 2.2 Families with no code surface

`Inspector (21) · Canvas (7) · Shell (7) + Shell states (13) · CmdK (7) ·
Preview (7) · Notifications (6) · Issues (5) · Compare (8) · Commerce (3) ·
Exit (2) · Onboarding (2) · Modal (5)` plus the S-flow families
(`S1 28 · S2 11 · S3 17 · S5 26 · S6 7 · S7 15`) and `Reference (15)`.

These are not gaps — they are cross-cutting surfaces (inspector, canvas, shell)
and journey boards, not left-rail panels. They are listed so the matrix does not
mistake them for orphans.

---

## 3. Matrix classes — first cut

| Class | Count so far | Items |
|---|---|---|
| 1 · consistent in both | 12 panels | the 12 with a family, pending per-board verification |
| 2 · present, inconsistent | **3** | Settings placement (Finding B, corrected); `PublishHistory` home (Finding C); History tab set (Finding D) |
| 3 · code-only | **0** | ~~Settings panel~~ — Finding B withdrawn |
| 4 · Figma-only | **≥3** | History · Backups (7 boards); Preview · performance audit (4); scheduled-publish (4) — all `[design-ahead]`, preserve per rule 4 |
| 5 · duplicated in Figma | **0 true duplicates** | 25 multi-board clusters detected; all resolve to screen + states, not copies — Phase 3/4 doc §5 |
| 6 · duplicated in code | **1 confirmed** | two `CreateComponentModal` (§1.4) |
| 7 · incomplete / broken | — | see the Media + Content arcs, already fixed and shipped |
| 8 · experimental | **2** | zone rail, tool rail (`?rail=`) |
| 9 · needs clarification | **2** | which Figma file is the target (below); the missing **S4** (Finding E) |

Phases 3 and 4 continue in
[`2026-08-11-editor-job-architecture.md`](./2026-08-11-editor-job-architecture.md).

---

## Open gate — blocks Phase 5 only

Two live instructions point at different files:

- **2026-08-08, approved:** full from-code rebuild in a **new** file, zero reuse
  of `g4Gz…`. That lane is still committing (`feat(baseline): …`, 160/212 frames,
  into `wQsxXDoVQ2LpPkpnaKIVtR`).
- **2026-08-11, this brief:** reconcile **into** `g4Gz…`, preserving its
  Figma-only extensions.

Both running unreconciled produces exactly the duplication this brief forbids.
Phases 1–4 (inventory, matrix, job architecture, screen inventory) are
file-agnostic and continue regardless. Phase 5 — creating frames — does not
start until the target file is named.
