/**
 * ConnectTokensCheck — Brand › Brand checks › Connect to tokens, board BRP1-M7:
 *
 *   8224:234362  suggestions         "#1A56DB · 14 elements → Primary" · Change
 *   8224:234982  choose-token        "Two tokens match #1A56DB. Choose one."
 *   8224:235608  preview             the affected elements highlighted in the
 *                                    live preview; Cancel · Apply
 *   8224:236236  applied             "Connected 74 elements. Your site looks the same."
 *   8224:236852  nothing-to-connect  "No unconnected values match your tokens."
 *
 * The suggestions are the engine's (`designSystem.connectSuggestions`): raw
 * values that EXACTLY equal a token's light value, whole values only, base
 * styles and breakpoint overrides, component instances and masters skipped
 * (owner, OQ-5/6). A tie the engine leaves open (`target: null`) waits for the
 * user's pick (a row left without one is not connected); Primary wins a tie
 * it is part of. Apply is
 * `designSystem.applyConnect` — ONE transaction, one ⌘Z — and takes no restore
 * point (owner, OQ-4), so the board's "Apply creates a restore point" line
 * reads "Apply is one ⌘Z step." here.
 *
 * Preview is a highlight, not a repaint: every target equals the raw value by
 * construction, so the page would look the same. The highlight is cleared on
 * Cancel, on Apply, on unmount and (by the workspace) on a page change.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { ConnectSuggestion } from "@/engine/designSystem/connectTokens";
import { Button } from "@/editor/chrome-ui";
import type { DesignToken } from "../../types";
import { candidateLabel } from "./TokenDeleteDialog";
import { displayValue } from "../colors/ColorTokenList";
import { NOTICE, SMALL_ACTION } from "./UsageHighlight";

export interface ConnectTokensCheckProps {
  composer: Composer | null | undefined;
  /** Every token — names for the targets and the chooser. */
  tokens: readonly DesignToken[];
  /** Highlight these elements in the live preview; `null` clears it. */
  onPreview: (elementIds: readonly string[] | null) => void;
  /** "Back to colours" on the nothing-to-connect state. */
  onBack: () => void;
  /** After a successful Apply, with the number of elements connected. */
  onApplied?: (elements: number) => void;
}

/* 8224:235564 "Card · Connect exact matches": 16 in, 12 between, radius-md. */
const CARD =
  "tw:flex tw:flex-col tw:items-start tw:gap-3 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-4";
const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[var(--bk-leading-30)] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]";
const COPY = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
const ROW_TEXT = "tw:m-0 tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";

const COUNT_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

type Phase = "choose" | "preview" | "applied";

export const ConnectTokensCheck: React.FC<ConnectTokensCheckProps> = ({ composer, tokens, onPreview, onBack, onApplied }) => {
  /* Read once per visit: the list is a snapshot the user works through, and
     the applied state keeps showing what was connected. */
  const [suggestions] = React.useState<ConnectSuggestion[]>(() => composer?.designSystem?.connectSuggestions?.() ?? []);
  const [picks, setPicks] = React.useState<Record<string, string | null>>(() =>
    Object.fromEntries(suggestions.map((s) => [s.key, s.target])),
  );
  /* The chooser: the row whose Change was pressed, else the first tie. */
  const [choosing, setChoosing] = React.useState<string | null>(() => suggestions.find((s) => s.target === null)?.key ?? null);
  const [phase, setPhase] = React.useState<Phase>("choose");
  const [connected, setConnected] = React.useState(0);
  const applying = React.useRef(false);

  /* Cleared on unmount — a highlight must never outlive the page that drew it. */
  const previewRef = React.useRef(onPreview);
  previewRef.current = onPreview;
  React.useEffect(() => () => previewRef.current(null), []);

  const nameOf = (id: string | null | undefined) => {
    const t = id ? tokens.find((x) => x.id === id) : undefined;
    return t ? (t.friendlyName ?? t.name) : null;
  };
  const included = suggestions.filter((s) => picks[s.key]);
  const elementIds = [...new Set(included.flatMap((s) => s.refs.map((r) => r.elementId)))];

  const preview = () => {
    setPhase("preview");
    setChoosing(null);
    onPreview(elementIds);
  };
  const cancel = () => {
    setPhase("choose");
    onPreview(null);
  };
  const apply = () => {
    if (applying.current) return;
    applying.current = true;
    const writes = composer?.designSystem?.applyConnect?.(included.map((s) => ({ key: s.key, tokenId: picks[s.key] as string }))) ?? 0;
    onPreview(null);
    if (writes > 0) {
      setConnected(elementIds.length);
      setPhase("applied");
      onApplied?.(elementIds.length);
    } else {
      applying.current = false;
      setPhase("choose");
    }
  };

  if (suggestions.length === 0) {
    return (
      <section aria-label="Connect to tokens" className={CARD} data-testid="brand-connect-check" data-connect-state="empty">
        <p className={TITLE}>Nothing to connect</p>
        <p className={COPY}>Connect raw values to semantic tokens without changing how your site looks.</p>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]">
          No unconnected values match your tokens.
        </p>
        <Button type="button" variant="secondary" size="xs" className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`} onClick={onBack}>
          Back to colours
        </Button>
      </section>
    );
  }

  const chooser = choosing ? suggestions.find((s) => s.key === choosing) : undefined;

  return (
    <section aria-label="Connect to tokens" className={CARD} data-testid="brand-connect-check" data-connect-state={phase}>
      <p className={TITLE}>Connect exact matches</p>
      <p className={COPY}>Connect raw values to semantic tokens without changing how your site looks.</p>
      {suggestions.map((s) => {
        const target = picks[s.key];
        return (
          <div key={s.key} className="tw:flex tw:w-full tw:items-center tw:gap-2" data-testid={`brand-connect-row-${s.key}`}>
            {/* 8224:235568: a 24 swatch for a colour; other kinds keep its slot. */}
            <span
              aria-hidden="true"
              className={`tw:size-6 tw:flex-none tw:rounded-[var(--bk-radius-sm)] ${s.kind === "color" ? "tw:border tw:border-[var(--bk-border)]" : ""}`}
              style={s.kind === "color" ? { background: s.value } : undefined}
            />
            <p className={ROW_TEXT}>
              {displayValue(s.value)} · {plural(s.elementCount, "element")} → {target ? nameOf(target) : "Choose a token"}
            </p>
            {/* The boards keep Change on the rows while previewing (it goes back
                to choosing); once applied there is nothing left to change. */}
            {phase !== "applied" && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`}
              onClick={() => {
                if (phase === "preview") cancel();
                setChoosing(choosing === s.key ? null : s.key);
              }}
              aria-expanded={choosing === s.key}
            >
              Change
            </Button>
            )}
          </div>
        );
      })}

      {phase === "choose" && chooser && (
        /* 8224:235594 "Card · Choose matching token": 12 in, 12 between. */
        <div
          className="tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-3 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-3"
          data-testid="brand-connect-chooser"
        >
          <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:font-semibold tw:leading-[18px] tw:text-[var(--bk-ink)]">
            {chooser.candidates.length > 1
              ? `${COUNT_WORDS[chooser.candidates.length] ?? chooser.candidates.length} tokens match ${displayValue(chooser.value)}. Choose one.`
              : `${displayValue(chooser.value)} matches ${nameOf(chooser.candidates[0])}.`}
          </p>
          {chooser.candidates.map((id) => {
            const t = tokens.find((x) => x.id === id);
            if (!t) return null;
            const on = picks[chooser.key] === id;
            return (
              <Button
                key={id}
                type="button"
                variant={on ? "primary" : "secondary"}
                size="xs"
                aria-pressed={on}
                className={`${SMALL_ACTION} ${on ? "" : "tw:text-[var(--bk-gray-700)]"}`}
                onClick={() => {
                  setPicks((p) => ({ ...p, [chooser.key]: id }));
                  setChoosing(null);
                }}
              >
                {candidateLabel(t, tokens)}
              </Button>
            );
          })}
        </div>
      )}

      {/* 8224:234982 draws no Preview while the chooser is open: pick first. */}
      {phase === "choose" && !chooser && (
        <Button
          type="button"
          variant="primary"
          size="xs"
          className={SMALL_ACTION}
          disabled={included.length === 0}
          onClick={preview}
          data-testid="brand-connect-preview"
        >
          Preview on canvas
        </Button>
      )}

      {phase === "preview" && (
        <>
          <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-accent-tint)]`} role="status" data-testid="brand-connect-preview-notice">
            Preview only · Your colours are unchanged. Confirm to connect {plural(elementIds.length, "element")}.
          </p>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button type="button" variant="secondary" size="xs" className={`${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`} onClick={cancel}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="xs" className={SMALL_ACTION} onClick={apply} data-testid="brand-connect-apply">
              Apply
            </Button>
          </div>
        </>
      )}

      {phase === "applied" ? (
        <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-success-tint)]`} role="status" data-testid="brand-connect-applied-notice">
          Connected {plural(connected, "element")}. Your site looks the same.
        </p>
      ) : (
        <p className={`${COPY} tw:text-[var(--bk-ink-muted)]`} data-testid="brand-connect-note">
          Apply is one ⌘Z step.
        </p>
      )}
    </section>
  );
};
