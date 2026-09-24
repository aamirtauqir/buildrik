/**
 * G3-022 — the drawer hub's alt text Generate goes through the server's
 * alt-text model (AltTextService, via `onGenerateAltText`) and shows its
 * states: generating (6623:149646), failed + Retry (6623:150370), filled →
 * Regenerate (4418:61698). It used to call a local file-name prompt and stay
 * silently manual when that failed.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { AssetDetailOverlay } from "../AssetDetailOverlay";
import type { LibraryItem } from "../../data/mediaTypes";

const base: LibraryItem = {
  key: "a1",
  name: "hero",
  type: "img",
  src: "https://cdn.example/hero.png",
  size: 100,
  createdAt: "2026-01-01T00:00:00.000Z",
  mimeType: "image/png",
  assetId: "a1",
};

function mount(item: LibraryItem, onGenerateAltText: React.ComponentProps<typeof AssetDetailOverlay>["onGenerateAltText"]) {
  return render(
    <ToastProvider>
      <AssetDetailOverlay item={item} onClose={vi.fn()} onGenerateAltText={onGenerateAltText} />
    </ToastProvider>,
  );
}

describe("AssetDetailOverlay — G3-022 alt text Generate", () => {
  it("empty → '✨ Generate'; filled → 'Regenerate'", () => {
    const { unmount } = mount(base, vi.fn());
    expect(screen.getByTestId("media-alt-generate")).toHaveTextContent("Generate");
    expect(screen.getByTestId("media-alt-generate")).not.toHaveTextContent("Regenerate");
    unmount();
    mount({ ...base, altText: "A plate of pasta" }, vi.fn());
    expect(screen.getByTestId("media-alt-generate")).toHaveTextContent("Regenerate");
  });

  it("shows 'Generating…' while the model runs, and hands the asset over", async () => {
    let resolve!: (v: { altText: string; skipped: boolean }) => void;
    const gen = vi.fn(() => new Promise<{ altText: string; skipped: boolean }>((r) => { resolve = r; }));
    mount(base, gen);
    fireEvent.click(screen.getByTestId("media-alt-generate"));
    expect(gen).toHaveBeenCalledWith(base);
    expect(screen.getByTestId("media-alt-generate")).toHaveTextContent("Generating…");
    expect(screen.getByLabelText("Alt text")).toHaveAttribute("placeholder", "Generating alt text…");
    await act(async () => resolve({ altText: "Chef plating pasta", skipped: false }));
    expect(screen.getByLabelText("Alt text")).toHaveValue("Chef plating pasta");
  });

  it("a failure is visible, with Retry — never silently manual", async () => {
    const gen = vi.fn(async () => null);
    mount(base, gen);
    await act(async () => { fireEvent.click(screen.getByTestId("media-alt-generate")); });
    expect(screen.getByLabelText("Alt text")).toHaveAttribute(
      "placeholder",
      "Couldn't generate alt text — write it or retry",
    );
    expect(screen.getByTestId("media-alt-generate")).toHaveTextContent("Retry");
    await act(async () => { fireEvent.click(screen.getByTestId("media-alt-generate")); });
    expect(gen).toHaveBeenCalledTimes(2);
  });
});
