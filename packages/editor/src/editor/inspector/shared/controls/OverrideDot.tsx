/**
 * OverrideDot — the 6px accent dot beside a field that is overridden here
 * (R-DD-14, boards 26–28). A real control, not decoration: a 24px target
 * announced as "Overridden on Tablet" / "Overridden on :hover" / "Overrides
 * master" (§16), opening a menu whose one row puts the value back ("Reset to
 * Desktop" / "Reset to Base" / "Reset to master" — the last through
 * ComponentManager.resetInstanceOverride, one property of the instance).
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
import { Button, IconButton, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import type { InspectorFieldContextValue, OverrideEntry, OverrideKind } from "./InspectorFieldContext";

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

/** The menu row per kind. */
const RESET: Record<OverrideKind, string> = {
  breakpoint: "Reset to Desktop",
  pseudo: "Reset to Base",
  master: "Reset to master",
};

const DOT = "tw:block tw:size-1.5 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-accent)]";

export function OverrideDot({ kind, label, onReset }: OverrideDotProps) {
  const [open, setOpen] = React.useState(false);
  const says = SAYS[kind](label);
  const resetLabel = RESET[kind];
  const reset = onReset;
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
  titleNote: string | null;
  lead: React.ReactNode | null;
}

/** "24px" → "24 px", as the boards print a value. */
const spaced = (v: string) => v.replace(/^(-?[\d.]+)([a-z%]+)$/, "$1 $2");

/**
 * 2L9 241:18683 (IC05): a section's breakpoint overrides at the head of its
 * body, one row per property family — "● Padding  16 px", "Remove Tablet
 * override", "Falls back to Desktop: 24 px". The values are the engine's
 * breakpoint layer and the element's base styles (`useFieldOverrides`).
 */
function BreakpointOverrides({
  entries,
  label,
  onRemove,
}: {
  entries: readonly OverrideEntry[];
  label: string;
  onRemove: (properties: readonly string[]) => void;
}) {
  const families = new Map<string, OverrideEntry[]>();
  for (const e of entries) families.set(propertyName(e.property), [...(families.get(propertyName(e.property)) ?? []), e]);
  return (
    <div className="tw:flex tw:flex-col tw:pb-2" data-testid="inspector-section-bp-overrides">
      {[...families].map(([name, list]) => {
        const values = [...new Set(list.map((e) => spaced(e.value)))];
        const fallbacks = [...new Set(list.map((e) => spaced(e.fallback)))];
        return (
          <div key={name} className="tw:flex tw:flex-col" data-testid="inspector-bp-override">
            <div className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink)]">
              <span aria-hidden="true" className={DOT} />
              <span className="tw:w-[88px] tw:shrink-0">{name}</span>
              <span className="tw:min-w-0 tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:py-1 tw:text-[12px]">
                {values.length === 1 ? values[0] : "Mixed"}
              </span>
            </div>
            <Button
              variant="link"
              size="xs"
              className="tw:h-7 tw:justify-start tw:p-0 tw:text-[13px] tw:font-normal"
              onClick={() => onRemove(list.map((e) => e.property))}
            >
              Remove {label} override
            </Button>
            <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
              Falls back to Desktop: {fallbacks.length === 1 ? fallbacks[0] || "not set" : "Mixed"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** The header dot and bottom note of a section whose `styleKeys` are given. */
export function sectionOverrideMarks(
  field: Pick<InspectorFieldContextValue, "overrides" | "overrideLabels" | "breakpointEntries" | "resetOverride">,
  styleKeys: readonly string[],
): SectionOverrideMarks {
  const byKind = new Map<OverrideKind, string[]>();
  for (const key of styleKeys) {
    for (const kind of field.overrides.get(key) ?? []) byKind.set(kind, [...(byKind.get(kind) ?? []), key]);
  }
  if (byKind.size === 0) return { headerDot: null, note: null, titleNote: null, lead: null };

  /* IC05: the breakpoint layer's share of this section, listed at its head. */
  const bpEntries = (field.breakpointEntries ?? []).filter((e) => styleKeys.includes(e.property));
  const bpLabel = field.overrideLabels.breakpoint ?? "";
  const lead = bpEntries.length ? (
    <BreakpointOverrides
      entries={bpEntries}
      label={bpLabel}
      onRemove={(properties) => properties.forEach((p) => field.resetOverride(p, "breakpoint"))}
    />
  ) : null;

  const lines: string[] = [];
  for (const kind of ["breakpoint", "pseudo", "master"] as const) {
    const keys = byKind.get(kind);
    if (!keys) continue;
    if (kind === "breakpoint" && lead) continue;
    if (kind === "master") {
      const names = [...new Set(keys.map(propertyName))].sort();
      lines.push(`${names.join(", ")} ${names.length === 1 ? "overrides" : "override"} master`);
    } else {
      lines.push(SAYS[kind](field.overrideLabels[kind] ?? ""));
    }
  }

  const bp = byKind.has("breakpoint") ? SAYS.breakpoint(field.overrideLabels.breakpoint ?? "") : null;
  return {
    titleNote: bpEntries.length ? `${bpEntries.length} override${bpEntries.length === 1 ? "" : "s"}` : null,
    lead,
    /* The title note says it when the section lists its overrides (IC05). */
    headerDot: bp && !lead ? (
      <span role="img" aria-label={bp} data-testid="inspector-section-dot" className="tw:inline-flex tw:size-3 tw:items-center tw:justify-center">
        <span aria-hidden="true" className={DOT} />
      </span>
    ) : null,
    note: lines.length === 0 ? null : (
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
