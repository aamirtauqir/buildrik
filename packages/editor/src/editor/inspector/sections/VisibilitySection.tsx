/**
 * Visibility Section — Behaviour › Visibility (board 2): one checkbox per
 * breakpoint, "Desktop · Tablet · Mobile", ticked = shown there. Unticking
 * writes `--hide-<bp>: true`; ticking clears it.
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
  const { readOnly } = useInspectorField();
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
      <div className="tw:flex tw:items-center tw:gap-1 tw:py-2" data-testid="visibility-show-on" role="group" aria-label="Show on">
        {VISIBILITY_BREAKPOINTS.map((bp) => {
          const shown = isVisible(bp.id);
          const id = `visibility-${bp.id}`;
          return (
            <span key={bp.id} className="tw:flex tw:items-center tw:gap-1 tw:w-[84px]">
              <Checkbox
                id={id}
                data-testid={`visibility-check-${bp.id}`}
                checked={shown}
                aria-readonly={readOnly || undefined}
                onChange={() => {
                  if (!readOnly) onChange(`--hide-${bp.id}`, shown ? "true" : "");
                }}
                className="tw:size-4 tw:shrink-0"
              />
              {/* Read-only keeps the label from offering a click it refuses:
                  a pointer over a locked box read as editable (QA 2026-10-02). */}
              <label
                htmlFor={id}
                className={`${readOnly ? "tw:cursor-default" : "tw:cursor-pointer"} tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]`}
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
