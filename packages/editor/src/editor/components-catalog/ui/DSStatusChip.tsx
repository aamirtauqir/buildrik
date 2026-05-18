/**
 * DSStatusChip (S6 CU1) — header chip showing live DS-binding stats.
 *
 * Reads token + preset registries to compute "N styles · M tokens" badges.
 * Click invokes onJumpToDesign — caller routes to the Design tab so users
 * can edit the underlying tokens without leaving Components panel context.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  useColorRegistry, useTypeRegistry, useSpacingRegistry,
  useRadiusRegistry, useShadowRegistry, useMotionRegistry,
  useBorderRegistry, useOpacityRegistry, useZindexRegistry,
  useBreakpointRegistry, useGridRegistry, useSizingRegistry,
  useIconRegistry, useImageryRegistry,
} from "@/editor/design-system/state/TokenRegistryContext";
import {
  useButtonPresets, useCardPresets, useFormPresets, useLinkPresets,
  useBadgePresets, useAlertPresets, useTooltipPresets, useModalPresets,
  useNavPresets, useTablePresets, useLayoutPresets,
} from "@/editor/design-system/state/StylePresetRegistryContext";

interface DSStatusChipProps {
  onJumpToDesign?: () => void;
}

const chipStyle = (clickable: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  background: "rgba(34, 197, 94, 0.1)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  borderRadius: 12,
  fontSize: 11,
  color: "var(--bd-fg-primary)",
  cursor: clickable ? "pointer" : "default",
});

const dotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "var(--bd-radius-full)",
  background: "var(--bd-success, #22c55e)",
  flexShrink: 0,
};

export const DSStatusChip: React.FC<DSStatusChipProps> = ({ onJumpToDesign }) => {
  const tokenCount =
    useColorRegistry().tokens.length +
    useTypeRegistry().tokens.length +
    useSpacingRegistry().tokens.length +
    useRadiusRegistry().tokens.length +
    useShadowRegistry().tokens.length +
    useMotionRegistry().tokens.length +
    useBorderRegistry().tokens.length +
    useOpacityRegistry().tokens.length +
    useZindexRegistry().tokens.length +
    useBreakpointRegistry().tokens.length +
    useGridRegistry().tokens.length +
    useSizingRegistry().tokens.length +
    useIconRegistry().tokens.length +
    useImageryRegistry().tokens.length;

  const presetCount =
    useButtonPresets().presets.length +
    useCardPresets().presets.length +
    useFormPresets().presets.length +
    useLinkPresets().presets.length +
    useBadgePresets().presets.length +
    useAlertPresets().presets.length +
    useTooltipPresets().presets.length +
    useModalPresets().presets.length +
    useNavPresets().presets.length +
    useTablePresets().presets.length +
    useLayoutPresets().presets.length;

  const clickable = !!onJumpToDesign;
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      onClick={onJumpToDesign}
      style={chipStyle(clickable)}
      data-ds-status-chip
      aria-label={`Bound to design system: ${presetCount} styles, ${tokenCount} tokens`}
    >
      <span style={dotStyle} aria-hidden />
      <span>
        Bound to DS · <strong>{presetCount}</strong> style{presetCount === 1 ? "" : "s"} ·{" "}
        <strong>{tokenCount}</strong> token{tokenCount === 1 ? "" : "s"}
      </span>
    </Tag>
  );
};
