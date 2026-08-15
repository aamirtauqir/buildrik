/**
 * Grid Section - Visual CSS Grid controls
 * AQUI-029: Visual CSS Grid Editor
 *
 * @module editor/inspector/sections/GridSection
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Section,
  InlineInput,
  CompactButtonGroup,
  AlignmentGrid,
  LinkedGapInput,
  SubSectionTitle,
  TemplateButtonGrid,
  SectionLabel,
  type SectionTier,
  MixedValueIndicator,
} from "../shared/controls";
import { InputField } from "../../../shared/forms/InputField";
import { MixedValueBadge } from "../shared/MixedValueBadge";

export interface GridSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Batch handler for atomic updates (used by LinkedGapInput toggle). */
  onBatchChange?: (changes: Record<string, string>) => void;
  isGridContainer: boolean;
  isGridItem: boolean;
  /** Controlled open state — driven by collapse/expand all */
  isOpen?: boolean;
  /** Called when section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
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


export const GridSection: React.FC<GridSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  isGridContainer,
  isGridItem,
  isOpen,
  onToggle,
  tier = "secondary",
  mixedKeys,
}) => {
  // Only show if grid-related
  if (!isGridContainer && !isGridItem) {
    return null;
  }

  // Collapsed preview: rough column/row count from grid-template-* values so
  // users can see "3 × 2" without expanding. Falls back to "auto" when the
  // template uses functions like repeat(auto-fit, ...).
  const countGridTracks = (template: string | undefined): string => {
    if (!template) return "—";
    if (/auto-fit|auto-fill/.test(template)) return "auto";
    const repeatMatch = template.match(/repeat\((\d+)/);
    if (repeatMatch) return repeatMatch[1];
    const tracks = template.trim().split(/\s+/).filter(Boolean).length;
    return String(tracks || 1);
  };
  const gridPreview = isGridContainer ? (
    <span
      style={{
        fontSize: 11,
        color: "var(--bk-ink-muted)",
        fontFamily: "var(--bk-font-mono)",
        whiteSpace: "nowrap",
      }}
    >
      {countGridTracks(styles["grid-template-columns"])} ×{" "}
      {countGridTracks(styles["grid-template-rows"])}
    </span>
  ) : undefined;

  return (
    <Section
      title="Grid"
      icon="Grid3X3"
      defaultOpen
      isOpen={isOpen}
      onToggle={onToggle}
      preview={gridPreview}
      tier={tier}
      id="inspector-section-grid"
    >
      {/* GRID CONTAINER CONTROLS */}
      {isGridContainer && (
        <>
          <SubSectionTitle>Grid Container</SubSectionTitle>

          {/* Quick Templates */}
          <SectionLabel
            style={{ fontSize: "var(--bk-text-11)", marginBottom: "var(--bk-space-4)" }}
          >
            Column Templates
          </SectionLabel>
          <TemplateButtonGrid
            templates={GRID_TEMPLATES}
            currentValue={styles["grid-template-columns"] || ""}
            onChange={(v) => onChange("grid-template-columns", v)}
          />

          {/* Grid Template Inputs */}
          <div style={{ position: "relative" }}>
            <MixedValueIndicator prop="grid-template-columns" mixedKeys={mixedKeys} offsetLeft={0} />
            <InlineInput
              label="Columns"
              value={styles["grid-template-columns"] || ""}
              onChange={(v) => onChange("grid-template-columns", v)}
              placeholder="1fr 1fr 1fr"
            />
          </div>

          <div style={{ position: "relative" }}>
            <MixedValueIndicator prop="grid-template-rows" mixedKeys={mixedKeys} offsetLeft={0} />
            <InlineInput
              label="Rows"
              value={styles["grid-template-rows"] || ""}
              onChange={(v) => onChange("grid-template-rows", v)}
              placeholder="auto"
            />
          </div>

          {/* Grid Auto-Flow */}
          {mixedKeys?.has("grid-auto-flow") && <MixedValueBadge compact />}
          <CompactButtonGroup
            label="Flow"
            value={styles["grid-auto-flow"] || ""}
            options={FLOW_OPTIONS}
            onChange={(v) => onChange("grid-auto-flow", v)}
          />

          {/* Gap Controls */}
          {mixedKeys?.has("gap") && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
              <MixedValueBadge compact />
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--bk-space-4)",
              marginBottom: "var(--bk-space-8)",
            }}
          >
            <InputField
              label="Gap"
              type="text"
              value={styles.gap || ""}
              onChange={(e) => onChange("gap", e.target.value)}
              placeholder="0"
            />
            <InputField
              label="Row"
              type="text"
              value={styles["row-gap"] || ""}
              onChange={(e) => onChange("row-gap", e.target.value)}
              placeholder="0"
            />
            <InputField
              label="Col"
              type="text"
              value={styles["column-gap"] || ""}
              onChange={(e) => onChange("column-gap", e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Visual Alignment Grid */}
          <SectionLabel
            style={{ fontSize: "var(--bk-text-11)", marginBottom: "var(--bk-space-4)" }}
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
          {(mixedKeys?.has("grid-column") || mixedKeys?.has("grid-row")) && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
              {mixedKeys?.has("grid-column") && <MixedValueBadge compact />}
              {mixedKeys?.has("grid-row") && <MixedValueBadge compact />}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--bk-space-4)",
              marginBottom: "var(--bk-space-8)",
            }}
          >
            <InputField
              label="Col"
              type="text"
              value={styles["grid-column"] || ""}
              onChange={(e) => onChange("grid-column", e.target.value)}
              placeholder="auto"
            />
            <InputField
              label="Row"
              type="text"
              value={styles["grid-row"] || ""}
              onChange={(e) => onChange("grid-row", e.target.value)}
              placeholder="auto"
            />
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