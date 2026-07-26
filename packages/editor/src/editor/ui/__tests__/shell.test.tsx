/**
 * EditorShell — structural contract.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorShell, Topbar, Footer, Rail, RailItem, Drawer, RightPanel } from "../index";

function shell(extra: Partial<React.ComponentProps<typeof EditorShell>> = {}) {
  return render(
    <EditorShell
      topbar={<Topbar>Bella Cucina</Topbar>}
      rail={
        <Rail>
          <RailItem icon="+" label="Insert" active />
        </Rail>
      }
      footer={<Footer>Desktop · 100%</Footer>}
      {...extra}
    >
      <div>canvas</div>
    </EditorShell>,
  );
}

describe("EditorShell", () => {
  it("gives every screen the same landmarks", () => {
    shell();
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Editor tools" })).toBeTruthy();
    expect(screen.getByRole("main", { name: "Canvas" })).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it("keeps slot order stable when optional slots appear", () => {
    const { container } = shell({
      drawer: <Drawer title="Pages">rows</Drawer>,
      inspector: <RightPanel title="Inspector">fields</RightPanel>,
    });
    const band = container.querySelector(".bk-shell__band")!;
    const order = Array.from(band.children).map((c) => c.className.split(" ")[0]);
    expect(order).toEqual(["bk-rail", "bk-drawer", "bk-shell__canvas", "bk-right-panel"]);
  });

  it("renders without drawer or inspector — the canvas still holds the middle", () => {
    const { container } = shell();
    const band = container.querySelector(".bk-shell__band")!;
    expect(Array.from(band.children).map((c) => c.className.split(" ")[0])).toEqual([
      "bk-rail",
      "bk-shell__canvas",
    ]);
  });

  it("lets a full-page surface relabel the main region", () => {
    shell({ canvasLabel: "Site settings" });
    expect(screen.getByRole("main", { name: "Site settings" })).toBeTruthy();
  });
});
