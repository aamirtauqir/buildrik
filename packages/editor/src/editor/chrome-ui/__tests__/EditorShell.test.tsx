/**
 * EditorShell — structural contract.
 *
 * Moved from `editor/ui/__tests__/shell.test.tsx` (Task 6, flowbite
 * big-bang) when EditorShell/Rail/Footer/RightPanel ported to chrome-ui.
 * Topbar and Drawer ported in a later Task 6 batch (Group B) — all six now
 * import from the local chrome-ui barrel, not the editor/ui bridge.
 *
 * Slot-order assertions were rewritten from raw `bk-*` classNames (deleted
 * with the CSS block) to tag-name structure — the semantics they were
 * actually protecting (rail/drawer/canvas/inspector order), not the
 * implementation classes.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorShell, Footer, Rail, RailItem, RightPanel, Topbar, Drawer } from "../index";

function shell(extra: Partial<React.ComponentProps<typeof EditorShell>> = {}) {
  return render(
    <EditorShell
      topbar={<Topbar siteName="Bella Cucina" save="saved" />}
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
    shell({
      drawer: <Drawer title="Pages">rows</Drawer>,
      inspector: <RightPanel title="Inspector">fields</RightPanel>,
    });
    const band = screen.getByRole("navigation", { name: "Editor tools" }).parentElement!;
    const order = Array.from(band.children).map((c) => c.tagName.toLowerCase());
    expect(order).toEqual(["nav", "aside", "main", "aside"]);
  });

  it("renders without drawer or inspector — the canvas still holds the middle", () => {
    shell();
    const band = screen.getByRole("navigation", { name: "Editor tools" }).parentElement!;
    expect(Array.from(band.children).map((c) => c.tagName.toLowerCase())).toEqual(["nav", "main"]);
  });

  it("lets a full-page surface relabel the main region", () => {
    shell({ canvasLabel: "Site settings" });
    expect(screen.getByRole("main", { name: "Site settings" })).toBeTruthy();
  });
});
