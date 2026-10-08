/**
 * The live preview card's Light / Dark switch — controlled and preview-only
 * (L4-021). The workspace's wiring to the preview layer is pinned in
 * BrandWorkspace.previewSwitch.test.tsx.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ColorModeToggle } from "../ColorModeToggle";

describe("ColorModeToggle (2-pill seg, preview-only)", () => {
  it("renders a role=tablist container with aria-label 'Color mode' and two tabs", () => {
    const u = render(<ColorModeToggle theme="light" onChange={vi.fn()} siteOff={false} />);
    const list = u.getByRole("tablist");
    expect(list.getAttribute("aria-label")).toBe("Color mode");
    expect(u.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Light", "Dark"]);
  });

  it("marks the shown theme selected", () => {
    const u = render(<ColorModeToggle theme="dark" onChange={vi.fn()} siteOff={false} />);
    expect(u.getByTestId("brand-colour-mode-seg-dark").getAttribute("aria-selected")).toBe("true");
    expect(u.getByTestId("brand-colour-mode-seg-light").getAttribute("aria-selected")).toBe("false");
  });

  it("asks the owner for the other theme; it writes nothing itself", () => {
    const onChange = vi.fn();
    const u = render(<ColorModeToggle theme="light" onChange={onChange} siteOff={false} />);
    fireEvent.click(u.getByTestId("brand-colour-mode-seg-dark"));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("Off site: Dark is disabled with the board's hint (8224:241285)", () => {
    const u = render(<ColorModeToggle theme="light" onChange={vi.fn()} siteOff />);
    const dark = u.getByTestId("brand-colour-mode-seg-dark") as HTMLButtonElement;
    expect(dark.disabled).toBe(true);
    expect(dark.getAttribute("title")).toBe("Dark mode is off for this site");
  });

  it("locked while another flow previews: both segments wait", () => {
    const u = render(<ColorModeToggle theme="light" onChange={vi.fn()} siteOff={false} locked />);
    expect((u.getByTestId("brand-colour-mode-seg-light") as HTMLButtonElement).disabled).toBe(true);
    expect((u.getByTestId("brand-colour-mode-seg-dark") as HTMLButtonElement).disabled).toBe(true);
  });
});
