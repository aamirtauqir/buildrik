/**
 * KindTokenList — the token list for every non-colour kind: Spacing (2L9
 * B6-B22) and the eleven Other kinds pages (B6-B24, B6-B25, B6-B54, B6-B55).
 *
 * One 40px row per token on the TokenTable card: name · value · "Used by N"
 * (· PRESET on Spacing). A row click selects the token — the workspace draws
 * its card in the right column. On the Other kinds pages the row also edits
 * in place, as the boards draw:
 *   - the value is a field on click; Enter / blur writes it, Esc puts it
 *     back; a value the kind cannot take stays in the field with the
 *     kind's message ("Use a length such as 8px or 0.5rem. Nothing was
 *     changed.") and nothing is written (B6-B25);
 *   - ⋯ → Rename (inline, "Enter to rename · Esc to cancel. References
 *     update automatically; n places keep their look.", B6-B55) · Delete…
 *     (the workspace's delete / replace dialog, B6-B54).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "@/editor/design-system/types";
import { TokenTable, TokenTableRow, TOKEN_CELL_NAME, TOKEN_CELL_PREVIEW, TOKEN_CELL_VALUE } from "./TokenTable";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { Button, IconButton, Menu, MenuItem, Popover, TextInput } from "@/editor/chrome-ui";
import { renameError } from "../sections/TokenRenameDialog";

/** The in-place edits an Other kinds page offers. Absent on Spacing. */
export interface KindRowActions {
  /** Why `value` cannot be this kind's value, or null when it can. */
  validate: (value: string) => string | null;
  onValueChange: (id: string, value: string) => void;
  onRename?: (id: string, newId: string) => void;
  onDelete?: (id: string) => void;
  /** A seed token cannot be removed (the seed merges it back): its row
   *  offers "Reset to default" in Delete's place (owner, OQ-7). */
  onReset?: (id: string) => void;
  isSeed?: (id: string) => boolean;
  /** Every id in use — a rename may not collide. */
  takenIds: readonly string[];
}

const FIELD = "tw:h-7 tw:w-full tw:text-[length:var(--bk-text-13)]";
const HELP = "tw:col-span-full tw:px-3 tw:pb-2 tw:text-[length:var(--bk-text-12)] tw:leading-[18px]";

export interface KindTokenListProps {
  tokens: readonly DesignToken[];
  /** The list `tokens` resolves aliases against — the whole registry, since
   *  the mode filter can hide the primitives. Defaults to `tokens`. */
  allTokens?: readonly DesignToken[];
  /** "spacing", "radius" … — the empty-state noun. */
  kindLabel: string;
  usageByTokenId?: ReadonlyMap<string, number>;
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  /** Pro prints the token id; Beginner the friendly name. */
  isPro?: boolean;
  /** How many of this kind Beginner mode is hiding right now. */
  hiddenByModeCount?: number;
  /** Spacing only: the PRESET cell for a token. Absent → no PRESET column. */
  presetOf?: (token: DesignToken) => string;
  actions?: KindRowActions;
}

/* 7576:197036: gutter 52 · TOKEN 180 · VALUE 120 · PRESET 120 · USED; the
   Other kinds rows end in the ⋯ column, as wide as its button. */
const WITH_PRESET = "52px 180px 120px 120px minmax(0, 1fr)";
const WITHOUT_PRESET = "52px 180px 240px minmax(0, 1fr)";
const WITH_ACTIONS = "52px 180px 200px minmax(0, 1fr) auto";

export const KindTokenList: React.FC<KindTokenListProps> = ({
  tokens,
  allTokens = tokens,
  kindLabel,
  usageByTokenId,
  selectedTokenId,
  onSelectToken,
  isPro,
  hiddenByModeCount = 0,
  presetOf,
  actions,
}) => {
  const [editing, setEditing] = React.useState<{ id: string; draft: string; error: string | null } | null>(null);
  const [renaming, setRenaming] = React.useState<{ id: string; draft: string; error: string | null } | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  if (tokens.length === 0) {
    return (
      <div className="tw:py-6 tw:text-center tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="kind-empty">
        {hiddenByModeCount > 0
          ? `Beginner mode is hiding ${hiddenByModeCount} ${kindLabel} token${hiddenByModeCount === 1 ? "" : "s"}. Switch to Pro to see them.`
          : `No ${kindLabel} tokens yet.`}
      </div>
    );
  }

  const template = actions ? WITH_ACTIONS : presetOf ? WITH_PRESET : WITHOUT_PRESET;
  const columns = presetOf ? (["Token", "Value", "Preset", "Used"] as const) : (["Token", "Value", "Used"] as const);
  /* Keys typed into a row's field stay in the field: the row's own Enter /
     Space select it, and the table's arrows move between rows. */
  const keepKeys = (e: React.KeyboardEvent) => e.stopPropagation();

  const commitValue = () => {
    if (!editing || !actions) return;
    const error = actions.validate(editing.draft.trim());
    if (error) return setEditing({ ...editing, error });
    actions.onValueChange(editing.id, editing.draft.trim());
    setEditing(null);
  };
  const commitRename = () => {
    if (!renaming || !actions?.onRename) return;
    const next = renaming.draft.trim();
    const error = renameError(next, renaming.id, actions.takenIds.filter((t) => t !== renaming.id));
    if (error) return setRenaming({ ...renaming, error });
    actions.onRename(renaming.id, next);
    setRenaming(null);
  };

  return (
    <TokenTable columns={actions ? [...columns, ""] : columns} template={template} label={`${kindLabel} tokens`}>
      {tokens.map((token) => {
        const value = resolveTokenLiteral(allTokens, token.id, "light") ?? "";
        const usage = usageByTokenId?.get(token.id) ?? 0;
        const isEditing = editing?.id === token.id;
        const isRenaming = renaming?.id === token.id;
        return (
          <React.Fragment key={token.id}>
          <TokenTableRow
            tokenId={token.id}
            template={template}
            selected={selectedTokenId === token.id}
            onSelect={() => onSelectToken?.(token.id)}
          >
            <span className={TOKEN_CELL_PREVIEW}>
              <span aria-hidden="true" className="tw:relative tw:inline-block tw:size-4 tw:rounded-full tw:bg-[var(--bk-gray-200)]" />
            </span>
            <span className={TOKEN_CELL_NAME}>
              {isRenaming ? (
                <TextInput
                  sizing="sm"
                  autoFocus
                  aria-label={`New ID for ${token.id}`}
                  value={renaming.draft}
                  color={renaming.error ? "failure" : undefined}
                  className={FIELD}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenaming({ ...renaming, draft: e.target.value, error: null })}
                  onKeyDown={(e) => {
                    keepKeys(e);
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  data-testid={`brand-token-rename-input-${token.id}`}
                />
              ) : (
                <span className="tw:truncate" data-testid={`brand-token-name-${token.id}`}>
                  {isPro ? token.id : (token.friendlyName ?? token.name)}
                </span>
              )}
            </span>
            {isEditing ? (
              <span className={TOKEN_CELL_VALUE}>
                <TextInput
                  sizing="sm"
                  autoFocus
                  aria-label={`${token.id} value`}
                  aria-invalid={editing.error ? true : undefined}
                  color={editing.error ? "failure" : undefined}
                  value={editing.draft}
                  className={FIELD}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditing({ ...editing, draft: e.target.value, error: null })}
                  onBlur={commitValue}
                  onKeyDown={(e) => {
                    keepKeys(e);
                    if (e.key === "Enter") commitValue();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  data-testid={`brand-token-value-input-${token.id}`}
                />
              </span>
            ) : (
              actions ? (
                <span className={TOKEN_CELL_VALUE}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-label={`Edit ${token.id} value`}
                    className="tw:h-7 tw:min-h-0 tw:max-w-full tw:justify-start tw:px-1 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink-muted)]"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onSelectToken?.(token.id);
                      setEditing({ id: token.id, draft: value, error: null });
                    }}
                  >
                    <span className="tw:truncate" data-testid={`brand-token-value-${token.id}`}>{value}</span>
                  </Button>
                </span>
              ) : (
                <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-value-${token.id}`}>{value}</span>
              )
            )}
            {presetOf && (
              <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-preset-${token.id}`}>{presetOf(token)}</span>
            )}
            <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-used-${token.id}`}>
              Used by {usage}
            </span>
            {actions && (
              <span className="tw:flex tw:items-center tw:justify-center">
                <Popover
                  open={menuFor === token.id}
                  onClose={() => setMenuFor(null)}
                  placement="bottom-end"
                  label={`${token.id} actions`}
                  trigger={
                    <IconButton
                      label={`${token.id} actions`}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === token.id ? null : token.id);
                      }}
                      onKeyDown={keepKeys}
                      data-testid={`brand-kind-row-menu-${token.id}`}
                    >
                      ⋯
                    </IconButton>
                  }
                >
                  <Menu label={`${token.id} actions`}>
                    <MenuItem
                      disabled={!actions.onRename}
                      onClick={() => {
                        setMenuFor(null);
                        setRenaming({ id: token.id, draft: token.id, error: null });
                      }}
                      data-testid={`brand-kind-row-rename-${token.id}`}
                    >
                      Rename
                    </MenuItem>
                    {actions.isSeed?.(token.id) ? (
                      <MenuItem
                        disabled={!actions.onReset}
                        onClick={() => {
                          setMenuFor(null);
                          actions.onReset?.(token.id);
                        }}
                        data-testid={`brand-kind-row-reset-${token.id}`}
                      >
                        Reset to default
                      </MenuItem>
                    ) : (
                      <MenuItem
                        disabled={!actions.onDelete}
                        onClick={() => {
                          setMenuFor(null);
                          actions.onDelete?.(token.id);
                        }}
                        data-testid={`brand-kind-row-delete-${token.id}`}
                      >
                        Delete…
                      </MenuItem>
                    )}
                  </Menu>
                </Popover>
              </span>
            )}
          </TokenTableRow>
          {isEditing && editing.error && (
            <p role="alert" className={`${HELP} tw:m-0 tw:text-[var(--bk-error-text)]`} data-testid={`brand-token-value-error-${token.id}`}>
              {editing.error}
            </p>
          )}
          {isRenaming && (
            <p className={`${HELP} tw:m-0 ${renaming.error ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink-muted)]"}`} data-testid={`brand-token-rename-help-${token.id}`}>
              {renaming.error ??
                `Enter to rename · Esc to cancel. References update automatically; ${usage} place${usage === 1 ? "" : "s"} keep${usage === 1 ? "s" : ""} their look.`}
            </p>
          )}
          </React.Fragment>
        );
      })}
    </TokenTable>
  );
};
