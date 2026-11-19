/**
 * L2-020 (owner 2026-10-10): the master preview was a white well, so a
 * light-on-dark component ("Audit Feature Card": white text on a translucent
 * dark fill) showed an empty white box. The well now picks light or dark from
 * the picture itself, can be set by hand (Light · Dark · Transparency
 * checker), and never touches the component's saved styles.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MasterPreview, wellToneForPixels } from "../MasterPreview";
import type { ComponentDefinition } from "@/shared/types/components";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const px = (...rgba: number[][]) => new Uint8ClampedArray(rgba.flat());

describe("wellToneForPixels", () => {
  it("light content (white text) asks for a dark well", () => {
    expect(wellToneForPixels(px([255, 255, 255, 255], [250, 250, 250, 200], [0, 0, 0, 0]))).toBe("dark");
  });
  it("dark content asks for a light well", () => {
    expect(wellToneForPixels(px([10, 20, 30, 255], [40, 40, 40, 255]))).toBe("light");
  });
  it("a fully transparent picture has no opinion", () => {
    expect(wellToneForPixels(px([255, 255, 255, 0], [0, 0, 0, 0]))).toBeNull();
  });
});

const component = (over: Partial<ComponentDefinition> = {}): ComponentDefinition => ({
  id: "c1",
  name: "Feature card",
  masterTree: { id: "m1", type: "container" },
  createdAt: 1,
  updatedAt: 1,
  version: 1,
  thumbnail: "data:image/png;base64,AAAA",
  ...over,
});

describe("MasterPreview (L2-020)", () => {
  it("offers Auto, Light, Dark and Transparency checker, Auto first", () => {
    render(<MasterPreview component={component()} />);
    const select = screen.getByLabelText("Preview background") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["Auto", "Light", "Dark", "Transparency checker"]);
    expect(select.value).toBe("auto");
  });

  it("a manual choice paints the well, draws the checker, and is remembered for this component", () => {
    const { unmount } = render(<MasterPreview component={component()} />);
    const select = screen.getByLabelText("Preview background");
    fireEvent.change(select, { target: { value: "dark" } });
    expect(screen.getByTestId("component-preview")).toHaveAttribute("data-well", "dark");
    fireEvent.change(select, { target: { value: "checker" } });
    expect(screen.getByTestId("component-preview")).toHaveAttribute("data-well", "checker");
    expect(screen.getByTestId("component-preview-checker")).toBeTruthy();
    unmount();
    render(<MasterPreview component={component()} />);
    expect(screen.getByTestId("component-preview")).toHaveAttribute("data-well", "checker");
  });

  it("never writes to the component — the choice is a viewing preference", () => {
    const c = component();
    const before = JSON.stringify(c);
    render(<MasterPreview component={c} />);
    fireEvent.change(screen.getByLabelText("Preview background"), { target: { value: "dark" } });
    expect(JSON.stringify(c)).toBe(before);
  });

  it("no thumbnail: says so, and the background control stays out of the way", () => {
    render(<MasterPreview component={component({ thumbnail: undefined })} />);
    expect(screen.getByText("No preview yet")).toBeTruthy();
    expect(screen.queryByLabelText("Preview background")).toBeNull();
  });
});
