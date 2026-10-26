# Design 2L9 · Lane L-C — Resources (CMS, Assets, Components, Templates)

> **For agentic workers:** sub-plan of `docs/superpowers/plans/2026-10-22-implement-2l9-design.md`
> (Phase 2, lane L-C). Execute with THE LOOP, one commit per archetype.

**Goal:** the non-Brand rows of Figma page 05 (`3:6`, families `cms`, `assets`,
`components`, `templates`, `resources`) plus Play F2, done per the master plan's
done predicate.

**Inputs:** `packages/editor/docs/design-2l9/inventory/05-resources.{md,json}`,
`inventory/09-play.md` §F2, `gap-inventory.md` (OD-1..4 and lead auto-decisions),
`REQUESTS.md`. Board copy is read from the local dump
(`docs/design-2l9/dump/page-3-6.json`, `page-3-10.json`); no Figma calls.

**Global Constraints, Review Focus, Manifest schema:** as in the master plan
(sections of the same names). Lane-specific restatements:
- Owned paths (under `packages/editor/src/editor/`): `cms/`, `sidebar/tabs/content/`,
  `sidebar/tabs/media/`, `media/`, `sidebar/tabs/ComponentsTab.tsx`,
  `sidebar/tabs/component-library/`, `sidebar/tabs/templates/`.
- Not owned, therefore requests in `REQUESTS.md`: `inspector/sections/CmsBindingSection.tsx`
  (L-B), `shell/StudioPanels.tsx`, `sidebar/FullPageRouter.tsx`, `shell/modals/*`.
- Review Focus 3: CMS record edits are server records outside `composer.history`.
  No CMS board in this lane draws a record-edit Undo in the topbar; receipt Undo
  buttons (record delete, template/asset receipts) stay only where they call the
  composer history stack or are a server-side restore that the board names as such.
- Lead auto-decisions applied: in-use collection/field delete keeps code behaviour
  (`authority: code:unbind-on-delete`); Recovery/Recently deleted is a later
  server slice (not started in this wave).

## Verification

Light (owner preference): targeted vitest per slice, `npx tsc --noEmit` = 0 and
`pnpm run verify:ds` (cwd `packages/editor`) before each commit batch. No Next dev
server (the lead walks live on the integration branch). No archetype screenshots
exist in the dump, so a slice is compared against the dump's copy and structure
only: manifest rows stay `drift-open` with `verifiedNote: "built, not compared — …"`
until the lead's live walk compares them.

## Archetypes, in order of user impact

### C1 · Record leave guard with Save and leave (Play F2.08/F2.09/F2.14/F2.15)
- Files: `cms/RecordSheet.tsx`, `cms/cmsWorkspaceStore.ts` (guard receives a destination label).
- Board copy: title "Leave without saving?"; body "Save or discard the edits to “{record}” before opening {destination}." (tab/collection doors, 168:21408…22734), "{record} has unsaved record edits." (no named destination, 165:2184), "Your destination is {origin}." (return to an element, 173:17098 / 302:15235). Actions: Keep editing · Discard changes · **Save and leave** (primary).
- Save and leave → "Saving…" on the save button with **Stay here** (cancel the return, F2.15 "Return cancelled. Your record save is still in progress."); success leaves to the destination; failure keeps the draft, shows "Couldn’t save · return paused" + body "Your edits are still here. Return to {destination} is paused." with Cancel · **Retry and return** (174:14111 / 302:17816).
- Also: the Save button reads "Saving…" while a save runs (165:797, 254:81738).
- Failing tests first (`cms/__tests__/RecordSheet.test.tsx`): guard copy + Save and leave saves then leaves; rejected save pauses the return and Retry and return leaves after success; Stay here cancels the return and the save finishes in place; Saving… label. Old "Discard record changes?" tests rewritten.
- Rows: 165:2184, 168:21408, 168:21848, 168:22290, 168:22734, 173:17098, 254:81923 (guard); 168:21620, 168:22061, 168:22504, 168:22949, 173:16635, 177:16850, 174:13882 (pending); 174:14111 (return failed); 165:797, 254:81738 (saving); play 302:15235, 302:15605, 302:17816, 302:18174.

### C2 · Return to origin from a record (Play F2.06/F2.12)
- Files: `cms/cmsWorkspaceStore.ts` (`CmsOpenRequest.origin?: string`, kept in state), `cms/RecordSheet.tsx`, `cms/CmsWorkspace.tsx`.
- Board copy: the sheet's back reads "‹ {origin}" (e.g. "‹ Heading · Title binding", "‹ Home · Latest posts") when the request named one; otherwise the existing element door stays "‹ Back to canvas" until the lead's bottom bar "‹ Back to Editor" (Phase 1) is the only exit.
- Requests: L-B passes `origin` from `CmsBindingSection` Open record (and `CollectionListSection` Open collection); lead makes `backToCanvas` reopen the binding subview (F2.12) — StudioPanels.
- Rows: 173:16169, 173:16399, 173:16863 (record-return-to-binding), 189:28227 (list-return-to-origin), play 302:14521, 302:16675.

### C3 · CMS workspace tabs and collection menu (records-table, record-sheet IA)
- Files: `cms/CmsWorkspace.tsx`, `cms/RecordSheet.tsx`.
- Board copy: four visible tabs Records · Fields · Dynamic pages · Collection settings (165:2, 165:520); the ⋯ menu keeps Import CSV… / Import JSON… and the planned connectors labelled "Planned" (254:82143); header "{name} · {n} records"; record sheet back "‹ {name} records" (165:520); empty collection "Add your first record or import existing records." with "Import CSV…"/"Import JSON…" (254:74075).
- Rows: 165:2 (partial — status filter, sort menu and Columns stay open), 165:520, 165:1350, 254:82143, 254:74075.

### C4 · CMS drawer current release (RL01/RL02, BD-39)
- Files: `sidebar/tabs/content/ContentViews.tsx`, `ContentTab.tsx`.
- Board copy: Data group = Site variables · Conditions · Recently deleted; **Sources hidden** behind a release constant (BD-39; authored sources and their data are kept, conditions that reference them keep working). "Recently deleted" is drawn as a disabled row tagged "Planned" until the server restore slice lands (no dead door). Site variables view header "Site variables", "+ New variable", intro "Use one value across your site" + "Type {{site.key}} in text. Published pages show the value; the canvas keeps the placeholder. Changes are saved with your site."
- Rows: 424:337006 (RL01), 424:337452 (RL02), 260:235689 group (site-variables-list), 260:235928 (empty).
- Not in this slice: per-variable "N text placeholders" counts (needs a placeholder scan; C8).

### C5 · Record sheet save states (failed / offline banners)
- Files: `cms/RecordSheet.tsx`.
- Board copy: failed "Couldn’t save" banner + "Your edits are still here. Retry when you’re ready." and button "Retry" (165:1072); offline "You’re offline" + "Your edits are not saved to the server. Keep this tab open." (165:1625).
- Rows: 165:1072, 165:1625.

### C6 · Add field: all schema types, failure state
- Files: `cms/fieldTypes.ts`, `cms/AddFieldDialog.tsx`.
- Board: picker offers every stored schema type (Email, URL, Date & time, Option, File, Color added; labels per board); a failed add keeps the dialog with an error and Retry; Save reads "Saving…" while busy.
- Rows: 167:3871, 167:4956 group (unsupported types), 167:8474, 167:8747.

### C7 · Templates catalogue copy drifts
- Files: `sidebar/tabs/templates/*`.
- Board copy on working code: replace confirm CTA "Replace {page}", backup-failed title "Couldn’t save a backup of {page}", create-failed body "Nothing was changed. No empty page was left behind.", Save as template copy, viewer disabled-with-reason (behaviour stays ADMIN, `authority: code:apply-role-admin` for the role name).
- Rows: 223:44891, 223:45184, 222:47163, 223:46314, 223:46702.

### C8 · Site variable usages, rename/delete impact
- Files: `sidebar/tabs/content/*`.
- Board: "N text placeholders" per variable, rename/delete dialogs state the placeholder impact.
- Rows: 260:238267, 260:238707, 260:238513, 260:238886.

### C9 · Components workspace copy and states (add-door, empty-this-page, long-name tooltip)
- Files: `sidebar/tabs/ComponentsTab.tsx`, `component-library/*`.
- Rows: 215:43301, 217:43651, 217:43947.

### C10 · Binding source picker and binding detail (Play F2.02/F2.05/F2.16) — **request, L-B path**
- The surface lives in `inspector/sections/CmsBindingSection.tsx` and moves into L-B's new Content tab (OD-2). Building it from this lane would collide with that move. Filed as a request to L-B with the board copy (302:12190 source popover, 302:13946 binding subview, 302:18532 summary); this lane supplies the record side (C1/C2).

## Requests filed (REQUESTS.md)
- Assets as a resource area instead of the full-screen portal: mount point is `sidebar/FullPageRouter.tsx:139` + `shell/StudioPanels.tsx` (`mediaFullPage`), not owned → lead.
- C2 origin label from `CmsBindingSection` / `CollectionListSection` → L-B; return reopens binding subview → lead.
- C10 Choose source / binding detail / binding summary → L-B.

## Later slices (not this wave)
- **Recovery (server slice):** CMS Recently deleted list, exact-ID restore and restore-as-new (34 R rows + GAP-CM), component trash, saved-template trash. Needs `cms.listDeleted` / `cms.restore` (shared Zod schema → service → router → client) and a retention decision; the drawer row C4 draws as Planned until then. Rows stay `drift-open`/`no` with `authority: blocked:server-restore-slice` noted in the sub-plan, not the manifest, until the slice is scheduled.
- Field type-change preview, Required impact, typed field delete (SC-9 server conversion).
- Canvas record picker, collection-list filter/sort/pagination, collection-page generator (engine work).
- Assets workspace restructure (after the resource-area request lands).
- Components versioned library, import/export packages.

## Code-ahead dispositions (capabilities the boards lack — never removed silently)
| Capability | Code | Disposition |
|---|---|---|
| Whole-record Keep mine / Use theirs | `cms/RecordSheet.tsx:612` | kept in the record footer until the per-field diff (C09) exists |
| Record-delete Undo toast re-creating the record | `cms/RecordSheet.tsx:346` | kept (interim restore; moves under Recently deleted with the server slice) |
| Field validation rules (min/max length…) | `cms/FieldInspector.tsx:43,214` | kept in the field inspector |
| Sheets/Airtable disabled connector rows | `cms/CmsWorkspace.tsx:392` | kept, relabelled "Planned" (C3) |
| Binding "Specific record" select | `inspector/sections/CmsBindingSection.tsx:256` | L-B: moves into the source picker |
| Binding source-missing Reconnect… | `CmsBindingSection.tsx:284` | L-B: kept as the collection-deleted binding status |
| Drawer "+ New condition" | `sidebar/tabs/content/ContentViews.tsx:771` | owner decision (RL03 makes the index read-only; the create path moves to the Inspector rule editor, which does not exist yet) — `open:conditions-create-home` |
| Sources editor | `ContentViews.tsx:303` | kept behind the BD-39 release constant (C4) |
| Asset folder management, Replace instead, per-placement replace opt-out, local-only pill, Resize/Optimise tabs, Tags filter | `media/*` | kept in place (Assets restructure is a later slice) |
| Saved-component drag to canvas, storage guard, Reset to master, master preview, overrides-lost toast | `sidebar/tabs/ComponentsTab.tsx`, `component-library/*` | kept in place |
| Templates Reload catalogue, APPLIED badge, preview Used on | `sidebar/tabs/templates/*` | kept in place |

## Owner decisions raised
- `open:conditions-create-home` (above).
- Recently deleted retention period (server slice): boards promise 30 days; the server soft-deletes with no stated retention. `blocked:owner-retention` for the copy until the slice.

## Status (2026-10-26, end of wave 1)

| Archetype | Commit | Rows touched | State |
|---|---|---|---|
| C1 leave guard + Save and leave | `4321b14a2` | 21 | built, not compared |
| C2 return to origin | `d9ea0127a` | 5 | built; live label waits on REQUESTS #11/#12 |
| C3 four tabs, ⋯ imports | `45214b27c` | 5 | built (165:2 filter/sort/Columns still open) |
| C4 drawer RL01/RL02 (BD-39) | `6846d1563` | 7 | built (Site variables still a drawer subview) |
| C5 record failed/offline banners | `0be9c31a1` | 3 | built |
| C6 Add field types + states | `ff4fa4963` | 19 | built (Default/min/max/Placeholder/Help text open) |
| C7 templates copy + no-empty-page rollback | `0a04adfb0` | 3 | built |
| C9 component row tooltip + "N uses" | (this batch) | 1 | built |
| C8 variable usages, C10 binding picker | — | — | not started (C10 is a request to L-B) |

Every touched row keeps `verified: drift-open`/`no` with a "built, not compared"
note: there are no board screenshots in the dump and no Figma calls were made, so
the lead's live walk is the comparison. Two boards disagree on the record
save-failed button (165:1072 "Retry" vs Play F2.17 "Retry save"); the play
journey's wording was adopted and the note says so.
