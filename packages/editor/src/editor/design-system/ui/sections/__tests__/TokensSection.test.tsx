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
      expect(button.style.fontFamily).toContain("var(--bk-font-mono");
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

  // B5-wire (2026-05-17): Beginner mode shows ONLY tokens with semanticKind
  // set. Pro mode shows all tokens (primitives + semantics). The seed
  // committed in v4 migration provides 4 semantic color tokens; Pro mode
  // exposes those plus the 4 primitives + the legacy 9 colors.
  describe("B5-wire — mode-driven token filter", () => {
    function colorRowIds(container: HTMLElement): string[] {
      const colorCard = container.querySelector('[data-token-kind-card="color"]') as HTMLElement;
      // Inline color tokens use data-token-id; generic kinds use data-token-row.
      const rows = colorCard.querySelectorAll("[data-token-id],[data-token-row]");
      const ids: string[] = [];
      rows.forEach((row) => {
        const id = row.getAttribute("data-token-id") ?? row.getAttribute("data-token-row");
        if (id) ids.push(id);
      });
      return ids;
    }

    it("Beginner mode shows only color tokens carrying semanticKind", () => {
      const { container } = render(wrap(<TokensSection />, "beginner"));
      const ids = colorRowIds(container);
      // 4 semantic seeds — present.
      expect(ids).toContain("color-action");
      expect(ids).toContain("color-surface");
      expect(ids).toContain("color-text-primary");
      expect(ids).toContain("color-feedback-error");
      // Primitive seeds + legacy primitives — absent.
      expect(ids).not.toContain("color-blue-500");
      expect(ids).not.toContain("color-primary");
      expect(ids).not.toContain("color-error");
    });

    it("Pro mode shows both primitives and semantics", () => {
      const { container } = render(wrap(<TokensSection />, "pro"));
      const ids = colorRowIds(container);
      // Semantics + primitives both present.
      expect(ids).toContain("color-action");
      expect(ids).toContain("color-blue-500");
      expect(ids).toContain("color-primary");
    });

    it("Beginner card count reflects filtered (semantic-only) count, not total", () => {
      const { container } = render(wrap(<TokensSection />, "beginner"));
      const colorCard = container.querySelector('[data-token-kind-card="color"]') as HTMLElement;
      const header = colorCard.querySelector(":scope > button") as HTMLButtonElement;
      // 4 semantic colors seeded — count must show 4 in Beginner.
      expect(header.textContent).toMatch(/Color · 4 TOKENS/);
    });

    it("Pro card count reflects total (semantic + primitive + legacy) count", () => {
      const { container } = render(wrap(<TokensSection />, "pro"));
      const colorCard = container.querySelector('[data-token-kind-card="color"]') as HTMLElement;
      const header = colorCard.querySelector(":scope > button") as HTMLButtonElement;
      // 9 legacy + 4 v4 primitives + 4 v4 semantics = 17 in Pro.
      expect(header.textContent).toMatch(/Color · 17 TOKENS/);
    });
  });
});
