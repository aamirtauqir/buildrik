/**
 * ColourModeSection — Brand › Colour mode, board 7316:80949 (C1 (ii); was
 * the drawer's 153:92).
 *
 * One bordered card, a 48px row per colour token: the id, then either "No dark
 * value" with a Set action, or "#LIGHT → #DARK" with a check. The tokens that
 * still need a value come first — that is what the page is for. The Light /
 * Dark switch is not on this page any more: the board draws it inside the
 * live preview card, so the workspace passes it there.
 *
 * Deferred at M5 with the reason "its board lists tokens with NO DARK VALUE
 * plus a Set action each, and that query is not known to exist on the
 * registries". Both halves are true now and neither was quite what I said:
 *
 *   · The QUERY was always there — `ColorTokenList` computes exactly this at
 *     :243. What is NOT the query is `DSLinter`'s `missing-dark` rule, which
 *     only fires when the project already holds at least one darkValue
 *     (DSLinter.ts:141), so it would report nothing on the project that needs
 *     this screen most.
 *   · The WRITE was genuinely missing, and worse than missing: TokenDetailView
 *     had a dark-value input with an empty onBlur that discarded what you
 *     typed. Fixed earlier today, so `updateToken(id, value, darkValue)` is now
 *     reachable from the UI at all.
 *
 * Set is inline rather than a jump into Tokens. The row already names the token
 * and the only missing piece is one value; sending someone two levels away to
 * type it would be navigation standing in for a text field.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Check } from "lucide-react";
import { Button, TextInput } from "@/editor/chrome-ui";
import { useColorRegistry } from "../../state/TokenRegistryContext";
import { useDSModeOptional } from "../../state/DSModeContext";
import { filterTokensByMode } from "../../utils/semanticKind";
import { displayValue } from "../colors/ColorTokenList";

/* 7316:80949: 48 tall, 16 in on the left, 12 on the right; 14px ink name over
   a 13px muted line; the action in accent. */
const ROW = "tw:flex tw:h-12 tw:items-center tw:gap-3 tw:pl-4 tw:pr-3";
const NAME = "tw:truncate tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]";
const SUB = "tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export const ColourModeSection: React.FC = () => {
  const color = useColorRegistry();
  const mode = useDSModeOptional()?.mode ?? "beginner";
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  /* The unconditional question — which colour tokens have no dark value — not
     the lint rule, which stays silent until the project has at least one.
     The same mode filter as the Colours page, so the two pages count the same
     palette. */
  const { missing, paired } = React.useMemo(() => {
    const visible = filterTokensByMode(color?.tokens ?? [], mode);
    return {
      missing: visible.filter((t) => !t.darkValue),
      paired: visible.filter((t) => t.darkValue),
    };
  }, [color?.tokens, mode]);

  const commit = (id: string, lightValue: string) => {
    const next = draft.trim();
    setEditing(null);
    if (!next) return;
    color.updateToken(id, lightValue, next);
  };

  if (missing.length + paired.length === 0) {
    return (
      <div className="tw:py-6 tw:text-center tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-muted)]">
        No colour tokens yet.
      </div>
    );
  }

  return (
    <ul
      className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:overflow-hidden tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-0"
      aria-label="Colour mode"
      data-testid="brand-colour-mode-list"
    >
      {/*
        The id, not the display name — the board draws ids, and the live
        palette holds both `Text` and `Text Primary`, so a name cannot say
        which token you are about to give a dark value to. The name stays in
        the title so it is still reachable.
      */}
      {missing.map((t) => (
        <li key={t.id} data-no-dark-row={t.id} data-testid={`brand-nodark-row-${t.id}`} className={ROW}>
          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
            <span data-testid={`brand-nodark-name-${t.id}`} className={NAME} title={t.name}>
              {t.id}
            </span>
            <span className={SUB}>No dark value</span>
          </div>
          {editing === t.id ? (
            <TextInput
              autoFocus
              value={draft}
              aria-label={`Dark value for ${t.name}`}
              className="tw:w-28 tw:[font-family:var(--bk-font-mono)]"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commit(t.id, t.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(t.id, t.value);
                if (e.key === "Escape") setEditing(null);
              }}
            />
          ) : (
            <Button
              size="xs"
              variant="link"
              data-set-dark={t.id}
              data-testid={`brand-nodark-set-${t.id}`}
              onClick={() => {
                setDraft(t.value);
                setEditing(t.id);
              }}
              className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 tw:text-[var(--bk-accent-text)]"
            >
              Set
            </Button>
          )}
        </li>
      ))}
      {paired.map((t) => (
        <li key={t.id} data-dark-row={t.id} data-testid={`brand-dark-row-${t.id}`} className={ROW}>
          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
            <span className={NAME} title={t.name}>
              {t.id}
            </span>
            <span className={SUB} data-testid={`brand-dark-pair-${t.id}`}>
              {displayValue(t.value)} → {displayValue(t.darkValue ?? "")}
            </span>
          </div>
          <Check size={12} aria-label="Has a dark value" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
        </li>
      ))}
    </ul>
  );
};

export default ColourModeSection;
