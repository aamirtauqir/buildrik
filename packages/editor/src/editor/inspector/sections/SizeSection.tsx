import { Button } from "@/shared/ui/Button";
/**
 * Size Section - Width, Height, Min/Max dimensions
 * CP3: W and H rows each have a hover-reveal chain button that opens a spacing
 * token picker. Selecting a spacing token stores var(--buildrick-space-4) on the
 * element — not "16px". The picker uses list layout (showSwatch=false).
 */

import { Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { useSpacingRegistry } from "../../../features/design-system/state/TokenRegistryContext";
import { Popover } from "../../../shared/ui/Popover";
import { TokenPickerPopover } from "../shared/TokenPickerPopover";
import { Section, InputWithUnit, MoreSettingsToggle, type SectionTier, MixedValueIndicator } from "../shared/controls";

// ============================================================================
// HELPERS
// ============================================================================

const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "";
};

// ============================================================================
// CHAIN BUTTON
// Chain button: hover-reveal (opacity 0→1 via CSS on parent hover).
// Bound state: always visible in blue with unlink button.
// ============================================================================

interface ChainButtonProps {
  property: string;
  value: string;
  onChange: (value: string) => void;
}

const ChainButton: React.FC<ChainButtonProps> = ({ property, value, onChange }) => {
  const { tokens: spacingTokens } = useSpacingRegistry();
  const tokenEntries = spacingTokens.map((t) => ({
    id: t.id,
    name: t.name,
    value: t.value,
    cssVar: t.cssVar,
  }));

  const isBound = isTokenVar(value);
  const boundToken = isBound
    ? tokenEntries.find((t) => value === `var(${t.cssVar})`)
    : null;

  if (isBound) {
    return (
      <Button
        type="button"
        onClick={() => onChange(resolveVar(value))}
        aria-label={`Unlink ${property} spacing token`}
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
    <Popover
      triggerOn="click"
      position="bottom"
      trigger={
        <Button
          type="button"
          aria-label={`Link ${property} to spacing token`}
          title="Link to spacing token"
          className="buildrick-chain-btn"
          style={{
            padding: 2,
            background: "none",
            border: "none",
            color: "var(--buildrick-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            opacity: 0, // revealed by parent row :hover via CSS
            transition: "opacity 0.12s, color 0.12s",
            flexShrink: 0,
          }}
        >
          <Link2 size={12} aria-hidden="true" />
        </Button>
      }
      content={
        <TokenPickerPopover
          tokens={tokenEntries}
          currentValue={value}
          showSwatch={false}
          tokenLabel="spacing"
          onSelect={(_id, cssVarRef) => onChange(cssVarRef)}
          onCustomValue={onChange}
        />
      }
    />
  );
};

// ============================================================================
// SIZE SECTION
// ============================================================================

export interface SizeSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<
    string,
    { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }
  >;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
  advancedExpanded?: boolean;
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Hide width/height rows (LayoutSection handles them via ConstraintControl) */
  showDimensions?: boolean;
}

export const SizeSection: React.FC<SizeSectionProps> = ({
  styles,
  onChange,
  propertyStates = {},
  isOpen,
  onToggle,
  tier = "secondary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
  showDimensions = true,
}) => {
  const hidden = (prop: string) => propertyStates[prop]?.hidden;
  const disabled = (prop: string) => propertyStates[prop]?.disabled;
  const reason = (prop: string) => propertyStates[prop]?.reason;
  const w = styles.width || "";
  const h = styles.height || "";
  const sizePreview =
    w || h ? (
      <span
        style={{
          fontSize: 11,
          color: "var(--buildrick-text-tertiary)",
          fontFamily: "var(--buildrick-font-family-mono)",
          whiteSpace: "nowrap",
        }}
      >
        {w || "auto"} × {h || "auto"}
      </span>
    ) : undefined;

  return (
    <Section
      title="Size"
      icon="Ruler"
      isOpen={isOpen}
      onToggle={onToggle}
      preview={sizePreview}
      tier={tier}
      id="inspector-section-size"
    >
      {/* W | link | H pair */}
      {showDimensions && !hidden("width") && !hidden("height") && (
        <div className="bdi-pair" role="group" aria-label="Width and height">
          <div
            style={{ position: "relative", display: "flex", alignItems: "center" }}
            className="buildrick-row-hover-chain"
          >
            <MixedValueIndicator prop="width" mixedKeys={mixedKeys} />
            <div style={{ flex: 1 }}>
              <InputWithUnit
                label=""
                value={styles.width || ""}
                onChange={(v) => onChange("width", v)}
                disabled={disabled("width")}
                disabledReason={reason("width")}
                isOverridden={propertyStates["width"]?.isOverridden}
                fieldIcon={<span style={{ font: "600 10px var(--bd-font)" }}>W</span>}
              />
            </div>
            {!disabled("width") && (
              <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}>
                <ChainButton property="width" value={styles.width || ""} onChange={(v) => onChange("width", v)} />
              </div>
            )}
          </div>
          <span className="bdi-pair-sep" aria-hidden="true" />
          <div
            style={{ position: "relative", display: "flex", alignItems: "center" }}
            className="buildrick-row-hover-chain"
          >
            <MixedValueIndicator prop="height" mixedKeys={mixedKeys} />
            <div style={{ flex: 1 }}>
              <InputWithUnit
                label=""
                value={styles.height || ""}
                onChange={(v) => onChange("height", v)}
                disabled={disabled("height")}
                disabledReason={reason("height")}
                isOverridden={propertyStates["height"]?.isOverridden}
                fieldIcon={<span style={{ font: "600 10px var(--bd-font)" }}>H</span>}
              />
            </div>
            {!disabled("height") && (
              <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}>
                <ChainButton property="height" value={styles.height || ""} onChange={(v) => onChange("height", v)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Advanced: min/max pairs (behind More settings) ─── */}
      {advancedExpanded && (
        <>
          {/* Min W | · | Max W */}
          {(!hidden("min-width") || !hidden("max-width")) && (
            <div className="bdi-pair" role="group" aria-label="Width constraints">
              {!hidden("min-width") ? (
                <div style={{ position: "relative" }}>
                  <MixedValueIndicator prop="min-width" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    value={styles["min-width"] || ""}
                    onChange={(v) => onChange("min-width", v)}
                    disabled={disabled("min-width")}
                    disabledReason={reason("min-width")}
                    isOverridden={propertyStates["min-width"]?.isOverridden}
                    fieldIcon={<span style={{ font: "600 9px var(--bd-font)" }}>min</span>}
                  />
                </div>
              ) : <span />}
              <span className="bdi-pair-sep" aria-hidden="true" />
              {!hidden("max-width") ? (
                <div style={{ position: "relative" }}>
                  <MixedValueIndicator prop="max-width" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    value={styles["max-width"] || ""}
                    onChange={(v) => onChange("max-width", v)}
                    disabled={disabled("max-width")}
                    disabledReason={reason("max-width")}
                    isOverridden={propertyStates["max-width"]?.isOverridden}
                    fieldIcon={<span style={{ font: "600 9px var(--bd-font)" }}>max</span>}
                  />
                </div>
              ) : <span />}
            </div>
          )}

          {/* Min H | · | Max H */}
          {(!hidden("min-height") || !hidden("max-height")) && (
            <div className="bdi-pair" role="group" aria-label="Height constraints">
              {!hidden("min-height") ? (
                <div style={{ position: "relative" }}>
                  <MixedValueIndicator prop="min-height" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    value={styles["min-height"] || ""}
                    onChange={(v) => onChange("min-height", v)}
                    disabled={disabled("min-height")}
                    disabledReason={reason("min-height")}
                    isOverridden={propertyStates["min-height"]?.isOverridden}
                    fieldIcon={<span style={{ font: "600 9px var(--bd-font)" }}>min</span>}
                  />
                </div>
              ) : <span />}
              <span className="bdi-pair-sep" aria-hidden="true" />
              {!hidden("max-height") ? (
                <div style={{ position: "relative" }}>
                  <MixedValueIndicator prop="max-height" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    value={styles["max-height"] || ""}
                    onChange={(v) => onChange("max-height", v)}
                    disabled={disabled("max-height")}
                    disabledReason={reason("max-height")}
                    isOverridden={propertyStates["max-height"]?.isOverridden}
                    fieldIcon={<span style={{ font: "600 9px var(--bd-font)" }}>max</span>}
                  />
                </div>
              ) : <span />}
            </div>
          )}
        </>
      )}

      {/* Object Fit (for images/videos) */}
      {!hidden("object-fit") && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--buildrick-space-2)",
            marginBottom: "var(--buildrick-space-3)",
            opacity: disabled("object-fit") ? 0.5 : 1,
          }}
          title={reason("object-fit")}
        >
          <label
            style={{
              fontSize: "var(--buildrick-text-sm)",
              color: "var(--buildrick-text-tertiary)",
              fontWeight: 500,
              minWidth: 70,
            }}
          >
            Object Fit
          </label>
          <select
            value={styles["object-fit"] || ""}
            onChange={(e) => onChange("object-fit", e.target.value)}
            style={{
              flex: 1,
              padding: "var(--buildrick-space-2) 10px",
              background: "var(--bd-bg-subtle)",
              border: "1px solid var(--buildrick-border)",
              borderRadius: "var(--buildrick-radius-sm)",
              color: "var(--buildrick-text-primary)",
              fontSize: "var(--buildrick-text-sm-plus)",
              outline: "none",
              cursor: "pointer",
            }}
            disabled={disabled("object-fit")}
          >
            <option value="">Default</option>
            <option value="fill">Fill</option>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="none">None</option>
            <option value="scale-down">Scale Down</option>
          </select>
        </div>
      )}

      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          advancedCount={5}
        />
      )}
    </Section>
  );
};

export default SizeSection;