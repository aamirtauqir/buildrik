/**
 * OverrideDot — the 6px accent dot beside a field that is overridden here
 * (R-DD-14, boards 26–28). A real control, not decoration: a 24px target
 * announced as "Overridden on Tablet" / "Overridden on :hover" / "Overrides
 * master" (§16), opening a menu whose one row puts the value back ("Reset to
 * Desktop" / "Reset to Base").
 *
 * A master dot announces and offers no reset: the engine can only reset a
 * whole instance (ComponentManager.resetInstance, the component row's ⋯), not
 * one property, and a menu row that cannot do what it says is worse than none.
 *
 * `sectionOverrideMarks` gives a section frame its header dot and bottom note
 * from the same field context: "● Padding overrides master" (26), "●
 * Overridden on :hover" (27), "Size ●" + "● Overridden on Tablet" (28). The
 * header dot is drawn for the breakpoint kind only — boards 26 and 27 put the
 * dot on the field, 28 on the header.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import type { InspectorFieldContextValue, OverrideKind } from "./InspectorFieldContext";

export interface OverrideDotProps {
  kind: OverrideKind;
  /** "Tablet", ":hover", the component's name. */
  label: string;
  /** Drop the override. Absent = the dot only announces. */
  onReset?: () => void;
}

const SAYS: Record<OverrideKind, (l: string) => string> = {
  breakpoint: (l) => `Overridden on ${l}`,
  pseudo: (l) => `Overridden on ${l}`,
  master: () => "Overrides master",
};

/** The menu row per kind; null = the engine has no single-property reset. */
const RESET: Record<OverrideKind, string | null> = {
  breakpoint: "Reset to Desktop",
  pseudo: "Reset to Base",
  master: null,
};

const DOT = "tw:block tw:size-1.5 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-accent)]";

export function OverrideDot({ kind, label, onReset }: OverrideDotProps) {
  const [open, setOpen] = React.useState(false);
  const says = SAYS[kind](label);
  const resetLabel = RESET[kind];
  const reset = resetLabel ? onReset : undefined;
  const dot = (
    <IconButton
      label={says}
      size="sm"
      data-testid={`inspector-override-dot-${kind}`}
      aria-haspopup={reset ? "menu" : undefined}
      aria-expanded={reset ? open : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (reset) setOpen((v) => !v);
      }}
      className="tw:size-6 tw:shrink-0"
    >
      <span aria-hidden="true" className={DOT} />
    </IconButton>
  );
  if (!reset) return dot;
  return (
    <Popover open={open} onClose={() => setOpen(false)} trigger={dot} placement="bottom" label={says}>
      <Menu label={says}>
        <MenuItem
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          {resetLabel}
        </MenuItem>
      </Menu>
    </Popover>
  );
}

// ============================================================================
// SECTION MARKS
// ============================================================================

/** What a property is called in a note: the shorthand family, not the longhand. */
const FAMILY: readonly [RegExp, string][] = [
  [/^padding/, "Padding"],
  [/^margin/, "Margin"],
  [/^border/, "Border"],
  [/^(background|fill$)/, "Fill"],
  [/^color$/, "Colour"],
  [/^(min-|max-)?width$/, "Width"],
  [/^(min-|max-)?height$/, "Height"],
];

function propertyName(property: string): string {
  const hit = FAMILY.find(([re]) => re.test(property));
  if (hit) return hit[1];
  const words = property.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const NOTE_LINE = "tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export interface SectionOverrideMarks {
  headerDot: React.ReactNode | null;
  note: React.ReactNode | null;
}

/** The header dot and bottom note of a section whose `styleKeys` are given. */
export function sectionOverrideMarks(
  field: Pick<InspectorFieldContextValue, "overrides" | "overrideLabels">,
  styleKeys: readonly string[],
): SectionOverrideMarks {
  const byKind = new Map<OverrideKind, string[]>();
  for (const key of styleKeys) {
    for (const kind of field.overrides.get(key) ?? []) byKind.set(kind, [...(byKind.get(kind) ?? []), key]);
  }
  if (byKind.size === 0) return { headerDot: null, note: null };

  const lines: string[] = [];
  for (const kind of ["breakpoint", "pseudo", "master"] as const) {
    const keys = byKind.get(kind);
    if (!keys) continue;
    if (kind === "master") {
      const names = [...new Set(keys.map(propertyName))].sort();
      lines.push(`${names.join(", ")} ${names.length === 1 ? "overrides" : "override"} master`);
    } else {
      lines.push(SAYS[kind](field.overrideLabels[kind] ?? ""));
    }
  }

  const bp = byKind.has("breakpoint") ? SAYS.breakpoint(field.overrideLabels.breakpoint ?? "") : null;
  return {
    headerDot: bp ? (
      <span role="img" aria-label={bp} data-testid="inspector-section-dot" className="tw:inline-flex tw:size-3 tw:items-center tw:justify-center">
        <span aria-hidden="true" className={DOT} />
      </span>
    ) : null,
    note: (
      <span data-testid="inspector-section-note" className="tw:flex tw:flex-col tw:gap-0.5">
        {lines.map((line) => (
          <span key={line} className={NOTE_LINE}>
            <span aria-hidden="true" className={DOT} />
            {line}
          </span>
        ))}
      </span>
    ),
  };
}
