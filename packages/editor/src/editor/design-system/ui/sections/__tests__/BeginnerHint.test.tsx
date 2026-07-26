import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokensSection } from "../TokensSection";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import { DSModeProvider } from "../../../state/DSModeContext";
import { ToastProvider } from "@/editor/ui";

// document.fonts polyfill lives in test-setup.ts (jsdom-wide).

const wrap = (children: React.ReactNode, mode: "beginner" | "pro") => (
  <ToastProvider>
    <DSModeProvider initialMode={mode}>
      <TokenRegistryProvider projectId="beginner-hint-test">
        {children}
      </TokenRegistryProvider>
    </DSModeProvider>
  </ToastProvider>
);

beforeEach(() => localStorage.clear());

describe("TokensSection — beginner hint", () => {
  it("shows hint in beginner mode", () => {
    const { getByText } = render(wrap(<TokensSection />, "beginner"));
    expect(getByText(/Beginner mode hides token IDs/i)).toBeTruthy();
  });

  it("hides hint in pro mode", () => {
    const { queryByText } = render(wrap(<TokensSection />, "pro"));
    expect(queryByText(/Beginner mode hides token IDs/i)).toBeNull();
  });
});
