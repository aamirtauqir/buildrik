import { Button } from "@/editor/shared/vibcoder/Button";
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
import { useTypeRegistry } from "../../../design-system/state/TokenRegistryContext";
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
} from "@/editor/shared/vibcoder";
import { TokenPickerPopover } from "../../shared/TokenPickerPopover";
import { SelectRow, ButtonGroup, InputWithUnit, MixedValueIndicator } from "../../shared/controls";
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
        style={{
          padding: "2px 4px",
          background: "var(--buildrick-accent-subtle)",
          border: `1px solid ${"var(--buildrick-accent)"}`,
          borderRadius: 4,
          color: "var(--buildrick-accent)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 3,
          fontSize: 9,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <Link2 size={10} aria-hidden="true" />
        {boundToken?.name && (
          <span style={{ maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis" }}>
            {boundToken.name}
          </span>
        )}
        <Link2Off size={9} aria-hidden="true" style={{ opacity: 0.7 }} />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-label={`Link ${property} to type token`}
          title="Link to type token"
          className="bd-chain-btn"
          style={{
            padding: 2,
            background: "none",
            border: "none",
            color: "var(--buildrick-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            opacity: 0,
            transition: "opacity 0.12s, color 0.12s",
            flexShrink: 0,
          }}
        >
          <Link2 size={12} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent sideOffset={8}>
          <TokenPickerPopover
            tokens={tokenEntries}
            currentValue={value}
            showSwatch={false}
            tokenLabel="type"
            onSelect={(_id, cssVarRef) => onChange(cssVarRef)}
            onCustomValue={onChange}
          />
        </PopoverContent>
      </PopoverPortal>
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
}

export const FontControls: React.FC<FontControlsProps> = ({ styles, onChange, mixedKeys }) => {
  return (
    <>
      {/* Font Size — CP5: chain button for type token binding */}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
        className="bd-chain-row"
      >
        <MixedValueIndicator prop="font-size" mixedKeys={mixedKeys} />
        <div style={{ flex: 1 }}>
          <InputWithUnit
            label="Size"
            value={styles["font-size"] || "16px"}
            onChange={(v) => onChange("font-size", v)}
            units={["px", "em", "rem", "%", "vw"]}
          />
        </div>
        <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}>
          <TypeChainButton
            property="font-size"
            value={styles["font-size"] || ""}
            onChange={(v) => onChange("font-size", v)}
          />
        </div>
      </div>

      {/* Font Weight */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="font-weight" mixedKeys={mixedKeys} />
        <SelectRow
          label="Weight"
          value={styles["font-weight"] || ""}
          onChange={(v) => onChange("font-weight", v)}
          options={FONT_WEIGHTS}
        />
      </div>

      {/* Line Height — CP5: chain button for type token binding */}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
        className="bd-chain-row"
      >
        <MixedValueIndicator prop="line-height" mixedKeys={mixedKeys} />
        <div style={{ flex: 1 }}>
          <InputWithUnit
            label="Line height"
            value={styles["line-height"] || ""}
            onChange={(v) => onChange("line-height", v)}
            units={["px", "em", "%", "normal"]}
          />
        </div>
        <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}>
          <TypeChainButton
            property="line-height"
            value={styles["line-height"] || ""}
            onChange={(v) => onChange("line-height", v)}
          />
        </div>
      </div>

      {/* Letter Spacing */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="letter-spacing" mixedKeys={mixedKeys} />
        <InputWithUnit
          label="Letter spacing"
          value={styles["letter-spacing"] || ""}
          onChange={(v) => onChange("letter-spacing", v)}
          units={["px", "em", "normal"]}
        />
      </div>

      {/* Text Decoration */}
      <div style={{ position: "relative" }}>
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

      {/* Font Style */}
      <ButtonGroup
        label="Style"
        value={styles["font-style"] || ""}
        onChange={(v) => onChange("font-style", v)}
        options={[
          { value: "normal", label: "Normal", icon: "N" },
          { value: "italic", label: "Italic", icon: "I" },
        ]}
      />
    </>
  );
};

export default FontControls;