/**
 * LinkedGapInput — shared linked/unlinked gap input for flex + grid.
 * Ported to .bdi-row-ctrl + .bdi-num.
 *
 * @license BSD-3-Clause
 */

import { Link, Link2Off } from "lucide-react";
import * as React from "react";
import { Input } from "@/editor/ui";
import { Button } from "flowbite-react";

export interface LinkedGapInputProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange?: (changes: Record<string, string>) => void;
  label?: string;
  disabled?: boolean;
}

function isLinked(styles: Record<string, string>): boolean {
  const row = styles["row-gap"];
  const col = styles["column-gap"];
  if (!row && !col) return true;
  if (row && col && row === col) return true;
  return false;
}

function getLinkedValue(styles: Record<string, string>): string {
  return styles.gap || styles["row-gap"] || styles["column-gap"] || "";
}

const parseNum = (val: string): { num: string; unit: string } => {
  const m = val.match(/^(-?[\d.]+)(.*)$/);
  return m ? { num: m[1], unit: m[2] || "px" } : { num: val, unit: "" };
};

const GapIcon: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4v16 M17 4v16 M3 12h4 M17 12h4" />
  </svg>
);

const NumField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: React.ReactNode;
}> = ({ value, onChange, placeholder = "0", disabled, ariaLabel, icon }) => {
  const { num, unit } = parseNum(value);
  return (
    <div
      className="bdi-fld"
      style={disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
    >
      {icon && <span className="bdi-flb">{icon}</span>}
      <Input
        type="text"
        value={num}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onChange("");
          else if (/^-?[\d.]+$/.test(v)) onChange(`${v}px`);
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      {unit && <span className="bdi-u">{unit}</span>}
    </div>
  );
};

export const LinkedGapInput: React.FC<LinkedGapInputProps> = ({
  styles: elementStyles,
  onChange,
  onBatchChange,
  label = "Gap",
  disabled = false,
}) => {
  const linked = isLinked(elementStyles);

  const applyChanges = (changes: Record<string, string>) => {
    if (onBatchChange) {
      onBatchChange(changes);
      return;
    }
    Object.entries(changes).forEach(([prop, val]) => onChange(prop, val));
  };

  const handleLinkedChange = (value: string) => {
    applyChanges({ gap: value, "row-gap": "", "column-gap": "" });
  };

  const toggleLink = () => {
    if (linked) {
      const current = getLinkedValue(elementStyles);
      applyChanges({ gap: "", "row-gap": current || "", "column-gap": current || "" });
    } else {
      const current = elementStyles["row-gap"] || elementStyles["column-gap"] || "";
      applyChanges({ gap: current, "row-gap": "", "column-gap": "" });
    }
  };

  return (
    <div className={`bdi-row-ctrl${disabled ? " disabled" : ""}`}>
      <label className="bdi-lb">
        {label}
        <Button
          type="button"
          onClick={toggleLink}
          title={linked ? "Unlink row and column gap" : "Link row and column gap"}
          aria-pressed={linked}
          aria-label={linked ? "Unlink row and column gap" : "Link row and column gap"}
          disabled={disabled}
          className="bdi-mini"
          style={{
            width: 16,
            height: 16,
            color: linked ? "var(--bk-accent)" : "var(--bk-ink-muted)",
          }}
        >
          {linked ? <Link size={10} aria-hidden="true" /> : <Link2Off size={10} aria-hidden="true" />}
        </Button>
      </label>
      <div className="bdi-row-content">
        {linked ? (
          <NumField
            value={getLinkedValue(elementStyles)}
            onChange={handleLinkedChange}
            disabled={disabled}
            ariaLabel={`${label} (linked)`}
            icon={<GapIcon />}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, flex: 1 }}>
            <NumField
              value={elementStyles["row-gap"] || ""}
              onChange={(v) => onChange("row-gap", v)}
              disabled={disabled}
              ariaLabel="Row gap"
              icon={<span style={{ font: "600 10px var(--bk-font-ui)" }}>R</span>}
            />
            <NumField
              value={elementStyles["column-gap"] || ""}
              onChange={(v) => onChange("column-gap", v)}
              disabled={disabled}
              ariaLabel="Column gap"
              icon={<span style={{ font: "600 10px var(--bk-font-ui)" }}>C</span>}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedGapInput;
