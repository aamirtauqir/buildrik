# Inspector v4 design delivery

- Status: DESIGNED; owner review pending.
- Section: https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8021-206877
- Overview: https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=7997-206529
- Review artifact: `review.html` (36 board links, complete board-level MUST checklists and decision references).
- `manifest.json`: board node IDs. `components.json`: existing DS component keys and local chassis IDs.
- `acceptance.json`: compact read-back evidence. `*.result.json`: queue job results, including failed attempts and corrected retries.
- `overview.png`: one batched overview of all 36 boards.

The repository-root queue handles simple node edits and cannot create a composed board. The package-local `../apply-queue.mjs` is the native-connector board-job adapter: it syntax-checks and emits a job, which is executed through the connected Figma tool. Results are persisted alongside each job. No alternate credentials or direct Figma write transport were used. Original boards and application source were not changed.

Basic navigation links are included for Heading tabs, AI and Inspector visibility. Designs are editable component compositions; field mutation, persistence, master editing and CMS integration still require the later implementation phases.

Compact polish (2026-09-27): all 34 Inspector panels use 24px-high, 160px-wide inputs, muted borders, compact option pills and text actions. Read-back found no oversized fields or clipped field text. Local reusable components live in node `8025:206525`; shared design-system masters are unchanged. `compact-audit.result.json` contains geometry evidence; owner review remains pending.

Numeric input refinement: separate 24px number inputs, up/down stepper buttons, and px/% unit selectors. Font size and line height are separate rows; count fields omit units. Numeric masters: `8031:206265`, `8031:206278`. Screens are Figma designs; numeric validation and stepping require application implementation. The overview raster predates this refinement; direct board links show the latest version.
