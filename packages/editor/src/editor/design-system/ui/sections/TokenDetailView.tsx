/**
 * TokenDetailView — the selected token's card, board 7315:80955 (right
 * column, under the live preview; Spacing 7576:197036 draws the same card).
 *
 *   ┌ 468 ─────────────────────────────────────────────┐
 *   │ ▇ 40  name                                    ⋯  │  ⋯ → Rename · Delete
 *   │       id (Pro) / description                      │
 *   │ Light value  #1A56DB                    [Change]  │  → inline editor
 *   │ Dark value   #76A9FA                    [Change]  │  → inline field
 *   │ Used by      34 elements                [View ›]  │  → element list
 *   │ ✓ Brand checks pass · 8.6:1 contrast on white     │  or △ issue + fixes
 *   │ ⓘ                                                 │  draft note
 *   └───────────────────────────────────────────────────┘
 *
 * The card is a SIBLING of the token table, not a drill-in: the workspace
 * owns which token is selected and mounts this beside the preview. There is
 * no back link; a row click swaps the token (the board's row reaction is
 * "set 7 variables", not "navigate").
 *
 * Engine reads (unchanged): usage from `tokenUsage` ("tokenUsage:changed"),
 * findings from `lintState` ("lint:changed"), the reverse alias lookup from
 * `aliasResolver` ("tokens:alias-changed"). Auto-fix goes through the
 * history-aware `designSystem.applyAutoFix` so Cmd+Z reverts it.
 *
 * Departures from the board, recorded: "Used by 34 elements on 3 pages" —
 * the tracker counts elements, not pages, so the page half is not printed;
 * the ⋯ menu has no "Duplicate token" (no registry path for it).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Info } from "lucide-react";
import type { Composer } from "../../../../engine/Composer";
import type { DesignToken } from "../../types";
import type { LintIssue } from "../../../../engine/designSystem/LintState";
import type { UsageRef } from "../../../../engine/designSystem/TokenUsageTracker";
import { ELEMENT_TYPE_LABELS } from "../../../../shared/constants/elementTypeLabels";
import { useDSModeOptional } from "../../state/DSModeContext";
import { calcContrastRatio } from "../../utils/colorUtils";
import { findSurfaceToken, resolveSurface, shownValue } from "../../utils/contrastLint";
import { ColorPicker } from "../colors/ColorPicker";
import { displayValue } from "../colors/ColorTokenList";
import { FontFamilyPicker } from "./FontFamilyPicker";
import { TokenReplaceModal } from "./TokenReplaceModal";
import { TokenRenameDialog } from "./TokenRenameDialog";
import { Button, HintTooltip, IconButton, Menu, MenuItem, Popover, TextInput } from "@/editor/chrome-ui";

export interface TokenDetailViewProps {
  token: DesignToken;
  composer: Composer | null | undefined;
  /** Every token, for the reverse alias lookup and the contrast surface. */
  allTokens?: ReadonlyArray<DesignToken>;
  /** The preview mode — the contrast line reads the value the page shows. */
  mode?: "light" | "dark";
  /** Commit a token edit. `darkValue` carries the dark-mode variant; only the
   *  color registry stores one, and passing it for other kinds is a no-op. */
  onValueChange?: (id: string, value: string, darkValue?: string) => void;
  /**
   * Delete callback. Accepts an optional `{ replaceWith }` second arg routed
   * through the B1 `replacedBy` bridge (B4 follow-up). Without the second
   * arg the call is a hard delete; with it consumer bindings transparently
   * redirect to `replaceWith` via the resolver.
   */
  onDelete?: (id: string, opts?: { replaceWith?: string }) => void;
  onRename?: (id: string, newId: string) => void;
  /** After a delete — the caller drops its selection. */
  onDeleted?: () => void;
}

const MONO = "tw:[font-family:var(--bk-font-mono)]";
/* 7315:80955 detail rows: 13px muted label, 14px semibold value, 40px pitch,
   the action on the right at 24 tall. */
const ROW = "tw:flex tw:h-10 tw:items-center tw:gap-2";
const LABEL = "tw:flex-none tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const VALUE = "tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const VALUE_EMPTY = "tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const ACTION =
  "tw:h-6 tw:flex-none tw:rounded-[var(--bk-radius-md)] tw:border-[var(--bk-border)] tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)]";
const LINK = "tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:leading-4";

/* The 40px preview tile — the token's own colour, family or size is the one
   computed value; everything else is chrome. */
const TILE = "tw:flex tw:size-10 tw:flex-none tw:items-center tw:justify-center tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-alpha-ink-10)]";

const previewTile = (token: DesignToken): React.ReactNode => {
  if (token.kind === "color" || token.category === "colors") {
    return <span aria-hidden="true" data-testid="brand-token-detail-swatch" className={TILE} style={{ background: token.value }} />;
  }
  if (token.kind === "type" || token.category === "typography") {
    return (
      <span
        aria-hidden="true"
        className={`${TILE} tw:bg-[var(--bk-gray-50)] tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:text-[var(--bk-ink)]`}
        style={token.type === "font-family" ? { fontFamily: token.value } : undefined}
      >
        Aa
      </span>
    );
  }
  if (token.kind === "spacing" || token.category === "spacing") {
    const num = parseFloat(token.value);
    const widthPx = Number.isFinite(num) ? Math.min(num, 24) : 8;
    return (
      <span aria-hidden="true" className={`${TILE} tw:bg-[var(--bk-gray-50)]`}>
        <span className="tw:relative tw:h-2 tw:w-6 tw:rounded-sm tw:bg-[var(--bk-gray-200)]">
          <span className="tw:absolute tw:left-0 tw:top-0 tw:h-full tw:rounded-sm tw:bg-[var(--bk-accent)]" style={{ width: widthPx }} />
        </span>
      </span>
    );
  }
  return <span aria-hidden="true" className={`${TILE} tw:bg-[var(--bk-gray-50)]`} />;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TokenDetailView: React.FC<TokenDetailViewProps> = ({
  token,
  composer,
  allTokens,
  mode = "light",
  onValueChange,
  onDelete,
  onRename,
  onDeleted,
}) => {
  const dsMode = useDSModeOptional();
  const isPro = dsMode?.mode === "pro";
  const isColor = token.kind === "color" || token.category === "colors";

  // ─ Used by: subscribe to tokenUsage:changed for live count + breakdown updates.
  const tracker = composer?.designSystem?.tokenUsage;
  const readBreakdown = React.useCallback(
    (): readonly UsageRef[] => tracker?.getBreakdown?.(token.id) ?? [],
    [tracker, token.id],
  );
  const [usageRefs, setUsageRefs] = React.useState<readonly UsageRef[]>(() => readBreakdown());
  React.useEffect(() => {
    if (!tracker) return;
    setUsageRefs(readBreakdown());
    const handler = () => setUsageRefs(readBreakdown());
    tracker.on("tokenUsage:changed", handler);
    return () => {
      tracker.off("tokenUsage:changed", handler);
    };
  }, [tracker, readBreakdown]);
  const usageCount = usageRefs.length;
  const [usageExpanded, setUsageExpanded] = React.useState(false);

  // ─ Lint: subscribe to lint:changed; snapshot visible (non-suppressed) issues.
  const lintState = composer?.designSystem?.lintState;
  const [lintIssues, setLintIssues] = React.useState<readonly LintIssue[]>(
    () => lintState?.getVisibleIssues?.(token.id) ?? [],
  );
  React.useEffect(() => {
    if (!lintState) return;
    setLintIssues(lintState.getVisibleIssues(token.id));
    const handler = () => setLintIssues(lintState.getVisibleIssues(token.id));
    lintState.on("lint:changed", handler);
    return () => {
      lintState.off("lint:changed", handler);
    };
  }, [lintState, token.id]);

  // ─ Aliased by: reverse-lookup via composer.aliasResolver (D6.a).
  const aliasResolver = composer?.aliasResolver;
  const computeAliases = React.useCallback((): readonly DesignToken[] => {
    if (!aliasResolver || !allTokens || allTokens.length === 0) return [];
    return aliasResolver.findAliasesOf(token.id, allTokens);
  }, [aliasResolver, allTokens, token.id]);
  const [aliases, setAliases] = React.useState<readonly DesignToken[]>(() => computeAliases());
  React.useEffect(() => {
    setAliases(computeAliases());
    if (!composer || typeof composer.on !== "function") return;
    const handler = () => setAliases(computeAliases());
    composer.on("tokens:alias-changed", handler);
    return () => {
      composer.off?.("tokens:alias-changed", handler);
    };
  }, [composer, computeAliases]);

  /* The contrast the pass line reports: the token as the page shows it,
     against the customer's page colour (never the editor's). */
  const contrast = React.useMemo(() => {
    if (!isColor) return null;
    const surface = findSurfaceToken(allTokens ?? [token]);
    const bg = resolveSurface(surface, mode);
    const fg = shownValue(token, mode);
    if (!fg || fg.toUpperCase() === bg.toUpperCase()) return null;
    const ratio = calcContrastRatio(fg, bg);
    if (!Number.isFinite(ratio)) return null;
    const on = bg.toUpperCase() === "#FFFFFF" ? "white" : (surface?.friendlyName ?? surface?.name ?? bg);
    return `${ratio.toFixed(1)}:1 contrast on ${on}`;
  }, [isColor, allTokens, token, mode]);

  // ─ Editors. The value line is read-only until its Change is pressed.
  const [editingLight, setEditingLight] = React.useState(false);
  const [editingDark, setEditingDark] = React.useState(false);
  const [darkInput, setDarkInput] = React.useState(token.darkValue ?? "");
  React.useEffect(() => {
    setDarkInput(token.darkValue ?? "");
    setEditingLight(false);
    setEditingDark(false);
    setUsageExpanded(false);
  }, [token.id, token.darkValue]);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const commitDark = () => {
    const next = darkInput.trim();
    setEditingDark(false);
    if (next === (token.darkValue ?? "")) return;
    onValueChange?.(token.id, token.value, next);
  };

  // ─ Lint actions.
  const handleAutoFix = () => {
    const issue = lintIssues[0];
    if (!issue || !composer) return;
    const hint = issue.autoFixHint;
    // D6.c: prefer the history-aware engine path. It writes through
    // projectSettings inside a labeled transaction, so Cmd+Z roundtrips
    // into a single undoable entry. The React registries re-hydrate via
    // TokensSection's project:changed subscription.
    const engineApply = composer.designSystem.applyAutoFix;
    if (typeof engineApply === "function") {
      const fixed = engineApply(token.id, hint);
      if (fixed === null) {
        const computed = composer.designSystem.computeAutoFix(token.value, hint);
        if (computed && computed !== token.value) onValueChange?.(token.id, computed);
      }
    } else {
      const fixed = composer.designSystem.computeAutoFix(token.value, hint);
      if (fixed && fixed !== token.value) onValueChange?.(token.id, fixed);
    }
    lintState?.suppress(token.id);
  };
  const handleIgnore = () => lintState?.suppress(token.id);

  // ─ Menu actions.
  const [renameOpen, setRenameOpen] = React.useState(false);
  const handleRenameId = () => {
    setMenuOpen(false);
    setRenameOpen(true);
  };

  // B4 follow-up (2026-05-17): per-token consumer count drives the delete
  // path. Zero consumers → hard delete bypasses the modal. > 0 consumers →
  // open the picker modal; user picks a replacement which routes through
  // useColorTokens / useTokensForKind deleteToken(id, { replaceWith }).
  const consumerCount = composer?.designSystem?.tokenUsage?.getUsage(token.id) ?? 0;
  const tokenKind = token.kind ?? (token.category === "colors" ? "color" : undefined);
  const replaceCandidates = React.useMemo(
    () =>
      (allTokens ?? []).filter((t) => {
        if (t.id === token.id) return false;
        if (t.replacedBy) return false;
        const k = t.kind ?? (t.category === "colors" ? "color" : undefined);
        return k === tokenKind;
      }),
    [allTokens, token.id, tokenKind],
  );
  const [replaceOpen, setReplaceOpen] = React.useState(false);
  const handleDelete = () => {
    setMenuOpen(false);
    if (!isPro) return; // Beginner-blocked.
    if (consumerCount === 0) {
      onDelete?.(token.id);
      onDeleted?.();
      return;
    }
    setReplaceOpen(true);
  };
  const handleReplaceConfirm = (replaceWithId: string) => {
    onDelete?.(token.id, { replaceWith: replaceWithId });
    onDeleted?.();
  };

  const subtitle = token.description ?? "";
  const issue = lintIssues[0];

  return (
    <section
      aria-label={`${token.friendlyName ?? token.name} token`}
      data-token-detail-view={token.id}
      data-testid="brand-token-detail"
      className="tw:flex tw:flex-col tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4 tw:pb-4 tw:pt-4"
    >
      {/* Header — tile + name + id/description + ⋯ */}
      <div className="tw:flex tw:items-center tw:gap-3" data-testid="brand-token-detail-header">
        {previewTile(token)}
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
          <span
            className="tw:truncate tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]"
            data-testid="brand-token-detail-name"
          >
            {token.friendlyName ?? token.name}
          </span>
          {/* Pro prints the id (the anchor the conformance spec measures),
              Beginner the description — two literal elements, so the anchor
              check can see the testid rather than a ternary. */}
          {isPro ? (
            <span
              className={`tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)] ${MONO}`}
              data-testid="brand-token-detail-id"
            >
              {token.id}
            </span>
          ) : subtitle ? (
            <span className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
              {subtitle}
            </span>
          ) : null}
        </div>
        <div data-testid="brand-token-actions">
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            placement="bottom-end"
            label="Token actions"
            trigger={
              <IconButton label="Token actions" onClick={() => setMenuOpen((v) => !v)} data-testid="brand-token-menu">
                ⋯
              </IconButton>
            }
          >
            <Menu>
              <MenuItem
                onClick={handleRenameId}
                disabled={!onRename}
                title={onRename ? undefined : "Type and spacing tokens keep their IDs."}
                data-testid="brand-token-action-rename"
              >
                Rename token…
              </MenuItem>
              <MenuItem
                danger
                onClick={handleDelete}
                aria-disabled={!isPro || undefined}
                disabled={!isPro}
                title={isPro ? undefined : "Delete is blocked in Beginner mode. Switch to Pro to delete tokens."}
                data-testid="brand-token-action-delete"
              >
                Delete token…
              </MenuItem>
            </Menu>
          </Popover>
        </div>
      </div>

      {/* Light value */}
      <div className={`${ROW} tw:mt-2`}>
        <span className={LABEL}>{isColor ? "Light value" : "Value"}</span>
        <span className={`${VALUE} ${isColor ? "" : MONO}`} data-testid="brand-token-value-light">
          {displayValue(token.value)}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => setEditingLight((v) => !v)}
          aria-expanded={editingLight}
          data-testid="brand-token-action-replace"
          className={ACTION}
        >
          Change
        </Button>
      </div>
      {editingLight && (
        <div className="tw:mb-2" data-testid="brand-token-light-editor">
          {isColor ? (
            <ColorPicker
              initialHex={token.value}
              onChange={() => {
                /* live preview owned by picker; commit via onSave */
              }}
              onSave={(hex) => {
                onValueChange?.(token.id, hex);
                setEditingLight(false);
              }}
              onCancel={() => setEditingLight(false)}
            />
          ) : (
            <>
              {/* Clone 3721:44821 — a font-family token is picked, not only
                  typed: presets, the ADDED site fonts, `Manage site fonts`.
                  The field below stays for a hand-typed stack. */}
              {token.type === "font-family" && (
                <div className="tw:mb-1.5">
                  <FontFamilyPicker
                    value={token.value}
                    onChange={(family) => onValueChange?.(token.id, family)}
                    composer={composer}
                  />
                </div>
              )}
              <TextInput
                type="text"
                value={token.value}
                onChange={(e) => onValueChange?.(token.id, e.target.value)}
                className={MONO}
                aria-label="Value"
                autoFocus
              />
            </>
          )}
        </div>
      )}

      {/* Dark value — color tokens only */}
      {isColor && (
        <>
          <div className={ROW}>
            <span className={LABEL}>Dark value</span>
            {token.darkValue ? (
              <span className={VALUE} data-testid="brand-token-value-dark">{displayValue(token.darkValue)}</span>
            ) : (
              <span className={VALUE_EMPTY} data-testid="brand-token-value-dark">No dark value</span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setEditingDark((v) => !v)}
              aria-expanded={editingDark}
              data-testid="brand-token-action-dark"
              className={ACTION}
            >
              {token.darkValue ? "Change" : "Set"}
            </Button>
          </div>
          {editingDark && (
            <div className="tw:mb-2">
              <TextInput
                type="text"
                value={darkInput}
                placeholder="#RRGGBB"
                onChange={(e) => setDarkInput(e.target.value)}
                onBlur={commitDark}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitDark();
                  if (e.key === "Escape") {
                    setDarkInput(token.darkValue ?? "");
                    setEditingDark(false);
                  }
                }}
                className={MONO}
                aria-label="Dark value"
                autoFocus
              />
            </div>
          )}
        </>
      )}

      {/* Used by */}
      <div className={ROW}>
        <span className={LABEL}>Used by</span>
        <span className={VALUE} data-testid="brand-token-usedby-value" data-used-count={usageCount}>
          {usageCount} {usageCount === 1 ? "element" : "elements"}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => setUsageExpanded((v) => !v)}
          aria-expanded={usageExpanded}
          aria-disabled={usageCount === 0 || undefined}
          disabled={usageCount === 0}
          data-used-by-toggle
          className={ACTION}
        >
          View ›
        </Button>
      </div>
      {usageExpanded && usageCount > 0 && (
        <ul className="tw:mb-2 tw:flex tw:flex-col tw:gap-0.5 tw:pl-1" data-used-by-list role="list">
          {usageRefs.map((ref, idx) => {
            const el = composer?.elements?.getElement?.(ref.elementId);
            const type = el?.getType?.();
            const name = type
              ? (ELEMENT_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1))
              : ref.elementId;
            return (
              <li key={`${ref.elementId}-${ref.styleProp}-${idx}`}>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => {
                    const target = composer?.elements?.getElement?.(ref.elementId);
                    if (target) composer?.selection?.select(target);
                  }}
                  aria-label={`Select ${name} · ${ref.styleProp}`}
                  data-used-by-entry={ref.elementId}
                  className={`${LINK} tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-accent)]`}
                >
                  <span>{name}</span>
                  <span className={`tw:ml-1 tw:text-[var(--bk-ink-muted)] ${MONO}`}>· {ref.styleProp}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Aliased by — hidden when empty (D6.a) */}
      {aliases.length > 0 && (
        <div className={ROW}>
          <span className={LABEL}>Aliased by</span>
          <span className={VALUE} data-aliased-by-count={aliases.length}>
            {aliases.length} · {aliases.map((a) => a.friendlyName ?? a.name).join(", ")}
          </span>
        </div>
      )}

      {/* Brand checks */}
      <div className="tw:mt-1 tw:flex tw:min-h-6 tw:flex-col tw:justify-center tw:gap-1.5">
        {issue ? (
          <div
            className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-warning-text)]"
            data-testid="brand-token-lint-value"
            data-lint-status="fail"
          >
            <span>
              <span aria-hidden="true">△ </span>
              {issue.message}
            </span>
            {issue.autoFixHint && (
              <Button type="button" variant="link" size="xs" onClick={handleAutoFix} aria-label="Auto-fix lint issue" className={LINK}>
                Auto-fix
              </Button>
            )}
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={handleIgnore}
              aria-label="Ignore lint issue"
              data-testid="brand-token-ignore"
              className={`${LINK} tw:text-[var(--bk-ink-muted)]`}
            >
              Ignore
            </Button>
          </div>
        ) : (
          /* `--bk-success-text` — the one green that passes AA at this size. */
          <div
            className="tw:flex tw:items-center tw:gap-1.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
            data-testid="brand-token-lint-value"
            data-lint-status="pass"
          >
            <span aria-hidden="true" className="tw:text-[var(--bk-success-text)]">✓</span>
            <span>Brand checks pass{contrast ? ` · ${contrast}` : ""}</span>
          </div>
        )}
      </div>

      {/* ⓘ — the draft note (7318:81119) */}
      <div className="tw:mt-3 tw:flex">
        <HintTooltip content="Edits stay in the draft until you Save. Publish to put them live." placement="bottom">
          <IconButton label="About drafts" className="tw:size-5 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]" data-testid="brand-token-draft-note">
            <Info size={12} aria-hidden />
          </IconButton>
        </HintTooltip>
      </div>

      <TokenRenameDialog
        open={renameOpen}
        currentId={token.id}
        takenIds={(allTokens ?? []).map((t) => t.id).filter((id) => id !== token.id)}
        usage={usageCount}
        onCancel={() => setRenameOpen(false)}
        onRename={(newId) => {
          setRenameOpen(false);
          onRename?.(token.id, newId);
        }}
      />

      <TokenReplaceModal
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        token={token}
        candidates={replaceCandidates}
        usage={consumerCount}
        onConfirm={handleReplaceConfirm}
      />
    </section>
  );
};
