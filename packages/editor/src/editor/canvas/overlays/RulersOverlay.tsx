/**
 * RulersOverlay Component
 * Renders horizontal and vertical rulers on canvas edges
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "../../../shared/constants/canvas";

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

/* Colours are tokens, resolved before painting: a 2D canvas cannot read
   var(--…) — the assignment is silently ignored, which is how the rulers
   painted as solid black bars (the old background was also the dark-theme
   #0A0A0A surface). Named fallbacks cover a detached node. */
const TOKENS = {
  background: ["--bk-bg-panel", "white"],
  edge: ["--bk-border", "lightgray"],
  tick: ["--bk-gray-400", "gray"],
  number: ["--bk-ink-muted", "gray"],
  hover: ["--bk-accent", "blue"],
} as const;
type RulerColors = Record<keyof typeof TOKENS, string>;

function resolveColors(el: Element): RulerColors {
  const cs = getComputedStyle(el);
  const out = {} as RulerColors;
  for (const [k, [name, fallback]] of Object.entries(TOKENS) as [keyof typeof TOKENS, readonly [string, string]][]) {
    out[k] = cs.getPropertyValue(name).trim() || fallback;
  }
  return out;
}

/** Drag out of a ruler (walk, /edit/:id): past 4px of travel the release point
 *  places a guide ACROSS the drag, and the click that follows is swallowed. */
function useRulerDrag(
  axis: "x" | "y",
  scale: number,
  onDragGuide: (position: number) => void,
): { onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void; dragged: React.MutableRefObject<boolean> } {
  const dragged = React.useRef(false);
  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      dragged.current = false;
      const rect = e.currentTarget.getBoundingClientRect();
      // Overlay origin: the top ruler starts RULER_SIZE in on x, the left ruler on y.
      const originX = axis === "x" ? rect.left : rect.left - RULER_SIZE;
      const originY = axis === "y" ? rect.top : rect.top - RULER_SIZE;
      const start = axis === "y" ? e.clientY : e.clientX;
      const move = (ev: MouseEvent) => {
        if (Math.abs((axis === "y" ? ev.clientY : ev.clientX) - start) > 4) dragged.current = true;
      };
      const up = (ev: MouseEvent) => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        if (Math.abs((axis === "y" ? ev.clientY : ev.clientX) - start) > 4) dragged.current = true;
        if (dragged.current) onDragGuide(axis === "y" ? (ev.clientY - originY) / scale : (ev.clientX - originX) / scale);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [axis, scale, onDragGuide],
  );
  return { onMouseDown, dragged };
}

/**
 * Horizontal ruler (top edge)
 */
const HorizontalRuler: React.FC<{
  width: number;
  zoom: number;
  onCreateGuide: (position: number) => void;
  onDragGuide: (position: number) => void;
}> = ({ width, zoom, onCreateGuide, onDragGuide }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = React.useState<number | null>(null);

  const scale = zoom / 100;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const COLORS = resolveColors(canvas);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = (width - RULER_SIZE) * dpr;
    canvas.height = RULER_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, RULER_SIZE);
    ctx.fillStyle = COLORS.edge;
    ctx.fillRect(0, RULER_SIZE - 1, width, 1);

    // Ticks
    ctx.fillStyle = COLORS.tick;
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";

    /* The overlay is already scaled with the page, so the ruler draws in page
       pixels: a tick every 10, labelled every 100. The canvas starts
       RULER_SIZE in, so page position p sits at canvas x p - RULER_SIZE. It
       used to scale again, which squeezed 0–1000 into the first third. */
    for (let p = MINOR_TICK * Math.ceil(RULER_SIZE / MINOR_TICK); p <= width; p += MINOR_TICK) {
      const isMajor = p % MAJOR_TICK === 0;
      const tickHeight = isMajor ? 10 : 5;
      const x = p - RULER_SIZE;
      ctx.fillRect(x, RULER_SIZE - tickHeight, 1, tickHeight);
      if (isMajor) {
        ctx.fillStyle = COLORS.number;
        ctx.fillText(String(p), x, 10);
        ctx.fillStyle = COLORS.tick;
      }
    }

    // Hover indicator (hoverPos is in screen pixels)
    if (hoverPos !== null) {
      ctx.fillStyle = COLORS.hover;
      ctx.fillRect(hoverPos / scale - 1, 0, 2, RULER_SIZE);
    }
  }, [width, zoom, scale, hoverPos]);

  const drag = useRulerDrag("y", scale, onDragGuide);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      // Guides are placed in overlay coordinates; the ruler starts RULER_SIZE in.
      const x = e.clientX - rect.left + RULER_SIZE;
      if (drag.dragged.current) {
        drag.dragged.current = false;
        return;
      }
      onCreateGuide(x / scale);
    },
    [scale, onCreateGuide, drag.dragged]
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
        /* The overlay group is pointer-events:none; without this a ruler click
           fell through to the page and no guide could ever be placed. */
        pointerEvents: "auto",
      }}
      onMouseDown={drag.onMouseDown}
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
  onDragGuide: (position: number) => void;
}> = ({ height, zoom, onCreateGuide, onDragGuide }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = React.useState<number | null>(null);

  const scale = zoom / 100;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const COLORS = resolveColors(canvas);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = RULER_SIZE * dpr;
    canvas.height = (height - RULER_SIZE) * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, RULER_SIZE, height);
    ctx.fillStyle = COLORS.edge;
    ctx.fillRect(RULER_SIZE - 1, 0, 1, height);

    // Ticks
    ctx.fillStyle = COLORS.tick;
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";

    for (let p = MINOR_TICK * Math.ceil(RULER_SIZE / MINOR_TICK); p <= height; p += MINOR_TICK) {
      const isMajor = p % MAJOR_TICK === 0;
      const tickWidth = isMajor ? 10 : 5;
      const y = p - RULER_SIZE;
      ctx.fillRect(RULER_SIZE - tickWidth, y, tickWidth, 1);
      if (isMajor) {
        ctx.save();
        ctx.translate(10, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = COLORS.number;
        ctx.textAlign = "left";
        ctx.fillText(String(p), 2, 0);
        ctx.restore();
        ctx.fillStyle = COLORS.tick;
      }
    }

    // Hover indicator (hoverPos is in screen pixels)
    if (hoverPos !== null) {
      ctx.fillStyle = COLORS.hover;
      ctx.fillRect(0, hoverPos / scale - 1, RULER_SIZE, 2);
    }
  }, [height, zoom, scale, hoverPos]);

  const drag = useRulerDrag("x", scale, onDragGuide);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top + RULER_SIZE;
      if (drag.dragged.current) {
        drag.dragged.current = false;
        return;
      }
      onCreateGuide(y / scale);
    },
    [scale, onCreateGuide, drag.dragged]
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
        /* The overlay group is pointer-events:none; without this a ruler click
           fell through to the page and no guide could ever be placed. */
        pointerEvents: "auto",
      }}
      onMouseDown={drag.onMouseDown}
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
  /* The top ruler measures x, so a click on it places a VERTICAL guide at
     that x; the left ruler places a horizontal one. They were crossed: a
     top-ruler click at x=200 drew a horizontal line 200px down. */
  const handleHorizontalGuide = React.useCallback(
    (position: number) => onCreateGuide("vertical", position),
    [onCreateGuide]
  );

  const handleVerticalGuide = React.useCallback(
    (position: number) => onCreateGuide("horizontal", position),
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
          background: "var(--bk-bg-panel)",
          borderRight: "1px solid var(--bk-border)",
          borderBottom: "1px solid var(--bk-border)",
          boxSizing: "border-box",
          zIndex: Z_LAYERS.rulers + 1, // Corner above ruler lines
        }}
      />

      {/* Horizontal ruler (top) */}
      <HorizontalRuler width={canvasSize.width / (zoom / 100)} zoom={zoom} onCreateGuide={handleHorizontalGuide} onDragGuide={handleVerticalGuide} />

      {/* Vertical ruler (left) */}
      <VerticalRuler height={canvasSize.height / (zoom / 100)} zoom={zoom} onCreateGuide={handleVerticalGuide} onDragGuide={handleHorizontalGuide} />
    </>
  );
};

export default RulersOverlay;
