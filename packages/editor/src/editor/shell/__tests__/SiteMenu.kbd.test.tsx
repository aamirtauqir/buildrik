/**
 * SC-12 / owner Q4 (R-1018b): Site settings has no shortcut — the row used
 * to print ⌃, (Ctrl , elsewhere). Checked on both platforms because `IS_MAC`
 * is computed at module scope, hence the resetModules dance.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const realPlatform = Object.getOwnPropertyDescriptor(Navigator.prototype, "platform");

afterEach(() => {
  cleanup();
  vi.resetModules();
  delete (navigator as unknown as Record<string, unknown>).platform;
  if (realPlatform) Object.defineProperty(Navigator.prototype, "platform", realPlatform);
});

async function settingsHint(platform: string): Promise<string | null> {
  vi.resetModules();
  Object.defineProperty(navigator, "platform", { value: platform, configurable: true });
  const { SiteMenu } = await import("../SiteMenu");
  render(<SiteMenu onOpenSiteSettings={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
  return screen.getByRole("menuitem", { name: /Site settings/ }).textContent;
}

describe("SC-12 / owner Q4: the Site settings row prints no chord", () => {
  it("macOS: no ⌃, — Site settings has no shortcut", async () => {
    expect(await settingsHint("MacIntel")).toBe("Site settings");
  });

  it("elsewhere: no Ctrl ,", async () => {
    expect(await settingsHint("Win32")).toBe("Site settings");
  });
});
