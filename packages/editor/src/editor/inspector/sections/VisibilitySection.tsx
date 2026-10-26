/**
 * Visibility Section — Behavior › Visibility (board 2, 2L9 161:13919): "Show
 * on these devices", one checkbox per breakpoint, "Desktop · Tablet ·
 * Mobile", ticked = shown there. Unticking writes `--hide-<bp>: true`;
 * ticking clears it. (The board's "Data conditions: Content › Conditions"
 * note is not drawn: there are no conditions yet — REQUESTS #11.)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BREAKPOINTS as SHARED_BREAKPOINTS } from "@/shared/constants/breakpoints";
import { Section, type SectionTier } from "../shared/controls/Section";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { Checkbox } from "@/editor/chrome-ui";

export interface VisibilitySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const VISIBILITY_BREAKPOINTS = (["desktop", "tablet", "mobile"] as const).map((id) => {
  const bp = SHARED_BREAKPOINTS[id];
  return {
    id: bp.id,
    label: bp.name,
  };
});

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
  styles: elementStyles,
  onChange,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const { readOnly, discrete } = useInspectorField();
  const isVisible = (breakpointId: string): boolean => elementStyles[`--hide-${breakpointId}`] !== "true";
  const hiddenCount = VISIBILITY_BREAKPOINTS.filter((bp) => !isVisible(bp.id)).length;

  return (
    <Section
      title="Visibility"
      icon="Eye"
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-visibility"
      preview={hiddenCount > 0 ? `hidden on ${hiddenCount}` : undefined}
    >
      <p className="tw:m-0 tw:pt-1 tw:pb-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" id="visibility-show-on-label">
        Show on these devices
      </p>
      {/* 2L9 161:13919: one device per row, stacked. */}
      <div className="tw:flex tw:flex-col tw:pl-2" data-testid="visibility-show-on" role="group" aria-labelledby="visibility-show-on-label">
        {VISIBILITY_BREAKPOINTS.map((bp) => {
          const shown = isVisible(bp.id);
          const id = `visibility-${bp.id}`;
          return (
            <span key={bp.id} className="tw:flex tw:h-10 tw:items-center tw:gap-3">
              <Checkbox
                id={id}
                data-testid={`visibility-check-${bp.id}`}
                checked={shown}
                aria-readonly={readOnly || undefined}
                onChange={() => {
                  if (!readOnly) discrete(() => onChange(`--hide-${bp.id}`, shown ? "true" : ""));
                }}
                className="tw:size-4 tw:shrink-0"
              />
              {/* Read-only keeps the label from offering a click it refuses:
                  a pointer over a locked box read as editable (QA 2026-10-02). */}
              <label
                htmlFor={id}
                className={`${readOnly ? "tw:cursor-default" : "tw:cursor-pointer"} tw:text-[13px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)]`}
              >
                {bp.label}
              </label>
            </span>
          );
        })}
      </div>
    </Section>
  );
};

export default VisibilitySection;
