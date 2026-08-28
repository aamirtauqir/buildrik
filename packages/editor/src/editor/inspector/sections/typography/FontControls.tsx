import { Popover, Button } from "@/editor/chrome-ui";
/**
 * FontControls - Font weight, style, and decoration controls
 * Part of Typography section refactoring
 *
 * CP5: font-size and line-height rows have a hover-reveal chain button that
 * opens a type token picker. Selecting a type token stores the type-size var
 * binding on the element, not the raw px value.
 * The picker uses list layout (showSwatch=false).
 *
 * @module editor/inspector/sections/typography/FontControls
 * @license BSD-3-Clause
 */

import { Link2, Link2Off } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../../engine";
import { useTypeRegistry } from "../../../design-system/state/TokenRegistryContext";
import { TokenPickerPopover } from "../../shared/TokenPickerPopover";
import { SelectRow, ButtonGroup, ColorInput, InputWithUnit, MixedValueIndicator } from "../../shared/controls";
import { CHAIN_BOUND, CHAIN_ROW, CHAIN_SLOT, CHAIN_TRIGGER } from "../../shared/controls/controlClasses";
import { getCssVariable } from "@/shared/utils/getCssVariable";
// Font weight options
export const FONT_WEIGHTS = [
  { value: "100", label: "Thin (100)" },
  { value: "200", label: "Extra Light (200)" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "900", label: "Black (900)" },
];

// ============================================================================
// HELPERS
// ============================================================================

const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  return getCssVariable(varName);
};

// ============================================================================
// TYPE CHAIN BUTTON
// ============================================================================

interface TypeChainButtonProps {
  property: string;
  value: string;
  onChange: (value: string) => void;
}

const TypeChainButton: React.FC<TypeChainButtonProps> = ({ property, value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { tokens: typeTokens } = useTypeRegistry();
  const tokenEntries = typeTokens.map((t) => ({
    id: t.id,
    name: t.name,
    value: t.value,
    cssVar: t.cssVar,
  }));

  const isBound = isTokenVar(value);
  const boundToken = isBound ? tokenEntries.find((t) => value === `var(${t.cssVar})`) : null;

  if (isBound) {
    return (
      <Button
        type="button"
        onClick={() => onChange(resolveVar(value))}
        aria-label={`Unlink ${property} type token`}
        title={`Unlink "${boundToken?.name ?? "token"}" — resolves to current value`}
        className={CHAIN_BOUND}
      >
        <Link2 size={10} aria-hidden="true" />
        {boundToken?.name && (
          <span className="tw:max-w-12 tw:overflow-hidden tw:text-ellipsis">{boundToken.name}</span>
        )}
        <Link2Off size={9} aria-hidden="true" className="tw:opacity-70" />
      </Button>
    );
  }

  return (
    <Popover
      open={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      label="Type tokens"
      trigger={
        <Button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={`Link ${property} to type token`}
          aria-expanded={isOpen}
          title="Link to type token"
          className={CHAIN_TRIGGER}
        >
          <Link2 size={12} aria-hidden="true" />
        </Button>
      }
    >
      <TokenPickerPopover
        tokens={tokenEntries}
        currentValue={value}
        showSwatch={false}
        tokenLabel="type"
        onSelect={(_id, cssVarRef) => onChange(cssVarRef)}
        onCustomValue={onChange}
      />
    </Popover>
  );
};

// ============================================================================
// FONT CONTROLS
// ============================================================================

interface FontControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Threaded so the colour chip can jump to the Design panel. */
  composer?: Composer | null;
}

export const FontControls: React.FC<FontControlsProps> = ({ styles, onChange, mixedKeys, composer }) => {
  return (
    <>
      {/* Board 807:8342 pairs the two type numbers on one row — "Size 14 | 1.5"
          — because line height is read against the size it belongs to, never
          on its own. Both keep their type-token chain. */}
      <div className="bdi-row-ctrl" role="group" aria-label="Size and line height">
        <label className="bdi-lb">Size</label>
        <div className="bdi-pair">
          {/* Board 807:8342 pairs the numbers with no second label; a hover
              title says which is which when both read in px (designer walk
              2026-08-28: "16 / 24" gave no clue the 24 was line height). */}
          <div className={CHAIN_ROW} title="Font size">
            <MixedValueIndicator prop="font-size" mixedKeys={mixedKeys} />
            <div className="tw:flex-1">
              <InputWithUnit
                label=""
                ariaLabel="Font size"
                value={styles["font-size"] || "16px"}
                onChange={(v) => onChange("font-size", v)}
                units={["px", "em", "rem", "%", "vw"]}
              />
            </div>
            <div className={CHAIN_SLOT}>
              <TypeChainButton
                property="font-size"
                value={styles["font-size"] || ""}
                onChange={(v) => onChange("font-size", v)}
              />
            </div>
          </div>
          <span className="bdi-pair-sep" aria-hidden="true" />
          <div className={CHAIN_ROW} title="Line height">
            <MixedValueIndicator prop="line-height" mixedKeys={mixedKeys} />
            <div className="tw:flex-1">
              <InputWithUnit
                label=""
                ariaLabel="Line height"
                value={styles["line-height"] || ""}
                onChange={(v) => onChange("line-height", v)}
                units={["px", "em", "%", "normal"]}
                placeholder="1.5"
              />
            </div>
            <div className={CHAIN_SLOT}>
              <TypeChainButton
                property="line-height"
                value={styles["line-height"] || ""}
                onChange={(v) => onChange("line-height", v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font Weight */}
      <div className="tw:relative">
        <MixedValueIndicator prop="font-weight" mixedKeys={mixedKeys} />
        <SelectRow
          label="Weight"
          value={styles["font-weight"] || ""}
          onChange={(v) => onChange("font-weight", v)}
          options={FONT_WEIGHTS}
        />
      </div>

      {/* Text Align — on the board's face, not behind More settings: it is one
          of the three things anyone changes on a piece of text. */}
      <div className="tw:relative">
        <MixedValueIndicator prop="text-align" mixedKeys={mixedKeys} />
        <ButtonGroup
          label="Align"
          value={styles["text-align"] || ""}
          onChange={(v) => onChange("text-align", v)}
          options={[
            { value: "left", label: "Left", icon: "\u2B05" },
            { value: "center", label: "Center", icon: "\u2B0C" },
            { value: "right", label: "Right", icon: "\u27A1" },
            { value: "justify", label: "Justify", icon: "\u2630" },
          ]}
        />
      </div>

      {/* Colour */}
      <div className="tw:relative">
        <MixedValueIndicator prop="color" mixedKeys={mixedKeys} />
        <ColorInput label="Color" value={styles.color || ""} onChange={(v) => onChange("color", v)} composer={composer} />
      </div>

      {/* Text Transform */}
      <div className="tw:relative">
        <MixedValueIndicator prop="text-transform" mixedKeys={mixedKeys} />
        <ButtonGroup
          label="Transform"
          value={styles["text-transform"] || ""}
          onChange={(v) => onChange("text-transform", v)}
          options={[
            { value: "none", label: "None", icon: "Aa" },
            { value: "uppercase", label: "Upper", icon: "AA" },
            { value: "lowercase", label: "Lower", icon: "aa" },
            { value: "capitalize", label: "Cap", icon: "Aa" },
          ]}
        />
      </div>

      {/* Text Decoration */}
      <div className="tw:relative">
        <MixedValueIndicator prop="text-decoration" mixedKeys={mixedKeys} />
        <ButtonGroup
          label="Decoration"
          value={styles["text-decoration"] || ""}
          onChange={(v) => onChange("text-decoration", v)}
          options={[
            { value: "none", label: "None", icon: "\u2014" },
            { value: "underline", label: "Under", icon: "U\u0332" },
            { value: "line-through", label: "Strike", icon: "S\u0336" },
            { value: "overline", label: "Over", icon: "O\u0305" },
          ]}
        />
      </div>

      {/* Letter / Word — the board's two spacing numbers, in its words. */}
      <div className="tw:relative">
        <MixedValueIndicator prop="letter-spacing" mixedKeys={mixedKeys} />
        <InputWithUnit
          label="Letter"
          value={styles["letter-spacing"] || ""}
          onChange={(v) => onChange("letter-spacing", v)}
          units={["px", "em", "normal"]}
        />
      </div>
      <div className="tw:relative">
        <MixedValueIndicator prop="word-spacing" mixedKeys={mixedKeys} />
        <InputWithUnit
          label="Word"
          value={styles["word-spacing"] || ""}
          onChange={(v) => onChange("word-spacing", v)}
          units={["px", "em", "normal"]}
        />
      </div>

    </>
  );
};

export default FontControls;