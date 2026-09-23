/**
 * ConnectionVerifiedDialog — Clone 4256:26844 "Connection verified" (640):
 * the dialog Verify lands on. One `it` per prototype fact a DOM assertion
 * can prove; the visual half is the live walk's shot pair.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ConnectionVerifiedDialog, connectionVerifiedLine, eventsPhrase } from "../ConnectionVerifiedDialog";

function mount(over: Partial<React.ComponentProps<typeof ConnectionVerifiedDialog>> = {}) {
  const props = { open: true, id: "G-4XQ2P7B1KD", events24h: 1284, onBack: vi.fn(), ...over };
  render(<ConnectionVerifiedDialog {...props} />);
  return props;
}

describe("Clone 4256:26844 · Connection verified", () => {
  it("carries the frame's title, the receiving line and the just-now note, at the 640 table width", () => {
    mount();
    expect(screen.getByTestId("set-an-verified-title")).toHaveTextContent("Connection verified");
    expect(screen.getByTestId("set-an-verified-line")).toHaveTextContent(
      "G-4XQ2P7B1KD is receiving data. 1,284 events arrived in the last 24 hours.",
    );
    expect(screen.getByTestId("set-an-verified-note")).toHaveTextContent(
      "Last checked just now · Data usually appears within 30 minutes of the first visit.",
    );
    expect(screen.getByTestId("set-an-verified")).toHaveClass("tw:w-[640px]");
  });

  it("says the id is verified with nothing arrived yet when the count is zero", () => {
    mount({ events24h: 0 });
    expect(screen.getByTestId("set-an-verified-line")).toHaveTextContent(
      /^G-4XQ2P7B1KD is verified\. No events have arrived yet\.$/,
    );
  });

  it("Back to analytics is the primary, takes focus and is the one door", () => {
    const props = mount();
    const back = screen.getByTestId("set-an-verified-back");
    expect(back).toHaveTextContent("Back to analytics");
    expect(document.activeElement).toBe(back);
    expect(back).toHaveClass("tw:h-8");
    expect(screen.getByTestId("set-an-verified-foot").querySelectorAll("button")).toHaveLength(1);
    fireEvent.click(back);
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("Escape and the scrim are the same door", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onBack).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onBack).toHaveBeenCalledTimes(2);
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("set-an-verified")).toBeNull();
  });
});

describe("connectionVerifiedLine / eventsPhrase — pure", () => {
  it("draws 1,284-style counts with the right plural", () => {
    expect(eventsPhrase(1284)).toBe("1,284 events");
    expect(eventsPhrase(1)).toBe("1 event");
    expect(eventsPhrase(0)).toBe("0 events");
  });

  it("switches sentence on the count", () => {
    expect(connectionVerifiedLine("G-ABCD123456", 1)).toBe("G-ABCD123456 is receiving data. 1 event arrived in the last 24 hours.");
    expect(connectionVerifiedLine("G-ABCD123456", 0)).toBe("G-ABCD123456 is verified. No events have arrived yet.");
  });
});
