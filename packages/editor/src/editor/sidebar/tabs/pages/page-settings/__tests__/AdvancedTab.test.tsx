// @vitest-environment jsdom
/**
 * AdvancedTab — visibility radios, password box, indexing switches, head code.
 * Pure form renderer.
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
    password: "",
    setPassword: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    allowIndex: true,
    setAllowIndex: vi.fn(),
    allowFollow: true,
    setAllowFollow: vi.fn(),
    customHead: "",
    setCustomHead: vi.fn(),
    headCodeError: null,
    copyPassword: vi.fn(),
    domain: null,
    saveState: "clean",
    isDirty: false,
    save: vi.fn(),
    discard: vi.fn(),
    showDiscardConfirm: false,
    setShowDiscardConfirm: vi.fn(),
    pendingTabChange: null,
    confirmTabChange: vi.fn(),
    cancelTabChange: vi.fn(),
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

  it("calls setVisibility with the clicked value", () => {
    const s = makeSettings({ visibility: "live" });
    render(<AdvancedTab s={s} />);
    fireEvent.click(screen.getAllByRole("radio").find((r) => r.textContent === "Password")!);
    expect(s.setVisibility).toHaveBeenCalledWith("password");
  });

  it("shows the visibility helper text matching the current mode", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "hidden" })} />);
    expect(
      screen.getByText("Page is not linked in menus but reachable via direct URL.")
    ).toBeTruthy();
  });
});

// ── Password box ─────────────────────────────────────────────────────────────

describe("AdvancedTab password box", () => {
  it("is hidden unless visibility is password", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "live" })} />);
    expect(screen.queryByLabelText("Page access password")).toBeNull();
  });

  it("renders the password input when visibility is password", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "password", password: "secret" })} />);
    const input = screen.getByLabelText("Page access password") as HTMLInputElement;
    expect(input.value).toBe("secret");
  });

  it("masks the password (type=password) until Show is toggled", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "password", showPassword: false })} />);
    const input = screen.getByLabelText("Page access password") as HTMLInputElement;
    expect(input.getAttribute("type")).toBe("password");
  });

  it("reveals the password (type=text) when showPassword is true", () => {
    render(<AdvancedTab s={makeSettings({ visibility: "password", showPassword: true })} />);
    const input = screen.getByLabelText("Page access password") as HTMLInputElement;
    expect(input.getAttribute("type")).toBe("text");
  });

  it("Show button toggles showPassword", () => {
    const s = makeSettings({ visibility: "password", showPassword: false });
    render(<AdvancedTab s={s} />);
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(s.setShowPassword).toHaveBeenCalledWith(true);
  });

  it("Copy button is disabled with an empty password and calls copyPassword when enabled", () => {
    const empty = makeSettings({ visibility: "password", password: "" });
    const { rerender } = render(<AdvancedTab s={empty} />);
    const copyEmpty = screen.getByRole("button", { name: "Copy password" }) as HTMLButtonElement;
    expect(copyEmpty.disabled).toBe(true);

    const filled = makeSettings({ visibility: "password", password: "pw" });
    rerender(<AdvancedTab s={filled} />);
    const copyFilled = screen.getByRole("button", { name: "Copy password" }) as HTMLButtonElement;
    expect(copyFilled.disabled).toBe(false);
    fireEvent.click(copyFilled);
    expect(filled.copyPassword).toHaveBeenCalledTimes(1);
  });

  it("forwards password input to setPassword", () => {
    const s = makeSettings({ visibility: "password" });
    render(<AdvancedTab s={s} />);
    fireEvent.change(screen.getByLabelText("Page access password"), {
      target: { value: "hunter2" },
    });
    expect(s.setPassword).toHaveBeenCalledWith("hunter2");
  });
});

// ── Indexing switches ────────────────────────────────────────────────────────

describe("AdvancedTab indexing switches", () => {
  it("reflects allowIndex / allowFollow as switch checked state", () => {
    render(<AdvancedTab s={makeSettings({ allowIndex: true, allowFollow: false })} />);
    expect(
      (screen.getByRole("switch", { name: "Allow indexing" }) as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (screen.getByRole("switch", { name: "Follow links" }) as HTMLInputElement).checked
    ).toBe(false);
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
