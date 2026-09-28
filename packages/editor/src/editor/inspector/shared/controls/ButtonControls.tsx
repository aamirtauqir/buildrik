/**
 * ButtonGroup — the Inspector's segmented control (DD-21): Level H1–H6, Align,
 * Direction, Fit (boards 1, 8, 16). A radio group (§16): one tab stop on the
 * chosen option, ←/→ (and ↑/↓) move the choice, Home/End jump to the ends.
 *
 * Board 1: a gray track (bg-subtle, 2px inset, 24 tall), the chosen option a
 * white chip with a hairline and accent text. With more than four options the
 * row gives the track the room (label 64, as the board's Level row).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FieldDot } from "./FieldDot";
import { useInspectorField } from "./InspectorFieldContext";
import { Button } from "@/editor/chrome-ui";
import { fieldTestId, labelTestId, rowTestId } from "./ControlRow";

const slugifySeg = (label: string): string =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** One line, same reason as `rowTestId` — see ControlRow.tsx. */
const segTestId = (label: string, value: string): string => `inspector-seg-${slugifySeg(label)}-${value}`;

export interface ButtonGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode | string }[];
  /** The CSS property it edits — read-only and the override dot come from the field context. */
  property?: string;
}

const NEXT_KEYS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, value, onChange, options, property }) => {
  const field = useInspectorField(property);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const chosen = options.findIndex((o) => o.value === value);
  /* The tab stop: the chosen option, or the first when none is chosen. */
  const stop = chosen < 0 ? 0 : chosen;

  const choose = (index: number) => {
    refs.current[index]?.focus();
    if (!field.readOnly) onChange(options[index].value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = refs.current.findIndex((el) => el === document.activeElement);
    const from = at < 0 ? stop : at;
    let to: number | null = null;
    if (e.key in NEXT_KEYS) to = (from + NEXT_KEYS[e.key] + options.length) % options.length;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = options.length - 1;
    if (to === null) return;
    e.preventDefault();
    choose(to);
  };

  const segment = (
    <div
      className="bdi-seg"
      role="radiogroup"
      aria-label={label}
      aria-readonly={field.readOnly || undefined}
      data-testid={label ? fieldTestId(label) : undefined}
      onKeyDown={onKeyDown}
    >
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <Button
            key={opt.value}
            ref={(el: HTMLButtonElement | null) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            /* One anchor per segment, so a recipe can drive a real style write.
               Prefix-first for `check-anchors`'s template matcher. */
            data-testid={label ? segTestId(label, opt.value) : undefined}
            className={on ? "on" : ""}
            aria-checked={on}
            tabIndex={i === stop ? 0 : -1}
            onClick={() => {
              if (!field.readOnly) onChange(opt.value);
            }}
            title={opt.label}
            aria-label={opt.label}
          >
            {opt.icon ? (
              <span className="bdi-ico" aria-hidden="true">
                {opt.icon}
              </span>
            ) : (
              opt.label
            )}
          </Button>
        );
      })}
    </div>
  );

  if (!label) return segment;

  return (
    <div className={`bdi-row-ctrl seg${options.length > 4 ? " wide" : ""}`} data-testid={rowTestId(label)}>
      <label className="bdi-lb" data-testid={labelTestId(label)}>
        {label}
        <FieldDot field={field} />
      </label>
      <div className="bdi-row-content">{segment}</div>
    </div>
  );
};
