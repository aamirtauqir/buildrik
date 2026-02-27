/**
 * Size Section - Width, Height, Min/Max dimensions
 */

import * as React from "react";
import { Section, InputWithUnit } from "../shared/Controls";

interface SizeSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<
    string,
    { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }
  >;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
}

export const SizeSection: React.FC<SizeSectionProps> = ({
  styles,
  onChange,
  propertyStates = {},
  isOpen,
}) => {
  const hidden = (prop: string) => propertyStates[prop]?.hidden;
  const disabled = (prop: string) => propertyStates[prop]?.disabled;
  const reason = (prop: string) => propertyStates[prop]?.reason;

  return (
    <Section title="Size" icon="Ruler" isOpen={isOpen}>
      {/* Width */}
      {!hidden("width") && (
        <InputWithUnit
          label="Width"
          value={styles.width || ""}
          onChange={(v) => onChange("width", v)}
          disabled={disabled("width")}
          disabledReason={reason("width")}
          isOverridden={propertyStates["width"]?.isOverridden}
        />
      )}

      {/* Height */}
      {!hidden("height") && (
        <InputWithUnit
          label="Height"
          value={styles.height || ""}
          onChange={(v) => onChange("height", v)}
          disabled={disabled("height")}
          disabledReason={reason("height")}
          isOverridden={propertyStates["height"]?.isOverridden}
        />
      )}

      {/* Min Width */}
      {!hidden("min-width") && (
        <InputWithUnit
          label="Min W"
          value={styles["min-width"] || ""}
          onChange={(v) => onChange("min-width", v)}
          disabled={disabled("min-width")}
          disabledReason={reason("min-width")}
          isOverridden={propertyStates["min-width"]?.isOverridden}
        />
      )}

      {/* Max Width */}
      {!hidden("max-width") && (
        <InputWithUnit
          label="Max W"
          value={styles["max-width"] || ""}
          onChange={(v) => onChange("max-width", v)}
          disabled={disabled("max-width")}
          disabledReason={reason("max-width")}
          isOverridden={propertyStates["max-width"]?.isOverridden}
        />
      )}

      {/* Min Height */}
      {!hidden("min-height") && (
        <InputWithUnit
          label="Min H"
          value={styles["min-height"] || ""}
          onChange={(v) => onChange("min-height", v)}
          disabled={disabled("min-height")}
          disabledReason={reason("min-height")}
          isOverridden={propertyStates["min-height"]?.isOverridden}
        />
      )}

      {/* Max Height */}
      {!hidden("max-height") && (
        <InputWithUnit
          label="Max H"
          value={styles["max-height"] || ""}
          onChange={(v) => onChange("max-height", v)}
          disabled={disabled("max-height")}
          disabledReason={reason("max-height")}
          isOverridden={propertyStates["max-height"]?.isOverridden}
        />
      )}

      {/* Object Fit (for images/videos) */}
      {!hidden("object-fit") && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--aqb-space-2)",
            marginBottom: "var(--aqb-space-3)",
            opacity: disabled("object-fit") ? 0.5 : 1,
          }}
          title={reason("object-fit")}
        >
          <label
            style={{
              fontSize: "var(--aqb-text-sm)",
              color: "var(--aqb-text-tertiary)",
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
              padding: "var(--aqb-space-2) 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--aqb-border)",
              borderRadius: "var(--aqb-radius-sm)",
              color: "var(--aqb-text-primary)",
              fontSize: "var(--aqb-text-base)",
              outline: "none",
              cursor: "pointer",
            }}
            disabled={disabled("object-fit")}
          >
            <option value="">—</option>
            <option value="fill">Fill</option>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="none">None</option>
            <option value="scale-down">Scale Down</option>
          </select>
        </div>
      )}
    </Section>
  );
};

export default SizeSection;
