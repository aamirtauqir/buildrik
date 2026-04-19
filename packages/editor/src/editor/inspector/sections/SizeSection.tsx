/**
 * Size Section - Width, Height, Min/Max dimensions
 * CP3: W and H rows each have a hover-reveal chain button that opens a spacing
 * token picker. Selecting a spacing token stores var(--buildrick-design-space-4) on the
 * element — not "16px". The picker uses list layout (showSwatch=false).
 */

import { Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { useSpacingRegistry } from "../../../features/design-system/state/TokenRegistryContext";
import { Popover } from "../../../shared/ui/Popover";
import { TokenPickerPopover } from "../shared/TokenPickerPopover";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import { Section, InputWithUnit, MoreSettingsToggle, type SectionTier } from "../shared/controls";
import { MixedValueBadge } from "../shared/MixedValueBadge";

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
      <button
        type="button"
        onClick={() => onChange(resolveVar(value))}
        aria-label={`Unlink ${property} spacing token`}
        title={`Unlink "${boundToken?.name ?? "token"}" — resolves to current value`}
        style={{
          padding: "2px 4px",
          background: INSPECTOR_TOKENS.accentAlpha10,
          border: `1px solid ${INSPECTOR_TOKENS.accent}`,
          borderRadius: 4,
          color: INSPECTOR_TOKENS.accent,
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
      </button>
    );
  }

  return (
    <Popover
      triggerOn="click"
      position="bottom"
      trigger={
        <button
          type="button"
          aria-label={`Link ${property} to spacing token`}
          title="Link to spacing token"
          className="buildrick-chain-btn"
          style={{
            padding: 2,
            background: "none",
            border: "none",
            color: INSPECTOR_TOKENS.textMuted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            opacity: 0, // revealed by parent row :hover via CSS
            transition: "opacity 0.12s, color 0.12s",
            flexShrink: 0,
          }}
        >
          <Link2 size={12} aria-hidden="true" />
        </button>
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
          fontFamily: "var(--buildrick-design-font-mono)",
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
      {/* Width */}
      {!hidden("width") && (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}
          className="buildrick-row-hover-chain"
        >
          {mixedKeys?.has("width") && (
            <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
              <MixedValueBadge compact />
            </span>
          )}
          <div style={{ flex: 1 }}>
            <InputWithUnit
              label="Width"
              value={styles.width || ""}
              onChange={(v) => onChange("width", v)}
              disabled={disabled("width")}
              disabledReason={reason("width")}
              isOverridden={propertyStates["width"]?.isOverridden}
            />
          </div>
          {!disabled("width") && (
            <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}>
              <ChainButton property="width" value={styles.width || ""} onChange={(v) => onChange("width", v)} />
            </div>
          )}
        </div>
      )}

      {/* Height */}
      {!hidden("height") && (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}
          className="buildrick-row-hover-chain"
        >
          {mixedKeys?.has("height") && (
            <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
              <MixedValueBadge compact />
            </span>
          )}
          <div style={{ flex: 1 }}>
            <InputWithUnit
              label="Height"
              value={styles.height || ""}
              onChange={(v) => onChange("height", v)}
              disabled={disabled("height")}
              disabledReason={reason("height")}
              isOverridden={propertyStates["height"]?.isOverridden}
            />
          </div>
          {!disabled("height") && (
            <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}>
              <ChainButton property="height" value={styles.height || ""} onChange={(v) => onChange("height", v)} />
            </div>
          )}
        </div>
      )}

      {/* ─── Advanced: min/max/ratio (behind More settings) ─── */}
      {advancedExpanded && (
        <>
          {/* Min Width */}
          {!hidden("min-width") && (
            <div style={{ position: "relative" }}>
              {mixedKeys?.has("min-width") && (
                <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
                  <MixedValueBadge compact />
                </span>
              )}
              <InputWithUnit
                label="Min W"
                value={styles["min-width"] || ""}
                onChange={(v) => onChange("min-width", v)}
                disabled={disabled("min-width")}
                disabledReason={reason("min-width")}
                isOverridden={propertyStates["min-width"]?.isOverridden}
              />
            </div>
          )}

          {/* Max Width */}
          {!hidden("max-width") && (
            <div style={{ position: "relative" }}>
              {mixedKeys?.has("max-width") && (
                <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
                  <MixedValueBadge compact />
                </span>
              )}
              <InputWithUnit
                label="Max W"
                value={styles["max-width"] || ""}
                onChange={(v) => onChange("max-width", v)}
                disabled={disabled("max-width")}
                disabledReason={reason("max-width")}
                isOverridden={propertyStates["max-width"]?.isOverridden}
              />
            </div>
          )}

          {/* Min Height */}
          {!hidden("min-height") && (
            <div style={{ position: "relative" }}>
              {mixedKeys?.has("min-height") && (
                <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
                  <MixedValueBadge compact />
                </span>
              )}
              <InputWithUnit
                label="Min H"
                value={styles["min-height"] || ""}
                onChange={(v) => onChange("min-height", v)}
                disabled={disabled("min-height")}
                disabledReason={reason("min-height")}
                isOverridden={propertyStates["min-height"]?.isOverridden}
              />
            </div>
          )}

          {/* Max Height */}
          {!hidden("max-height") && (
            <div style={{ position: "relative" }}>
              {mixedKeys?.has("max-height") && (
                <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
                  <MixedValueBadge compact />
                </span>
              )}
              <InputWithUnit
                label="Max H"
                value={styles["max-height"] || ""}
                onChange={(v) => onChange("max-height", v)}
                disabled={disabled("max-height")}
                disabledReason={reason("max-height")}
                isOverridden={propertyStates["max-height"]?.isOverridden}
              />
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
            gap: "var(--buildrick-design-space-2)",
            marginBottom: "var(--buildrick-design-space-3)",
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
              padding: "var(--buildrick-design-space-2) 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--buildrick-border)",
              borderRadius: "var(--buildrick-design-radius-sm)",
              color: "var(--buildrick-text-primary)",
              fontSize: "var(--buildrick-text-base)",
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
