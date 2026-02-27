/**
 * Aquibra Viewport
 * Manages the canvas viewport and device preview
 *
 * @module engine/Viewport
 * @license BSD-3-Clause
 */

import { EVENTS, THRESHOLDS } from "../shared/constants";
import type { DeviceType, DeviceConfig } from "../shared/types";
import { clamp } from "../shared/utils/helpers";
import type { Composer } from "./Composer";

/**
 * Viewport manager for canvas display
 */
export class Viewport {
  private composer: Composer;
  private currentDevice: DeviceType = "desktop";
  private zoom: number = 100;
  private container: HTMLElement | null = null;
  private frame: HTMLIFrameElement | null = null;

  private devices: Record<DeviceType, DeviceConfig> = {
    desktop: { name: "Desktop", width: 1920 },
    tablet: { name: "Tablet", width: 768, height: 1024 },
    mobile: { name: "Mobile", width: 375, height: 812 },
    watch: { name: "Watch", width: 196, height: 230 },
  };

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Initialize viewport with container
   */
  initialize(container: HTMLElement): void {
    this.container = container;
    this.createFrame();
    this.applyDeviceSize();
  }

  /**
   * Create the iframe for canvas
   */
  private createFrame(): void {
    if (!this.container) return;

    this.frame = document.createElement("iframe");
    this.frame.className = "aqb-viewport-frame";
    this.frame.style.cssText = `
      border: none;
      background: #fff;
      transition: width 0.3s ease, height 0.3s ease, transform 0.3s ease;
      transform-origin: top center;
    `;

    this.container.appendChild(this.frame);
  }

  /**
   * Set device type
   */
  setDevice(device: DeviceType): void {
    if (this.currentDevice !== device) {
      this.currentDevice = device;
      this.applyDeviceSize();
      this.composer.emit(EVENTS.BREAKPOINT_CHANGED, device);
    }
  }

  /**
   * Get current device
   */
  getDevice(): DeviceType {
    return this.currentDevice;
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.zoom = clamp(zoom, THRESHOLDS.ZOOM_MIN, THRESHOLDS.ZOOM_MAX);
    this.applyZoom();
    this.composer.emit(EVENTS.VIEWPORT_ZOOM, this.zoom);
  }

  /**
   * Get zoom level
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Apply device size to frame
   */
  private applyDeviceSize(): void {
    if (!this.frame) return;

    const config = this.devices[this.currentDevice];

    if (this.currentDevice === "desktop") {
      this.frame.style.width = "100%";
      this.frame.style.height = "100%";
    } else {
      this.frame.style.width = `${config.width}px`;
      this.frame.style.height = config.height ? `${config.height}px` : "100%";
    }

    this.applyZoom();
  }

  /**
   * Apply zoom to frame
   */
  private applyZoom(): void {
    if (!this.frame) return;

    const scale = this.zoom / 100;
    this.frame.style.transform = `scale(${scale})`;
  }

  /**
   * Get frame document
   */
  getDocument(): Document | null {
    return this.frame?.contentDocument || null;
  }

  /**
   * Get frame window
   */
  getWindow(): Window | null {
    return this.frame?.contentWindow || null;
  }

  /**
   * Get frame body
   */
  getBody(): HTMLElement | null {
    return this.frame?.contentDocument?.body || null;
  }

  /**
   * Set frame content
   */
  setContent(html: string, css?: string): void {
    const doc = this.getDocument();
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
          ${css || ""}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `);
    doc.close();
  }

  /**
   * Add device configuration
   */
  addDevice(id: string, config: DeviceConfig): void {
    (this.devices as Record<string, DeviceConfig>)[id] = config;
  }

  /**
   * Get all devices
   */
  getDevices(): Record<string, DeviceConfig> {
    return { ...this.devices };
  }

  /**
   * Get device config
   */
  getDeviceConfig(device: DeviceType): DeviceConfig {
    return this.devices[device];
  }

  /**
   * Refresh viewport
   */
  refresh(): void {
    const html = this.composer.exportHTML();
    this.setContent(html.html, html.css);
  }

  /**
   * Destroy viewport
   */
  destroy(): void {
    if (this.frame && this.frame.parentNode) {
      this.frame.parentNode.removeChild(this.frame);
    }
    this.frame = null;
    this.container = null;
  }
}
