# BD-24 — independent scoped Pages-placement review

Date: 2026-10-18. Reviewer: independent design-guard reviewer. Mode: DESIGN ONLY; read-only Figma inspection. File: `2L9OTGzBrL6kYmU18yA1c7`.

## Result

**No blocking defect found in the sampled placement correction. PARTIALLY VERIFIED.** The explicit user correction takes precedence: Pages management is in the left rail after Layers; the bottom bar holds created-page tabs and save status. This review does not approve the full B3 phase or verify implementation/runtime behavior.

## Independently checked evidence

| Check | Native/render evidence | Result |
|---|---|---|
| Main entry and rail order | `7:20634`: Add, Layers, Pages, Assets, CMS, Brand; Help below. Pages `74:12713` retains destination `63:6393`. | Pass |
| Manager ownership and fit | `63:6393`: Pages active (`74:12586`), Layers default. Surface `63:6903` is x56/y56, 560×812, between the 56px topbar and 32px bottom bar at 1440×900. Rail remains visible. | Pass |
| Listings width | `63:21262`, surface `63:21772`: x56/y56, 720×812. | Pass |
| Created-page strip | Main and manager show Home, About, Work, Contact, Legal, Blog post plus separate save status/Details. No primary bottom Pages manager button. One collection-template tab represents the 20 generated records. | Pass |
| Changed-URL return identity | `67:11915` → rail `74:13434` → manager `64:10927`; tab is Our story. | Pass, structural route |
| Deleted-page return identity | `67:12583` → rail `74:13454` → `63:19334`; About absent. Recently deleted `63:20001` also omits About. | Pass, structural route |
| Kept-URL return identity | `69:19044` → rail `74:13474` → `63:23182`; Our story name preserved in its separate kept-URL branch. | Pass, structural route |
| Restored tab | `63:20585` restores About in the six-tab fixture. | Pass |
| Attached menus | Page-actions `63:14496`: x616/y250, 280×330. More `65:17824`: x328/y188, 280×170. Both remain within their desktop shell after relocation. | Pass, geometry |
| Short shell | `11:311`, 1440×600: rail y56/h512; Help text ends at y561 before rail end568. Six tabs and status fit. | Pass, rendered shell |
| Narrow shell | `11:2`, 1024×768: rail y56/h680; Help text ends at y729 before rail end736. Six tabs/status fit without collision. | Pass, rendered shell |

Visual inspection used normal screenshots of main, manager, short and narrow samples. An additional isolated manager render (`/tmp/bd24-manager-isolated.png`) confirms the complete topbar, proper manager anchor, visible Pages active state and unobstructed bottom strip. One non-isolated screenshot showed external canvas overlap at the top; native geometry and the isolated frame are intact. This is not evidence of an internal manager-layout defect.

## Contract reconciliation

Read the canonical brief BD-24, updated P11 contracts and `pages-placement-correction.md`. They explicitly supersede the old bottom-management placement, preserve the P shortcut, restore focus to the rail Pages entry on dismissal, keep active-page identity on manager opening, and retain draft/permission/offline rules. Narrow manager fallback and short-manager validation are explicitly pending. Earlier historical placement prose must be read under the BD-24 override; it is not a second authorized manager home.

The author's reported 56-shell propagation (38 Editor, 8 Recovery/access, 10 Journey) is recorded in the mutation ledger; this reviewer independently sampled the frames above rather than claiming exhaustive inspection of all 56.

## Remaining limits

- Prototype route playback, keyboard/P/Escape focus behavior, assistive technology, actual page switching, save/undo/restore execution and persistence: **NOT RUN**.
- Short/narrow checks cover the shell and rail, not an open manager at those viewport sizes. Overlay clamping, scrolling and focus containment still require those variants/runtime checks.
- Existing unrepresented/unwired page destinations, including About Open, remain pending from the bounded B3 review. Moving the entry does not complete these routes.
- The collection-template marker/accessible distinction, long-name tab scrolling, and guard behavior remain handoff acceptance requirements; the six-label fixture alone does not exercise them.
- No application code, production pages, data model or Figma nodes were modified by this reviewer.

**Closure:** sampled BD-24 placement and preserved branch connections pass the bounded design check. Overall checkpoint remains PARTIALLY VERIFIED; no full B3 or runtime completion claim.
