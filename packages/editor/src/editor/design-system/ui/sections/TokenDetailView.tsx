/**
 * TokenDetailView — the selected token's card, board 7315:80955 (right
 * column, under the live preview; Spacing 7576:197036 draws the same card).
 *
 *   ┌ 468 ─────────────────────────────────────────────┐
 *   │ ▇ 40  name                                    ⋯  │  ⋯ → Rename · Delete (seed: Reset to default)
 *   │       id (Pro) / description                      │
 *   │ Light value  #1A56DB                    [Change]  │  → inline editor
 *   │ Dark value   #76A9FA                    [Change]  │  → inline field
 *   │ Used by      34 elements                [View ›]  │  → element list
 *   │ ✓ Brand checks pass · 8.6:1 contrast on white     │  or △ issue + fixes
 *   └───────────────────────────────────────────────────┘
 *
 * Where it mounts is the workspace's call: on Colors it is the body of the
 * token's edit page ("‹ Colors" drill-in, 2L9 B6-B02); on the other token
 * pages it is the card beside the preview. (Its draft ⓘ — "Edits stay in the
 * draft until you Save" — went with 2L9: Brand autosaves.)
 *
 * Engine reads (unchanged): usage from `tokenUsage` ("tokenUsage:changed"),
 * findings from `lintState` ("lint:changed"), the reverse alias lookup from
 * `aliasResolver` ("tokens:alias-changed"). Auto-fix computes the value
 * (`computeAutoFix`) and writes it through `onValueChange` — Brand's logged
 * commit — so it is one ⌘Z step and a Review-changes row.
 *
 * Departures from the board, recorded: "Used by 34 elements on 3 pages" —
 * the tracker counts elements, not pages, so the page half is not printed;
 * the ⋯ menu has no "Duplicate token" (no registry path for it).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { resolveTokenLiteral, type TokenUsageCount } from "@buildrik/shared/tokens";
import type { Composer } from "@/engine/Composer";
import type { DesignToken } from "@/editor/design-system/types";
import { useDSModeOptional } from "@/editor/design-system/state/DSModeContext";
import { TokenChecksLine, TokenUsageList, tokenContrastLine, useTokenFacts } from "./tokenFacts";
import { ColorPicker } from "../colors/ColorPicker";
import { displayValue } from "../colors/ColorTokenList";
import { BrandFontPopover } from "./BrandFontPopover";
import { TokenDeleteDialog } from "./TokenDeleteDialog";
import { TokenRenameDialog } from "./TokenRenameDialog";
import { Button, IconButton, Menu, MenuItem, Popover, TextInput } from "@/editor/chrome-ui";

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
  /** A seed token's "Delete" is "Reset to default" (owner, OQ-7): a seed
   *  token cannot be removed — the seed merges it back — so the menu offers
   *  what deleting it would really do. Given only for seed tokens. */
  onReset?: (id: string) => void;
  /** After a delete — the caller drops its selection. */
  onDeleted?: () => void;
  /** BRP1-M9: open the colour scale generator for this token. Given only for
   *  semantic colours (OQ-3: every one of them). */
  onGenerateScale?: (id: string) => void;
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
/* DQ-020: a 20px target (DESIGN.md A1.4) for a 16px line — the -2px margins
   keep the row's layout where the 16px link left it. */

/* The 40px preview tile — the token's own colour, family or size is the one
   computed value; everything else is chrome. */
const TILE = "tw:flex tw:size-10 tw:flex-none tw:items-center tw:justify-center tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-alpha-ink-10)]";

const previewTile = (token: DesignToken, value: string): React.ReactNode => {
  if (token.kind === "color" || token.category === "colors") {
    return <span aria-hidden="true" data-testid="brand-token-detail-swatch" className={TILE} style={{ background: value }} />;
  }
  if (token.kind === "type" || token.category === "typography") {
    return (
      <span
        aria-hidden="true"
        className={`${TILE} tw:bg-[var(--bk-gray-50)] tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:text-[var(--bk-ink)]`}
        style={token.type === "font-family" ? { fontFamily: value } : undefined}
      >
        Aa
      </span>
    );
  }
  if (token.kind === "spacing" || token.category === "spacing") {
    const num = parseFloat(value);
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
  onReset,
  onDeleted,
  onGenerateScale,
}) => {
  const dsMode = useDSModeOptional();
  const isPro = dsMode?.mode === "pro";
  const isColor = token.kind === "color" || token.category === "colors";
  const resolveList = React.useMemo(() => allTokens ?? [token], [allTokens, token]);
  const value = resolveTokenLiteral(resolveList, token.id, "light") ?? "";
  const darkValue = token.modes.dark ? resolveTokenLiteral(resolveList, token.id, "dark") ?? "" : undefined;
  /* The typed value commits on blur / Enter, not per keystroke: one write and
     one ⌘Z step per edit, and no half-typed (or empty) value reaches the canvas. */
  const [draft, setDraft] = React.useState(value);
  /* The draft last sent: a refused one (its toast already shown) is not sent
     again by the blur that follows Enter. Cleared when the value moves. */
  const sentRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    setDraft(value);
    sentRef.current = null;
  }, [value]);
  const commitDraft = () => {
    if (draft === value || draft === sentRef.current) return;
    sentRef.current = draft;
    onValueChange?.(token.id, draft);
  };

  // ─ Used by · lint · Aliased by — one subscription set, shared with ColorTokenEditor.
  const { usageRefs, usageCount, lintState, lintIssues, aliases } = useTokenFacts(composer, token.id, allTokens);
  const [usageExpanded, setUsageExpanded] = React.useState(false);

  const contrast = isColor ? tokenContrastLine(token, resolveList, mode) : null;

  // ─ Editors. The value line is read-only until its Change is pressed.
  const [editingLight, setEditingLight] = React.useState(false);
  /* A font role's Change opens the board's picker (7318:81029) first. */
  const [fontPopoverOpen, setFontPopoverOpen] = React.useState(false);
  /* 7318:80959's WORKSPACE PALETTE: the other brand colours, one swatch per
     distinct value, eight at most (the board draws seven). */
  const workspacePalette = React.useMemo(() => {
    const seen = new Set<string>();
    /* Semantic tokens only: a primitive may hold another token's DARK literal,
       which is not a brand colour of the light palette. */
    const list = allTokens ?? [];
    return list
      .filter((t) => t.type === "color" && t.layer === "semantic" && t.id !== token.id && !t.replacedBy)
      .map((t) => ({ id: t.id, name: t.name, value: resolveTokenLiteral(list, t.id, "light") ?? "" }))
      .filter((t) => {
        const v = t.value.toUpperCase();
        if (seen.has(v)) return false;
        seen.add(v);
        return true;
      })
      .slice(0, 8);
  }, [allTokens, token.id]);
  const [editingDark, setEditingDark] = React.useState(false);
  const [darkInput, setDarkInput] = React.useState(darkValue ?? "");
  React.useEffect(() => {
    setDarkInput(darkValue ?? "");
    setEditingLight(false);
    setFontPopoverOpen(false);
    setEditingDark(false);
    setUsageExpanded(false);
  }, [token.id, darkValue]);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const commitDark = () => {
    const next = darkInput.trim();
    setEditingDark(false);
    if (next === (darkValue ?? "")) return;
    onValueChange?.(token.id, value, next);
  };

  // ─ Lint actions.
  const handleAutoFix = () => {
    const issue = lintIssues[0];
    if (!issue || !composer) return;
    /* Through the card's own write (onValueChange → Brand's logged commit),
       exactly like Brand checks' Fix: one ⌘Z step AND a Review-changes row.
       The engine's applyAutoFix wrote around that log. */
    const fixed = composer.designSystem.computeAutoFix(value, issue.autoFixHint);
    if (fixed && fixed !== value) onValueChange?.(token.id, fixed);
    lintState?.suppress(token.id);
  };
  const handleIgnore = () => lintState?.suppress(token.id);

  // ─ Menu actions.
  const [renameOpen, setRenameOpen] = React.useState(false);
  const handleRenameId = () => {
    setMenuOpen(false);
    setRenameOpen(true);
  };

  // Safe delete (BRP1-M6): the site-wide count, read when Delete is pressed,
  // picks the dialog's state — a known 0 confirms, a number asks for a
  // replacement (`replacedBy`, one ⌘Z), "unknown" refuses with the reason.
  // The engine's removal guard refuses a hard delete of a used token anyway.
  const readCount = (): TokenUsageCount => composer?.designSystem?.tokenUsage?.getCount(token.id) ?? 0;
  const [deleteUsage, setDeleteUsage] = React.useState<TokenUsageCount | null>(null);
  const handleDelete = () => {
    setMenuOpen(false);
    if (!isPro || !onDelete) return; // Beginner-blocked, or no delete path.
    setDeleteUsage(readCount());
  };
  const handleReset = () => {
    setMenuOpen(false);
    onReset?.(token.id);
  };
  const confirmDelete = (opts: { replaceWith: string } | undefined) => {
    setDeleteUsage(null);
    if (opts) onDelete?.(token.id, opts);
    else onDelete?.(token.id);
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
        {previewTile(token, value)}
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
          {/* 7315:80955: Pro titles the card with the id ("color-primary") and
              puts the name under it ("Blue 700"); Beginner, which hides ids,
              titles it with the name over the description. */}
          {isPro ? (
            <>
              <span
                className="tw:truncate tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]"
                data-testid="brand-token-detail-id"
              >
                {token.id}
              </span>
              <span
                className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                data-testid="brand-token-detail-name"
              >
                {token.friendlyName ?? token.name}
              </span>
            </>
          ) : (
            <>
              <span
                className="tw:truncate tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]"
                data-testid="brand-token-detail-name"
              >
                {token.friendlyName ?? token.name}
              </span>
              {subtitle ? (
                <span className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                  {subtitle}
                </span>
              ) : null}
            </>
          )}
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
              {onGenerateScale && (
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    onGenerateScale(token.id);
                  }}
                  data-testid="brand-token-action-scale"
                >
                  Generate colour scale…
                </MenuItem>
              )}
              <MenuItem
                onClick={handleRenameId}
                disabled={!onRename}
                title={onRename ? undefined : "Type and spacing tokens keep their IDs."}
                data-testid="brand-token-action-rename"
              >
                Rename token…
              </MenuItem>
              {onReset ? (
                <MenuItem onClick={handleReset} data-testid="brand-token-action-reset">
                  Reset to default
                </MenuItem>
              ) : (
              <MenuItem
                danger
                onClick={handleDelete}
                aria-disabled={!isPro || !onDelete || undefined}
                disabled={!isPro || !onDelete}
                title={
                  !isPro
                    ? "Delete is blocked in Beginner mode. Switch to Pro to delete tokens."
                    : onDelete
                      ? undefined
                      : "Type and spacing tokens are part of the scale and cannot be deleted."
                }
                data-testid="brand-token-action-delete"
              >
                Delete token…
              </MenuItem>
              )}
            </Menu>
          </Popover>
        </div>
      </div>

      {/* Light value */}
      <div className={`${ROW} tw:mt-2`}>
        <span className={LABEL}>{isColor ? "Light value" : "Value"}</span>
        <span className={`${VALUE} ${isColor ? "" : MONO}`} data-testid="brand-token-value-light">
          {displayValue(value)}
        </span>
        {token.type === "font-family" ? (
          <BrandFontPopover
            open={fontPopoverOpen}
            onClose={() => setFontPopoverOpen(false)}
            trigger={
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => (editingLight ? setEditingLight(false) : setFontPopoverOpen((v) => !v))}
                aria-expanded={fontPopoverOpen || editingLight}
                aria-haspopup="dialog"
                data-testid="brand-token-action-replace"
                className={ACTION}
              >
                Change
              </Button>
            }
            roleName={token.name}
            tokenId={token.id}
            value={value}
            onPick={(family) => {
              onValueChange?.(token.id, family);
              setFontPopoverOpen(false);
            }}
            onTypeStack={() => {
              setFontPopoverOpen(false);
              setEditingLight(true);
            }}
            composer={composer}
          />
        ) : isColor ? (
          /* 7318:80959 — the one colour picker, as a popover off Change. */
          <Popover
            open={editingLight}
            onClose={() => setEditingLight(false)}
            placement="bottom-end"
            label={`${token.name} colour`}
            trigger={
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => setEditingLight((v) => !v)}
                aria-expanded={editingLight}
                aria-haspopup="dialog"
                data-testid="brand-token-action-replace"
                className={ACTION}
              >
                Change
              </Button>
            }
          >
            {/* -m-2 cancels the popover's own inset: the picker's header rule
                and grey foot run edge to edge as on the board. */}
            <div className="tw:-m-2 tw:overflow-hidden tw:rounded-lg" data-testid="brand-token-light-editor">
              <ColorPicker
                initialHex={value}
                title={token.name}
                palette={workspacePalette}
                onChange={() => {
                  /* live preview owned by picker; commit via onSave */
                }}
                onSave={(hex) => {
                  onValueChange?.(token.id, hex);
                  setEditingLight(false);
                }}
                onCancel={() => setEditingLight(false)}
              />
            </div>
          </Popover>
        ) : (
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
        )}
      </div>
      {editingLight && !isColor && (
        <div className="tw:mb-2" data-testid="brand-token-light-editor">
          {(
            <>
              <TextInput
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitDraft();
                }}
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
            {darkValue ? (
              <span className={VALUE} data-testid="brand-token-value-dark">{displayValue(darkValue)}</span>
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
              {darkValue ? "Change" : "Set"}
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
                    setDarkInput(darkValue ?? "");
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
      {usageExpanded && usageCount > 0 && <TokenUsageList composer={composer} usageRefs={usageRefs} />}

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
      <TokenChecksLine issue={issue} contrast={contrast} onAutoFix={handleAutoFix} onIgnore={handleIgnore} />


      <TokenRenameDialog
        open={renameOpen}
        currentId={token.id}
        takenIds={(allTokens ?? []).map((t) => t.id).filter((id) => id !== token.id)}
        usage={usageCount}
        siteName={composer?.getProjectMetadata?.()?.name}
        onCancel={() => setRenameOpen(false)}
        onRename={(newId) => {
          setRenameOpen(false);
          onRename?.(token.id, newId);
        }}
      />

      <TokenDeleteDialog
        open={deleteUsage !== null}
        token={token}
        usage={deleteUsage ?? 0}
        allTokens={allTokens ?? [token]}
        onClose={() => setDeleteUsage(null)}
        onDelete={confirmDelete}
        onRetry={() => setDeleteUsage(readCount())}
      />
    </section>
  );
};
