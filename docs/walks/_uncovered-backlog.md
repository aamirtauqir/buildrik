# Uncovered-leg backlog — harvested from the 17 walk records

Generated 2026-08-25 as task 0a of `docs/plans/2026-08-25-editor-flow-walk-arc.md`.

Every walk record ends with its own "Not covered / Not walked" section. Those
sections were written at zero marginal cost during the 08-24 pass and then
never read back. This file collects them so walk depth is set by what is
actually uncovered, rather than by re-deriving the same list.

**Ranking is by data-loss risk, not by flow id.** A leg that can destroy a
customer's site outranks a leg that renders a banner.

## P1 — can lose or corrupt user data

| Lane | Uncovered leg | Source |
|---|---|---|
| `F-A2` | Offline queue durability **across a navigation**. The queue carries CMS, components, templates and versions — **never the project** (`BuildrikSyncProvider.ts:55`) | F-A2:35-38 |
| `F-A2` | The Overwrite branch's "adopt token, re-save" | F-A2:38 |
| `F-A1` | The DS schema migration step | F-A1:42 |
| `F-A1` | Crash recovery (`buildrick:last-crash`) — **never exercised**, no crash triggered. Code read only (`RecoveryManager.ts:95,113-115`) | F-A1:21 |
| `F-A7` | `runWithoutTracking` / collab-remote-op / restore-in-progress exclusions | F-A7:55 |
| `F-A7` | The "bail out without mutation if the patch path diverges" guard | F-A7:57 |
| `U11` | Last-page protection — **only home was tested** | U10-U12:55 |
| `U4` | The **override-survival chain** — style+attr surviving a master edit. Two probe attempts failed **on the harness, not the product** | U4:22-31 |

## P2 — feature works or does not, user-visible

| Lane | Uncovered leg | Source |
|---|---|---|
| `U6` | **The review ROUND** — `Send for review` → `reviews.submit` → admin resolving APPROVED / CHANGES_REQUESTED → `/review/<token>` as the client sees it. "That is U6's other half and the part that actually closes the loop" | U6:36-38 |
| `U6` | Password and expiry options on a share link | U6:39 |
| `U5` | `/share/<token>` and `/review/<token>` — the surfaces a client actually receives — and Review's `reviews.submit` round trip | U5:47-49 |
| `U7` | Import-from-URL (⛔ stub), stock search (Unsplash/Pexels/Pixabay), folders + smart folders, **Trash (a "Trash coming soon" toast stub)**, bulk move/delete, alt-text rail + AI generate, Versions tab + `replaceAcross`, image editor (crop/adjust/resize), the optimizer | U7:24-28 |
| `U3` | Per-token undo; the **four lint rules** (no-black, banned purple/violet/indigo, alias depth ≤3, contrast auto-fix to AA 4.5); export formats (CSS × 3 dark strategies / JSON / Tailwind, ⛔ Figma stub); JSON import + Replace / keep-mine / keep-theirs; inspector token binding with the Reach strip (This item / All like this / Whole site) | U3:17-21 |
| `U4` | Variant swap via `VariantSection`, detach (pro-DS-mode only), the `componentSync` master mirror, the 27-component read-only catalog + its ⛔ drag-to-canvas stub, the MAX-100 cap | U4:40-42 |
| `U11` | Rename with live slug preview (F2), duplicate ("X Copy"), the **8-second undo toast** on a normal page delete, localStorage-only folders, bulk multi-select, drag reorder, SEO table view | U10-U12:54-57 |
| `U12` | Drill-in mechanics (root ⇄ section, the 180 ms lock, the dirty guard), the central dirty counter + sticky savebar, and **what each of the 13 sections actually does** | U12:49-51 |
| `U1` | Achievement modal (4 s per completion), collapse-on-element-select, the dashboard's "Edit site" entry into `/edit/:id` | U1:32-34 |
| `F-A6` | The server mirror's own **50-per-site cap** | F-A6:67 |
| `F-A5` | **Never fired.** No AI call has ever been executed against this pipeline | F-A5 header |

## P3 — polish, numbers, and stubs

| Lane | Uncovered leg | Source |
|---|---|---|
| `U2` | Drag-to-canvas's last two claims: snap guides 5px, 500 ms touch long-press | U2:62-63 |
| `F-A2` | `HistoryManager`'s 500 ms coalesce / max-100 / checkpoint-every-10 numbers — *code-read, confirmed, not live-observed* | F-A2:37 |
| `F-A7` | The depth-100 cap | F-A7:56 |

## Already closed since being written — do not re-walk

| Lane | Leg | Closed by |
|---|---|---|
| `F-A1` | `loadServerMedia`'s 200-asset cap | fixed 2026-08-24, `U7-F-A4-media.md` |
| `F-A1` | Per-site IndexedDB scoping | worked 08-24 — turned out to be a **live cross-site data bleed**, now fixed |
| `F-A6` | Compare diptych, time-travel scrubber, 300 ms hover preview | walked 2026-08-25, `U9-version-rescue.md` |
| `U2` | Inline text edit, right-click context menu | walked 2026-08-24 with real keystrokes (an `execCommand` bypass manufactures false positives here) |

## Out of scope this arc

| Lane | Leg | Why |
|---|---|---|
| `F-A3` | A real publish end to end | SHIP-gate item 3; deploys to the public internet; needs founder site choice + confirmation. **Founder excluded deploy** |
| `U1` | The final publish | Same leg as above |

## Counts

- 17 records, **31** uncovered-leg markers harvested.
- **8 P1** (data-loss), **11 P2** (user-visible), **3 P3** (polish).
- 4 legs already closed since being written.
- 2 legs excluded by founder scope.

The P1 block is the walk order for lanes 1-8 of the arc.
