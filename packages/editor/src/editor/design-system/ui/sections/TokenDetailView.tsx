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
import { useDSModeOptional } from "../../state/DSModeContext";
import { ColorPicker } from "../colors/ColorPicker";

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
  onValueChange?: (id: string, value: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newId: string) => void;
}

// ─── Inline styles (no orphan classNames — feedback_orphan_classes_pattern) ───

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "12px 4px",
};

const backBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  background: "transparent",
  border: "none",
  color: "var(--bd-fg-muted)",
  fontSize: 12,
  cursor: "pointer",
  alignSelf: "flex-start",
  borderRadius: 4,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const nameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "var(--bd-fg-primary)",
  lineHeight: 1.2,
};

const idMonoStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
  color: "var(--bd-fg-muted)",
};

const cssVarStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
  color: "var(--bd-fg-muted)",
  marginTop: 2,
};

const fieldRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "8px 0",
  borderTop: "1px solid var(--bd-border)",
};

const fieldLabelStyle: React.CSSProperties = {
  width: 96,
  flexShrink: 0,
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  paddingTop: 4,
};

const fieldValueStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 12,
  color: "var(--bd-fg-primary)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "var(--bd-bg-elevated)",
  color: "var(--bd-fg-primary)",
  fontSize: 12,
  fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
  boxSizing: "border-box",
};

const lintPassStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "var(--bd-success, #22c55e)",
};

const lintFailStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  color: "var(--buildrick-warning-strong, #B45309)",
};

const lintActionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
};

const smallBtnStyle: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 4,
  border: "1px solid var(--bd-border)",
  background: "transparent",
  color: "var(--bd-fg-primary)",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid var(--bd-border)",
  background: "var(--bd-bg-elevated)",
  color: "var(--bd-fg-primary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

const dangerBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  color: "var(--bd-danger, #ef4444)",
  borderColor: "var(--bd-danger, #ef4444)",
};

const beginnerNoticeStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  background: "var(--buildrick-info-soft, #EFF4FF)",
  color: "var(--buildrick-info-strong, #1F4FBF)",
  borderRadius: 6,
  fontSize: 11.5,
  lineHeight: 1.5,
};

// ─── Preview slot ─────────────────────────────────────────────────────────────

const previewSlot = (token: DesignToken): React.ReactNode => {
  if (token.kind === "color" || token.category === "colors") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 24,
          height: 24,
          borderRadius: 4,
          background: token.value,
          border: "1px solid var(--bd-border)",
          flexShrink: 0,
        }}
      />
    );
  }
  if (token.kind === "type" || token.category === "typography") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: token.type === "font-family" ? token.value : undefined,
          color: "var(--bd-fg-primary)",
          flexShrink: 0,
        }}
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
        style={{
          display: "inline-block",
          width: 24,
          height: 8,
          background: "var(--bd-border)",
          borderRadius: 2,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: widthPx,
            height: "100%",
            background: "var(--bd-accent)",
            borderRadius: 2,
          }}
        />
      </span>
    );
  }
  // Default — neutral chip.
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 24,
        height: 24,
        borderRadius: 4,
        background: "var(--bd-bg-subtle)",
        border: "1px solid var(--bd-border)",
        flexShrink: 0,
      }}
    />
  );
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

  // ─ Used by: subscribe to tokenUsage:changed for live count updates.
  const tracker = composer?.designSystem?.tokenUsage;
  const [usageCount, setUsageCount] = React.useState<number>(
    () => tracker?.getUsage?.(token.id) ?? 0,
  );
  React.useEffect(() => {
    if (!tracker) return;
    setUsageCount(tracker.getUsage(token.id));
    const handler = () => setUsageCount(tracker.getUsage(token.id));
    tracker.on("tokenUsage:changed", handler);
    return () => {
      tracker.off("tokenUsage:changed", handler);
    };
  }, [tracker, token.id]);

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
    const fixed = composer.designSystem.computeAutoFix(token.value, hint);
    if (fixed && fixed !== token.value) {
      onValueChange?.(token.id, fixed);
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

  const handleDelete = () => {
    if (!isPro) return; // Beginner-blocked.
    onDelete?.(token.id);
    onBack();
  };

  // ─ Field renderers ──────────────────────────────────────────────────────────

  const lintRow = (() => {
    if (lintIssues.length === 0) {
      return (
        <div style={lintPassStyle} data-lint-status="pass">
          <span aria-hidden="true">✓</span>
          <span>pass</span>
        </div>
      );
    }
    const issue = lintIssues[0];
    return (
      <div style={lintFailStyle} data-lint-status="fail">
        <span>
          <span aria-hidden="true">△ </span>
          {issue.message}
        </span>
        <div style={lintActionRowStyle}>
          {issue.autoFixHint && (
            <button
              type="button"
              onClick={handleAutoFix}
              style={smallBtnStyle}
              aria-label="Auto-fix lint issue"
            >
              Auto-fix
            </button>
          )}
          <button
            type="button"
            onClick={handleIgnore}
            style={smallBtnStyle}
            aria-label="Ignore lint issue"
          >
            Ignore
          </button>
        </div>
      </div>
    );
  })();

  return (
    <div style={containerStyle} data-token-detail-view={token.id}>
      {/* Back arrow */}
      <button
        type="button"
        onClick={onBack}
        style={backBtnStyle}
        aria-label="Back to tokens"
      >
        <span aria-hidden="true">←</span>
        <span>Back to tokens</span>
      </button>

      {/* Header — preview + name + id + cssVar(Pro) */}
      <div style={headerStyle}>
        {previewSlot(token)}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={nameStyle}>{token.friendlyName ?? token.name}</span>
          {isPro && <span style={idMonoStyle}>{token.id}</span>}
          {isPro && <span style={cssVarStyle}>{cssVarName}</span>}
        </div>
      </div>

      {/* Light value */}
      <div style={fieldRowStyle}>
        <div style={fieldLabelStyle}>Light value</div>
        <div style={fieldValueStyle}>
          {isColor ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  value={token.value}
                  onChange={(e) => onValueChange?.(token.id, e.target.value)}
                  style={inputStyle}
                  aria-label="Light value"
                />
              </div>
              {pickerOpen && (
                <div style={{ marginTop: 8 }}>
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
            <input
              type="text"
              value={token.value}
              onChange={(e) => onValueChange?.(token.id, e.target.value)}
              style={inputStyle}
              aria-label="Light value"
            />
          )}
        </div>
      </div>

      {/* Dark value — color tokens only */}
      {isColor && (
        <div style={fieldRowStyle}>
          <div style={fieldLabelStyle}>Dark value</div>
          <div style={fieldValueStyle}>
            <input
              type="text"
              value={darkInput}
              placeholder={token.darkValue ? "" : "+ add (currently falls back)"}
              onChange={(e) => setDarkInput(e.target.value)}
              onBlur={() => {
                // Dark value commits via the same onValueChange seam; consumers
                // distinguish via field naming downstream when wired. For MVP
                // we forward through onValueChange-dark equivalent if present.
                // T8 ships only the local input — engine-side dark commit is a
                // separate follow-up (D4).
              }}
              style={inputStyle}
              aria-label="Dark value"
            />
          </div>
        </div>
      )}

      {/* Used by */}
      <div style={fieldRowStyle}>
        <div style={fieldLabelStyle}>Used by</div>
        <div style={fieldValueStyle}>
          <span data-used-count={usageCount}>
            {usageCount} {usageCount === 1 ? "element" : "elements"}
          </span>
        </div>
      </div>

      {/* Aliased by — hidden when empty (D6.a) */}
      {aliases.length > 0 && (
        <div style={fieldRowStyle}>
          <div style={fieldLabelStyle}>Aliased by</div>
          <div style={fieldValueStyle}>
            <span data-aliased-by-count={aliases.length}>
              {aliases.length} ·{" "}
              {aliases.map((a) => a.friendlyName ?? a.name).join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Lint */}
      <div style={fieldRowStyle}>
        <div style={fieldLabelStyle}>Lint</div>
        <div style={fieldValueStyle}>{lintRow}</div>
      </div>

      {/* Action row */}
      <div style={actionRowStyle}>
        <button
          type="button"
          onClick={handleReplaceValue}
          style={actionBtnStyle}
          aria-label="Replace value"
        >
          Replace value
        </button>
        <button
          type="button"
          onClick={handleRenameId}
          style={actionBtnStyle}
          aria-label="Rename ID"
        >
          Rename ID
        </button>
        <button
          type="button"
          onClick={handleDelete}
          style={dangerBtnStyle}
          aria-label="Delete token"
          aria-disabled={!isPro || undefined}
          disabled={!isPro}
        >
          Delete
        </button>
      </div>

      {/* Beginner notice */}
      {!isPro && (
        <div style={beginnerNoticeStyle} role="note" data-beginner-notice>
          <strong style={{ display: "block", marginBottom: 4 }}>
            Delete blocked in Beginner mode.
          </strong>
          <span>
            Pro shows replace-with / cascade-clear when {usageCount}{" "}
            {usageCount === 1 ? "element" : "elements"} bind.
          </span>
        </div>
      )}
    </div>
  );
};
