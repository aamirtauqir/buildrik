// @vitest-environment jsdom
/**
 * PagesTab — Listings widens the drawer (design-2l9 board 63:21262 draws it
 * 720 wide over the canvas; Pages and Structure stay narrow).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer, pg } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";

afterEach(cleanup);

function Host({ onToggle }: { onToggle: (wide: boolean) => void }) {
  const composer = React.useMemo(() => createMockComposer({ pages: [pg("p1", "Home", { isHome: true }), pg("p2", "About")] }), []);
  const [wide, setWide] = React.useState(false);
  return (
    <ToastProvider>
      <span data-testid="width">{wide ? "wide" : "narrow"}</span>
      <PagesTab
        composer={composer}
        isExpanded={wide}
        onExpandToggle={() => setWide((w) => { onToggle(!w); return !w; })}
      />
    </ToastProvider>
  );
}

const tab = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));

describe("PagesTab — Listings drawer width", () => {
  it("widens for Listings and narrows again for Pages", () => {
    const onToggle = vi.fn();
    render(<Host onToggle={onToggle} />);
    expect(screen.getByTestId("width")).toHaveTextContent("narrow");
    tab("Listings");
    expect(screen.getByTestId("width")).toHaveTextContent("wide");
    tab("Pages");
    expect(screen.getByTestId("width")).toHaveTextContent("narrow");
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("leaves a drawer the user widened alone when Listings closes", () => {
    render(<Host onToggle={() => {}} />);
    fireEvent.click(screen.getByTestId("pages-panel-menu"));
    fireEvent.click(screen.getByTestId("pages-wide-view"));
    expect(screen.getByTestId("width")).toHaveTextContent("wide");
    tab("Listings");
    tab("Structure");
    expect(screen.getByTestId("width")).toHaveTextContent("wide");
  });
});
