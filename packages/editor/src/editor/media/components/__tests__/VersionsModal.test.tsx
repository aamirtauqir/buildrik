/**
 * Clone contracts for the Asset versions dialog — Figma page "Editor v1
 * Clone", 3695:45529 ("Assets · versions"), 3697:20326 ("original selected")
 * and 3697:20341 ("v2 applied"). Phase 6, section 4184:26629.
 *
 * The model: a saved edit is a row of its own, flagged with its parent; the
 * parent's src stays the original. "Applied" is a fact about the site, not
 * the row — a version is applied when placements carry its src.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { VersionEntry } from "../../../sidebar/tabs/media/data/mediaTypes";
import { makeItem } from "../../__tests__/libraryFixture";
import { VersionsModal } from "../VersionsModal";

const EDITS = {
  width: 2400,
  height: 1600,
  crop: "Free",
  preset: "None",
  format: "Original",
  transform: "Original",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

const hero = makeItem({ key: "hero", name: "hero-dark", displayName: "hero-dark.jpg", src: "blob:hero", width: 2400, height: 1600 });
const heroV2 = makeItem({
  key: "hero-v2",
  name: "hero-dark-v2",
  displayName: "hero-dark-v2.jpg",
  src: "blob:hero-v2",
  width: 2400,
  height: 1600,
  versionOf: "hero",
  edits: EDITS,
});

function entry(item: VersionEntry["item"], index: number, placements = 0, pages: string[] = []): VersionEntry {
  return { item, index, placements, pages };
}

/** 3695:45529 — v1 on Home and Menu, v2 saved but not applied. */
const NOT_APPLIED = [entry(hero, 1, 3, ["Home", "Menu"]), entry(heroV2, 2)];
/** 3697:20341 — v2 applied to the same three placements. */
const APPLIED = [entry(hero, 1), entry(heroV2, 2, 3, ["Home", "Menu"])];

function mount(versions: VersionEntry[], over: Partial<React.ComponentProps<typeof VersionsModal>> = {}) {
  const props = {
    open: true,
    versions,
    onClose: vi.fn(),
    onEditLatest: vi.fn(),
    onApplyLatest: vi.fn(),
    ...over,
  };
  const utils = render(<VersionsModal {...props} />);
  return { ...utils, props };
}

const card = (key: string) => screen.getByTestId(`versions-card-${key}`);

describe("Clone 3695:45529 · Asset versions", () => {
  it("titles itself and names the file with the original retained", () => {
    mount(NOT_APPLIED);
    expect(screen.getByTestId("versions-title")).toHaveTextContent("Asset versions");
    expect(screen.getByTestId("versions-subtitle")).toHaveTextContent("hero-dark.jpg · Original retained");
  });

  it("lists one card per version, newest first: v2 · Latest saved · 2400 × 1600 over v1 · Original · 2400 × 1600", () => {
    mount(NOT_APPLIED);
    const heads = within(screen.getByTestId("versions-list"))
      .getAllByTestId(/^versions-card-head-/)
      .map((el) => el.textContent);
    expect(heads).toEqual(["v2 · Latest saved · 2400 × 1600", "v1 · Original · 2400 × 1600"]);
  });

  it("says where each version stands: the saved one 'Not applied to site', the original 'Currently used on Home and Menu · 3 placements'", () => {
    mount(NOT_APPLIED);
    expect(screen.getByTestId("versions-card-state-hero-v2")).toHaveTextContent("Not applied to site");
    expect(screen.getByTestId("versions-card-state-hero")).toHaveTextContent("Currently used on Home and Menu · 3 placements");
  });

  it("prints the saved edits under the version, in two lines", () => {
    mount(NOT_APPLIED);
    const lines = within(card("hero-v2")).getAllByTestId(/^versions-card-edits-/).map((el) => el.textContent);
    expect(lines).toEqual(["Crop: Free · Preset: None · Format: Original", "Brightness: 0 · Contrast: 0 · Saturation: 0 · Blur: 0"]);
    expect(within(card("hero")).queryByTestId(/^versions-card-edits-/)).toBeNull();
  });

  it("a version saved without a snapshot prints no edit lines rather than inventing 'Original'", () => {
    mount([entry(hero, 1, 1, ["Home"]), entry({ ...heroV2, edits: undefined }, 2)]);
    expect(within(card("hero-v2")).queryByTestId(/^versions-card-edits-/)).toBeNull();
  });

  it("the latest saved card is selected on open; clicking the original moves the selection (3697:20326)", () => {
    mount(NOT_APPLIED);
    expect(card("hero-v2")).toHaveAttribute("data-selected", "true");
    expect(card("hero")).not.toHaveAttribute("data-selected");
    fireEvent.click(card("hero"));
    expect(card("hero")).toHaveAttribute("data-selected", "true");
    expect(card("hero-v2")).not.toHaveAttribute("data-selected");
  });

  it("foots Close · Edit latest saved version · Apply latest saved version (primary), each wired to the latest saved row", () => {
    const { props } = mount(NOT_APPLIED);
    const foot = within(screen.getByTestId("versions-foot"));
    expect(foot.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual([
      "Close",
      "Edit latest saved version",
      "Apply latest saved version",
    ]);
    fireEvent.click(screen.getByTestId("versions-edit-latest"));
    expect(props.onEditLatest).toHaveBeenCalledWith(heroV2);
    fireEvent.click(screen.getByTestId("versions-apply-latest"));
    expect(props.onApplyLatest).toHaveBeenCalledWith(heroV2);
    fireEvent.click(screen.getByTestId("versions-close"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("one placement reads singular", () => {
    mount([entry(hero, 1, 1, ["Home"]), entry(heroV2, 2)]);
    expect(screen.getByTestId("versions-card-state-hero")).toHaveTextContent("Currently used on Home · 1 placement");
  });
});

describe("Clone 3697:20341 · Asset versions · v2 applied", () => {
  it("the applied version reads 'Applied to site · 3 placements' and the original 'Not on site'", () => {
    mount(APPLIED);
    expect(screen.getByTestId("versions-card-state-hero-v2")).toHaveTextContent("Applied to site · 3 placements");
    expect(screen.getByTestId("versions-card-state-hero")).toHaveTextContent("Not on site");
  });

  it("Apply latest saved version is disabled once the latest is the one on the site", () => {
    mount(APPLIED);
    expect(screen.getByTestId("versions-apply-latest")).toBeDisabled();
    expect(screen.getByTestId("versions-edit-latest")).toBeEnabled();
  });

  it("stays enabled while any placement still carries an older version", () => {
    mount([entry(hero, 1, 1, ["Menu"]), entry(heroV2, 2, 2, ["Home"])]);
    expect(screen.getByTestId("versions-apply-latest")).toBeEnabled();
  });
});

describe("Asset versions · three versions", () => {
  const heroV3 = makeItem({ key: "hero-v3", name: "hero-dark-v3", src: "blob:hero-v3", width: 1200, height: 800, versionOf: "hero" });

  it("v3 is the latest saved, v2 a plain saved version, v1 the original — newest first", () => {
    mount([entry(hero, 1, 3, ["Home"]), entry(heroV2, 2), entry(heroV3, 3)]);
    const heads = screen.getAllByTestId(/^versions-card-head-/).map((el) => el.textContent);
    expect(heads).toEqual(["v3 · Latest saved · 1200 × 800", "v2 · Saved · 2400 × 1600", "v1 · Original · 2400 × 1600"]);
    expect(card("hero-v3")).toHaveAttribute("data-selected", "true");
  });

  it("the footer's edit and apply target v3", () => {
    const { props } = mount([entry(hero, 1, 3, ["Home"]), entry(heroV2, 2), entry(heroV3, 3)]);
    fireEvent.click(screen.getByTestId("versions-apply-latest"));
    expect(props.onApplyLatest).toHaveBeenCalledWith(heroV3);
  });
});
