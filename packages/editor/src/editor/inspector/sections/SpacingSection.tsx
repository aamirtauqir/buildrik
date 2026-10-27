/**
 * Spacing Section — 2L9 247:22853: one row per edge. Padding top · Padding
 * sides · Padding bottom · Margin top · Margin bottom; "sides" is left and
 * right together while they agree, and splits into Left / Right rows once
 * they differ (or under More settings). Margin sides show once set — the
 * board draws none, but `margin: 0 auto` centring has no other writer.
 *
 * A token-bound edge gets a "Source" group: "Padding top · spacing token ·
 * 24 px resolved", "Unlink to 24 px", and "Remove local override" when the
 * edge is also overridden here.
 *
 * Gap is not here (DD-9): it belongs to the flex / grid container that uses
 * it (`layout/GapRow.tsx`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { requestBrandToken } from "@/editor/design-system/ui/brandOpenRequest";
import { InputWithUnit, MoreSettingsToggle, Section } from "../shared/controls";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { cssVarToTokenId, extractVarName, isTokenVar, resolveTokenVar } from "../shared/tokenBindingDetection";
import { parseCssShorthand } from "../shared/utils/parseCssShorthand";

type Side = "top" | "right" | "bottom" | "left";
type Box = "padding" | "margin";

export interface SpacingSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** More settings: every side on its own row. */
  advancedExpanded?: boolean;
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Threaded so the Source group can jump to the token in Brand. */
  composer?: Composer | null;
}

const UNITS: Record<Box, string[]> = {
  padding: ["px", "%", "em", "rem"],
  margin: ["px", "%", "em", "rem", "auto"],
};
const NAME: Record<Box, string> = { padding: "Padding", margin: "Margin" };
const ORDER: readonly Box[] = ["padding", "margin"];
const EDGES: readonly Side[] = ["top", "left", "right", "bottom"];

/** A box's four sides: longhands first, the shorthand behind them. */
function sidesOf(styles: Record<string, string>, box: Box): Record<Side, string> {
  const short = parseCssShorthand(styles[box] || "");
  return {
    top: styles[`${box}-top`] || short.top,
    right: styles[`${box}-right`] || short.right,
    bottom: styles[`${box}-bottom`] || short.bottom,
    left: styles[`${box}-left`] || short.left,
  };
}

/** "24px" → "24 px", as the board prints a resolved value. */
const spaced = (value: string): string => value.replace(/^(-?[\d.]+)([a-z%]+)$/, "$1 $2");

function SourceGroup({
  property,
  name,
  value,
  onChange,
  composer,
}: {
  property: string;
  name: string;
  value: string;
  onChange: (property: string, value: string) => void;
  composer?: Composer | null;
}) {
  const field = useInspectorField(property);
  const resolved = resolveTokenVar(value);
  const tokenId = cssVarToTokenId(extractVarName(value) ?? "");
  return (
    <div data-testid="inspector-spacing-source">
      <div className={GROUP_TITLE}>Source</div>
      <p className="tw:m-0 tw:mb-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        {name} ·{" "}
        {composer && tokenId ? (
          <Button variant="link" size="xs" className="tw:inline tw:p-0 tw:h-auto" title={tokenId} onClick={() => requestBrandToken(composer, tokenId)}>
            spacing token
          </Button>
        ) : (
          "spacing token"
        )}
        {resolved ? ` · ${spaced(resolved)} resolved` : null}
      </p>
      <div className="tw:flex tw:flex-col tw:gap-2">
        {resolved && (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => onChange(property, resolved)}>
            Unlink to {spaced(resolved)}
          </Button>
        )}
        {field.overrides.length > 0 && (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => field.resetOverride(field.overrides[0])}>
            Remove local override
          </Button>
        )}
      </div>
    </div>
  );
}

export const SpacingSection: React.FC<SpacingSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  isOpen,
  onToggle,
  advancedExpanded = false,
  onAdvancedToggle,
  composer,
}) => {
  const boxes = { padding: sidesOf(styles, "padding"), margin: sidesOf(styles, "margin") };
  const hidden = (property: string) => propertyStates[property]?.hidden;

  const edge = (box: Box, side: Side) => {
    const property = `${box}-${side}`;
    if (hidden(property)) return null;
    return (
      <InputWithUnit
        key={property}
        label={`${NAME[box]} ${side}`}
        property={property}
        units={UNITS[box]}
        placeholder=""
        value={boxes[box][side]}
        onChange={(v) => onChange(property, v)}
      />
    );
  };

  const rows = (box: Box) => {
    const s = boxes[box];
    const split = advancedExpanded || s.left !== s.right;
    /* Margin sides only once set (247:22853 draws Margin top / bottom). */
    const showSides = box === "padding" || split || Boolean(s.left);
    return (
      <React.Fragment key={box}>
        {edge(box, "top")}
        {showSides &&
          (split ? (
            <>
              {edge(box, "left")}
              {edge(box, "right")}
            </>
          ) : (
            <InputWithUnit
              label={`${NAME[box]} sides`}
              property={`${box}-left`}
              units={UNITS[box]}
              placeholder=""
              value={s.left}
              onChange={(v) => onBatchChange({ [`${box}-left`]: v, [`${box}-right`]: v })}
            />
          ))}
        {edge(box, "bottom")}
      </React.Fragment>
    );
  };

  /* The first token-bound edge, in the rows' order. */
  const bound = ORDER.flatMap((box) => EDGES.map((side) => ({ box, side, value: boxes[box][side] }))).find((e) => isTokenVar(e.value));

  return (
    <Section title="Spacing" isOpen={isOpen} onToggle={onToggle} id="inspector-section-spacing">
      {ORDER.map(rows)}
      {bound && (
        <SourceGroup
          property={`${bound.box}-${bound.side}`}
          name={`${NAME[bound.box]} ${bound.side}`}
          value={bound.value}
          onChange={onChange}
          composer={composer}
        />
      )}
      {onAdvancedToggle && <MoreSettingsToggle isOpen={advancedExpanded} onToggle={() => onAdvancedToggle()} />}
    </Section>
  );
};

export default SpacingSection;
