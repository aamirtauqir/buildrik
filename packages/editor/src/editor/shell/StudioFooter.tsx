import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * StudioFooter — 32px status bar at bottom of editor shell.
 * Left: sync status + breadcrumb path to selected element.
 * Right: canvas dimensions, zoom -/+ control, version.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { DeviceType } from "../../shared/types";

const VERSION = "v2.14.0";
const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200] as const;

const DEVICE_DIMENSIONS: Partial<Record<DeviceType, string>> = {
  wide: "1440 × 900",
  desktop: "1280 × 800",
  tablet: "768 × 1024",
  mobile: "375 × 812",
};

export interface StudioFooterProps {
  composer: Composer | null;
  device: DeviceType;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  syncConnected?: boolean;
  selectedElement: { id: string; type: string; tagName?: string } | null;
}

const zoomBtnStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--buildrick-text-muted)",
  cursor: "pointer",
  borderRadius: 4,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--buildrick-font-family)",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1,
};

export const StudioFooter: React.FC<StudioFooterProps> = ({
  composer,
  device,
  zoom,
  onZoomChange,
  syncConnected = true,
  selectedElement,
}) => {
  const breadcrumb = selectedElement
    ? `body › ${selectedElement.tagName ?? selectedElement.type}`
    : "body";

  const dims = DEVICE_DIMENSIONS[device] ?? "—";
  const zoomLabel = `${Math.round(zoom)}%`;

  const applyZoom = React.useCallback(
    (z: number) => {
      const clamped = Math.max(25, Math.min(200, z));
      onZoomChange?.(clamped);
      composer?.setZoom?.(clamped);
    },
    [composer, onZoomChange]
  );

  const onZoomOut = React.useCallback(() => {
    const prev = [...ZOOM_PRESETS].reverse().find((p) => p < zoom);
    applyZoom(prev ?? ZOOM_PRESETS[0]);
  }, [zoom, applyZoom]);

  const onZoomIn = React.useCallback(() => {
    const next = ZOOM_PRESETS.find((p) => p > zoom);
    applyZoom(next ?? ZOOM_PRESETS[ZOOM_PRESETS.length - 1]);
  }, [zoom, applyZoom]);

  return (
    <>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "var(--bd-radius-full)",
            background: syncConnected
              ? "var(--buildrick-success)"
              : "var(--buildrick-text-muted)",
          }}
        />
        {syncConnected ? "Connected · main" : "Offline"}
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
          flex: 1,
        }}
        title={breadcrumb}
      >
        {breadcrumb}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span>{dims}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            padding: "2px 4px",
            borderRadius: 5,
            background: "var(--buildrick-bg-subtle)",
          }}
        >
          <Button
            type="button"
            style={zoomBtnStyle}
            onClick={onZoomOut}
            aria-label="Zoom out"
            disabled={zoom <= ZOOM_PRESETS[0]}
          >
            −
          </Button>
          <span
            style={{
              minWidth: 36,
              textAlign: "center",
              color: "var(--buildrick-text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {zoomLabel}
          </span>
          <Button
            type="button"
            style={zoomBtnStyle}
            onClick={onZoomIn}
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
          >
            +
          </Button>
        </span>
        <span>{VERSION}</span>
      </span>
    </>
  );
};

export default StudioFooter;
