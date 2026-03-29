/**
 * Grid Section - Visual CSS Grid controls
 * AQUI-029: Visual CSS Grid Editor
 *
 * @module components/Panels/ProInspector/sections/GridSection
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Section,
  InlineInput,
  CompactButtonGroup,
  AlignmentGrid,
  SubSectionTitle,
  TemplateButtonGrid,
  SectionLabel,
} from "../shared/Controls";

interface GridSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isGridContainer: boolean;
  isGridItem: boolean;
}

// Grid column templates
const GRID_TEMPLATES = [
  { label: "2 Col", value: "1fr 1fr" },
  { label: "3 Col", value: "1fr 1fr 1fr" },
  { label: "4 Col", value: "repeat(4, 1fr)" },
  { label: "Auto", value: "repeat(auto-fit, minmax(200px, 1fr))" },
  { label: "1:2", value: "1fr 2fr" },
  { label: "2:1", value: "2fr 1fr" },
  { label: "Sidebar", value: "250px 1fr" },
  { label: "Holy", value: "200px 1fr 200px" },
];

// Grid flow options
const FLOW_OPTIONS = [
  { value: "row", label: "row" },
  { value: "column", label: "col" },
  { value: "row dense", label: "r+d" },
  { value: "column dense", label: "c+d" },
];

// Content alignment options (with space- prefix handling)
const makeContentOptions = () => {
  const options = ["start", "center", "end", "between", "around"];
  return options.map((val) => {
    const fullValue = val === "between" ? "space-between" : val === "around" ? "space-around" : val;
    return {
      value: fullValue,
      label: val.slice(0, 3),
    };
  });
};

// Span options
const SPAN_OPTIONS = ["1", "2", "3", "4", "full"];
const getSpanValue = (span: string, isFull: boolean) => (isFull ? "1 / -1" : `span ${span}`);
const isSpanActive = (current: string, span: string) =>
  span === "full" ? current === "1 / -1" : current === `span ${span}`;

// Self alignment options
const SELF_OPTIONS = [
  { value: "auto", label: "aut" },
  { value: "start", label: "sta" },
  { value: "center", label: "cen" },
  { value: "end", label: "end" },
  { value: "stretch", label: "str" },
];

// Compact input style for gap controls
const compactInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "var(--aqb-space-1)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-xs)",
  color: "var(--aqb-text-primary)",
  fontSize: "var(--aqb-text-xs)",
  outline: "none",
};

export const GridSection: React.FC<GridSectionProps> = ({
  styles,
  onChange,
  isGridContainer,
  isGridItem,
}) => {
  // Only show if grid-related
  if (!isGridContainer && !isGridItem) {
    return null;
  }

  return (
    <Section title="CSS Grid" icon="Grid3X3" defaultOpen id="inspector-section-grid">
      {/* GRID CONTAINER CONTROLS */}
      {isGridContainer && (
        <>
          <SubSectionTitle>Grid Container</SubSectionTitle>

          {/* Quick Templates */}
          <SectionLabel
            style={{ fontSize: "var(--aqb-text-2xs)", marginBottom: "var(--aqb-space-1)" }}
          >
            Column Templates
          </SectionLabel>
          <TemplateButtonGrid
            templates={GRID_TEMPLATES}
            currentValue={styles["grid-template-columns"] || ""}
            onChange={(v) => onChange("grid-template-columns", v)}
          />

          {/* Grid Template Inputs */}
          <InlineInput
            label="Columns"
            value={styles["grid-template-columns"] || ""}
            onChange={(v) => onChange("grid-template-columns", v)}
            placeholder="1fr 1fr 1fr"
          />

          <InlineInput
            label="Rows"
            value={styles["grid-template-rows"] || ""}
            onChange={(v) => onChange("grid-template-rows", v)}
            placeholder="auto"
          />

          {/* Grid Auto-Flow */}
          <CompactButtonGroup
            label="Flow"
            value={styles["grid-auto-flow"] || ""}
            options={FLOW_OPTIONS}
            onChange={(v) => onChange("grid-auto-flow", v)}
          />

          {/* Gap Controls */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--aqb-space-1)",
              marginBottom: "var(--aqb-space-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: "var(--aqb-text-2xs)", color: "var(--aqb-text-muted)" }}>
                Gap
              </span>
              <input
                type="text"
                value={styles.gap || ""}
                onChange={(e) => onChange("gap", e.target.value)}
                placeholder="0"
                style={compactInputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: "var(--aqb-text-2xs)", color: "var(--aqb-text-muted)" }}>
                Row
              </span>
              <input
                type="text"
                value={styles["row-gap"] || ""}
                onChange={(e) => onChange("row-gap", e.target.value)}
                placeholder="0"
                style={compactInputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: "var(--aqb-text-2xs)", color: "var(--aqb-text-muted)" }}>
                Col
              </span>
              <input
                type="text"
                value={styles["column-gap"] || ""}
                onChange={(e) => onChange("column-gap", e.target.value)}
                placeholder="0"
                style={compactInputStyle}
              />
            </div>
          </div>

          {/* Visual Alignment Grid */}
          <SectionLabel
            style={{ fontSize: "var(--aqb-text-2xs)", marginBottom: "var(--aqb-space-1)" }}
          >
            Item Alignment
          </SectionLabel>
          <AlignmentGrid
            justifyItems={styles["justify-items"] || "stretch"}
            alignItems={styles["align-items"] || "stretch"}
            onChange={onChange}
          />

          {/* Justify/Align Content */}
          <CompactButtonGroup
            label="J-Content"
            value={styles["justify-content"] || ""}
            options={makeContentOptions()}
            onChange={(v) => onChange("justify-content", v)}
          />

          <CompactButtonGroup
            label="A-Content"
            value={styles["align-content"] || ""}
            options={makeContentOptions()}
            onChange={(v) => onChange("align-content", v)}
          />
        </>
      )}

      {/* GRID ITEM CONTROLS */}
      {isGridItem && (
        <>
          <SubSectionTitle>Grid Item</SubSectionTitle>

          {/* Grid Column/Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--aqb-space-1)",
              marginBottom: "var(--aqb-space-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span
                style={{
                  fontSize: "var(--aqb-text-2xs)",
                  color: "var(--aqb-text-muted)",
                  width: "var(--aqb-space-8)",
                }}
              >
                Col
              </span>
              <input
                type="text"
                value={styles["grid-column"] || ""}
                onChange={(e) => onChange("grid-column", e.target.value)}
                placeholder="auto"
                style={compactInputStyle}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span
                style={{
                  fontSize: "var(--aqb-text-2xs)",
                  color: "var(--aqb-text-muted)",
                  width: "var(--aqb-space-8)",
                }}
              >
                Row
              </span>
              <input
                type="text"
                value={styles["grid-row"] || ""}
                onChange={(e) => onChange("grid-row", e.target.value)}
                placeholder="auto"
                style={compactInputStyle}
              />
            </div>
          </div>

          {/* Column Span shortcuts */}
          <CompactButtonGroup
            label="Col Span"
            value={
              SPAN_OPTIONS.find((s) => isSpanActive(styles["grid-column"] || "", s))
                ? styles["grid-column"] || ""
                : ""
            }
            options={SPAN_OPTIONS.map((s) => ({
              value: getSpanValue(s, s === "full"),
              label: s,
            }))}
            onChange={(v) => onChange("grid-column", v)}
          />

          {/* Row Span shortcuts */}
          <CompactButtonGroup
            label="Row Span"
            value={
              SPAN_OPTIONS.find((s) => isSpanActive(styles["grid-row"] || "", s))
                ? styles["grid-row"] || ""
                : ""
            }
            options={SPAN_OPTIONS.map((s) => ({
              value: getSpanValue(s, s === "full"),
              label: s,
            }))}
            onChange={(v) => onChange("grid-row", v)}
          />

          {/* Self alignment */}
          <CompactButtonGroup
            label="J-Self"
            value={styles["justify-self"] || ""}
            options={SELF_OPTIONS}
            onChange={(v) => onChange("justify-self", v)}
          />

          <CompactButtonGroup
            label="A-Self"
            value={styles["align-self"] || ""}
            options={SELF_OPTIONS}
            onChange={(v) => onChange("align-self", v)}
          />
        </>
      )}
    </Section>
  );
};

export default GridSection;
