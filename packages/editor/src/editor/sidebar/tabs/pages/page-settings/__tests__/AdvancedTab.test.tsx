// @vitest-environment jsdom
/**
 * AdvancedTab — visibility radios (Live · Hidden), indexing switches, head
 * code. Pure form renderer. Decision #21: Password is gone until the
 * published-site middleware exists; indexing / follow and head code stay.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import * as React from "react";
import { AdvancedTab } from "../AdvancedTab";
import type { UsePageSettingsReturn } from "../usePageSettings";

function makeSettings(over: Partial<UsePageSettingsReturn> = {}): UsePageSettingsReturn {
  return {
    activeTab: "advanced",
    setActiveTab: vi.fn(),
    publishedUrl: null,
    seoTitle: "",
    setSeoTitle: vi.fn(),
    seoDesc: "",
    setSeoDesc: vi.fn(),
    slug: "home",
    setSlug: vi.fn(),
    slugError: null,
    seoScore: 100,
    seoChecks: { titleSet: true, slugClean: true, indexingOn: true, descSet: true },
    ogTitle: "",
    setOgTitle: vi.fn(),
    ogDesc: "",
    setOgDesc: vi.fn(),
    ogImageUrl: null,
    setOgImageUrl: vi.fn(),
    visibility: "live",
    setVisibility: vi.fn(),
    allowIndex: true,
    setAllowIndex: vi.fn(),
    allowFollow: true,
    setAllowFollow: vi.fn(),
    customHead: "",
    setCustomHead: vi.fn(),
    headCodeError: null,
    domain: null,
    saveState: "clean",
    isDirty: false,
    save: vi.fn(),
    discard: vi.fn(),
    showDiscardConfirm: false,
    setShowDiscardConfirm: vi.fn(),
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

// ── Visibility ───────────────────────────────────────────────────────────────

describe("AdvancedTab visibility", () => {
  it("marks the current visibility radio as checked", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "hidden" })} />);
    const radios = screen.getAllByRole("radio");
    const hidden = radios.find((r) => r.textContent === "Hidden")!;
    const live = radios.find((r) => r.textContent === "Live")!;
    expect(hidden.getAttribute("aria-checked")).toBe("true");
    expect(live.getAttribute("aria-checked")).toBe("false");
  });

  it("offers Live and Hidden only — no Password (decision #21)", () => {
    render(<AdvancedTab s={makeSettings()} />);
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Live", "Hidden"]);
    expect(screen.queryByLabelText("Page access password")).toBeNull();
    expect(screen.queryByText(/password/i)).toBeNull();
  });

  it("calls setVisibility with the clicked value", () => {
    const s = makeSettings({ visibility: "live" });
    render(<AdvancedTab s={s} />);
    fireEvent.click(screen.getAllByRole("radio").find((r) => r.textContent === "Hidden")!);
    expect(s.setVisibility).toHaveBeenCalledWith("hidden");
  });

  it("shows the visibility helper text matching the current mode", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "hidden" })} />);
    expect(
      screen.getByText("Page is not linked in menus but reachable via direct URL.")
    ).toBeTruthy();
  });
});

// ── Indexing ─────────────────────────────────────────────────────────────────

describe("AdvancedTab indexing switches", () => {
  it("reflects allowIndex / allowFollow as switch checked state", () => {
    // flowbite's ToggleSwitch is a <button role="switch" aria-checked>, not
    // an <input> — the checked state lives in aria-checked now.
    render(<AdvancedTab s={makeSettings({ allowIndex: true, allowFollow: false })} />);
    expect(
      screen.getByRole("switch", { name: "Allow indexing" }).getAttribute("aria-checked")
    ).toBe("true");
    expect(
      screen.getByRole("switch", { name: "Follow links" }).getAttribute("aria-checked")
    ).toBe("false");
  });

  it("toggles allowIndex to the opposite of its current value", () => {
    const s = makeSettings({ allowIndex: true });
    render(<AdvancedTab s={s} />);
    fireEvent.click(screen.getByRole("switch", { name: "Allow indexing" }));
    expect(s.setAllowIndex).toHaveBeenCalledWith(false);
  });

  it("toggles allowFollow to the opposite of its current value", () => {
    const s = makeSettings({ allowFollow: false });
    render(<AdvancedTab s={s} />);
    fireEvent.click(screen.getByRole("switch", { name: "Follow links" }));
    expect(s.setAllowFollow).toHaveBeenCalledWith(true);
  });
});

// ── Custom head code ─────────────────────────────────────────────────────────

describe("AdvancedTab custom head code", () => {
  it("forwards head-code input to setCustomHead", () => {
    const s = makeSettings();
    render(<AdvancedTab s={s} />);
    fireEvent.change(screen.getByLabelText("Custom head code"), {
      target: { value: "<meta name='x'>" },
    });
    expect(s.setCustomHead).toHaveBeenCalledWith("<meta name='x'>");
  });

  it("shows the head-code error when headCodeError is set", () => {
    render(<AdvancedTab s={makeSettings({ headCodeError: "Unclosed HTML tag detected." })} />);
    expect(screen.getByText("Unclosed HTML tag detected.")).toBeTruthy();
  });

  it("does not render a head-code error when none is set", () => {
    render(<AdvancedTab s={makeSettings({ headCodeError: null })} />);
    expect(screen.queryByText(/Unclosed HTML tag/)).toBeNull();
  });
});
