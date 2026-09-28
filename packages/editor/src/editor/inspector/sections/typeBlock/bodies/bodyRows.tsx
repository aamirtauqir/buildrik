/**
 * Row pieces the media / embed / widget type blocks share (boards 8–13),
 * where the shared controls have no equivalent:
 *   ChoiceRow  — a labelled select with only real choices (no "Default"
 *                blank; board 11 When done, board 13 Open / Closed)
 *   Note       — the 11px hint line under a field ("Detected: YouTube",
 *                "Uses the visitor's time zone.", missing-alt hint)
 *   Warning    — the full-width tinted warning (board 9 autoplay + sound)
 * plus `useElementVersion`, the re-read on `element:updated` every body needs.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BK_SELECT_BARE_VALUE_THEME, Select } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { fieldTestId, labelTestId, rowTestId } from "../../../shared/controls";
import { useInspectorField } from "../../../shared/controls/InspectorFieldContext";

export function ChoiceRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = React.useId();
  const { readOnly } = useInspectorField();
  return (
    <div className="bdi-row-ctrl" data-testid={rowTestId(label)}>
      <label className="bdi-lb" data-testid={labelTestId(label)} htmlFor={id}>
        {label}
      </label>
      <div className="bdi-row-content">
        <div className="bdi-ddn" data-testid={fieldTestId(label)}>
          <Select
            id={id}
            disabled={readOnly}
            aria-readonly={readOnly || undefined}
            className="bdi-v"
            theme={BK_SELECT_BARE_VALUE_THEME}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <span className="bdi-c" aria-hidden="true">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

export function Note({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p className="tw:m-0 tw:py-2 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid={testId}>
      {children}
    </p>
  );
}

/** Full-bleed across the section body (it pads 16 left, 20 right). */
export function Warning({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p
      role="status"
      className="tw:-mr-5 tw:-ml-4 tw:mb-0 tw:mt-1 tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-2 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-warning-text)]"
      data-testid={testId}
    >
      {children}
    </p>
  );
}

/** Re-render when any element changes — the rows read the element itself. */
export function useElementVersion(composer: Composer | null | undefined): number {
  const [version, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on("element:updated", bump);
    return () => {
      composer.off("element:updated", bump);
    };
  }, [composer]);
  return version;
}
