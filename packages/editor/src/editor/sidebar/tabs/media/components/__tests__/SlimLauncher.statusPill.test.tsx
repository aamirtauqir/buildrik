/**
 * SlimLauncher status pill — boards 303:1997 / 303:2032.
 * The running media job names itself over the grid, takes no click, and a
 * pointerdown back in the drawer clears a pill the closed modal left behind.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { SlimLauncher } from "../SlimLauncher";
import type { Composer } from "@/engine/Composer";
import type { MediaBucket } from "../../data/mediaTypes";

function baseProps() {
  return {
    composer: {} as Composer,
    libraryItems: [],
    activeTypes: new Set() as ReadonlySet<MediaBucket>,
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    searchQuery: "",
    storage: { used: 0, total: 1e9 },
    uploadQueue: [],
    usageMap: new Map<string, number>(),
    onInsert: vi.fn(),
    onToggleType: vi.fn(),
    onSearchChange: vi.fn(),
    onUpload: vi.fn(),
    onOpenStock: vi.fn(),
  };
}

function mount(extra: Partial<React.ComponentProps<typeof SlimLauncher>> = {}) {
  return render(
    <ToastProvider>
      <SlimLauncher {...baseProps()} {...extra} />
    </ToastProvider>,
  );
}

describe("SlimLauncher — status pill", () => {
  it("renders nothing when no job is running", () => {
    mount();
    expect(screen.queryByTestId("media-status-pill")).toBeNull();
  });

  it("names the running job and announces it politely", () => {
    mount({ statusPill: "Optimising → WebP…" });
    const pill = screen.getByTestId("media-status-pill");
    expect(pill).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Optimising → WebP…")).toBeInTheDocument();
  });

  // The editor modal's open state lives outside this tab, so a cancelled edit
  // would strand the pill. The drawer is inert while the modal is up, so the
  // first pointerdown back here means the user has left it.
  it("a pointerdown in the drawer clears a stranded pill", () => {
    const onDismissStatusPill = vi.fn();
    mount({
      statusPill: "Image editor — crop · rotate · adjust",
      onDismissStatusPill,
    });
    fireEvent.pointerDown(screen.getByTestId("media-panel"));
    expect(onDismissStatusPill).toHaveBeenCalledTimes(1);
  });

  it("does not fire the dismiss handler when no pill is showing", () => {
    const onDismissStatusPill = vi.fn();
    mount({ onDismissStatusPill });
    fireEvent.pointerDown(screen.getByTestId("media-panel"));
    expect(onDismissStatusPill).not.toHaveBeenCalled();
  });
});
