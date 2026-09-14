/**
 * SettingsSavedDialog — Clone 3737:43624 "Settings saved" (640): the
 * dialog every successful Save changes lands on. One `it` per prototype
 * fact a DOM assertion can prove; the visual half is the live walk's shot
 * pair.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { SettingsSavedDialog } from "../SettingsSavedDialog";

function mount(over: Partial<React.ComponentProps<typeof SettingsSavedDialog>> = {}) {
  const props = { open: true, siteName: "Bella Cucina", onReturn: vi.fn(), ...over };
  render(<SettingsSavedDialog {...props} />);
  return props;
}

describe("Clone 3737:43624 · Settings saved", () => {
  it("carries the frame's title and the site-prefixed body, at the 640 table width", () => {
    mount();
    expect(screen.getByTestId("set-saved-title")).toHaveTextContent("Settings saved");
    expect(screen.getByTestId("set-saved-body")).toHaveTextContent(
      "Bella Cucina · Configuration saved. Your canvas content is unchanged.",
    );
    expect(screen.getByTestId("set-saved")).toHaveClass("tw:w-[640px]");
  });

  it("Return to settings is the primary, takes focus and is the one door", () => {
    const props = mount();
    const back = screen.getByTestId("set-saved-return");
    expect(back).toHaveTextContent("Return to settings");
    expect(document.activeElement).toBe(back);
    expect(back).toHaveClass("tw:h-8");
    expect(screen.getByTestId("set-saved-foot").querySelectorAll("button")).toHaveLength(1);
    fireEvent.click(back);
    expect(props.onReturn).toHaveBeenCalledTimes(1);
  });

  it("Escape and the scrim are the same door", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onReturn).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onReturn).toHaveBeenCalledTimes(2);
  });

  it("drops the site prefix when no site name is known", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-saved-body")).toHaveTextContent(
      /^Configuration saved\. Your canvas content is unchanged\.$/,
    );
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("set-saved")).toBeNull();
  });
});
