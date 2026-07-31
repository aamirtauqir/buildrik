/**
 * Organisms — Shell frames still resident in editor/ui/ (Topbar/Drawer).
 *
 * Modal and CommandPalette moved to `chrome-ui/__tests__/Modal.test.tsx` +
 * `CommandPalette.test.tsx` (Task 6, flowbite big-bang) when those
 * components ported. "Shell frames" stays here until Topbar ports (a later
 * Task 6 batch) — it mixes Drawer/RightPanel/Rail (chrome-ui) with
 * Topbar/Footer (still editor/ui) composition checks.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Drawer, RightPanel, Rail, RailItem, Topbar, Footer } from "../index";

describe("Shell frames", () => {
  it("Drawer and RightPanel are labelled landmarks", () => {
    render(
      <>
        <Drawer title="Pages">rows</Drawer>
        <RightPanel title="Inspector">fields</RightPanel>
      </>,
    );
    expect(screen.getByRole("complementary", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Inspector" })).toBeTruthy();
  });

  it("Drawer grid layout is opt-in", () => {
    render(<Drawer title="Media" layout="grid">tiles</Drawer>);
    const body = screen.getByRole("complementary", { name: "Media" }).children[1];
    expect(body.className).toMatch(/tw:grid\b/);
  });

  it("Rail marks the open tool with aria-current", () => {
    render(
      <Rail>
        <RailItem icon="+" label="Insert" active />
        <RailItem icon="L" label="Layers" />
      </Rail>,
    );
    expect(screen.getByRole("navigation", { name: "Editor tools" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Insert" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: "Layers" }).getAttribute("aria-current")).toBeNull();
  });

  it("icon-only rail items keep an accessible name", () => {
    render(
      <Rail>
        <RailItem icon="+" label="Insert" showLabel={false} />
      </Rail>,
    );
    expect(screen.getByRole("button", { name: "Insert" })).toBeTruthy();
  });

  it("Topbar and Footer are banner and contentinfo landmarks", () => {
    render(
      <>
        <Topbar siteName="Bella Cucina" save="saved" />
        <Footer>bottom</Footer>
      </>,
    );
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });
});
