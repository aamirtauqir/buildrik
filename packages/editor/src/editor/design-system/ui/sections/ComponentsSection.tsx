/**
 * ComponentsSection (S3) — read-only summary of the Components catalog
 * displayed inside the Design tab's 4-section workspace.
 *
 * Read-only by design: catalog browsing + drag + saving lives in the
 * dedicated Components rail panel (out of scope for the Design tab).
 * This section gives a single-glance view of how much DS surface the
 * project carries today and points users to the rail panel for action.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CATALOG } from "../../../components-catalog/catalog";
import {
  useColorRegistry,
  useTypeRegistry,
  useSpacingRegistry,
  useRadiusRegistry,
  useShadowRegistry,
  useMotionRegistry,
  useBorderRegistry,
  useOpacityRegistry,
  useZindexRegistry,
  useBreakpointRegistry,
  useGridRegistry,
  useSizingRegistry,
  useIconRegistry,
  useImageryRegistry,
} from "../../state/TokenRegistryContext";
import {
  useButtonPresets, useCardPresets, useFormPresets, useLinkPresets,
  useBadgePresets, useAlertPresets, useTooltipPresets, useModalPresets,
  useNavPresets, useTablePresets, useLayoutPresets,
} from "../../state/StylePresetRegistryContext";
import type { ComponentTier } from "../../../components-catalog/types";

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 12,
};

const cardStyle: React.CSSProperties = {
  background: "var(--bd-surface-1)",
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  padding: 16,
};

const headingStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--bd-fg-primary)",
  marginBottom: 8,
};

const statRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "baseline",
  padding: "4px 0",
  fontSize: 12,
  color: "var(--bd-fg-secondary)",
};

const statValueStyle: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  color: "var(--bd-fg-primary)",
  fontWeight: 600,
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  lineHeight: 1.5,
};

export const ComponentsSection: React.FC = () => {
  const colors = useColorRegistry();
  const types = useTypeRegistry();
  const spacing = useSpacingRegistry();
  const radius = useRadiusRegistry();
  const shadow = useShadowRegistry();
  const motion = useMotionRegistry();
  const border = useBorderRegistry();
  const opacity = useOpacityRegistry();
  const zindex = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid = useGridRegistry();
  const sizing = useSizingRegistry();
  const icon = useIconRegistry();
  const imagery = useImageryRegistry();

  const tokenTotal =
    colors.tokens.length + types.tokens.length + spacing.tokens.length +
    radius.tokens.length + shadow.tokens.length + motion.tokens.length +
    border.tokens.length + opacity.tokens.length + zindex.tokens.length +
    breakpoint.tokens.length + grid.tokens.length + sizing.tokens.length +
    icon.tokens.length + imagery.tokens.length;

  const button = useButtonPresets();
  const card = useCardPresets();
  const form = useFormPresets();
  const link = useLinkPresets();
  const badge = useBadgePresets();
  const alert = useAlertPresets();
  const tooltip = useTooltipPresets();
  const modal = useModalPresets();
  const nav = useNavPresets();
  const table = useTablePresets();
  const layout = useLayoutPresets();

  const presetTotal =
    button.presets.length + card.presets.length + form.presets.length +
    link.presets.length + badge.presets.length + alert.presets.length +
    tooltip.presets.length + modal.presets.length + nav.presets.length +
    table.presets.length + layout.presets.length;

  const tierCounts = React.useMemo(() => {
    const counts: Record<ComponentTier, number> = { atom: 0, molecule: 0, organism: 0 };
    for (const c of CATALOG) counts[c.category]++;
    return counts;
  }, []);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headingStyle}>Catalog</div>
        <div style={statRowStyle}>
          <span>Built-in components</span>
          <span style={statValueStyle}>{CATALOG.length}</span>
        </div>
        <div style={statRowStyle}>
          <span>Atoms</span>
          <span style={statValueStyle}>{tierCounts.atom}</span>
        </div>
        <div style={statRowStyle}>
          <span>Molecules</span>
          <span style={statValueStyle}>{tierCounts.molecule}</span>
        </div>
        <div style={statRowStyle}>
          <span>Organisms</span>
          <span style={statValueStyle}>{tierCounts.organism}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headingStyle}>Design surface</div>
        <div style={statRowStyle}>
          <span>Tokens defined</span>
          <span style={statValueStyle}>{tokenTotal}</span>
        </div>
        <div style={statRowStyle}>
          <span>Style presets defined</span>
          <span style={statValueStyle}>{presetTotal}</span>
        </div>
        <p style={hintStyle}>
          Catalog components bind to these tokens and presets. Edits in
          Tokens or Styles propagate to every placed instance via CSS variable
          references — no instance re-rendering needed.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={headingStyle}>Manage components</div>
        <p style={hintStyle}>
          Open the <strong>Components</strong> rail tab to browse the catalog,
          drag components onto the canvas, save selections as reusable
          components, or detach instances.
        </p>
      </div>
    </div>
  );
};
