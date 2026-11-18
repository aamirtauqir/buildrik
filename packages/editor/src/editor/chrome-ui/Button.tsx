/**
 * Button — the single pre-themed flowbite-react `Button` wrapper, third
 * member of the closed wrapper set (grown deliberately 2026-08-28, design-
 * debt arc; the gate's manifest edit in the same commit is the checkpoint).
 *
 * What it adds and nothing more:
 *   · `variant` — the five-role vocabulary two independent audits found
 *     missing: primary (flowbite default — ALREADY the brand accent via the
 *     Flowbite primary scale), secondary (light), ghost, link, danger (red).
 *     The ghost-link 6-class incantation was copy-pasted across 22 files;
 *     `variant="link"` is that recipe, once, in buttonTheme.ts.
 *   · BK_BUTTON_THEME merged under any caller theme (caller key wins).
 *   · `disabledReason` — design decision 13: a control that cannot act says
 *     why. The button stays focusable with `aria-disabled="true"`, ignores
 *     activation, and the reason sits under it as readable text (ink-soft,
 *     not disabled grey) that is its `aria-describedby`.
 *
 * Existing `color=` call sites (~850) pass through untouched — variant only
 * maps when given, so this wrapper changes zero shipped pixels on its own.
 *
 * `forwardRef` reaches the real `<button>`, same contract as TextInput.
 */
import * as React from "react";
import { Button as FlowbiteButton, type ButtonProps as FlowbiteButtonProps } from "flowbite-react";
import { BK_BUTTON_THEME } from "./buttonTheme";
import { mergeTheme } from "./mergeTheme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger";

export type ButtonProps = FlowbiteButtonProps & {
  /** Role vocabulary; omitted = the caller's `color` (or flowbite default). */
  variant?: ButtonVariant;
  /** Disabled WITH a reason the user can read (decision 13). */
  disabledReason?: string;
};

const VARIANT_COLOR: Record<ButtonVariant, string | undefined> = {
  primary: undefined, // flowbite default IS the brand primary
  secondary: "light",
  ghost: "ghost",
  link: "link",
  danger: "red",
};

const DISABLED_REASON_CLASS =
  "tw:cursor-not-allowed tw:aria-disabled:bg-[var(--bk-bg-subtle)] tw:aria-disabled:text-[var(--bk-ink-muted)] " +
  "tw:aria-disabled:border-transparent tw:aria-disabled:shadow-none tw:aria-disabled:hover:bg-[var(--bk-bg-subtle)]";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, color, theme, disabledReason, ...props },
  ref,
) {
  const resolvedColor = variant ? VARIANT_COLOR[variant] : color;
  const reasonId = React.useId();
  const button = (
    <FlowbiteButton
      ref={ref}
      {...(resolvedColor !== undefined ? { color: resolvedColor } : {})}
      theme={mergeTheme(BK_BUTTON_THEME, theme)}
      {...props}
      {...(disabledReason
        ? {
            disabled: false,
            "aria-disabled": true,
            "aria-describedby": [props["aria-describedby"], reasonId].filter(Boolean).join(" "),
            /* The theme's disabled look, keyed on aria-disabled (the button
               stays focusable so its reason is read): grey chip, muted ink,
               no hover. Opacity left the primary as faded brand blue — about
               3:1, an AA fail, and it still darkened on hover. */
            className: [props.className, DISABLED_REASON_CLASS].filter(Boolean).join(" "),
            onClick: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
          }
        : {})}
    />
  );
  if (!disabledReason) return button;
  return (
    <span className="tw:inline-flex tw:flex-col tw:items-start tw:gap-1">
      {button}
      <span id={reasonId} className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        {disabledReason}
      </span>
    </span>
  );
});
