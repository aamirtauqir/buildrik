# Panel 13 — Components manager: functionality specification (FD-PNL-13)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with 5 blocking, pass 2 one gap fixed). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected; owner instruction 2026-10-17: all recommendations accepted. Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, N1, N2, P4, C7, V1; gap rows T3-1, T3-2, T3-14, D2-8, D2-9, D2-24, T6-7, Q10, BD-17 (placement drift); CS-01, CS-14; matrix states offline / many items / long names. Round 2: Q10 (pointer — no bulk selection in the component list today, so no bar), Q15 *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: **BD-16** (reuse across sites in the same organization workspace; page-only scope kept), **BD-17** (Buildrick component package import/export in Add → Saved components → Manage components — *placement now the Components area's nav footer, §4; capability unchanged* *(R-1018)*), IA-01, **IAF-11** (A–M), **PKG-01** (`evidence/ia-final-2026-10-16/control-and-package-contracts.md` — package format, limits, validation, remapping; authoritative, not repeated here), GEO-01 (dedicated manager work area + detail 320; package dialog 720 / 480 / 960), Panel 02 (Components = module workspace, no rail item active), Panel 03 §6.6 (Add saved components), Panel 06 C7 (Save as component in shared action registry). FD-CMP-01 in the brief is proposal history; this panel supersedes its interface detail.

---

## 1. Purpose and boundary

Job: S supporting — "keep the site consistent" for J1 Build (reuse across pages and sites) (00-STRATEGY §3) *(R-1018)*

Components answers: **make something once, reuse it on any page or site in my workspace, keep it consistent, and move it between workspaces as an editable file** — always knowing whether a change is local or shared.

| In Components | Not here (owner) |
|---|---|
| Manage main components: list (This page / This site / Component library), detail, rename, duplicate, update from selection, detach all, used on, delete/recover, versions & updates, import/export packages | Inserting instances → **Add** (Panel 03); instance overrides/reset/detach/variant pick → **Inspector** (ComponentRow); organization library administration → **dashboard** (kept) |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/sidebar/tabs/ComponentsTab.tsx`, `component-library/*` (`ComponentDetailScreen.tsx`, `useComponentsState.ts`, `useComponentList.ts`, `instantiate.ts`, `openMasterRequest.ts`, `captureComponentThumbnail.ts`), `shell/modals/CreateComponentModal.tsx`, `inspector/sections/ComponentRow.tsx`, `inspector/shared/controls/OverrideDot.tsx`, `engine/components/ComponentManager.ts`, `ComponentInstances.ts`, `ComponentStorage.ts`, `services/componentSync.ts`; server `site-component.service.ts`, `routers/site-component.ts`; dashboard `components/library/library-panel.tsx`.

| ID | Capability | Today |
|---|---|---|
| CP-01 | Entry | off-rail **280 drawer** (expand 700); ⇧A; ⌘K "Open Components"; Add "Manage components ›"; Inspector instance "Edit master" (today's label; target "Open component", SC-11) (→ detail); "‹ Add" back row |
| CP-02 | List | "YOUR COMPONENTS" (site + page-scoped mixed) · "LINKED FROM LIBRARY" (only already-adopted); rows 32: name, New badge, "N on this site · linked", draggable; **no search, filter, row menu**; un-adopted library items only in Add |
| CP-03 | Create | doors: canvas context menu, Inspector header ⋯, panel "+ Create component" / empty-state link (toast if no selection), AI `save-as-component`; **no Layers door**; modal Name / Scope (This site / This page) / "Also convert N matching groups"; selection becomes first instance; **only non-empty name check; 100 cap not enforced** |
| CP-04 | Detail | inline rename; Insert; Update from selection… (confirm + Undo toast); Detach all; Duplicate main component (**drops variants and page scope**); Delete main component (today's labels say "master"); thumbnail; STRUCTURE; USED ON (jump to instance); "‹ All saved components"; **no read-only/lock checks** |
| CP-05 | Main component edit / instances | **no canvas main-component edit mode**; Inspector ComponentRow: Reset to master (today's label), Detach instance… (confirm, lock-gated), variant picker (always "Default" — **no variant authoring UI**, engine can); override dot per field; Layers ◇ badge; selection readout "Component instance · {master}" |
| CP-06 | Sync / library | **every main component without a page is already offered to the workspace's other sites** (`listComponentLibrary`, `site-component.service.ts:182-213`) — the library is not limited to adopted items, the editor list just shows only adopted ones; IndexedDB + server mirror with retry queue; same-ID adoption from Add; single version counter, **no revisions/pinning**; updates reach instances **within a site only**; **no cross-site propagation**; library list skips site-access filter (FI-05); failed library load returns `[]` silently |
| CP-07 | Delete / recovery | delete detaches instances then removes the main component; Undo toast via snapshot (⌘Z does not undo main-component operations); list-level delete dialog **never triggered** (`handleDelete`, `handleDuplicate`, `handleInstantiate` unused) |
| CP-08 | Import / export | **NOT FOUND** (BD-17 approved, PKG-01 specified) |
| CP-09 | Roles | viewers can't open; server upsert/delete EDITOR+, reads any member, workspace rename/delete ADMIN; dashboard OWNER/ADMIN |
| CP-10 | States | unavailable, error (**Retry only clears error**), empty (+ compact), loading, detach-all notice |
| CP-11 | Keyboard | rows `role=button` Enter/Space; live count; detail Esc backs out; USED ON Enter only; **no focus on mount** (stale comment) |

Tests: 27 files / 233 cases.

## 3. Problems this design solves
1. A cramped drawer for a management task with versions, usages and packages (IAF-11 F: dedicated work area).
2. Library is invisible in the manager until adopted; no search.
3. **Shared vs local unclear** and no update path across sites (BD-16 needs it explicit).
4. Duplicate loses variants and page scope (data loss).
5. Dead list actions, non-reloading Retry, missing read-only/lock checks, silent library failure.
6. Import/export missing (BD-17).

## 4. Layout — dedicated Components workspace

```
rail (no active) │ COMPONENTS NAV (240)       │ LIST (flex)                                 │ DETAIL (320)
                 │ ‹ Back to Add / Editor     │ [🔍 Search components]  Sort ▾  [+ Create]  │ Hero card
                 │ This page            3     │ ▢ Hero card  Component library v4 · 12 uses⋯ │ Component library · v4
                 │ This site           11     │ ▢ Footer        This site · 3 uses       ⋯   │ Update available (v5)
                 │ Component library   24     │ ▢ Pricing       Not on this site         ⋯   │ Used on · Structure
                 │                            │                                             │ [Insert] [Update from selection]
                 │ [Import package…]          │                                             │ ⋯ Rename · Duplicate · Export · Detach all · Delete
                 │ Recently deleted (2)       │                                             │
```
(Back slot per Panel 00 SC-1: left end of the 56px work-area header — not in the nav, so it survives the ≤1280 nav collapse.) Sketch position of the back link is illustrative.
- **Workspace** (Change from 280 drawer, IAF-11 F): rail item none active (Panel 02); header "Components" + scope; opened from all existing doors — **primary doors per N1** *(R-1018)*: **"Components ›" in the Add header** (Panel 03) and the **instance link in Layers** (◇ instance row → its main component, Panel 04); **no rail item**; Back label names the origin ("‹ Back to Add" / "‹ Back to Heading" from Inspector "Open component" / "‹ Back to Editor").
- **Nav sections** (IAF-11 E): **This page** (page-only main components for the current page), **This site** (**local main components + library items adopted on this site, each listed once** — an adopted item appears here only, never again under Component library; a *section*, not a create scope), **Component library** (accessible library components **not yet on this site** — NEW in the editor list; filtered by site access — Fix FI-05). *(R-1018, N2 — replaces "all library components, adopted or not", which listed an adopted item twice, T3-1; Panel 03 §6.6 counts derive from this rule.)*
- **List:** search (name) *(NEW)*, sort (Name, Recently updated, Most used), rows 40 (resource list): thumbnail, name, scope chip (This page / This site / Component library · v{n} — never "Library" alone, SC-11) *(R-1018, D2-24)*, usage count, status chip (**New** — existing badge kept / Update available / Local changes / Restricted), ⋯ row menu (Insert, Rename, Duplicate, Export, Delete — wires the existing unused handlers, Fix CP-07). **Drag to canvas moves to Add** (the workspace hides the canvas): drag/insert from Add › Saved components (Panel 03 §6.6); the row's **Insert** returns to Editor and inserts at the current target.
- **Import package…** in nav footer (BD-17 manager-level Import).
- **Topbar Publish here** *(R-1018b, owner Q15)*: opens the **Publish task in this area's task tray, in place** (SC-7) — the Components list and detail stay as they were.
- **Bulk selection** *(R-1018b, owner Q10)*: the component list has no multi-select today; its **Recently deleted** subview uses the shared bulk bar (SC-32) through Panel 24 §4.8. If list multi-select is added later it uses SC-32.
- **Recently deleted (N)** in the nav footer (NEW): subview per Panel 24 §4.8 with "‹ Back to Components"; rows "Detached 6 instances on 3 pages · Deleted by Ana · today" + "Deletes in N days"; Restore re-links detached instances that are unchanged since the detach; Delete permanently (ADMIN+, **typed confirm — SC-15 class c**, S2; replaces "non-typed", D2-9) *(R-1018)*. Also reachable from the delete toast "Recently deleted ›". *(amended 2026-10-17 — source: Panel 24 §4.8 / SC-10, SC-15)*

## 5. Create
- All existing doors kept + **Layers row menu "Save as component…"** (NEW, shared action registry, Panel 06 C7).
- Modal: Name (trim **1–200**, duplicate name → **inline warning under the field** "Another component is called Hero", Create stays enabled, no dialog (S2) *(R-1018)*), **Scope** radio per IAF-11 G: **Component library** (default; reusable on every site in this workspace — same as today's site main components, which are already library-visible) · **This page** (page-only, kept per BD-16); wording of the chosen scope shown before commit; "Also convert N matching groups" kept. Primary label follows scope: **"Create and share component"** (library) / **"Create component"** (page). (Today's "This site" create option maps to Component library — same backend behaviour; **Change: label only**.)
- Capacity: shown "N of 100" when > 80; at the cap Create disabled with reason — **server enforcement required** (today not an invariant, PKG-01).
- Result: selection becomes the first instance (existing); detail opens with the new component selected; Undo toast.

## 6. Detail actions

| Action | Contract |
|---|---|
| Insert | inserts at the Editor insertion target (Panel 03 rules), returns to Editor with instance selected |
| Rename | inline (existing); library identity rename requires ADMIN (IAF-11 H) — others see it disabled with reason |
| Duplicate | **Fix:** creates a fresh independent main component **with all variants, default variant, variant properties and page scope**; never overwrites |
| Update from selection… | **SC-15 class a — Undo only, no confirm** (S2; replaces the existing confirm) *(R-1018)*: toast names source and destination "Hero card updated from Section 3 on Home · Undo" (≥ 8 s); from the workspace (canvas hidden) **"Choose on canvas"** opens Editor in source-picking mode → select eligible source → "Return to component review" → **Update** (the review subview's primary, not a separate dialog) → Undo toast; Cancel restores the manager unchanged (IAF-11 G) |
| Detach all | existing scope: limited to accessible **current-site** instances, previews count, materializes full output; cannot detach other sites. **SC-15 class a — Undo only** (S2; the existing confirm, INV D15, is removed): toast "Detached N instances on M pages · Undo" *(R-1018)* |
| Used on | existing list; Locate opens exact page/instance with return to this detail and query |
| Delete | site main component: materialize instances before detach (existing), **no confirm** — Undo toast "{name} deleted · Undo · Recently deleted ›" (existing snapshot; the toast states "N instances on M pages were detached" — SC-15's "the confirm names…" line is read as this text, since component delete is not a declared exception E-1…E-5) + **Components › Recently deleted** for 30 days *(amended 2026-10-17 — source: Panel 24 §4.8 / SC-15)*; library identity (ADMIN): **tombstone** — hides from discovery, existing pinned uses keep rendering (IAF-11 H) |
| Export (NEW) | §8 |
| Versions / updates (NEW) | §7 |

Read-only / lock checks on every action (Fix CP-04): viewer never reaches it (rail/doors gated); locked instances skipped with reason in Detach all; role refusals inline.

## 7. Shared library, versions and updates (BD-16, IAF-11 D/G) — NEW, engineering required
- **Identity:** a Workspace Library Component with **immutable revisions** (v1, v2…) and a dependency snapshot; each site's adoption **pins a revision**. No automatic cross-site propagation (unchanged behaviour, now explicit).
- **Detail shows:** scope, current pinned revision, latest revision, **"Update available (v5)"** chip when newer exists.
- **Review update:** old vs new preview, affected instances on this site, override conflicts (stable node keys; ambiguous legacy positional overrides require user resolution), dependencies → **Apply to this site** (atomic, one receipt) / **Keep current**.
- **Local changes:** editing a library component on a site creates a **site-local draft** based on v{n}; status "Local changes"; **Share update v{n+1}** to the library (SC-11, 2026-10-17; was "Publish as v{n+1}") is ADMIN/OWNER only; others can "Keep as this site's copy".
- **Legacy data:** existing per-site copies are preserved; identical payloads may link to a library identity, divergent ones stay "Not linked — review" (no timestamp winner, IAF-11 K).
- Until revisions ship: library rows show "Component library" without version *(R-1018, SC-11)*; Update available never appears; behaviour = today (adopt latest copy at adoption time). **Rename and delete of a site copy keep today's site-edit permission (EDITOR+)**; the ADMIN rule and tombstones apply only once library identities/revisions exist.

## 8. Import / export packages (BD-17, PKG-01) — NEW
- **Export** (detail ⋯ or row ⋯; **one named main component per export**, PKG-01 initial scope; permission: source-site EDITOR, or workspace EDITOR with access to every included resource): dialog 720 / 480 / 960 (GEO-01): summary "Exporting main component Hero card", included dependencies (classes/tokens, media/fonts, CMS field requirements, nested components), **blocking items** (inaccessible media, unsupported content) with reasons → **Download package** (`.brcomponent`) enabled only when complete; "Download started" (not "saved"); export never changes scope, saves or publishes (PKG-01).
- **Import** (nav footer) — follows **PKG-01** exactly; dialog (720 / 480 / 960) steps: **Choose file → Choose roots → Confirm destination workspace/site → Validate + capacity review** (format, limits ≤50 MiB / ≤100 main components / ≤10,000 nodes, hashes, paths, cycles — before any write) **→ Map** (tokens/classes copy new by default or map to compatible; CMS field requirements map or block the root; media bytes ingested via Assets rules) **→ Review → Import → durable receipt** (per-root imported / blocked + reason). States: cancelled, interrupted, unknown outcome (checks the receipt before any retry), resuming. **Permissions per PKG-01:** EDITOR/DESIGNER may import new independent main components into This page or the Component library; ADMIN/OWNER only to share an update of an existing library identity. Fresh IDs with remapped references. **Recovery per PKG-01:** conditional **Undo import** while nothing depends on the result; otherwise **Review imported resources** with conditional removal that never deletes mapped or reused dependencies.
- Forms/commerce rules per PKG-01 (no submissions/secrets; commerce maps or blocks).

## 9. Inspector and canvas touchpoints (unchanged unless noted)
- Inspector ComponentRow — placed in the **Inspector header identity-details subview** (INS-D01, PDB:676) *(R-1018, T6-7)*: main component identity, Reset to main component, Detach instance, variant picker, **Open component** (one label everywhere; replaces "Edit master" / "Edit definition") → this workspace with "‹ Back to {instance}" (existing route, now to the workspace).
- **Confirms per SC-15 (S2)** *(R-1018)*: **Detach instance** → class a, Undo only (the existing confirm is removed): toast "Hero card detached · Undo". **Reset to main component** when the instance has overrides → class b **consequence confirm**, default Cancel: "Reset this instance? Its N overrides (incl. Tablet, Mobile and state overrides) will be removed." · Cancel · Reset; with no overrides it is disabled.
- **Instance overrides per breakpoint and state (C7)** *(R-1018, T3-14)*: an edit to an instance while the current breakpoint is Tablet or Mobile, or while a state (e.g. :hover) is being authored, is **recorded as an override on that instance at that breakpoint/state** — never written to the main component and never dropped (today INV D14: not recorded). The SC-13 cascade applies inside the instance: Desktop override flows to Tablet and Mobile, Tablet to Mobile; it uses SC-13's **three signal levels** (context row "Editing Tablet · N overrides", section count "N overrides", field accent dot) and the per-property action **"Remove Mobile override"** (names the layer it removes; tooltip names the resolved fallback) removes that layer only *(R-1018 — was "Reset to {parent breakpoint}" + per-field label, SC-13 wins)*. Updates from the main component reach every field not overridden at the current layer. Needs engineering CP-D2 (§13).
- **Variant authoring: Deferred — owner decision P4 (2026-10-18)**, closing the open Q10 / P1-D14 revisit (IAF-11 K) *(R-1018)* — picker keeps stored variants; no authoring UI this version. **Fix:** an unresolved variant shows "Variant unavailable" instead of today's silent fallback to `variants[0]` (`ComponentRow.tsx:74`).
- No on-canvas main-component edit mode (IAF-11 F: Update from selection is the source-edit path).

## 10. States, roles, geometry, keyboard

| Condition | Behaviour |
|---|---|
| Empty (per section) | This page/site: "No components yet" + how to create; Component library: "Nothing in the component library that isn't already on this site" when every accessible item is adopted, else "Your component library is empty" *(R-1018, N2)* |
| Loading / error | existing skeleton; **Retry reloads** (Fix CP-10); **library load failure shown** "Couldn't load the component library — Retry" (Fix silent `[]`); a network failure reads "You're offline", never the server sentence (DS §3) *(R-1018)* |
| Offline *(R-1018)* | Panel 22 §5.3 owns the banner and the one polite announcement. This page / This site list from the local mirror (IndexedDB, CP-06); Insert, Rename, Duplicate, Update from selection, Detach and Delete edit the document and sync through the existing retry queue. Server-only actions — Component library section, Import package…, Export, Review update / Apply, Share update, Recently deleted — disabled with "Needs a connection"; a library section never loaded shows "You're offline" |
| Many items *(R-1018)* | This page / This site are bounded by the 100 cap (CP-03) and render in full (virtualised 40 rows, search + sort). **Component library** loads 50 rows *(DS)* at a time with a "Load more" row at the end (needs cursor paging on `listComponentLibrary`, CP-D1; until then the full list as today); count in the nav shows the server total |
| Long names *(R-1018)* | names up to 200 characters (server limit, `packages/shared/schemas/site-component.ts:15` `name: z.string().min(1).max(200)`): list rows and nav truncate to one line with an ellipsis, full name in the tooltip and accessible name; detail header wraps to 2 lines then truncates; toasts and confirms quote at most 40 characters + "…" |
| Restricted | library item from a site the user can't access: listed only if authorized (FI-05), else hidden; insert disabled with reason when dependencies are inaccessible |
| Roles | EDITOR/DESIGNER: create (incl. new library identity), local drafts, site actions; ADMIN/OWNER: rename/share update/tombstone library identity; viewers: no access (unchanged) |
| Geometry | rail 56 + nav 240 + list flex + **detail summary 320** (identity, scope, version, primary actions); **Review update, Used on, Structure and the Update-from-selection review open as a work-area subview 720–960** (GEO-01 "component detail") with Back to the list; remaining < 480 → summary becomes subview; ≤1280 nav collapses to "Components navigation"; package dialogs 720 / 480 / 960, viewport−48; detail buttons **32 min with visible focus ring** (Fix: today 28 with `focus:ring-0`, `ComponentDetailScreen.tsx:57`) |
| Keyboard | list rows with roving focus, Enter opens detail; **focus moves to the header on open** (Fix CP-11); Esc closes the topmost layer only (shared rule) — **open subview/detail → back to the list is kept** (existing, `ComponentDetailScreen.tsx:123-134`); with nothing open Esc is a no-op and never leaves the workspace |

## 11. Preservation map
| Old | New | Disposition |
|---|---|---|
| CP-01 drawer (280, expand 700) + doors | Dedicated workspace (replaces drawer and its 700 expand); all doors kept; origin-named back | Change (IAF-11 F) |
| Drag from list to canvas | Drag/insert from Add › Saved components; row Insert returns to Editor | Move |
| New badge | Status chip "New" | Keep |
| CP-02 two sections | This page / This site / Component library; search; row menu | Redesign + NEW |
| CP-03 create doors + modal | + Layers door; scopes Component library / This page ("This site" label → library, same behaviour); name validation; capacity | Keep + extend |
| CP-04 detail actions | All kept; Duplicate complete; checks added | Keep + Fix |
| Update from selection / Detach all / Detach instance confirms | Undo toasts (SC-15 class a, S2) | Change *(R-1018)* |
| Duplicate-name "create anyway?" | inline warning, no dialog (S2) | Change *(R-1018)* |
| Reset to main component (no confirm) | consequence confirm when overrides exist (SC-15 class b, S2) | Change *(R-1018)* |
| Instance edits at Tablet/Mobile/state not recorded | recorded as overrides per breakpoint/state (C7) | Fix *(R-1018)* |
| CP-05 instance controls | Same; Open component → workspace | Keep |
| CP-06 sync | Same mirror; revisions/pins/updates NEW; ACL fix | Keep + Fix + NEW |
| CP-07 delete/recovery | Same + tombstone for library; dead handlers wired; Components › Recently deleted (30 days, NEW) | Keep + Fix + NEW *(amended 2026-10-17 — source: Panel 24 §4.8)* |
| CP-08 import/export | PKG-01 flows | NEW |
| CP-10/11 states, keyboard | Fixes | Fix |
| Variant authoring | Deferred — owner decision P4, 2026-10-18 (IAF-11 K) | Defer *(R-1018)* |
| Dashboard library admin | Unchanged | Keep |

No capability removed.

## 12. Acceptance (specified, NOT RUN)
| ID | Pass condition |
|---|---|
| T-CP-01 | Add "Manage components ›" opens the workspace; "‹ Back to Add" restores Add's query and focus |
| T-CP-02 | Component library lists accessible components not yet on this site; restricted ones absent; an adopted item appears once, under This site only (N2) *(R-1018)* |
| T-CP-03 | Create with scope Component library → available in Add › From library on another site of the same workspace; This page scope → only on that page |
| T-CP-13 | Import: cancel at Map writes nothing; interrupted import resumes from the receipt; Undo import available until a dependent edit exists |
| T-CP-04 | Duplicate a component with 3 variants and page scope → copy has 3 variants and the same scope |
| T-CP-05 | Library load failure shows Retry; Retry reloads |
| T-CP-06 | (after revisions) Site B pinned v4; v5 shared from A → B shows Update available; Keep current leaves B unchanged; Apply updates all B instances atomically |
| T-CP-07 | Export with an inaccessible image → Download disabled with the blocking reason |
| T-CP-08 | Import a package with a CMS field requirement → Map step requires a compatible field or blocks that root; nothing written before Import |
| T-CP-09 | Imported components get fresh IDs; internal anchors/ARIA references remapped |
| T-CP-10 | Update from selection from the workspace → Choose on canvas → Return to review → **Apply in review** (no dialog; SC-15 class (a) Undo toast, as T-CP-14) *(R-1018)*; Cancel leaves the main component unchanged |
| T-CP-11 | Layers row menu "Save as component…" opens the create modal for that element |
| T-CP-12 | Existing 233 component tests updated with the change, not deleted |
| T-CP-14 | Update from selection, Detach all and Detach instance open no dialog and each shows an Undo toast that reverses it; a duplicate name shows the inline warning and Create stays enabled (S2) *(R-1018)* |
| T-CP-15 | Reset to main component on an instance with 3 overrides → consequence confirm naming 3 overrides, Cancel is default; with no overrides Reset is disabled *(R-1018)* |
| T-CP-16 | On Tablet, change an instance's padding → stored as a Tablet override on that instance; Desktop instance and the main component unchanged; Mobile inherits it; "Remove Tablet override" (SC-13 wording) removes only the Tablet layer and the three SC-13 signals show it; same for a :hover edit (C7) *(R-1018)* |
| T-CP-17 | Offline: This site list works and edits sync after reconnect; Import, Export and Component library show "Needs a connection"; a 200-character name truncates in rows with the full name in the tooltip; 120 library items load 50 then "Load more" (after CP-D1) *(R-1018)* |
| T-CP-18 | Add header "Components ›" and the Layers instance link both open this area with an origin-named back (N1) *(R-1018)* |

## 12a. Engineering dependencies *(R-1018)*
| ID | Dependency | Fallback |
|---|---|---|
| CP-D1 (SC-9) | cursor paging on the component library query | full list as today |
| CP-D2 (SC-9) | record instance overrides per breakpoint and state (C7; INV D14) | today's behaviour — Tablet/Mobile/state edits on instances are not recorded; the section shows no override count |

## 13. Review and not verified
Independent review complete (see status). Not verified: runtime; main-component thumbnail background for light-on-dark components (T3-26 — fallback not decided, not applied *(R-1018)*); revisions/pins/tombstones and package endpoints (new schema/API per IAF-11 M); server capacity enforcement; measured geometry.

### BD-32 reconciliation — 2026-10-21

**Open component** is navigation to Components detail with exact return to the selected instance/child and prior tab/layer. **Push to master** is a different, root-only command that replaces the definition after an impact confirmation. Never show Push for a child. Pending/failed updates preserve local content and do not claim a new saved definition. Class membership is read-only inside instances; element-only overrides remain editable. Shared class edits in Brand affect every consumer and are not instance overrides. CF15–18/49–51/62/69 show these boundaries; no separate master editing canvas is introduced.
