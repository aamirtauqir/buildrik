/**
 * A colour token's edit page (2L9 B6-B02 `203:34125`, B03, B04, B06):
 *
 *   primary
 *   This changes 42 places across the site, including uses through aliases.
 *   Light  [■ #1A56DB      ]  [ Picker ]
 *   Dark   [■ #60A5FA      ]  [ Picker ]
 *   [ Dark shade suggestions ▾ ]          from the light colour's own scale
 *   [ Literal value · no alias        ⌄ ]  or "Alias of {token}"
 *              Used by 42 ›               the elements, each selectable
 *         Aliased by 3 tokens ›           opens one of them
 *   Token actions ▾                       Rename · Generate scale · Reset · Delete
 *
 * A hex field commits on Enter / blur; an invalid one stays in the field with
 * "Enter a valid hex color, such as #1A56DB. The token hasn’t changed." (B04).
 * Every write goes through the page's own commit, so each is one ⌘Z step and
 * a Review-changes row. The Brand-check line stays under the actions.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { lightAliasOf, resolveTokenLiteral, type TokenUsageCount } from "@buildrik/shared/tokens";
import type { Composer } from "@/engine/Composer";
import type { DesignToken } from "@/editor/design-system/types";
import { generateColorScale, SCALE_STEPS, type ScaleStep } from "@/engine/designSystem/scale";
import { useDSModeOptional } from "@/editor/design-system/state/DSModeContext";
import { Button, Menu, MenuItem, Popover, Select, TextInput } from "@/editor/chrome-ui";
import { ColorPicker } from "./ColorPicker";
import { displayValue } from "./ColorTokenList";
import { TokenChecksLine, TokenUsageList, tokenContrastLine, useTokenFacts } from "../sections/tokenFacts";
import { TokenDeleteDialog } from "../sections/TokenDeleteDialog";
import { TokenRenameDialog } from "../sections/TokenRenameDialog";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const LABEL = "tw:w-12 tw:flex-none tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const ACTION = "tw:h-8 tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink)]";
const LINK = "tw:h-8 tw:self-center tw:text-[length:var(--bk-text-13)] tw:font-normal";

export interface ColorTokenEditorProps {
  token: DesignToken;
  composer: Composer | null | undefined;
  allTokens: readonly DesignToken[];
  mode?: "light" | "dark";
  onValueChange: (id: string, value: string, darkValue?: string) => boolean;
  /** Point the light mode at another token, or (null) back to a literal of the value it shows. */
  onAliasChange: (id: string, targetId: string | null) => void;
  onSelectToken: (id: string) => void;
  onShowUsage?: (id: string) => void;
  onRename?: (id: string, newId: string) => void;
  onDelete?: (id: string, opts?: { replaceWith?: string }) => void;
  onReset?: (id: string) => void;
  onDeleted?: () => void;
  onGenerateScale?: (id: string) => void;
}

/** Dark-mode candidates from the light colour's own scale: its dark step,
 *  its mirror step, and the 300 / 400 steps — each once. */
export function darkShadeSuggestions(light: string): Array<{ step: ScaleStep; hex: string }> {
  const scale = generateColorScale(light);
  if (!scale) return [];
  const steps = [scale.darkStep, scale.mirrorStep, 300, 400] as ScaleStep[];
  const seen = new Set<string>();
  return steps
    .map((step) => ({ step, hex: scale.hexes[SCALE_STEPS.indexOf(step)] }))
    .filter(({ hex }) => hex && !seen.has(hex) && (seen.add(hex), true));
}

function HexRow({ label, value, onCommit, onInvalid, picker, testId }: { label: string; value: string; onCommit: (hex: string) => void; onInvalid: (invalid: boolean) => void; picker: React.ReactNode; testId: string }) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const invalid = draft.trim() !== "" && !HEX.test(draft.trim());
  React.useEffect(() => onInvalid(invalid), [invalid]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => {
    const next = draft.trim();
    if (next === value || !HEX.test(next)) return;
    onCommit(next.toUpperCase());
  };
  return (
    <div className="tw:flex tw:items-center tw:gap-3">
      <span className={LABEL}>{label}</span>
      <span className="tw:relative tw:min-w-0 tw:flex-1">
        <span
          aria-hidden="true"
          className="tw:pointer-events-none tw:absolute tw:left-2 tw:top-1/2 tw:z-10 tw:size-4 tw:-translate-y-1/2 tw:rounded-[var(--bk-radius-xs)] tw:border tw:border-[var(--bk-alpha-ink-10)]"
          style={{ background: HEX.test(draft.trim()) ? draft.trim() : value || "transparent" }}
        />
        <TextInput
          sizing="sm"
          aria-label={`${label} value`}
          aria-invalid={invalid || undefined}
          value={draft}
          placeholder="—"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(value);
          }}
          className="tw:[&_input]:pl-8 tw:[&_input]:[font-family:var(--bk-font-mono)]"
          data-testid={testId}
        />
      </span>
      {picker}
    </div>
  );
}

export function ColorTokenEditor(props: ColorTokenEditorProps) {
  const { token, composer, allTokens, mode = "light", onValueChange, onAliasChange, onSelectToken, onShowUsage } = props;
  const isPro = useDSModeOptional()?.mode === "pro";
  const { usageRefs, usageCount, lintState, lintIssues, aliases } = useTokenFacts(composer, token.id, allTokens);
  const light = resolveTokenLiteral(allTokens, token.id, "light") ?? "";
  const dark = token.modes.dark ? resolveTokenLiteral(allTokens, token.id, "dark") ?? "" : "";
  const [picking, setPicking] = React.useState<"light" | "dark" | null>(null);
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [aliasesOpen, setAliasesOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [usageOpen, setUsageOpen] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteUsage, setDeleteUsage] = React.useState<TokenUsageCount | null>(null);
  const [autoFixFailed, setAutoFixFailed] = React.useState(false);
  const [invalidRows, setInvalidRows] = React.useState<{ light: boolean; dark: boolean }>({ light: false, dark: false });
  const invalid = invalidRows.light || invalidRows.dark;
  const invalidFor = (which: "light" | "dark") => (v: boolean) => setInvalidRows((r) => (r[which] === v ? r : { ...r, [which]: v }));
  React.useEffect(() => {
    setPicking(null);
    setUsageOpen(false);
  }, [token.id]);

  const write = (which: "light" | "dark", hex: string) => (which === "light" ? onValueChange(token.id, hex) : onValueChange(token.id, light, hex));
  const commitFrom = (which: "light" | "dark") => (hex: string) => write(which, hex);
  const pickerFor = (which: "light" | "dark") => (
    <Popover
      open={picking === which}
      onClose={() => setPicking(null)}
      placement="bottom-end"
      label={`${token.name} ${which} colour`}
      trigger={
        <Button type="button" variant="secondary" size="xs" className={`${ACTION} tw:w-[130px] tw:justify-center`} aria-expanded={picking === which} onClick={() => setPicking((p) => (p === which ? null : which))} data-testid={which === "light" ? "brand-token-action-replace" : "brand-token-picker-dark"}>
          Picker
        </Button>
      }
    >
      <ColorPicker
        initialHex={(which === "light" ? light : dark) || light}
        title={token.name}
        onChange={() => undefined}
        onCancel={() => setPicking(null)}
        onSave={(hex) => {
          setPicking(null);
          write(which, hex);
        }}
      />
    </Popover>
  );

  /* The alias select: its own literal, or another colour token (not one that
     leads back here, not a token's private custom-* literal). */
  const current = lightAliasOf(token);
  const aliased = current && !current.startsWith("custom-") ? current : "";
  const targets = allTokens.filter(
    (t) => (t.kind === "color" || t.category === "colors") && t.id !== token.id && !t.replacedBy && !t.id.startsWith("custom-") && !aliases.some((a) => a.id === t.id),
  );
  const suggestions = darkShadeSuggestions(light);
  const readCount = (): TokenUsageCount => composer?.designSystem?.tokenUsage?.getCount(token.id) ?? 0;
  const issue = lintIssues[0];

  return (
    <section aria-label={`${token.friendlyName ?? token.name} token`} className="tw:flex tw:max-w-[446px] tw:flex-col tw:gap-3" data-testid="brand-color-token-editor">
      <HexRow
        label="Light"
        value={light}
        onCommit={commitFrom("light")}
        onInvalid={invalidFor("light")}
        picker={pickerFor("light")}
        testId="brand-token-hex-light"
      />
      <HexRow label="Dark" value={dark} onCommit={commitFrom("dark")} onInvalid={invalidFor("dark")} picker={pickerFor("dark")} testId="brand-token-hex-dark" />
      <Popover
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        placement="bottom"
        label="Dark shade suggestions"
        trigger={
          <Button type="button" variant="secondary" size="xs" className={`${ACTION} tw:w-[240px] tw:justify-center`} disabled={suggestions.length === 0} aria-expanded={suggestOpen} onClick={() => setSuggestOpen((v) => !v)} data-testid="brand-dark-suggestions">
            Dark shade suggestions ▾
          </Button>
        }
      >
        <Menu>
          {suggestions.map(({ step, hex }) => (
            <MenuItem
              key={hex}
              onClick={() => {
                setSuggestOpen(false);
                write("dark", hex);
              }}
              data-testid="brand-dark-suggestion"
            >
              <span aria-hidden="true" className="tw:mr-2 tw:inline-block tw:size-3 tw:rounded-[var(--bk-radius-xs)]" style={{ background: hex }} />
              {step} · {hex}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
      <Select
        sizing="sm"
        aria-label="Alias"
        value={aliased}
        onChange={(e) => onAliasChange(token.id, e.target.value || null)}
        data-testid="brand-token-alias"
      >
        <option value="">Literal value · no alias</option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            Alias of {t.friendlyName ?? t.name} · {displayValue(resolveTokenLiteral(allTokens, t.id, "light") ?? "")}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        variant="link"
        size="xs"
        className={LINK}
        disabled={usageCount === 0}
        aria-expanded={usageOpen}
        onClick={() => {
          setUsageOpen((v) => !v);
          onShowUsage?.(token.id);
        }}
        data-testid="brand-token-used-by"
      >
        Used by {usageCount} ›
      </Button>
      {usageOpen && usageCount > 0 && <TokenUsageList composer={composer} usageRefs={usageRefs} />}
      {aliases.length > 0 && (
        <Popover
          open={aliasesOpen}
          onClose={() => setAliasesOpen(false)}
          placement="bottom"
          label="Aliased by"
          trigger={
            <Button type="button" variant="link" size="xs" className={LINK} aria-expanded={aliasesOpen} onClick={() => setAliasesOpen((v) => !v)} data-testid="brand-token-aliased-by">
              Aliased by {aliases.length} token{aliases.length === 1 ? "" : "s"} ›
            </Button>
          }
        >
          <Menu>
            {aliases.map((a) => (
              <MenuItem
                key={a.id}
                onClick={() => {
                  setAliasesOpen(false);
                  onSelectToken(a.id);
                }}
              >
                {a.friendlyName ?? a.name}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
      )}
      <Popover
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="bottom"
        label="Token actions"
        trigger={
          <Button type="button" variant="ghost" size="xs" className={`${ACTION} tw:self-start tw:border-transparent tw:bg-transparent`} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} data-testid="brand-token-menu">
            Token actions ▾
          </Button>
        }
      >
        <Menu>
          <MenuItem
            disabled={!props.onRename}
            onClick={() => {
              setMenuOpen(false);
              setRenameOpen(true);
            }}
          >
            Rename…
          </MenuItem>
          {props.onGenerateScale && (
            <MenuItem
              onClick={() => {
                setMenuOpen(false);
                props.onGenerateScale!(token.id);
              }}
              data-testid="brand-token-action-scale"
            >
              Generate scale
            </MenuItem>
          )}
          {props.onReset ? (
            <MenuItem
              onClick={() => {
                setMenuOpen(false);
                props.onReset!(token.id);
              }}
              data-testid="brand-token-action-reset"
            >
              Reset to default
            </MenuItem>
          ) : (
            <MenuItem
              disabled={!isPro || !props.onDelete}
              onClick={() => {
                setMenuOpen(false);
                setDeleteUsage(readCount());
              }}
            >
              Delete…
            </MenuItem>
          )}
        </Menu>
      </Popover>
      {invalid && (
        <p role="alert" className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-error-text)]" data-testid="brand-token-hex-error">
          Enter a valid hex color, such as #1A56DB. The token hasn’t changed.
        </p>
      )}
      <TokenChecksLine
        issue={issue}
        contrast={tokenContrastLine(token, allTokens, mode)}
        autoFixFailed={autoFixFailed}
        onAutoFix={() => {
          if (!issue || !composer) return;
          const fixed = composer.designSystem.computeAutoFix(light, issue.autoFixHint);
          /* B-2: hide the warning only once the fix is written. */
          const written = !!fixed && fixed !== light && onValueChange(token.id, fixed);
          setAutoFixFailed(!written);
          if (written) lintState?.suppress(token.id);
        }}
        onIgnore={() => lintState?.suppress(token.id)}
      />
      <TokenRenameDialog
        open={renameOpen}
        currentId={token.id}
        takenIds={allTokens.map((t) => t.id).filter((id) => id !== token.id)}
        usage={usageCount}
        siteName={composer?.getProjectMetadata?.()?.name}
        onCancel={() => setRenameOpen(false)}
        onRename={(newId) => {
          setRenameOpen(false);
          props.onRename?.(token.id, newId);
        }}
      />
      <TokenDeleteDialog
        open={deleteUsage !== null}
        token={token}
        usage={deleteUsage ?? 0}
        allTokens={allTokens}
        onClose={() => setDeleteUsage(null)}
        onDelete={(opts) => {
          setDeleteUsage(null);
          if (opts) props.onDelete?.(token.id, opts);
          else props.onDelete?.(token.id);
          props.onDeleted?.();
        }}
        onRetry={() => setDeleteUsage(readCount())}
      />
    </section>
  );
}
