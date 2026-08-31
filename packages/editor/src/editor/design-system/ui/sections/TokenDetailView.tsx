/**
 * TokenDetailView — drill-in detail surface for a single token (s02 right-pane).
 *
 * T8 of DS prototype-full-rewrite arc. Rendered by TokensRouter when the
 * user clicks any token row.
 *
 * Layout (top → bottom):
 *   1. Back arrow header — `← Back to tokens`.
 *   2. Header block — 24px swatch / Aa / bar + name (16px) + ID mono + CSS var (Pro only).
 *   3. Field rows: Light value, Dark value (color only), Used by, Lint.
 *   4. Action button row: Replace, Rename, Delete.
 *   5. Beginner notice (only when dsMode !== "pro").
 *
 * Engine reads:
 *   - `composer.designSystem.tokenUsage.getUsage(id)` → number, subscribed
 *     via `"tokenUsage:changed"`.
 *   - `composer.designSystem.lintState.getIssues(id)` → readonly LintIssue[],
 *     subscribed via `"lint:changed"`.
 *   - `composer.designSystem.computeAutoFix(value, hint)` — pure helper for
 *     Auto-fix button.
 *
 * Aliased-by field — Arc D6.a (2026-05-16). When the project has any tokens
 * whose `aliasOf` equals this token's id, the row renders count + names.
 * Empty array → row is hidden. Re-renders on `tokens:alias-changed`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import type { DesignToken } from "../../types";
import type { LintIssue } from "../../../../engine/designSystem/LintState";
import type { UsageRef } from "../../../../engine/designSystem/TokenUsageTracker";
import { ELEMENT_TYPE_LABELS } from "../../../../shared/constants/elementTypeLabels";
import { useDSModeOptional } from "../../state/DSModeContext";
import { ColorPicker } from "../colors/ColorPicker";
import { TokenReplaceModal } from "./TokenReplaceModal";
import { Button, FieldRow, TextInput } from "@/editor/chrome-ui";

export interface TokenDetailViewProps {
  token: DesignToken;
  composer: Composer | null | undefined;
  /**
   * Full token list — used by the "Aliased by" row to compute reverse-lookup
   * via `composer.aliasResolver.findAliasesOf(token.id, allTokens)`. Optional
   * for back-compat with consumers that haven't been re-wired yet — when
   * absent or empty, the row simply renders nothing.
   */
  allTokens?: ReadonlyArray<DesignToken>;
  onBack: () => void;
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
}

/* Classes, not a style-const wall. The label+value pairs are chrome-ui's
   FieldRow now — its label is `w-24`, which is the 96px this file had been
   re-declaring five times. */

const CONTAINER = "tw:flex tw:flex-col tw:gap-4 tw:px-1 tw:py-3";
const FIELD_ROW = "tw:border-t tw:border-gray-200 tw:py-2";
const MONO = "tw:[font-family:var(--bk-font-mono)]";
const NAME = "tw:text-base tw:font-semibold tw:text-[var(--bk-ink)] tw:leading-tight";
const ID_MONO = `tw:text-xs tw:text-[var(--bk-ink-muted)] ${MONO}`;
const CSS_VAR = `tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:mt-0.5 ${MONO}`;
/** The quiet button look, previously six copies of the same class list. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";
const LINK_BTN = `${GHOST} tw:p-0 tw:text-left tw:inline-flex tw:items-center tw:gap-1.5`;

// ─── Preview slot ─────────────────────────────────────────────────────────────

/* Each swatch is static chrome plus ONE genuinely computed value — the token's
   own colour, font or size. The static half is classes; only the computed half
   stays inline, which is exactly the exception CLAUDE.md carves out. */
const SWATCH = "tw:inline-block tw:size-6 tw:rounded tw:border tw:border-gray-200 tw:flex-none";

const previewSlot = (token: DesignToken): React.ReactNode => {
  if (token.kind === "color" || token.category === "colors") {
    return <span aria-hidden="true" className={SWATCH} style={{ background: token.value }} />;
  }
  if (token.kind === "type" || token.category === "typography") {
    return (
      <span
        aria-hidden="true"
        className="tw:inline-flex tw:items-center tw:justify-center tw:size-6 tw:text-sm tw:font-semibold tw:text-[var(--bk-ink)] tw:flex-none"
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
      <span
        aria-hidden="true"
        className="tw:inline-block tw:w-6 tw:h-2 tw:bg-gray-200 tw:rounded-sm tw:flex-none tw:relative"
      >
        <span
          className="tw:absolute tw:left-0 tw:top-0 tw:h-full tw:bg-[var(--bk-accent)] tw:rounded-sm"
          style={{ width: widthPx }}
        />
      </span>
    );
  }
  // Default — neutral chip. Nothing computed here at all.
  return <span aria-hidden="true" className={`${SWATCH} tw:bg-gray-50`} />;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TokenDetailView: React.FC<TokenDetailViewProps> = ({
  token,
  composer,
  allTokens,
  onBack,
  onValueChange,
  onDelete,
  onRename,
}) => {
  const dsMode = useDSModeOptional();
  const isPro = dsMode?.mode === "pro";
  const isColor = token.kind === "color" || token.category === "colors";

  // ─ Used by: subscribe to tokenUsage:changed for live count + breakdown updates.
  // D6.b: breakdown drives the drill-in element list (click row → expand).
  const tracker = composer?.designSystem?.tokenUsage;
  const readBreakdown = React.useCallback(
    (): readonly UsageRef[] =>
      tracker?.getBreakdown?.(token.id) ?? [],
    [tracker, token.id],
  );
  const [usageRefs, setUsageRefs] = React.useState<readonly UsageRef[]>(
    () => readBreakdown(),
  );
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

  // ─ Aliased by: reverse-lookup via composer.aliasResolver. Re-subscribes to
  // `tokens:alias-changed` so the row updates when any alias-edit fires. D6.a.
  const aliasResolver = composer?.aliasResolver;
  const computeAliases = React.useCallback((): readonly DesignToken[] => {
    if (!aliasResolver || !allTokens || allTokens.length === 0) return [];
    return aliasResolver.findAliasesOf(token.id, allTokens);
  }, [aliasResolver, allTokens, token.id]);

  const [aliases, setAliases] = React.useState<readonly DesignToken[]>(() =>
    computeAliases(),
  );
  React.useEffect(() => {
    setAliases(computeAliases());
    if (!composer || typeof composer.on !== "function") return;
    const handler = () => setAliases(computeAliases());
    composer.on("tokens:alias-changed", handler);
    return () => {
      composer.off?.("tokens:alias-changed", handler);
    };
  }, [composer, computeAliases]);

  // ─ ColorPicker open state for color tokens (D3 — inline below value row).
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // ─ Dark value local input (color tokens only).
  const [darkInput, setDarkInput] = React.useState(token.darkValue ?? "");
  React.useEffect(() => {
    setDarkInput(token.darkValue ?? "");
  }, [token.darkValue]);

  // ─ CSS var name (Pro mode only). Prefer engine SSOT `token.cssVar`
  // field; fallback only if absent. Engine field already canonical so
  // we don't double-prefix (e.g. id="color-primary" + kind="colors"
  // was producing "--ds-colors-color-primary" before this fix).
  const cssVarName = React.useMemo(() => {
    if (token.cssVar) return token.cssVar;
    const kind = token.kind ?? token.category ?? "token";
    return `--ds-${kind}-${token.id.replace(/\./g, "-")}`;
  }, [token.cssVar, token.kind, token.category, token.id]);

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
        // Engine refused (token not found or value unchanged) — fall through
        // to the old onValueChange path so callers without engine support
        // still see the suppress side effect.
        const computed = composer.designSystem.computeAutoFix(token.value, hint);
        if (computed && computed !== token.value) onValueChange?.(token.id, computed);
      }
    } else {
      const fixed = composer.designSystem.computeAutoFix(token.value, hint);
      if (fixed && fixed !== token.value) onValueChange?.(token.id, fixed);
    }
    lintState?.suppress(token.id);
  };

  const handleIgnore = () => {
    lintState?.suppress(token.id);
  };

  // ─ Action buttons.
  const handleReplaceValue = () => {
    if (isColor) {
      setPickerOpen(true);
    }
    // Non-color tokens: input already focusable above.
  };

  const handleRenameId = () => {
    // TODO(T8 follow-up): replace window.prompt with a proper modal once the
    // confirm-dialog primitive is wired into TokensSection. MVP unblocks the
    // arc — see plan T8 § acceptance.
    if (typeof window === "undefined") return;
    const next = window.prompt("Rename token ID:", token.id);
    if (next && next !== token.id) {
      onRename?.(token.id, next);
    }
  };

  // B4 follow-up (2026-05-17): per-token consumer count drives the delete
  // path. Zero consumers → hard delete bypasses the modal. > 0 consumers →
  // open the picker modal; user picks a replacement which routes through
  // useColorTokens / useTokensForKind deleteToken(id, { replaceWith }).
  const consumerCount = composer?.designSystem?.tokenUsage?.getUsage(token.id) ?? 0;

  // Candidates = same-kind tokens, excluding self + already-soft-deleted (so
  // selecting one never produces a bridge chain). Fallback kind derivation
  // mirrors TokensSection.handleTokenDelete dispatch rules.
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
    if (!isPro) return; // Beginner-blocked.
    if (consumerCount === 0) {
      onDelete?.(token.id);
      onBack();
      return;
    }
    setReplaceOpen(true);
  };

  const handleReplaceConfirm = (replaceWithId: string) => {
    onDelete?.(token.id, { replaceWith: replaceWithId });
    onBack();
  };

  // ─ Field renderers ──────────────────────────────────────────────────────────

  const lintRow = (() => {
    if (lintIssues.length === 0) {
      return (
        <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-[var(--bk-success)]" data-lint-status="pass">
          <span aria-hidden="true">✓</span>
          <span>pass</span>
        </div>
      );
    }
    const issue = lintIssues[0];
    return (
      <div className="tw:flex tw:flex-col tw:gap-1.5 tw:text-xs tw:text-[var(--bk-warning-text)]" data-lint-status="fail">
        <span>
          <span aria-hidden="true">△ </span>
          {issue.message}
        </span>
        <div className="tw:flex tw:gap-1.5">
          {issue.autoFixHint && (
            <Button
              type="button"
              color="light"
              size="xs"
              onClick={handleAutoFix}
              aria-label="Auto-fix lint issue"
              className={GHOST}
            >
              Auto-fix
            </Button>
          )}
          <Button
            type="button"
            color="light"
            size="xs"
            onClick={handleIgnore}
            aria-label="Ignore lint issue"
            className={GHOST}
          >
            Ignore
          </Button>
        </div>
      </div>
    );
  })();

  return (
    <div className={CONTAINER} data-token-detail-view={token.id}>
      {/* Back arrow */}
      <Button
        type="button"
        color="light"
        onClick={onBack}
        size="xs"
        aria-label="Back to tokens"
        className={`${GHOST} tw:self-start`}
      >
        <span aria-hidden="true">←</span>
        <span>Back to tokens</span>
      </Button>

      {/* Header — preview + name + id + cssVar(Pro) */}
      <div className="tw:flex tw:items-center tw:gap-3">
        {previewSlot(token)}
        <div className="tw:flex tw:flex-col tw:min-w-0">
          <span className={NAME}>{token.friendlyName ?? token.name}</span>
          {isPro && <span className={ID_MONO}>{token.id}</span>}
          {isPro && <span className={CSS_VAR}>{cssVarName}</span>}
        </div>
      </div>

      {/* Light value */}
      <FieldRow label="Light value" className={FIELD_ROW}>
        <div className="tw:flex tw:flex-col tw:w-full tw:min-w-0">
          {isColor ? (
            <>
              <div className="tw:flex tw:items-center tw:gap-2">
                <TextInput
                  type="text"
                  value={token.value}
                  onChange={(e) => onValueChange?.(token.id, e.target.value)}
                  className={MONO}
                  aria-label="Light value"
                />
              </div>
              {pickerOpen && (
                <div className="tw:mt-2">
                  <ColorPicker
                    initialHex={token.value}
                    onChange={() => {
                      /* live preview owned by picker; commit via onSave */
                    }}
                    onSave={(hex) => {
                      onValueChange?.(token.id, hex);
                      setPickerOpen(false);
                    }}
                    onCancel={() => setPickerOpen(false)}
                  />
                </div>
              )}
            </>
          ) : (
            <TextInput
              type="text"
              value={token.value}
              onChange={(e) => onValueChange?.(token.id, e.target.value)}
              className={MONO}
              aria-label="Light value"
            />
          )}
        </div>
      </FieldRow>

      {/* Dark value — color tokens only */}
      {isColor && (
        <FieldRow label="Dark value" className={FIELD_ROW}>
          <div className="tw:w-full tw:min-w-0">
            <TextInput
              type="text"
              value={darkInput}
              placeholder={token.darkValue ? "" : "+ add (currently falls back)"}
              onChange={(e) => setDarkInput(e.target.value)}
              onBlur={() => {
                /* This handler was empty, with a comment saying the engine-side
                   dark commit was "a separate follow-up (D4)". That stopped
                   being true when `useColorTokens.updateToken` gained its third
                   `darkValue` argument for the import path — but the comment
                   froze the old limitation in place, so the field kept
                   accepting text and discarding it on blur, silently. */
                const next = darkInput.trim();
                if (next === (token.darkValue ?? "")) return;
                onValueChange?.(token.id, token.value, next);
              }}
              className={MONO}
              aria-label="Dark value"
            />
          </div>
        </FieldRow>
      )}

      {/* Used by — click-to-expand element list (D6.b) */}
      <FieldRow label="Used by" className={FIELD_ROW}>
        <div className="tw:flex tw:flex-col tw:w-full tw:min-w-0">
          <Button
            type="button"
            color="light"
            onClick={() => {
              if (usageCount > 0) setUsageExpanded((v) => !v);
            }}
            size="xs"
            className={LINK_BTN}
            aria-expanded={usageExpanded}
            aria-disabled={usageCount === 0 || undefined}
            disabled={usageCount === 0}
            data-used-by-toggle
          >
            <span aria-hidden="true" className="tw:inline-block tw:w-2.5 tw:text-[10px] tw:text-[var(--bk-ink-muted)]">
              {usageCount === 0 ? "" : usageExpanded ? "▾" : "▸"}
            </span>
            <span data-used-count={usageCount}>
              {usageCount} {usageCount === 1 ? "element" : "elements"}
            </span>
          </Button>
          {usageExpanded && usageCount > 0 && (
            <ul className="tw:flex tw:flex-col tw:gap-0.5 tw:mt-1.5 tw:pl-3.5" data-used-by-list role="list">
              {usageRefs.map((ref, idx) => {
                const el = composer?.elements?.getElement?.(ref.elementId);
                const type = el?.getType?.();
                const name = type
                  ? (ELEMENT_TYPE_LABELS[type] ??
                    type.charAt(0).toUpperCase() + type.slice(1))
                  : ref.elementId;
                return (
                  <li key={`${ref.elementId}-${ref.styleProp}-${idx}`}>
                    <Button
                      type="button"
                      color="light"
                      onClick={() => {
                        const target = composer?.elements?.getElement?.(
                          ref.elementId,
                        );
                        if (target) composer?.selection?.select(target);
                      }}
                      size="xs"
                      aria-label={`Select ${name} · ${ref.styleProp}`}
                      data-used-by-entry={ref.elementId}
                      className={`${LINK_BTN} tw:w-full`}
                    >
                      <span>{name}</span>
                      <span className={`tw:text-[var(--bk-ink-muted)] tw:text-[11px] ${MONO}`}>· {ref.styleProp}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </FieldRow>

      {/* Aliased by — hidden when empty (D6.a) */}
      {aliases.length > 0 && (
        <FieldRow label="Aliased by" className={FIELD_ROW}>
          <span data-aliased-by-count={aliases.length}>
            {aliases.length} ·{" "}
            {aliases.map((a) => a.friendlyName ?? a.name).join(", ")}
          </span>
        </FieldRow>
      )}

      {/* Lint */}
      <FieldRow label="Lint" className={FIELD_ROW}>
        <div className="tw:w-full tw:min-w-0">{lintRow}</div>
      </FieldRow>

      {/* Action row */}
      <div className="tw:flex tw:gap-2 tw:mt-2">
        <Button
          type="button"
          size="xs"
          onClick={handleReplaceValue}
          aria-label="Replace value"
        >
          Replace value
        </Button>
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={handleRenameId}
          aria-label="Rename ID"
          aria-disabled={!onRename || undefined}
          disabled={!onRename}
          title={onRename ? "Rename token id" : "Rename API coming soon — edit value inline above"}
        >
          Rename ID
        </Button>
        <Button
          type="button"
          color="red"
          size="xs"
          onClick={handleDelete}
          aria-label="Delete token"
          aria-disabled={!isPro || undefined}
          disabled={!isPro}
        >
          Delete
        </Button>
      </div>

      {/* Beginner notice */}
      {!isPro && (
        <div
          className="tw:mt-3 tw:px-3 tw:py-2.5 tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)] tw:rounded-md tw:text-[length:var(--bk-text-12)] tw:leading-normal"
          role="note"
          data-beginner-notice
        >
          <strong className="tw:block tw:mb-1">
            Delete blocked in Beginner mode.
          </strong>
          <span>
            Pro shows replace-with / cascade-clear when {usageCount}{" "}
            {usageCount === 1 ? "element" : "elements"} bind.
          </span>
        </div>
      )}
      <TokenReplaceModal
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        token={token}
        candidates={replaceCandidates}
        usage={consumerCount}
        onConfirm={handleReplaceConfirm}
      />
    </div>
  );
};
