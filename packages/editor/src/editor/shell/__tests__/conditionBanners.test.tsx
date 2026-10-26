// @vitest-environment jsdom
/**
 * 2L9 page 07 condition banners: role raised (G19), workspace deletion
 * (G20/G21), new version with save-first reload (G23–G25), and a panel whose
 * code was replaced by a deploy (G27).
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalBannerSlot } from "../GlobalBannerSlot";
import {
  BANNER_ID,
  clearGlobalBanner,
  showNewVersionBanner,
  showRoleRaisedBanner,
  showWorkspaceDeletionBanner,
} from "../globalBanners";
import { reloadAfterSaving } from "../reloadAfterSaving";
import { PanelChunkBoundary, isChunkLoadError } from "../PanelChunkBoundary";

afterEach(() => {
  cleanup();
  act(() => Object.values(BANNER_ID).forEach(clearGlobalBanner));
});

describe("condition banners", () => {
  it("role raised: You can edit this site now · Reload to edit (G19)", () => {
    const reload = vi.fn();
    render(<GlobalBannerSlot />);
    act(() => showRoleRaisedBanner(reload));
    expect(screen.getByText("You can edit this site now.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reload to edit" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("workspace deletion: the owner can cancel (G20); others are told to ask the owner (G21)", () => {
    const at = new Date(2026, 10, 12);
    render(<GlobalBannerSlot />);
    act(() => showWorkspaceDeletionBanner(at, vi.fn()));
    expect(screen.getByText("This workspace will be deleted on 12 Nov. Publishing is off.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel deletion ↗" })).toBeTruthy();
    act(() => showWorkspaceDeletionBanner(at, null));
    expect(
      screen.getByText("This workspace will be deleted on 12 Nov. Publishing is off. Ask the owner to cancel it."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel deletion ↗" })).toBeNull();
  });

  it("new version: A new version of Buildrik is ready · Reload (G23)", () => {
    render(<GlobalBannerSlot />);
    act(() => showNewVersionBanner(vi.fn()));
    expect(screen.getByText("A new version of Buildrik is ready.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });
});

describe("reloadAfterSaving (G24 / G25)", () => {
  it("says it saves first, then reloads once the save lands", async () => {
    let land!: (v: "saved") => void;
    const reload = vi.fn();
    render(<GlobalBannerSlot />);
    let done!: Promise<void>;
    act(() => {
      done = reloadAfterSaving({ save: () => new Promise((r) => (land = r)), pageName: "Home", siteId: null, reload });
    });
    expect(screen.getByText("Saving first… then reloading on Home with your panels as they are.")).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
    await act(async () => {
      land("saved");
      await done;
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("a failed save stops the reload, says nothing was lost, and Stay puts it away", async () => {
    const reload = vi.fn();
    render(<GlobalBannerSlot />);
    await act(async () => {
      await reloadAfterSaving({ save: async () => "error", siteId: null, reload });
    });
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText("Couldn’t save, so we didn’t reload. Nothing was lost.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    await waitFor(() => expect(screen.queryByTestId("global-banner")).toBeNull());
  });
});

describe("PanelChunkBoundary (G27)", () => {
  function Throw({ error }: { error: Error }): React.ReactElement {
    throw error;
  }

  it("a chunk that is gone says the panel was updated, with Reload", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PanelChunkBoundary>
        <Throw error={new Error("Failed to fetch dynamically imported module: /assets/LayersTab-1a2b.js")} />
      </PanelChunkBoundary>,
    );
    expect(screen.getByText("This part of the editor was updated. Reload to use it.")).toBeTruthy();
    expect(screen.getByText("Everything else keeps working.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });

  it("any other error goes on to the boundary above", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    class Outer extends React.Component<{ children: React.ReactNode }, { caught: boolean }> {
      state = { caught: false };
      static getDerivedStateFromError() {
        return { caught: true };
      }
      render() {
        return this.state.caught ? <p>outer caught</p> : this.props.children;
      }
    }
    render(
      <Outer>
        <PanelChunkBoundary>
          <Throw error={new Error("boom")} />
        </PanelChunkBoundary>
      </Outer>,
    );
    expect(screen.getByText("outer caught")).toBeTruthy();
  });

  it("recognises the chunk-load errors browsers throw", () => {
    expect(isChunkLoadError(Object.assign(new Error("x"), { name: "ChunkLoadError" }))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });
});
