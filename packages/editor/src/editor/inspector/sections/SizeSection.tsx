import { Popover, Button, Select } from "@/editor/chrome-ui";
/**
 * Size Section - Width, Height, Min/Max dimensions
 * CP3: W and H rows each have a hover-reveal chain button that opens a spacing
 * token picker. Selecting a spacing token stores var(--bk-space-16) on the
 * element — not "16px". The picker uses list layout (showSwatch=false).
 */

import { Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { useSpacingRegistry } from "@/editor/design-system/state/TokenRegistryContext";
import { ConstraintControl } from "./ConstraintControl";
import { TokenPickerPopover } from "../shared/TokenPickerPopover";
import { Section, InputWithUnit, MoreSettingsToggle, type SectionTier, MixedValueIndicator } from "../shared/controls";
import {
  CHAIN_BOUND,
  CHAIN_ROW,
  CHAIN_SLOT,
  CHAIN_TRIGGER,
  CONTROL_SELECT_WRAP,
  SECTION_PREVIEW,
} from "../shared/controls/controlClasses";
import { getCssVariable } from "@/shared/utils/getCssVariable";
// ============================================================================
// HELPERS
// ============================================================================

const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  return getCssVariable(varName);
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
  const [isOpen, setIsOpen] = React.useState(false);
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
      label="Spacing tokens"
      trigger={
        <Button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={`Link ${property} to spacing token`}
          aria-expanded={isOpen}
          title="Link to spacing token"
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
        tokenLabel="spacing"
        onSelect={(_id, cssVarRef) => onChange(cssVarRef)}
        onCustomValue={onChange}
      />
    </Popover>
  );
};

/** The W/H/min/max glyph inside a field — 600-weight, tiny. */
const FIELD_GLYPH = "tw:text-[10px] tw:font-semibold tw:[font-family:var(--bk-font-ui)]";
const FIELD_GLYPH_SM = "tw:text-[9px] tw:font-semibold tw:[font-family:var(--bk-font-ui)]";

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
      <span className={SECTION_PREVIEW}>
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
      {/* Board: Width / Height as Fixed · Fill · Hug, the value the profile
          boards print ("Fill", "Hug"). Fixed mode keeps the unit input and its
          design-token chain. */}
      {!hidden("width") && (
        <div className={CHAIN_ROW} role="group" aria-label="Width">
          <MixedValueIndicator prop="width" mixedKeys={mixedKeys} />
          <div className="tw:flex-1">
            <ConstraintControl
              label="Width"
              value={styles.width || "auto"}
              onChange={(v) => onChange("width", v)}
              fixedInput={
                <>
                  <div className="tw:flex-1">
                    <InputWithUnit
                      label=""
                      ariaLabel="Width"
                      value={styles.width || ""}
                      onChange={(v) => onChange("width", v)}
                      disabled={disabled("width")}
                      disabledReason={reason("width")}
                      isOverridden={propertyStates["width"]?.isOverridden}
                      fieldIcon={<span className={FIELD_GLYPH}>W</span>}
                    />
                  </div>
                  {!disabled("width") && (
                    <div className={CHAIN_SLOT}>
                      <ChainButton property="width" value={styles.width || ""} onChange={(v) => onChange("width", v)} />
                    </div>
                  )}
                </>
              }
            />
          </div>
        </div>
      )}
      {!hidden("height") && (
        <div className={CHAIN_ROW} role="group" aria-label="Height">
          <MixedValueIndicator prop="height" mixedKeys={mixedKeys} />
          <div className="tw:flex-1">
            <ConstraintControl
              label="Height"
              value={styles.height || "auto"}
              onChange={(v) => onChange("height", v)}
              fixedInput={
                <>
                  <div className="tw:flex-1">
                    <InputWithUnit
                      label=""
                      ariaLabel="Height"
                      value={styles.height || ""}
                      onChange={(v) => onChange("height", v)}
                      disabled={disabled("height")}
                      disabledReason={reason("height")}
                      isOverridden={propertyStates["height"]?.isOverridden}
                      fieldIcon={<span className={FIELD_GLYPH}>H</span>}
                    />
                  </div>
                  {!disabled("height") && (
                    <div className={CHAIN_SLOT}>
                      <ChainButton property="height" value={styles.height || ""} onChange={(v) => onChange("height", v)} />
                    </div>
                  )}
                </>
              }
            />
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
                <div className="tw:relative">
                  <MixedValueIndicator prop="min-width" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    ariaLabel="Min width"
                    value={styles["min-width"] || ""}
                    onChange={(v) => onChange("min-width", v)}
                    disabled={disabled("min-width")}
                    disabledReason={reason("min-width")}
                    isOverridden={propertyStates["min-width"]?.isOverridden}
                    fieldIcon={<span className={FIELD_GLYPH_SM}>min</span>}
                  />
                </div>
              ) : <span />}
              <span className="bdi-pair-sep" aria-hidden="true" />
              {!hidden("max-width") ? (
                <div className="tw:relative">
                  <MixedValueIndicator prop="max-width" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    ariaLabel="Max width"
                    value={styles["max-width"] || ""}
                    onChange={(v) => onChange("max-width", v)}
                    disabled={disabled("max-width")}
                    disabledReason={reason("max-width")}
                    isOverridden={propertyStates["max-width"]?.isOverridden}
                    fieldIcon={<span className={FIELD_GLYPH_SM}>max</span>}
                  />
                </div>
              ) : <span />}
            </div>
          )}

          {/* Min H | · | Max H */}
          {(!hidden("min-height") || !hidden("max-height")) && (
            <div className="bdi-pair" role="group" aria-label="Height constraints">
              {!hidden("min-height") ? (
                <div className="tw:relative">
                  <MixedValueIndicator prop="min-height" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    ariaLabel="Min height"
                    value={styles["min-height"] || ""}
                    onChange={(v) => onChange("min-height", v)}
                    disabled={disabled("min-height")}
                    disabledReason={reason("min-height")}
                    isOverridden={propertyStates["min-height"]?.isOverridden}
                    fieldIcon={<span className={FIELD_GLYPH_SM}>min</span>}
                  />
                </div>
              ) : <span />}
              <span className="bdi-pair-sep" aria-hidden="true" />
              {!hidden("max-height") ? (
                <div className="tw:relative">
                  <MixedValueIndicator prop="max-height" mixedKeys={mixedKeys} />
                  <InputWithUnit
                    label=""
                    ariaLabel="Max height"
                    value={styles["max-height"] || ""}
                    onChange={(v) => onChange("max-height", v)}
                    disabled={disabled("max-height")}
                    disabledReason={reason("max-height")}
                    isOverridden={propertyStates["max-height"]?.isOverridden}
                    fieldIcon={<span className={FIELD_GLYPH_SM}>max</span>}
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
          className={`tw:flex tw:items-center tw:gap-2 tw:mb-3 ${disabled("object-fit") ? "tw:opacity-50" : ""}`}
          title={reason("object-fit")}
        >
          <label className="tw:min-w-[70px] tw:text-xs tw:font-medium tw:text-[var(--bk-ink-muted)]">Object Fit</label>
          <div className={CONTROL_SELECT_WRAP}>
          <Select
            /* The <label> beside it names nothing: no htmlFor, no wrapping —
               axe read this as an unnamed select (critical), and it is the one
               control an image's inspector adds. */
            aria-label="Object fit"
            value={styles["object-fit"] || ""}
            onChange={(e) => onChange("object-fit", e.target.value)}
            disabled={disabled("object-fit")}
          >
            <option value="">Default</option>
            <option value="fill">Fill</option>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="none">None</option>
            <option value="scale-down">Scale Down</option>
          </Select>
          </div>
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