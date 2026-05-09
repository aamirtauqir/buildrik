import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokensSection } from "../TokensSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/shared/vibcoder";

// jsdom lacks document.fonts; TypeTokenList probes it on mount.
beforeEach(() => {
  if (!(document as Document & { fonts?: unknown }).fonts) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { load: () => Promise.resolve([]) },
    });
  }
});

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

  function headerTitles(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll("[data-token-kind-card]"))
      .map((el) => el.querySelector("button > span")?.textContent ?? "");
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
});
