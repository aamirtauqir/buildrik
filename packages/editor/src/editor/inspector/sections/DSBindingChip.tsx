/**
 * DSBindingChip — the one binding indicator: a bound value shows the token's
 * name inside its field ("Text / primary", boards 1 and 27). Nothing else
 * marks the binding — no tint, no link glyph, no second chip beside the field.
 *
 * With a handler the name is a button that opens Brand on the token (G3-156,
 * §13 "token chip → Brand"), focus-visible drawn with the Inspector's one
 * focus ring (`--bk-shadow-focus`). Without one it is plain text.
 *
 * A name longer than the field ends in an ellipsis ("Page / backgro…",
 * board 21) and the full name is the hover title. The ellipsis needs its own
 * block-level span: the flowbite Button is a flex box, and `text-overflow`
 * does nothing on a flex container's text — the name was cut mid-letter.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

export interface DSBindingChipProps {
  /** What the field shows: the token's name. */
  label: string;
  /** Opens Brand on the token. Omitted → static text. */
  onClick?: () => void;
  /** Overrides the default accessible name. */
  ariaLabel?: string;
}

const NAME =
  "tw:min-w-0 tw:flex-1 tw:truncate tw:text-left tw:text-[12px] tw:leading-4 tw:font-normal tw:text-[var(--bk-ink-soft)]";

export const DSBindingChip: React.FC<DSBindingChipProps> = ({ label, onClick, ariaLabel }) => {
  const name = ariaLabel ?? `Jump to token ${label} in Brand`;
  if (!onClick) {
    return (
      <span className={NAME} aria-label={name} title={label} data-testid="inspector-token-name">
        {label}
      </span>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={name}
      title={label}
      data-testid="inspector-token-name"
      className={
        `${NAME} tw:h-6 tw:min-h-0 tw:justify-start tw:rounded-[3px] tw:border-0 tw:bg-transparent tw:p-0 ` +
        "tw:enabled:hover:bg-transparent tw:hover:text-[var(--bk-accent-text)] tw:focus:ring-0 " +
        "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]"
      }
    >
      <span className="tw:min-w-0 tw:truncate">{label}</span>
    </Button>
  );
};
