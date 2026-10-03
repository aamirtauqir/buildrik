/**
 * SettingsCard — the Phase B card (8135:212718 `Card · Site identity`,
 * 8135:214533 `Card · Social profiles`): white on the border hairline,
 * radius-card, 24 in, 16 between the title and each row, title 16/600.
 *
 * With `onToggle` it is a disclosure, as the boards draw `Advanced ›` /
 * `Advanced ⌄` (8135:212966) and `Indexing ›` (8135:214820): the title is the
 * button and the body is not rendered while closed. Settings search lands on
 * a field by id (SettingsTab focuses `#<field id>`), so a closed card keeps
 * one focusable stand-in per field id it hides — `anchors` — and focusing one
 * opens the card and hands focus to the real control.
 *
 * Shared's `Section` stays the card of the screens not rebuilt in Phase B; its
 * 20/24 gaps are the Clone's, not these boards'.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { SET_CARD } from "../shared";

export interface SettingsCardProps {
  title: string;
  /** Anchor stem for `set-card-<anchor>`; defaults to the title. */
  anchor?: string;
  /** Disclosure state — omit `onToggle` for a plain card. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** Field ids inside the body, kept focusable while the card is closed. */
  anchors?: readonly string[];
  children?: React.ReactNode;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";
/* The title as a button: no box, the title's own type, the token focus ring. */
const TOGGLE =
  "tw:h-6 tw:justify-start tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:bg-transparent tw:p-0 " +
  "tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)] " +
  "tw:enabled:hover:bg-transparent tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export function SettingsCard({ title, anchor, open = true, onToggle, anchors, children }: SettingsCardProps) {
  const stem = slug(anchor ?? title);
  const pendingFocus = React.useRef<string | null>(null);

  React.useEffect(() => {
    const id = pendingFocus.current;
    if (!open || !id) return;
    pendingFocus.current = null;
    document.getElementById(id)?.focus();
  }, [open]);

  const collapsible = !!onToggle;
  const showBody = !collapsible || open;
  return (
    <section
      className={`${SET_CARD} tw:flex tw:flex-col tw:gap-4 tw:p-6`}
      data-testid={`set-card-${stem}`}
      data-open={collapsible ? String(open) : undefined}
    >
      <h3 className={TITLE} data-testid={`set-card-title-${stem}`}>
        {collapsible ? (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className={TOGGLE}
            aria-expanded={open}
            onClick={() => onToggle(!open)}
            data-testid={`set-card-toggle-${stem}`}
          >
            {title}
            <span aria-hidden="true" className="tw:ml-1">
              {open ? "⌄" : "›"}
            </span>
          </Button>
        ) : (
          title
        )}
      </h3>
      {showBody ? children : null}
      {!showBody && anchors
        ? anchors.map((id) => (
            <span
              key={id}
              id={id}
              tabIndex={-1}
              className="tw:sr-only"
              onFocus={() => {
                pendingFocus.current = id;
                onToggle?.(true);
              }}
            />
          ))
        : null}
    </section>
  );
}
