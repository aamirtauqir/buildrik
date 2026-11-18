# Settings Phase B — Figma handoff

2 October 2026. Designer brief delivery in [Editor Settings](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=4418-127312), page `4418:45431`.

40 editable boards: 36 Settings states and 4 CMS states. Every new board is 1440×900, in section `4418:127312`. New boards start at section-local y=22886, below neighboring sections; existing boards remain in place.

## Build order

- [x] M0 — shared sidebar navigation updated first.
- [x] M1, M2, M19 — scope, role read-only, saved toast.
- [x] M4–M9 — General, Languages, SEO and all requested validation/dialog states.
- [x] M10–M14 — Domains, Redirect CSV, Undo, Access and Form submissions.
- [x] M3, M15–M17 — pending deletion, archive, transfer and deletion.
- [x] M18 and the three CMS copy requirements (four state boards).
- [x] Rename the 17 specified superseded boards; retain them in place.
- [x] Final visual and structural validation — passed: 40 boards at 1440×900, Inter text throughout, 6,486 editable nodes, no detected content overflow, no full-UI image layers, and no new-board overlaps with neighboring sections.

Final screenshots checked the shared shell, full General read-only state, General, six-row Social profiles, Indexing switch, enabled/locked Access, submissions inbox, CSV error dialog, transfer dialog, saved toast, and CMS conflict/deleted/publish-blocked states. Reused toasts use light editor surfaces. Native comment-thread posting remains unavailable (see Handoff channel).

## Shared sources and existing updates

- Brief reference [4418:144988](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=4418-144988) is an instance. Its source [3450:14390](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=3450-14390) now owns the new navigation.
- Full-screen sidebar [5940:45359](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=5940-45359) now embeds that navigation, so current boards inherit it. Nested rows select the current screen; Access/Custom code lock booleans show blue Pro pills. Billing shows the illustrative Pro plan.
- Existing saved toast [4418:165469](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=4418-165469) updated to “Saved · applies on next publish” with Publish.
- Existing delete boards [5890:44728](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=5890-44728) and [5891:44701](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=5891-44701) updated with immediate unpublishing and Recently deleted / 30-day restoration copy.
- CMS boards preserve the existing record-sheet context; Settings boards use the shared M0 sidebar.

## Board node IDs

| Step | Screen / state | Node |
|---|---|---|
| M0 + M1 | Full-screen Settings · General · scope-next-publish | [8134:212121](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8134-212121) |
| M2 | Full-screen Settings · General · role-read-only | [8134:212323](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8134-212323) |
| M1 | Full-screen Settings · Domains · scope-live-immediately | [8134:212529](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8134-212529) |
| M19 | Full-screen Settings · General · saved | [8134:212718](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8134-212718) |
| M4 | Full-screen Settings · General · default | [8135:212718](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-212718) |
| M5 | Full-screen Settings · General · advanced | [8135:212966](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-212966) |
| M5 | Full-screen Settings · General · slug-taken | [8135:213221](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-213221) |
| M5 | Full-screen Settings · General · slug-format-error | [8135:213477](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-213477) |
| M5 | Full-screen Settings · General · slug-confirm | [8135:213733](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-213733) |
| M6 | Full-screen Settings · Languages · default | [8135:214023](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-214023) |
| M7 | Full-screen Settings · Languages · remove-locale-confirm | [8135:214262](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-214262) |
| M8 | Full-screen Settings · SEO · default | [8135:214533](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-214533) |
| M9 | Full-screen Settings · SEO · indexing-expanded | [8135:214820](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-214820) |
| M9 | Full-screen Settings · SEO · indexing-off | [8135:215066](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8135-215066) |
| M10 | Full-screen Settings · Domains · several | [8136:214348](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-214348) |
| M10 | Full-screen Settings · Domains · set-primary-confirm | [8136:214574](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-214574) |
| M11 | Full-screen Settings · Redirects · csv-actions | [8136:214826](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-214826) |
| M11 | Full-screen Settings · Redirects · import | [8136:215047](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-215047) |
| M11 | Full-screen Settings · Redirects · import-error | [8136:215307](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-215307) |
| M11 | Full-screen Settings · Redirects · import-success | [8136:215568](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-215568) |
| M12 | Full-screen Settings · Redirects · deleted-undo | [8136:215838](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-215838) |
| M13 | Full-screen Settings · Access · password-set | [8136:216089](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-216089) |
| M13 | Full-screen Settings · Access · password-off | [8136:216319](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-216319) |
| M13 | Full-screen Settings · Access · set-password | [8136:216535](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-216535) |
| M13 | Full-screen Settings · Access · pro-locked | [8136:216758](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-216758) |
| M14 | Full-screen Settings · Form submissions · inbox | [8136:216977](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8136-216977) |
| M3 | Full-screen Settings · Overview · pending-deletion | [8137:216089](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-216089) |
| M3 | Full-screen Settings · Overview · archived | [8137:216346](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-216346) |
| M15 | Full-screen Settings · Danger zone · owner | [8137:216600](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-216600) |
| M15 | Full-screen Settings · Danger zone · non-owner-read-only | [8137:216834](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-216834) |
| M16 | Full-screen Settings · Danger zone · archive-confirm | [8137:217085](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-217085) |
| M16 | Full-screen Settings · Danger zone · transfer-dialog | [8137:217348](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-217348) |
| M16 | Full-screen Settings · Danger zone · transfer-success | [8137:217625](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-217625) |
| M17 | Full-screen Settings · Danger zone · delete-confirm | [8137:217905](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-217905) |
| M17 | Full-screen Settings · Danger zone · delete-typed-confirm | [8137:218168](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8137-218168) |
| M18 | Full-screen Settings · Integrations & webhooks · workspace-door | [8139:217358](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8139-217358) |
| CMS-1 | CMS · Record sheet · conflict | [8139:217560](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8139-217560) |
| CMS-2 | CMS · Record deleted · unsaved change | [8139:217711](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8139-217711) |
| CMS-2 | CMS · Collection deleted · unsaved change | [8139:217890](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8139-217890) |
| CMS-3 | CMS · Publish blocked · record conflict | [8139:218055](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrik?node-id=8139-218055) |

## Superseded boards

All 17 have the `Superseded ·` prefix. No boards were deleted.

- Integrations: `4418:133079`, `4418:133885`, `4418:134028`, `4418:175131`, `4418:175272`, `4418:175416`, `4418:175559`, `4418:175839`, `4418:175951`, `4418:176070`, `4418:176174`.
- Webhooks: `4418:128657`, `4418:131193`, `4418:131293`, `4418:131395`, `4418:131496`.
- Export: `4418:127565`.

## Copy and interaction contract

- Sample site/domain/member/locale values illustrate shape only; resolve real values from product state.
- General/SEO/Access and default locale use the footer; invalid slug disables Save.
- Locale Add/Remove apply immediately and do not commit staged default-locale edits.
- Domains and Form submissions carry “Live immediately · no publish needed”.
- EDITOR / non-owner read-only boards have no footer and use disabled controls.
- Password fields never reveal a stored password. Set/change fields show placeholder copy; the saved state says “A password is set”.
- CMS deleted-item toast bodies prepend the server sentence. Examples use “This record was deleted.” and “This collection was deleted.” from the shipped sync tests.

## Handoff channel

Each new board has a Figma annotation containing its node ID. Native Figma comment posting is not exposed by the available connector, so no comment threads were posted; this checked list and the annotations provide the node-ID handoff.

## Second audit — 2 October 2026

Re-read the 40 boards, including confirmation and toast copy. Fixed the following findings directly in Figma:

- M2: three input controls were visually faded but retained the `rest` component variant. Their Field Control properties now reference disabled input `10:14`; a fresh read confirms all three are disabled. No save footer is present.
- M13: password-off copy now describes the next publish rather than claiming the live site is already unprotected. Unlocked password card titles identify the Pro feature.
- M18: the header now identifies workspace-wide scope rather than next-publish site settings.
- M3/M15–M17: lifecycle headers now say changes apply immediately, consistent with restore, archive, transfer and delete actions. This deliberately refines the generic M1 scope line for lifecycle screens.
- Old Localization, Localization save-error and standalone Forms settings boards (`4418:127966`, `4418:129708`, `4418:128507`) now use `REFERENCE · pre-Phase B`, with replacement-board annotations. This removes current-design authority from the obsolete Auto-redirect and Form settings structures without deleting them.

Verification: all 40 boards remain 1440×900 in the target section; each Settings board has exactly one active navigation row. Visible text uses Inter; the palette contains no purple/violet/indigo and uses #1A56DB for the accent. Both invalid-slug Save buttons and all three non-owner Danger zone actions are disabled. The original 17 Superseded boards remain in place. Updated read-only and Access screens were checked visually.

Limits: this is a Figma specification audit, not runtime or end-to-end application testing. Existing loading/error and other legacy boards outside the new-board ledger were not comprehensively migrated. Native Figma comments remain unavailable; annotations and this document are the handoff. The CSV brief has empty, error and success states; a separate file-selected/ready board is not included.
