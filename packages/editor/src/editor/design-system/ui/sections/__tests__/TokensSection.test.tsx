import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokensSection } from "../TokensSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

// document.fonts polyfill lives in test-setup.ts (jsdom-wide).

const wrap = (children: React.ReactNode, mode: "beginner" | "pro" = "beginner") => (
  <ToastProvider>
    <DSModeProvider initialMode={mode}>
      <TokenRegistryProvider projectId="tokens-section-test">
        {children}
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

describe("TokensSection", () => {
  it("renders a card for each of the 14 token kinds", () => {
    const { container } = render(wrap(<TokensSection />));
    const cards = container.querySelectorAll("[data-token-kind-card]");
    expect(cards.length).toBe(14);
  });

  // T3: header content lives in the first <span> of each section's direct
  // child <button> as `{Title} · {count} TOKENS`. Extract the title prefix.
  function headerTitles(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll("[data-token-kind-card]"))
      .map((el) => {
        const text = el.querySelector(":scope > button > span")?.textContent ?? "";
        return text.split(" ·")[0];
      });
  }

  it("renders Color, Type, Spacing card titles in the headers", () => {
    const { container } = render(wrap(<TokensSection />));
    const titles = headerTitles(container);
    expect(titles).toContain("Color");
    expect(titles).toContain("Type");
    expect(titles).toContain("Spacing");
  });

  it("renders all 11 new kind card titles in the headers", () => {
    const { container } = render(wrap(<TokensSection />));
    const titles = headerTitles(container);
    const expected = [
      "Radius", "Shadow", "Motion", "Border",
      "Opacity", "Z-index", "Breakpoint", "Grid",
      "Sizing", "Icon", "Imagery",
    ];
    for (const title of expected) {
      expect(titles).toContain(title);
    }
  });

  // T3: prototype s02 accordion header format — mono uppercase + count + [+]/[-]
  describe("T3 accordion header format", () => {
    it("renders header label · count TOKENS plus glyph reflecting open state", () => {
      const { container } = render(wrap(<TokensSection />));
      const colorCard = container.querySelector('[data-token-kind-card="color"]');
      expect(colorCard).toBeTruthy();
      const button = colorCard!.querySelector("button");
      expect(button).toBeTruthy();
      // Count is registry-driven — assert format, not exact count.
      const text = button!.textContent ?? "";
      expect(text).toMatch(/Color · \d+ TOKENS/);
      // Open by default → glyph is [−] (minus sign).
      expect(text).toContain("[−]");
      expect(button!.getAttribute("aria-expanded")).toBe("true");
    });

    it("toggles glyph and flips aria-expanded on header click", () => {
      const { container } = render(wrap(<TokensSection />));
      // Pick the Color card — header is the first direct-child button.
      const colorCard = container.querySelector('[data-token-kind-card="color"]') as HTMLElement;
      const headerButton = colorCard.querySelector(":scope > button") as HTMLButtonElement;
      // Capture initial state (may be open or closed depending on registry seed).
      const initialExpanded = headerButton.getAttribute("aria-expanded");
      const initialGlyph = initialExpanded === "true" ? "[−]" : "[+]";
      const toggledGlyph = initialExpanded === "true" ? "[+]" : "[−]";
      expect(headerButton.textContent).toContain(initialGlyph);
      fireEvent.click(headerButton);
      const toggledExpanded = initialExpanded === "true" ? "false" : "true";
      expect(headerButton.getAttribute("aria-expanded")).toBe(toggledExpanded);
      expect(headerButton.textContent).toContain(toggledGlyph);
    });

    it("applies monospace font-family to header via inline style", () => {
      const { container } = render(wrap(<TokensSection />));
      const card = container.querySelector('[data-token-kind-card="color"]') as HTMLElement;
      const button = card.querySelector(":scope > button") as HTMLButtonElement;
      // Inline style assertion — jsdom preserves the inline string verbatim.
      expect(button.style.fontFamily).toContain("var(--buildrick-font-family-mono");
      expect(button.style.textTransform).toBe("uppercase");
      expect(button.style.letterSpacing).toBe("0.08em");
    });

    it("renders all 14 sections with mono header + count format", () => {
      const { container } = render(wrap(<TokensSection />));
      const cards = container.querySelectorAll("[data-token-kind-card]");
      expect(cards.length).toBe(14);
      cards.forEach((card) => {
        const btn = card.querySelector(":scope > button") as HTMLButtonElement;
        expect(btn).toBeTruthy();
        expect(btn.style.fontFamily).toContain("mono");
        expect(btn.textContent).toMatch(/· \d+ TOKENS/);
        // Header must have either [+] or [−] glyph.
        expect(btn.textContent).toMatch(/\[[+−]\]/);
      });
    });
  });
});
