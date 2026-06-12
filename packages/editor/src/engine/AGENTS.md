# Engine (Headless Document Core)

Headless document engine: element tree, history, selection, storage, export, migrations. No React, no DOM-chrome concerns. UI lives in `../editor/`.

## Entry Points

- `Composer.ts` — central orchestrator; owns 25+ managers (elements, history, selection, viewport, …). Almost every operation routes through it.
- `index.ts` — public surface consumed by editor chrome and preview
- One folder per manager domain: `elements/`, `history/`, `commands/`, `designSystem/`, `storage/`, `export/`, `migration/`, …
- `EventEmitter.ts` — all engine→UI signaling; chrome subscribes, never polls

## Contracts & Invariants

- History coalesces rapid changes (~500ms window). Any code that asserts on or persists history state synchronously must call `flushPending()` first. Mocked begin/endTransaction tests stay green while live undo breaks — live-verify undo paths.
- `importProject` must never hand internal references to cached snapshots — a past P0 lost user data because import gutted the snapshot undo depended on. Deep-copy at the boundary.
- HTML sanitization is a single DOMPurify SSOT enforced at every boundary: serializer, HTML import, inline-edit paste. New HTML ingestion paths MUST route through it (XSS arc 2026-06-08).
- Canvas-bound events are RAF-coalesced — emit once per frame, not per mutation.
- Side-effect-free module level: managers lazy-init external resources.

## Pitfalls

- Engine emits HTML strings that chrome mounts directly (see `../editor/AGENTS.md`) — element features need engine-side serialization support, not React props.
- TemplateManager is soft-deprecated: new template features land on the `importHTMLToActivePage` path or in `editor/sidebar/tabs/templates/`.

## Related Context

- Chrome consuming this engine: `../editor/AGENTS.md`
- Package-level rules: `../../CLAUDE.md`
