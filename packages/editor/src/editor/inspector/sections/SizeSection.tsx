/**
 * Size Section — Width and Height as Fixed · Fill · Hug (boards 1, 16, 17).
 *
 * Board 1 reads "Width · Fill  [640 px]" and "Height  [Hug · Auto]": the row
 * label names the mode while the field holds a number, the field names it
 * when there is no number to show. Fill prints what the element measures on
 * the canvas; typing a number there makes it Fixed. The label is the mode
 * menu (Fixed / Fill / Hug) in every mode.
 *
 * Size is the only writer of width / height / min- / max- (Layout's old Size
 * row is gone, DD-9) and no longer carries object-fit (→ the Image block,
 * board 8). While the parent is a flex or grid container it also holds the
 * item controls (grow / span / align self — see `layout/ItemControls.tsx`).
 * On the Page panel (board 21) it is the one "Max width" row.
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { BK_SELECT_BARE_VALUE_THEME, Button, Menu, MenuItem, Popover, Select } from "@/editor/chrome-ui";
import { useSpacingRegistry } from "@/editor/design-system/state/TokenRegistryContext";
import { TokenPickerPopover } from "../shared/TokenPickerPopover";
import { isTokenVar, resolveTokenVar } from "../shared/tokenBindingDetection";
import { InputWithUnit, MoreSettingsToggle, Section } from "../shared/controls";
import { FieldDot } from "../shared/controls/FieldDot";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { CHAIN_BOUND, CHAIN_ROW, CHAIN_TRIGGER } from "../shared/controls/controlClasses";
import { ItemControls, type ParentLayout } from "./layout/ItemControls";

// ============================================================================
// FIXED · FILL · HUG
// ============================================================================

export type ConstraintType = "fixed" | "fill" | "hug";

/** Which of Fixed · Fill · Hug a width/height value is. */
export function constraintTypeOf(value: string): ConstraintType {
  if (value === "100%" || value === "-webkit-fill-available") return "fill";
  if (value === "auto" || value === "fit-content" || value === "max-content") return "hug";
  return "fixed";
}

/** The value a mode writes. Fixed keeps a fixed value already there. */
export function valueForConstraint(type: ConstraintType, current: string): string {
  if (type === "fill") return "100%";
  if (type === "hug") return "fit-content";
  return current && constraintTypeOf(current) === "fixed" ? current : "200px";
}

// ============================================================================
// SPACING-TOKEN CHAIN (Fixed mode) — binds width/height to a spacing token
// ============================================================================

interface ChainButtonProps {
  property: string;
  value: string;
  onChange: (value: string) => void;
}

const ChainButton: React.FC<ChainButtonProps> = ({ property, value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { tokens: spacingTokens } = useSpacingRegistry();
  const tokenEntries = spacingTokens.map((t) => ({ id: t.id, name: t.name, value: t.value, cssVar: t.cssVar }));
  const isBound = isTokenVar(value);
  const boundToken = isBound ? tokenEntries.find((t) => value === `var(${t.cssVar})`) : null;

  if (isBound) {
    return (
      <Button
        type="button"
        onClick={() => onChange(resolveTokenVar(value))}
        aria-label={`Unlink ${property} spacing token`}
        title={`Unlink "${boundToken?.name ?? "token"}" — resolves to current value`}
        className={CHAIN_BOUND}
      >
        <Link2 size={10} aria-hidden="true" />
        {boundToken?.name && <span className="tw:max-w-12 tw:overflow-hidden tw:text-ellipsis">{boundToken.name}</span>}
        <Link2Off size={9} aria-hidden="true" className="tw:opacity-70" />
      </Button>
    );
  }

  return (
    <Popover
      open={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      /* Beside the column over the canvas, like the colour popover (P-4):
         inside the column's scroll box it could clip. */
      beside=".layout-shell__inspector"
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

// ============================================================================
// RENDERED SIZE — what "Fill" measures on the canvas
// ============================================================================

/** The element's laid-out size on the canvas (CSS px, before canvas zoom). */
function useRenderedSize(elementId: string | undefined): { width: number; height: number } | null {
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  React.useLayoutEffect(() => {
    if (!elementId || typeof document === "undefined") return undefined;
    const node = document.querySelector<HTMLElement>(`[data-buildrick-id="${elementId.replace(/["\\]/g, "\\$&")}"]`);
    if (!node) {
      setSize(null);
      return undefined;
    }
    const read = () => (node.offsetWidth || node.offsetHeight ? setSize({ width: node.offsetWidth, height: node.offsetHeight }) : setSize(null));
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(node);
    return () => ro.disconnect();
  }, [elementId]);
  return size;
}

// ============================================================================
// DIMENSION ROW
// ============================================================================

const MODE_LABEL: Record<ConstraintType, string> = { fixed: "Fixed", fill: "Fill", hug: "Hug" };
const MODES: ConstraintType[] = ["fixed", "fill", "hug"];

const ROW = "bdi-row-ctrl";
const MODE_BUTTON =
  "bdi-lb tw:h-6 tw:min-w-0 tw:justify-start tw:gap-1 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:font-normal " +
  "tw:text-[var(--bk-ink-muted)] tw:hover:bg-transparent tw:hover:text-[var(--bk-ink-soft)] tw:focus:ring-0 " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

interface DimensionRowProps {
  axis: "width" | "height";
  value: string;
  /** Laid-out px on this axis, when the element is on the canvas. */
  measured: number | null;
  onChange: (value: string) => void;
}

function DimensionRow({ axis, value, measured, onChange }: DimensionRowProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const field = useInspectorField(axis);
  const name = axis === "width" ? "Width" : "Height";
  /* Unset reads as what a block does: fills its width, hugs its height. */
  const mode: ConstraintType = value ? constraintTypeOf(value) : axis === "width" ? "fill" : "hug";
  const setMode = (next: ConstraintType) => {
    if (next === mode) return;
    /* Fixed from Fill / Hug starts at what the element measures now. */
    const current = next === "fixed" && mode !== "fixed" && measured ? `${measured}px` : value;
    onChange(valueForConstraint(next, current));
  };
  const labelText = mode === "hug" ? name : `${name} · ${MODE_LABEL[mode]}`;
  const readout = measured ? `${measured}px` : "100%";

  return (
    <div className={`${ROW} tw:relative`} data-testid={`inspector-size-${axis}`} data-mode={mode}>
      <span className="tw:inline-flex tw:items-center tw:min-w-0">
        <Popover
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          placement="bottom"
          label={`${name} sizing`}
          trigger={
            <Button
              size="xs"
              color="light"
              className={MODE_BUTTON}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`${name} sizing: ${MODE_LABEL[mode]}`}
              data-testid={`inspector-size-${axis}-mode`}
              disabled={field.readOnly}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {labelText}
            </Button>
          }
        >
          <Menu label={`${name} sizing`}>
            {MODES.map((m) => (
              <MenuItem
                key={m}
                radio
                selected={m === mode}
                data-testid={`inspector-size-${axis}-mode-${m}`}
                onClick={() => {
                  setMenuOpen(false);
                  setMode(m);
                }}
              >
                {MODE_LABEL[m]}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
        <FieldDot field={field} />
      </span>
      <div className="bdi-row-content">
        {mode === "hug" ? (
          <div className="bdi-ddn">
            <Select
              aria-label={`${name} sizing`}
              className="bdi-v"
              theme={BK_SELECT_BARE_VALUE_THEME}
              disabled={field.readOnly}
              value="hug"
              onChange={(e) => setMode(e.target.value as ConstraintType)}
            >
              <option value="hug">Hug · Auto</option>
              <option value="fill">Fill</option>
              <option value="fixed">Fixed</option>
            </Select>
            <span className="bdi-c" aria-hidden="true">
              <ChevronDown size={9} />
            </span>
          </div>
        ) : (
          <div className={CHAIN_ROW}>
            <div className="tw:flex-1 tw:min-w-0">
              <InputWithUnit
                label=""
                ariaLabel={name}
                property={axis}
                units={["px", "%", "rem", "vw", "vh"]}
                value={mode === "fixed" ? value : readout}
                /* Fill's number is a readout: leaving it untouched must not
                   pin the element to its current size. */
                onChange={(v) => {
                  if (mode === "fill" && v === readout) return;
                  onChange(v);
                }}
              />
            </div>
            {mode === "fixed" && !field.readOnly && (
              /* Revealed on hover, left of the stepper and the unit select —
                 never over them (the field's number · stepper · unit). */
              <div className="tw:absolute tw:right-[76px] tw:top-1/2 tw:-translate-y-1/2 tw:z-[2]">
                <ChainButton property={axis} value={value} onChange={onChange} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SIZE SECTION
// ============================================================================

export interface SizeSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** The element on the canvas — Fill measures it. */
  elementId?: string;
  /** "page" = the Page panel's one Max width row (board 21). */
  variant?: "element" | "page";
  /** The parent is a flex / grid container: show the item controls. */
  parentLayout?: ParentLayout | null;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  advancedExpanded?: boolean;
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

const LIMITS = [
  { property: "min-width", label: "Min width" },
  { property: "max-width", label: "Max width" },
  { property: "min-height", label: "Min height" },
  { property: "max-height", label: "Max height" },
] as const;

export const SizeSection: React.FC<SizeSectionProps> = ({
  styles,
  onChange,
  elementId,
  variant = "element",
  parentLayout = null,
  propertyStates = {},
  isOpen,
  onToggle,
  advancedExpanded = false,
  onAdvancedToggle,
}) => {
  const measured = useRenderedSize(variant === "page" ? undefined : elementId);
  const hidden = (prop: string) => propertyStates[prop]?.hidden;

  if (variant === "page") {
    return (
      <Section title="Size" isOpen={isOpen} onToggle={onToggle} id="inspector-section-size">
        <InputWithUnit
          label="Max width"
          property="max-width"
          /* Unset reads empty, not a "0" that looks like a value (board 21). */
          placeholder=""
          units={["px", "%", "rem", "vw"]}
          value={styles["max-width"] || ""}
          onChange={(v) => onChange("max-width", v)}
        />
      </Section>
    );
  }

  return (
    <Section title="Size" isOpen={isOpen} onToggle={onToggle} id="inspector-section-size">
      {!hidden("width") && (
        <DimensionRow axis="width" value={styles.width || ""} measured={measured?.width ?? null} onChange={(v) => onChange("width", v)} />
      )}
      {!hidden("height") && (
        <DimensionRow axis="height" value={styles.height || ""} measured={measured?.height ?? null} onChange={(v) => onChange("height", v)} />
      )}
      {parentLayout && <ItemControls parent={parentLayout} styles={styles} onChange={onChange} advanced={advancedExpanded} />}
      {advancedExpanded &&
        LIMITS.filter((l) => !hidden(l.property)).map((l) => (
          <InputWithUnit
            key={l.property}
            label={l.label}
            property={l.property}
            value={styles[l.property] || ""}
            onChange={(v) => onChange(l.property, v)}
          />
        ))}
      {onAdvancedToggle && <MoreSettingsToggle isOpen={advancedExpanded} onToggle={() => onAdvancedToggle()} />}
    </Section>
  );
};

export default SizeSection;
