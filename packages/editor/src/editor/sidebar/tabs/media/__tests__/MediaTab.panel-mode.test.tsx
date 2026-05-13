/**
 * MediaTab panel-mode (S10) — verifies SlimLauncher mount + Maximize2 wires onOpenLibrary.
 * Plan §1.5: panel mode renders slim launcher; folders sidebar lives only in expanded mode.
 */

import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MediaTab } from "../MediaTab";
import { ToastProvider } from "@/editor/shared/vibcoder/Toast";

function withProviders(node: React.ReactNode) {
  return <ToastProvider>{node}</ToastProvider>;
}

function makeFakeComposer() {
  const noop = () => {};
  return {
    media: {
      getAssets: () => [],
      getFolders: () => [],
      getAllFolders: () => [],
      getIcons: () => [],
      getFonts: () => [],
      getStock: () => [],
      emitEvent: noop,
      on: noop,
      off: noop,
    },
    mediaOps: { insertMedia: () => null },
    elements: { getActivePage: () => null, on: noop, off: noop },
    on: noop,
    off: noop,
  } as never;
}

describe("MediaTab — 320px panel mode (S10 SlimLauncher)", () => {
  it("renders SlimLauncher (not full library) when onOpenLibrary is provided", () => {
    render(
      withProviders(
        <div style={{ width: 320 }}>
          <MediaTab composer={makeFakeComposer()} onOpenLibrary={vi.fn()} />
        </div>
      )
    );
    expect(screen.getByRole("heading", { name: /^media$/i })).toBeTruthy();
    expect(screen.getByLabelText(/open full library/i)).toBeTruthy();
    expect(screen.getByText(/your library is empty/i)).toBeTruthy();
    expect(screen.queryByText(/my folders/i)).toBeNull();
  });

  it("calls onOpenLibrary when Maximize button is clicked", async () => {
    const onOpenLibrary = vi.fn();
    render(
      withProviders(
        <MediaTab composer={makeFakeComposer()} onOpenLibrary={onOpenLibrary} />
      )
    );
    await userEvent.click(screen.getByLabelText(/open full library/i));
    expect(onOpenLibrary).toHaveBeenCalled();
  });
});
