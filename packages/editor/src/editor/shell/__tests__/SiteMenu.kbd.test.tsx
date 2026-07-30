/**
 * F6 — the Version-history hint shows the chord that works on THIS platform.
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

async function historyHint(platform: string): Promise<string | null> {
  vi.resetModules();
  Object.defineProperty(navigator, "platform", { value: platform, configurable: true });
  const { SiteMenu } = await import("../SiteMenu");
  render(<SiteMenu onOpenHistory={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
  return screen.getByRole("menuitem", { name: /Version history/ }).textContent;
}

describe("F6 platform-aware history shortcut hint", () => {
  it("macOS shows ⌃H — ⌘H is the OS hide-window chord", async () => {
    expect(await historyHint("MacIntel")).toBe("Version history⌃H");
  });

  it("everywhere else shows Ctrl H", async () => {
    expect(await historyHint("Win32")).toBe("Version historyCtrl H");
  });
});
