/**
 * F6/T9 — the Site-settings hint shows the chord that works on THIS platform.
 *
 * The handler (useEditorShortcuts) accepts ctrl OR meta everywhere, but ⌘H is
 * macOS's OS-level window-hide: the browser never sees it, so advertising it
 * is a lie. `IS_MAC` is computed at module scope, hence the resetModules dance.
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

describe("T9 platform-aware site-settings shortcut hint", () => {
  it("macOS shows ⌃, — ⌘, is the browser's Preferences chord", async () => {
    expect(await settingsHint("MacIntel")).toBe("Site settings⌃,");
  });

  it("everywhere else shows Ctrl ,", async () => {
    expect(await settingsHint("Win32")).toBe("Site settingsCtrl ,");
  });
});
