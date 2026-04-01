/**
 * RulersOverlay Component
 * Renders horizontal and vertical rulers on canvas edges
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import { canvasTokens } from "../../../styles/tokens";

export interface RulersOverlayProps {
  /** Current zoom level (percentage) */
  zoom: number;
  /** Canvas dimensions */
  canvasSize: { width: number; height: number };
  /** Callback when user clicks ruler to create guide */
  onCreateGuide: (type: "horizontal" | "vertical", position: number) => void;
}

/** Ruler size in pixels */
const RULER_SIZE = 20;
/** Major tick interval (show numbers) */
const MAJOR_TICK = 100;
/** Minor tick interval */
const MINOR_TICK = 10;

/** Colors - using design tokens */
const COLORS = {
  background: canvasTokens.colors.surface.background,
  tick: "#64748b",
  number: "#94a3b8",
  hover: canvasTokens.colors.primary.alpha30,
};

/**
 * Horizontal ruler (top edge)
 */
const HorizontalRuler: React.FC<{
  width: number;
  zoom: number;
  onCreateGuide: (position: number) => void;
}> = ({ width, zoom, onCreateGuide }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = React.useState<number | null>(null);

  const scale = zoom / 100;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = RULER_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, RULER_SIZE);

    // Ticks
    ctx.fillStyle = COLORS.tick;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center";

    const step = MINOR_TICK * scale;
    const majorStep = MAJOR_TICK * scale;

    for (let x = 0; x <= width; x += step) {
      const isMajor = Math.round(x / majorStep) * majorStep === Math.round(x);
      const tickHeight = isMajor ? 10 : 5;

      ctx.fillRect(x, RULER_SIZE - tickHeight, 1, tickHeight);

      if (isMajor && x > 0) {
        ctx.fillStyle = COLORS.number;
        ctx.fillText(String(Math.round(x / scale)), x, 10);
        ctx.fillStyle = COLORS.tick;
      }
    }

    // Hover indicator
    if (hoverPos !== null) {
      ctx.fillStyle = COLORS.hover;
      ctx.fillRect(hoverPos - 1, 0, 2, RULER_SIZE);
    }
  }, [width, zoom, scale, hoverPos]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      onCreateGuide(x / scale);
    },
    [scale, onCreateGuide]
  );

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos(e.clientX - rect.left);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: RULER_SIZE,
        width: width - RULER_SIZE,
        height: RULER_SIZE,
        cursor: "pointer",
        zIndex: Z_LAYERS.rulers,
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverPos(null)}
    />
  );
};

/**
 * Vertical ruler (left edge)
 */
const VerticalRuler: React.FC<{
  height: number;
  zoom: number;
  onCreateGuide: (position: number) => void;
}> = ({ height, zoom, onCreateGuide }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = React.useState<number | null>(null);

  const scale = zoom / 100;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = RULER_SIZE * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, RULER_SIZE, height);

    // Ticks
    ctx.fillStyle = COLORS.tick;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "right";

    const step = MINOR_TICK * scale;
    const majorStep = MAJOR_TICK * scale;

    for (let y = 0; y <= height; y += step) {
      const isMajor = Math.round(y / majorStep) * majorStep === Math.round(y);
      const tickWidth = isMajor ? 10 : 5;

      ctx.fillRect(RULER_SIZE - tickWidth, y, tickWidth, 1);

      if (isMajor && y > 0) {
        ctx.save();
        ctx.translate(10, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = COLORS.number;
        ctx.textAlign = "left";
        ctx.fillText(String(Math.round(y / scale)), 2, 0);
        ctx.restore();
        ctx.fillStyle = COLORS.tick;
      }
    }

    // Hover indicator
    if (hoverPos !== null) {
      ctx.fillStyle = COLORS.hover;
      ctx.fillRect(0, hoverPos - 1, RULER_SIZE, 2);
    }
  }, [height, zoom, scale, hoverPos]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      onCreateGuide(y / scale);
    },
    [scale, onCreateGuide]
  );

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos(e.clientY - rect.top);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: RULER_SIZE,
        left: 0,
        width: RULER_SIZE,
        height: height - RULER_SIZE,
        cursor: "pointer",
        zIndex: Z_LAYERS.rulers,
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverPos(null)}
    />
  );
};

/**
 * RulersOverlay - renders both rulers
 */
export const RulersOverlay: React.FC<RulersOverlayProps> = ({
  zoom,
  canvasSize,
  onCreateGuide,
}) => {
  const handleHorizontalGuide = React.useCallback(
    (position: number) => onCreateGuide("horizontal", position),
    [onCreateGuide]
  );

  const handleVerticalGuide = React.useCallback(
    (position: number) => onCreateGuide("vertical", position),
    [onCreateGuide]
  );

  return (
    <>
      {/* Corner box */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          background: COLORS.background,
          zIndex: Z_LAYERS.rulers + 1, // Corner above ruler lines
        }}
      />

      {/* Horizontal ruler (top) */}
      <HorizontalRuler width={canvasSize.width} zoom={zoom} onCreateGuide={handleHorizontalGuide} />

      {/* Vertical ruler (left) */}
      <VerticalRuler height={canvasSize.height} zoom={zoom} onCreateGuide={handleVerticalGuide} />
    </>
  );
};

export default RulersOverlay;
