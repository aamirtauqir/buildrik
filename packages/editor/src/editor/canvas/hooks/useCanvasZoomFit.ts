/**
 * Canvas zoom: Fit vs a fixed percent, remembered per site (L1-012, owner
 * 2026-10-10).
 *
 * - Fit = the frame's WIDTH scaled into the column when it is wider than the
 *   column, else 100% — a fit never enlarges the page.
 * - With no remembered choice the canvas opens in Fit.
 * - Choosing Fit (footer row, ⌘1, palette) keeps the canvas fitted: column
 *   resizes, panels opening, a breakpoint or custom-width switch all re-fit.
 * - Choosing any percent (rows, ⌘0/⌘=/⌘-, zoom to selection, palette) pins
 *   that percent until Fit is chosen again. Switching breakpoint then keeps
 *   the percent: zoom and viewport width stay independent.
 *
 * The choice lives in this browser per site, the way other per-site view
 * preferences do; it is a view setting, not site data.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";

/** Gutter each side of a fitted frame (boards 5936:44788 / 4428:44164). */
export const FIT_GUTTER = 60;

export type ZoomPreference = "fit" | number;

const KEY_PREFIX = "bk-canvas-zoom:";

/** The Fit percent: frame width into the column, never above 100. */
export function computeFitZoom(frameWidth: number, viewportWidth: number): number {
  if (frameWidth <= 0 || viewportWidth <= 0) return 100;
  if (frameWidth <= viewportWidth - FIT_GUTTER * 2) return 100;
  return Math.max(10, Math.min(100, Math.floor(((viewportWidth - FIT_GUTTER * 2) / frameWidth) * 100)));
}

export function readZoomPreference(siteId: string | null): ZoomPreference {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + (siteId ?? "local"));
    if (raw === null || raw === "fit") return "fit";
    const n = Number(raw);
    return Number.isFinite(n) && n >= 10 && n <= 500 ? n : "fit";
  } catch {
    return "fit";
  }
}

export function writeZoomPreference(siteId: string | null, pref: ZoomPreference): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + (siteId ?? "local"), String(pref));
  } catch {
    /* Storage blocked (private mode): the choice lasts this session only. */
  }
}

interface Options {
  composer: Composer | null | undefined;
  /** Current zoom percent (the prop the canvas paints from). */
  zoom: number;
  /** Declared frame width in CSS px — not offsetWidth, which lags the
   *  width transition on a breakpoint switch. */
  frameWidth: number;
  scrollRef: React.RefObject<HTMLElement | null>;
  /** The project has loaded and the frame is laid out. */
  ready: boolean;
  siteId: string | null;
}

export function useCanvasZoomFit({ composer, zoom, frameWidth, scrollRef, ready, siteId }: Options): () => void {
  const prefRef = React.useRef<ZoomPreference>("fit");
  const lastFitRef = React.useRef<number | null>(null);
  const appliedRef = React.useRef(false);
  const prevZoomRef = React.useRef(zoom);
  const frameWidthRef = React.useRef(frameWidth);
  frameWidthRef.current = frameWidth;
  const readyRef = React.useRef(ready);
  readyRef.current = ready;

  const applyFit = React.useCallback(() => {
    const viewport = scrollRef.current;
    if (!composer || !viewport) return;
    const next = computeFitZoom(frameWidthRef.current, viewport.clientWidth);
    lastFitRef.current = next;
    composer.setZoom(next);
  }, [composer, scrollRef]);

  /* First paint after load: the remembered choice, else Fit. Waits for the
     column to have a width — a fit against 0 would be a fit to nothing. */
  const applyInitial = React.useCallback(() => {
    if (appliedRef.current || !readyRef.current || !composer || !scrollRef.current?.clientWidth) return;
    appliedRef.current = true;
    prefRef.current = readZoomPreference(siteId);
    if (prefRef.current === "fit") applyFit();
    else composer.setZoom(prefRef.current);
  }, [composer, scrollRef, siteId, applyFit]);

  React.useEffect(() => {
    applyInitial();
  }, [ready, applyInitial]);

  /* A zoom CHANGE that Fit did not produce is an explicit percent: pin it.
     Only a change counts — the render that applies the first fit still
     carries the old zoom, and that is not a choice. */
  React.useEffect(() => {
    const changed = Math.round(prevZoomRef.current) !== Math.round(zoom);
    prevZoomRef.current = zoom;
    if (!appliedRef.current || !changed) return;
    if (prefRef.current === "fit" && Math.round(zoom) === lastFitRef.current) return;
    prefRef.current = Math.round(zoom);
    writeZoomPreference(siteId, prefRef.current);
  }, [zoom, siteId]);

  /* The frame changed width (breakpoint, custom width): re-fit in Fit. */
  React.useEffect(() => {
    if (appliedRef.current && prefRef.current === "fit") applyFit();
  }, [frameWidth, applyFit]);

  /* The column changed width (window, side panels): re-fit in Fit. */
  React.useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (!appliedRef.current) applyInitial();
      else if (prefRef.current === "fit") applyFit();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [scrollRef, applyFit, applyInitial, ready]);

  /** Fit, chosen explicitly: remember it and keep fitting. */
  return React.useCallback(() => {
    appliedRef.current = true;
    prefRef.current = "fit";
    writeZoomPreference(siteId, "fit");
    applyFit();
  }, [siteId, applyFit]);
}
