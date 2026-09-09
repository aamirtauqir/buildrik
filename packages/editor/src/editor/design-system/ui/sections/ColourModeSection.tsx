/**
 * ColourModeSection — Brand › Colour mode, board 153:92.
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
import { Button, TextInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine/Composer";
import { useColorRegistry } from "../../state/TokenRegistryContext";
import { ColorModeToggle } from "../ColorModeToggle";

export interface ColourModeSectionProps {
  composer?: Composer | null;
}

export const ColourModeSection: React.FC<ColourModeSectionProps> = ({ composer }) => {
  const color = useColorRegistry();
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  /* The unconditional question — which colour tokens have no dark value — not
     the lint rule, which stays silent until the project has at least one. */
  const missing = React.useMemo(
    () => (color?.tokens ?? []).filter((t) => !t.darkValue),
    [color?.tokens],
  );

  const commit = (id: string, lightValue: string) => {
    const next = draft.trim();
    setEditing(null);
    if (!next) return;
    color.updateToken(id, lightValue, next);
  };

  return (
    <div className="tw:flex tw:flex-col">
      {composer && composer.colorMode ? (
        /* 44 tall — 153:99. `py-2` around a 34px group measured 50, which is
           six pixels of unboarded band above the first section header. */
        <div className="tw:flex tw:h-11 tw:flex-none tw:items-center tw:px-3" data-testid="brand-colour-mode-preview">
          <ColorModeToggle composer={composer} />
        </div>
      ) : null}

      <div
        /* `--bk-ink-soft`, not the board's `--color/ink-muted`: this header's
           own fill is `--bk-gray-100`, where ink-muted measures 4.39:1 and
           fails AA at 11px. Same substitution as DesignTabFooter's status line.
           28 tall on a 16 inset with an 8px gap — 220:835, the shared Section
           header. It shipped 12-in on a `py-1.5` hug, so the one band that
           groups this list sat 4px inside every row it grouped. */
        className="tw:flex tw:h-7 tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-0 tw:text-[11px] tw:leading-4 tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-[var(--bk-ink-soft)] tw:bg-[var(--bk-gray-100)]"
        data-no-dark-header
        data-testid="brand-nodark-header"
      >
        <span>No dark value</span>
        <span className="tw:font-mono tw:tabular-nums tw:font-medium" data-no-dark-count>{missing.length}</span>
      </div>

      {missing.length === 0 ? (
        <div className="tw:px-3 tw:py-6 tw:text-center tw:text-xs tw:text-[var(--bk-ink-muted)]">
          Every colour token has a dark value.
        </div>
      ) : (
        <ul className="tw:flex tw:flex-col tw:list-none tw:m-0 tw:p-0">
          {missing.map((t) => (
            <li
              key={t.id}
              data-no-dark-row={t.id}
              data-testid={`brand-nodark-row-${t.id}`}
              className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:px-4 tw:py-0"
            >
              {/*
                The id, not the display name. Board 153:92 draws these rows as
                mono ids (`brand/accent-soft`, `surface/raised`) and the mono
                was already here — only the value was wrong. It matters on this
                screen more than on any other: the live list holds both `Text`
                and `Text Primary`, so a name cannot say which token you are
                about to give a dark value to, and this row's whole job is to
                let you set one without leaving to check.

                The board's own ids are sample data in a different convention;
                ours are `color-text` / `color-primary`, which serve the same
                purpose. The name stays in the accessible label so a screen
                reader still reads something human.
              */}
              <span
                data-testid={`brand-nodark-name-${t.id}`}
                className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[11px] tw:leading-4 tw:font-medium tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink)]"
                title={t.name}
              >
                {t.id}
              </span>
              {editing === t.id ? (
                <TextInput
                  autoFocus
                  value={draft}
                  aria-label={`Dark value for ${t.name}`}
                  className="tw:w-24 tw:[font-family:var(--bk-font-mono)]"
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commit(t.id, t.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(t.id, t.value);
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              ) : (
                <Button
                  color="light"
                  size="xs"
                  data-set-dark={t.id}
                  data-testid={`brand-nodark-set-${t.id}`}
                  onClick={() => {
                    setDraft(t.value);
                    setEditing(t.id);
                  }}
                  /* 12/18 in `--color/accent-text` — 153:110 and its three
                     siblings. flowbite's `size="xs"` link is 12/16, so the one
                     action on each row sat two pixels short of its own row. */
                  variant="link" className="tw:font-normal tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent-text)]"
                >
                  Set
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ColourModeSection;
