# DS UI Interactive Audit — 2026-05-16

Systematic-debugging sweep of every interactive in `editor/design-system/ui/` (146 handlers / 9120 LOC) + `editor/components-catalog/ui/`.

## Result

- **WIRED**: ~110
- **STUB** (documented follow-up): 7
- **ORPHAN** (handler declared, no upstream binding): 4
- **DEAD** (broken import / throws): 0
- **Event subscription leaks**: 0 — all 5 `composer.on(...)` useEffects have matching `composer.off(...)` cleanup

## Bugs fixed in this sweep

| Commit | Bug |
|--------|-----|
| `42ceaa8e` | ComponentsSection "Open Components panel" dispatched `buildrik:openRailTab` window CustomEvent w/ no production listener → routed through existing `composer.emit("ui:switch-tab", ...)` channel |
| `42ceaa8e` | DesignSystemTab subscribed to `undo:applied` / `redo:applied` (no emitters anywhere) → renamed to canonical `history:undo` / `history:redo` |
| (this commit) | TokenDetailView "Rename ID" button visible + clickable when `onRename` prop unbound; `window.prompt` asked for input that was discarded → button now `disabled` when prop missing |
| (this commit) | TabGuardModal "Save and switch" used banned purple gradient `linear-gradient(135deg, #7c3aed, #6d28d9)` (DESIGN.md bans purple) → removed inline style, defaults to cobalt via Button primary variant |

## Known ORPHANs (deferred — engine work needed)

### TokenDetailView "Rename ID" — engine API missing

`TokensSection.tsx:283` sets `onTokenRename={undefined}` with TODO comment. No registry has `renameToken(oldId, newId)` API. Real fix requires:

1. Add `renameToken(oldId, newId)` to each of 14 token registries (color/type/spacing + 11 generic via `useTokensForKind`)
2. Add `handleTokenRename` dispatcher in `TokensSection` (mirroring `handleTokenChange` / `handleTokenDelete`)
3. Update all bindings (`{{token.X}}` refs in element styles, preset bindings, aliasOf chains) to use new id
4. Migration concern: localStorage v1 keys reference token ids — need backfill or version bump

Until then: button is disabled with `title="Rename API coming soon"`.

### DSLintBanner "Review all"

`DSLintMount.tsx` doesn't receive `onReviewAll` from `DesignSystemTab`. Button only renders when truthy → invisible in prod. Graceful degradation, low impact. Future work: pass a callback that filters to issues across all kinds + scrolls to first failing token.

### CatalogCard onClick

`ComponentsPanelV2` mounts `<CatalogSection searchQuery={search} />` without `onComponentSelect`. Card click is dead, but drag-to-canvas (primary affordance) works via `dataTransfer.setData("application/x-buildrik-catalog-component", id)` + canvas drop handler at `editor/canvas/hooks/drag/dropOperations.tsx:486`. Future polish: wire click → insert at active cursor.

## Acceptable STUBs (documented in code)

1. **AIPromptModal `onAccept`** (DesignSystemTab + ComponentsPanelV2) — generated schema discarded on Accept; modal closes. Follow-up arc: `composer.components.adoptGeneratedSchema(schema)` + catalog surface.

2. **TokenDetailView Dark value `onBlur`** — Local input state only; never persists. Follow-up: `updateTokenDark(id, value)` registry method + `onDarkValueChange` prop.

3. **MigrationProgressModal Restore snapshot / Retry** — Mount handlers close modal only. Phase F.2 follow-up wires real restore/retry from snapshot + migration step.

4. **ComponentsPanelV2 "+ AI" fallback** — When `composer.aiAssistService` is null (feature-flag-gated in `useComposerInit.ts:94`), button logs TODO. Acceptable feature gating.

5. **ComponentsPanelV2 "+ Save current selection" fallback** — TODO log when 0 or >1 selected. Happy path (exactly 1) calls `composer.components.createComponent(name, selectedIds[0])` via `window.prompt`. Acceptable, but `window.prompt` is UX smell — should be replaced with modal.

## Engine APIs verified present

All called handlers route to engine APIs that exist:

- `composer.aiAssistService` (Composer.ts:128 / init :221)
- `composer.components.createComponent` / `getAllComponents` / `getInstancesOfComponent` / `isInstance` / `detachInstance` (engine/components/ComponentManager.ts)
- `composer.designSystem.tokenUsage.getBreakdown` (D6.b — TokenUsageTracker.ts)
- `composer.designSystem.lintState.getVisibleIssues` / `suppress` (LintState.ts)
- `composer.designSystem.applyAutoFix` / `computeAutoFix` (D6.c — Composer.ts:174-190)
- `composer.aliasResolver.findAliasesOf` (D6.a — AliasResolver.ts)
- `composer.colorMode.set` / `resolved` (Composer.ts)

## Files referenced

22 implementation files across `editor/design-system/ui/` + `editor/components-catalog/ui/`. Full table in commit `42ceaa8e` audit transcript.
