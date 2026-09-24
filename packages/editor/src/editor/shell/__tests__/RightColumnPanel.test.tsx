// @vitest-environment jsdom
/**
 * Re-walk 2026-09-24: opening Publish reloaded the whole project. The column's
 * lazy tab suspended past the studio to the dashboard's loader boundary, which
 * unmounted the editor. Opening a column panel must never unmount what is
 * around it — a skeleton while the chunk loads, a panel error if it throws.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { act, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RightColumnPanel } from "../RightColumnPanel";

afterEach(cleanup);

describe("RightColumnPanel", () => {
  it("a lazy panel that suspends does not unmount the editor around it", async () => {
    const mounts = vi.fn();
    const unmounts = vi.fn();
    function Editor({ children }: { children: React.ReactNode }) {
      React.useEffect(() => {
        mounts();
        return () => unmounts();
      }, []);
      return <div data-testid="editor">{children}</div>;
    }
    let resolve!: (m: { default: React.FC }) => void;
    const Lazy = React.lazy(() => new Promise<{ default: React.FC }>((r) => (resolve = r)));
    render(
      <React.Suspense fallback={<div data-testid="whole-editor-fallback" />}>
        <Editor>
          <RightColumnPanel>
            <Lazy />
          </RightColumnPanel>
        </Editor>
      </React.Suspense>,
    );
    expect(screen.getByTestId("editor")).toBeTruthy();
    expect(screen.queryByTestId("whole-editor-fallback")).toBeNull();
    await act(async () => resolve({ default: () => <div data-testid="publish-panel" /> }));
    expect(await screen.findByTestId("publish-panel")).toBeTruthy();
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(unmounts).not.toHaveBeenCalled();
  });

  it("a panel that throws shows a retryable panel error, not an editor crash", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom = () => {
      throw new Error("boom");
    };
    render(
      <div data-testid="editor">
        <RightColumnPanel>
          <Boom />
        </RightColumnPanel>
      </div>,
    );
    expect(screen.getByTestId("editor")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    err.mockRestore();
  });
});
