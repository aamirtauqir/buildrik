/**
 * Viewport — device presets, zoom clamping, iframe frame lifecycle,
 * content injection, and the breakpoint/zoom event contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Viewport } from "../Viewport";
import { EVENTS, THRESHOLDS } from "@/shared/constants";
import type { Composer } from "../Composer";

let composer: { emit: ReturnType<typeof vi.fn>; exportHTML: ReturnType<typeof vi.fn> };
let viewport: Viewport;
let container: HTMLElement;

function frame(): HTMLIFrameElement {
  return container.querySelector("iframe") as HTMLIFrameElement;
}

beforeEach(() => {
  composer = {
    emit: vi.fn(),
    exportHTML: vi.fn(() => ({ html: "<p>refreshed</p>", css: "p{color:red}", combined: "" })),
  };
  viewport = new Viewport(composer as unknown as Composer);
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  viewport.destroy();
  container.remove();
});

describe("initialize", () => {
  it("creates the viewport iframe inside the container with desktop sizing", () => {
    viewport.initialize(container);

    const f = frame();
    expect(f).toBeTruthy();
    expect(f.className).toBe("buildrick-viewport-frame");
    expect(f.style.width).toBe("100%");
    expect(f.style.height).toBe("100%");
  });
});

describe("setDevice", () => {
  beforeEach(() => viewport.initialize(container));

  it("applies the device pixel size and emits breakpoint:changed", () => {
    viewport.setDevice("tablet");

    expect(viewport.getDevice()).toBe("tablet");
    expect(frame().style.width).toBe("768px");
    expect(frame().style.height).toBe("1024px");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.BREAKPOINT_CHANGED, "tablet");
  });

  it("desktop uses 100% dimensions", () => {
    viewport.setDevice("mobile");
    viewport.setDevice("desktop");

    expect(frame().style.width).toBe("100%");
    expect(frame().style.height).toBe("100%");
  });

  it("a wide device with no height falls back to 100% height", () => {
    viewport.setDevice("wide");
    expect(frame().style.width).toBe("1920px");
    expect(frame().style.height).toBe("100%");
  });

  it("setting the same device again does not re-emit", () => {
    viewport.setDevice("mobile");
    composer.emit.mockClear();

    viewport.setDevice("mobile");

    expect(composer.emit).not.toHaveBeenCalled();
  });
});

describe("setZoom", () => {
  beforeEach(() => viewport.initialize(container));

  it("applies scale transform and emits viewport:zoom", () => {
    viewport.setZoom(150);

    expect(viewport.getZoom()).toBe(150);
    expect(frame().style.transform).toBe("scale(1.5)");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.VIEWPORT_ZOOM, 150);
  });

  it("clamps to the ZOOM_MIN/ZOOM_MAX thresholds", () => {
    viewport.setZoom(1);
    expect(viewport.getZoom()).toBe(THRESHOLDS.ZOOM_MIN);

    viewport.setZoom(99999);
    expect(viewport.getZoom()).toBe(THRESHOLDS.ZOOM_MAX);
  });

  it("zoom survives a device switch (re-applied by applyDeviceSize)", () => {
    viewport.setZoom(200);
    viewport.setDevice("mobile");
    expect(frame().style.transform).toBe("scale(2)");
  });
});

describe("device registry", () => {
  it("getDevices returns a copy — mutating it does not affect the viewport", () => {
    const devices = viewport.getDevices();
    delete (devices as Record<string, unknown>).desktop;
    expect(viewport.getDeviceConfig("desktop")).toEqual({ name: "Desktop", width: 1280 });
  });

  it("addDevice registers a custom device config", () => {
    viewport.addDevice("kiosk", { name: "Kiosk", width: 1080, height: 1920 });
    expect(viewport.getDevices().kiosk).toEqual({ name: "Kiosk", width: 1080, height: 1920 });
  });
});

describe("content injection", () => {
  beforeEach(() => viewport.initialize(container));

  it("setContent writes html + css into the iframe document", () => {
    viewport.setContent("<h1>Hi</h1>", "h1{font-size:2rem}");

    const doc = viewport.getDocument();
    expect(doc?.body.querySelector("h1")?.textContent).toBe("Hi");
    expect(doc?.head.querySelector("style")?.textContent).toContain("h1{font-size:2rem}");
    expect(viewport.getBody()?.querySelector("h1")).toBeTruthy();
    expect(viewport.getWindow()).toBeTruthy();
  });

  it("refresh pulls html/css from composer.exportHTML", () => {
    viewport.refresh();

    expect(composer.exportHTML).toHaveBeenCalled();
    expect(viewport.getDocument()?.body.querySelector("p")?.textContent).toBe("refreshed");
  });

  it("setContent before initialize is a safe no-op", () => {
    const fresh = new Viewport(composer as unknown as Composer);
    expect(() => fresh.setContent("<p>x</p>")).not.toThrow();
    expect(fresh.getDocument()).toBeNull();
    expect(fresh.getBody()).toBeNull();
  });
});

describe("destroy", () => {
  it("removes the frame from the DOM and nulls accessors", () => {
    viewport.initialize(container);
    viewport.destroy();

    expect(container.querySelector("iframe")).toBeNull();
    expect(viewport.getDocument()).toBeNull();
    expect(viewport.getWindow()).toBeNull();
    expect(viewport.getBody()).toBeNull();
  });
});
