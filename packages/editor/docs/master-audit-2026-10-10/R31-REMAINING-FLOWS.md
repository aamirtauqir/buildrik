# R31 — Remaining Editor flows

Date: 2026-10-13. Status: IMPLEMENTED_FOR_AUTHORED_SCENARIOS. Product-wide parity is not certified.

The existing improved Buildrick file was edited directly on page 8463:2. Original baseline pages and application source were not changed. The installed Figma application was opened at the new review entry.

- [Improved Editor](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-3)
- [R31 review entry in Figma](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237)
- [Interactive review](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237&starting-point-node-id=8690%3A13237&hide-ui=1)
- [Parity and limitations matrix](R31-REMAINING-FLOWS-PARITY.csv)

## Changes in the actual design

**Pages.** Added explicit page ownership to options and settings, with a direct Options shortcut in each drawer row. Home, About, Journal, Contact and the sample copy have separate names and URL state. Rename retains the URL unless Update URL is chosen. Duplicate adds a separate copy; delete has confirmation, cancellation and Undo. The current homepage is protected. Search has matching and no-result scenarios. Journal and copied-page destinations have matching Mobile and Preview states. Removed stale dimming from the now-enabled Home, Journal and Manage pages actions.

**Metadata.** Page SEO, Social and Advanced share one draft but persist separately for each page. Returning to About retains its values without changing Home. OG title, description and image selection/removal are connected. Invalid Head code blocks save and has a correction path. URL and Head validation flags are independent. Site defaults have save/cancel behavior, and clearing a page title visibly restores the current inherited title.

**Templates.** All eleven existing template entries now have meaningful preview routes; the three premium templates use a plan gate. The selected template is named before creating or replacing a page. Replacement exposes backup choice; failed backup leaves the page unchanged, with retry and explicit no-backup alternatives. Apply, Undo and backup review are connected. The template title and description feed the authored new-page result and matching previews. Previews remain representative editable fixtures, not complete imports of every template's HTML.

**History.** Existing R30 save, rename, delete/cancel and empty-state flows received browser verification. Template replacement also has a separately named backup record. Restoring full page/project snapshots remains an implementation dependency; authored restore examples retain specific fields and explicitly identify their limited scope.

**Navigation.** New page destinations retain their identity through Desktop/Mobile, Preview and Build returns. The Journal/copied-page clones originally inherited About routes; these were corrected. New dialogs have Escape routes to their inner cancel/back surface.

## Information architecture and design system

Pages remains the left-side owner of page discovery and actions. Settings expands into the existing SEO/Social/Advanced workspace because it is a multi-field task. Template browsing uses the existing catalogue; a preview precedes a focused create/replace confirmation. History and Publish retain their right-side ownership. Editor and Build remain separate workspaces in one project.

The work reuses existing TO-BE button variants, text fields, workspace navigation, Inter text styles, color/spacing/radius variables and the existing modal elevation style. No parallel visual system or flattened screen image was introduced.

Final R31-root structural evidence: 35 root frames; 155 active linked component instances; 301 active text nodes; zero image fills; no font-family mismatch, auto-layout child overflow, or missing prototype destination. The roots link to 49 distinct destinations. These are bounded structural measurements, not completion percentages.

## Verification

All tests use Figma prototype state; no production publish, model request, upload or backend write was made.

| Journey | Evidence | Disposition |
|---|---|---|
| Homepage protection; rename/Keep URL; duplicate; delete/cancel/Undo; search | r31-walk-pages.json.receipt.json and matching screenshots | VISUAL_PASS for authored samples |
| Direct Pages drawer → About Options → About settings | r31-walk-shortcuts.json.receipt.json; r31-direct-options and r31-direct-settings screenshots | VISUAL_PASS |
| Created copy appears in aligned drawer row and opens its own Options | r31-walk-copy-shortcut-final.json.receipt.json; r31-drawer-copy-*-verified screenshots | VISUAL_PASS |
| Social values; invalid Head/recovery; page settings persistence | r31-walk-seo.json.receipt.json | VISUAL_PASS for inspected Social/Head outcomes |
| Title persistence and page isolation; inherited site title | Final walk and r31-final-title-draft, final-home-isolation, final-about-retained, final-inherited-title screenshots | VISUAL_PASS; final stable run supersedes the earlier inconclusive title readback |
| Template backup failure/retry; apply/Undo; SaaS creation; premium gate | r31-walk-templates.json.receipt.json | VISUAL_PASS for inspected authored states |
| History save/name/delete/cancel/empty | Final walk and r31-history-* screenshots | VISUAL_PASS for the named checkpoint fixture |
| Journal/Mobile and copy/Build returns | Final walk; r31-journal-build-return, r31-journal-mobile-preview, r31-copy-build-return screenshots | VISUAL_PASS for inspected page/breakpoint identity |
| Template description synchronization | Final walk; r31-final-template-description screenshot | VISUAL_PASS for SaaS new-page heading and description |
| Escape routes | r31-escape-receipt.json; real browser `press Escape` from copied-page Options; r31-escape-copy-options screenshot | NATIVE_CONNECTED for 26 dialogs; BROWSER_VISUAL_PASS for Options → Manage pages only; remaining keyboard routes unverified |
| Components/layout/destination integrity | r31-final-native-qa.json | STRUCTURAL_PASS |

A prototype URL match alone does not validate an overlay. Overlay outcomes were reviewed through screenshots. Do not count earlier screenshots of a stale or partially updated prototype as fresh proof. The last readback run was performed after stopping Figma mutations to avoid live-edit state interference.

The exploratory Escape/copy-shortcut run began from the settings discard guard, not Page options. Its `r31-escape-options.png` filename is misleading and its `r31-walk-copy-shortcut.json` receipt is INCONCLUSIVE; neither is evidence of an Escape pass or a copy shortcut pass. Use the separately reset final shortcut run for that row.

After the final shortcut run, an actual browser Escape keypress on Page copy Options returned to Manage pages with the copied page retained. This verifies that specific inner-surface back route, not universal keyboard accessibility or focus restoration.

Scripts and receipts are in evidence/r31-*. Production source modifications shown by git status predate this work and were left alone.

## Explicit remaining limitations

1. **P2 — Finite input/data model.** Search, rename and field input use authored samples. The copy fixture models one duplicate, not unbounded page creation. Drag reorder, folder management, bulk selection and every keyboard combination are not implemented in these new scenarios.
2. **P1 — Template rendering and snapshot scope.** Catalogue routes and decisions are implemented, but native preview content represents selected fields. Complete template import, arbitrary nested content, full-document comparison/restore and the existing HIST-01 metadata comparison defect require runtime implementation/validation.
3. **P2 — Social images and services.** Image selection/removal changes sample metadata; it does not upload a file or generate a real image. Site SEO saves are prototype-local.
4. **P2 — Responsive range.** Authored Desktop and Mobile transitions are connected. Arbitrary viewport reflow and full typography inheritance across arbitrary content are not certified.
5. **P2 — Add-to-navigation.** Existing On/Off state is preserved, but actual generated website menu insertion remains outside the simulation.
6. **P1 — Broader finalized modules.** Existing CMS, Brand, Assets and workspace Settings routes were inventoried again, but this pass does not close their full per-control QA. Proposed AI/Agents/Team frames remain explicitly scope-unverified; they are not represented as finalized capabilities.
7. **P1 — Backend and external tools.** AI/MCP execution, permissions, concurrent edits, persistent snapshots and deployment effects are implementation dependencies. This Figma work does not claim to execute them.

The R30 open items for per-page metadata, page actions, catalogue routing and History management now have stronger implementation and verification evidence. Broader product-level limitations remain explicit; do not mark Phase 6 or the full master execution complete solely from R31.

