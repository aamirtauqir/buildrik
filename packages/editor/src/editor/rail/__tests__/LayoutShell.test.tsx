// @vitest-environment jsdom
/**
 * LayoutShell — slot rendering contract + drawer/inspector prop injection.
 *
 * The shell routes children by displayName into named grid regions (topbar,
 * rail, drawer, sidebar, canvas, inspector, fullpage, footer) and injects
 * open/overlay state into Drawer and Inspector via cloneElement inside a
 * useMemo, whose deps include `drawerPinned` — see the pin/unpin tests.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { LayoutShell } from "../LayoutShell";

afterEach(cleanup);

function renderFullShell(
  props: Partial<React.ComponentProps<typeof LayoutShell>> = {}
) {
  return render(
    <LayoutShell drawerOpen {...props}>
      <LayoutShell.TopBar>topbar-content</LayoutShell.TopBar>
      <LayoutShell.Rail>rail-content</LayoutShell.Rail>
      <LayoutShell.Drawer>drawer-content</LayoutShell.Drawer>
      <LayoutShell.Canvas>canvas-content</LayoutShell.Canvas>
      <LayoutShell.Inspector>inspector-content</LayoutShell.Inspector>
      <LayoutShell.Footer>footer-content</LayoutShell.Footer>
    </LayoutShell>
  );
}

describe("LayoutShell — slot rendering contract", () => {
  it("routes each named slot into its region element with the right role", () => {
    const { container } = renderFullShell();

    const topbar = container.querySelector(".layout-shell__topbar")!;
    expect(topbar.tagName).toBe("HEADER");
    expect(topbar.getAttribute("role")).toBe("banner");
    expect(topbar.textContent).toBe("topbar-content");

    const rail = container.querySelector(".layout-shell__rail")!;
    expect(rail.tagName).toBe("NAV");
    expect(rail.getAttribute("aria-label")).toBe("Primary navigation");
    expect(rail.textContent).toBe("rail-content");

    const drawer = container.querySelector(".layout-shell__drawer")!;
    expect(drawer.tagName).toBe("ASIDE");
    expect(drawer.getAttribute("role")).toBe("region");
    expect(drawer.getAttribute("aria-label")).toBe("Sidebar panel");
    expect(drawer.textContent).toBe("drawer-content");

    const canvas = container.querySelector(".layout-shell__canvas")!;
    expect(canvas.tagName).toBe("MAIN");
    expect(canvas.id).toBe("layout-canvas");
    expect(canvas.getAttribute("aria-label")).toBe("Design canvas");
    expect(canvas.textContent).toBe("canvas-content");

    const inspector = container.querySelector(".layout-shell__inspector")!;
    expect(inspector.tagName).toBe("ASIDE");
    expect(inspector.getAttribute("role")).toBe("complementary");
    expect(inspector.textContent).toBe("inspector-content");

    const footer = container.querySelector(".layout-shell__footer")!;
    expect(footer.tagName).toBe("FOOTER");
    expect(footer.getAttribute("role")).toBe("contentinfo");
    expect(footer.textContent).toBe("footer-content");
  });

  it("renders FullPage and Sidebar slots into their regions", () => {
    const { container } = render(
      <LayoutShell drawerOpen={false} fullPageMode>
        <LayoutShell.Sidebar>sidebar-content</LayoutShell.Sidebar>
        <LayoutShell.Canvas>canvas-content</LayoutShell.Canvas>
        <LayoutShell.FullPage>fullpage-content</LayoutShell.FullPage>
      </LayoutShell>
    );

    const sidebar = container.querySelector(".layout-shell__sidebar")!;
    expect(sidebar.tagName).toBe("ASIDE");
    expect(sidebar.getAttribute("aria-label")).toBe("Editor sidebar");
    expect(sidebar.textContent).toBe("sidebar-content");

    const fullPage = container.querySelector(".layout-shell__fullpage")!;
    expect(fullPage.getAttribute("aria-label")).toBe("Full-page view");
    expect(fullPage.textContent).toBe("fullpage-content");

    // Canvas stays mounted in fullpage mode (hidden via CSS visibility so
    // WebGL/iframe state is preserved — per the source header comment).
    expect(container.querySelector(".layout-shell__canvas")).not.toBeNull();
  });

  it("renders unrecognized children into the shell (other bucket)", () => {
    const { container, getByTestId } = render(
      <LayoutShell drawerOpen={false}>
        <LayoutShell.Canvas>canvas-content</LayoutShell.Canvas>
        <div data-testid="loose">loose-child</div>
        {"bare string child"}
      </LayoutShell>
    );
    expect(getByTestId("loose").textContent).toBe("loose-child");
    expect(container.querySelector(".layout-shell")!.textContent).toContain(
      "bare string child"
    );
  });

  it("always renders the skip link targeting the canvas", () => {
    const { container } = renderFullShell();
    const skip = container.querySelector("a.bd-skip-link")!;
    expect(skip.getAttribute("href")).toBe("#layout-canvas");
    expect(skip.textContent).toBe("Skip to Canvas");
  });

  it("sets the --layout-drawer-width CSS variable from drawerWidth", () => {
    const { container } = renderFullShell({ drawerWidth: 320 });
    const shell = container.querySelector(".layout-shell") as HTMLElement;
    expect(shell.style.getPropertyValue("--layout-drawer-width")).toBe("320px");
  });

  /* This asserted the shell writes `--layout-drawer-width: 280px` by default,
     which is the bug it was protecting. The inline property BEATS
     LayoutShell.css:26 (`--layout-drawer-width: var(--bk-size-drawer)`), so the
     grid TRACK was pinned to a hardcoded 280 while `.ls-panel` sized itself
     from the token — 320 in a 280 track, overflowing by 40 for five months,
     with the conformance baseline recording the overflow as expected.

     The contract now: write NOTHING by default so the token resolves, and
     write the property only for a caller that genuinely overrides. Verified
     live by moving the token to 300 — track and panel both followed. */
  it("writes no inline drawer width by default, so the token resolves", () => {
    const { container } = renderFullShell();
    const shell = container.querySelector(".layout-shell") as HTMLElement;
    expect(shell.style.getPropertyValue("--layout-drawer-width")).toBe("");
  });

  it("still writes it when a caller overrides", () => {
    const { container } = renderFullShell({ drawerWidth: 420 });
    const shell = container.querySelector(".layout-shell") as HTMLElement;
    expect(shell.style.getPropertyValue("--layout-drawer-width")).toBe("420px");
  });
});

describe("LayoutShell — shell modifier classes", () => {
  it("applies --no-topbar when no TopBar slot is present", () => {
    const { container } = render(
      <LayoutShell drawerOpen={false}>
        <LayoutShell.Canvas>c</LayoutShell.Canvas>
      </LayoutShell>
    );
    expect(
      container.querySelector(".layout-shell--no-topbar")
    ).not.toBeNull();
  });

  it("applies --drawer-open when drawer is open, drops it when closed", () => {
    const { container, rerender } = renderFullShell({ drawerOpen: true });
    expect(
      container.querySelector(".layout-shell--drawer-open")
    ).not.toBeNull();

    rerender(
      <LayoutShell drawerOpen={false}>
        <LayoutShell.Drawer>drawer-content</LayoutShell.Drawer>
        <LayoutShell.Canvas>canvas-content</LayoutShell.Canvas>
      </LayoutShell>
    );
    expect(container.querySelector(".layout-shell--drawer-open")).toBeNull();
  });

  it("suppresses --drawer-open in fullpage mode and when a Sidebar is present", () => {
    const { container } = render(
      <LayoutShell drawerOpen fullPageMode>
        <LayoutShell.Drawer>d</LayoutShell.Drawer>
        <LayoutShell.Canvas>c</LayoutShell.Canvas>
      </LayoutShell>
    );
    expect(container.querySelector(".layout-shell--fullpage")).not.toBeNull();
    expect(container.querySelector(".layout-shell--drawer-open")).toBeNull();

    const { container: c2 } = render(
      <LayoutShell drawerOpen>
        <LayoutShell.Sidebar>s</LayoutShell.Sidebar>
        <LayoutShell.Drawer>d</LayoutShell.Drawer>
        <LayoutShell.Canvas>c</LayoutShell.Canvas>
      </LayoutShell>
    );
    expect(c2.querySelector(".layout-shell--has-sidebar")).not.toBeNull();
    expect(c2.querySelector(".layout-shell--drawer-open")).toBeNull();
  });

  it("toggles --inspector-open with the inspectorOpen prop", () => {
    const { container } = renderFullShell({ inspectorOpen: true });
    expect(
      container.querySelector(".layout-shell--inspector-open")
    ).not.toBeNull();

    const { container: closed } = renderFullShell({ inspectorOpen: false });
    expect(
      closed.querySelector(".layout-shell--inspector-open")
    ).toBeNull();
  });
});

describe("LayoutShell — drawer/inspector prop injection", () => {
  it("injects drawerOpen into the Drawer slot (open class + aria-hidden)", () => {
    const { container } = renderFullShell({ drawerOpen: true });
    const drawer = container.querySelector(".layout-shell__drawer")!;
    expect(drawer.classList.contains("layout-shell__drawer--open")).toBe(true);
    expect(drawer.getAttribute("aria-hidden")).toBe("false");
    expect(drawer.getAttribute("tabindex")).toBe("0");

    const { container: closed } = renderFullShell({ drawerOpen: false });
    const closedDrawer = closed.querySelector(".layout-shell__drawer")!;
    expect(closedDrawer.classList.contains("layout-shell__drawer--open")).toBe(
      false
    );
    expect(closedDrawer.getAttribute("aria-hidden")).toBe("true");
    expect(closedDrawer.getAttribute("tabindex")).toBe("-1");
  });

  it("injects overlay = !drawerPinned into the Drawer slot on initial render", () => {
    const { container } = renderFullShell({ drawerPinned: false });
    const drawer = container.querySelector(".layout-shell__drawer")!;
    expect(drawer.classList.contains("layout-shell__drawer--overlay")).toBe(
      true
    );
    expect(
      container.querySelector(".layout-shell--drawer-overlay")
    ).not.toBeNull();

    const { container: pinned } = renderFullShell({ drawerPinned: true });
    expect(
      pinned
        .querySelector(".layout-shell__drawer")!
        .classList.contains("layout-shell__drawer--overlay")
    ).toBe(false);
    expect(pinned.querySelector(".layout-shell--drawer-overlay")).toBeNull();
  });

  it("injects inspectorOpen into the Inspector slot", () => {
    const { container } = renderFullShell({ inspectorOpen: false });
    const inspector = container.querySelector(".layout-shell__inspector")!;
    expect(
      inspector.classList.contains("layout-shell__inspector--open")
    ).toBe(false);
    expect(inspector.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("LayoutShell — pin/unpin reaches the drawer slot", () => {
  /* Was pinned as §3: the slots useMemo listed [children, drawerOpen,
     inspectorOpen] and omitted `drawerPinned`, which the Drawer clone reads
     (`overlay: !drawerPinned`). With referentially stable children a pin/unpin
     never recomputed the memo, so the drawer kept its stale overlay prop while
     the wrapper class — computed outside the memo — flipped, and the two
     disagreed about overlay mode. It did not bite in the app only because
     AquibraStudio re-creates its children every render; any memoised caller
     would have hit it. */

  const stableChildren = [
    <LayoutShell.Drawer key="drawer">drawer-content</LayoutShell.Drawer>,
    <LayoutShell.Canvas key="canvas">canvas-content</LayoutShell.Canvas>,
  ];

  it("with stable children, unpinning updates the wrapper AND the drawer slot", () => {
    const { container, rerender } = render(
      <LayoutShell drawerOpen drawerPinned>
        {stableChildren}
      </LayoutShell>
    );
    const drawer = () => container.querySelector(".layout-shell__drawer")!;
    expect(drawer().classList.contains("layout-shell__drawer--overlay")).toBe(
      false
    );
    expect(container.querySelector(".layout-shell--drawer-overlay")).toBeNull();

    rerender(
      <LayoutShell drawerOpen drawerPinned={false}>
        {stableChildren}
      </LayoutShell>
    );

    expect(
      container.querySelector(".layout-shell--drawer-overlay")
    ).not.toBeNull();
    expect(drawer().classList.contains("layout-shell__drawer--overlay")).toBe(
      true
    );
  });

  it("re-pinning goes back", () => {
    const { container, rerender } = render(
      <LayoutShell drawerOpen drawerPinned={false}>
        {stableChildren}
      </LayoutShell>
    );
    rerender(
      <LayoutShell drawerOpen drawerPinned>
        {stableChildren}
      </LayoutShell>
    );
    const drawer = container.querySelector(".layout-shell__drawer")!;
    expect(drawer.classList.contains("layout-shell__drawer--overlay")).toBe(false);
    expect(container.querySelector(".layout-shell--drawer-overlay")).toBeNull();
  });

  it("with stable children, drawerOpen still propagates (it IS a memo dep)", () => {
    const { container, rerender } = render(
      <LayoutShell drawerOpen drawerPinned>
        {stableChildren}
      </LayoutShell>
    );
    rerender(
      <LayoutShell drawerOpen={false} drawerPinned>
        {stableChildren}
      </LayoutShell>
    );
    const drawer = container.querySelector(".layout-shell__drawer")!;
    expect(drawer.classList.contains("layout-shell__drawer--open")).toBe(false);
    expect(drawer.getAttribute("aria-hidden")).toBe("true");
  });

  it("with fresh children each render, unpinning propagates to the drawer slot", () => {
    // Fresh JSX = new children reference = memo recomputes = no staleness.
    // In the real app (AquibraStudio) children are re-created every render,
    // which is why this bug does not bite in production today.
    const make = (pinned: boolean) => (
      <LayoutShell drawerOpen drawerPinned={pinned}>
        <LayoutShell.Drawer>drawer-content</LayoutShell.Drawer>
        <LayoutShell.Canvas>canvas-content</LayoutShell.Canvas>
      </LayoutShell>
    );
    const { container, rerender } = render(make(true));
    rerender(make(false));
    expect(
      container
        .querySelector(".layout-shell__drawer")!
        .classList.contains("layout-shell__drawer--overlay")
    ).toBe(true);
  });
});
