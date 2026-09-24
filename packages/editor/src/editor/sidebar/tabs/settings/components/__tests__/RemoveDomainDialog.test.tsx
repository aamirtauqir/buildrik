/**
 * RemoveDomainDialog — Clone 3397:34402 `Remove <domain>?` (640): the
 * confirm before `domains.remove`. One `it` per prototype fact a DOM
 * assertion can prove; the visual half is the live walk's shot pair.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { RemoveDomainDialog } from "../RemoveDomainDialog";

function mount(over: Partial<React.ComponentProps<typeof RemoveDomainDialog>> = {}) {
  const props = { domain: "bellacucina.com", siteName: "Bella Cucina", onCancel: vi.fn(), onRemove: vi.fn(), ...over };
  render(<RemoveDomainDialog {...props} />);
  return props;
}

describe("Clone 3397:34402 · Remove <domain>?", () => {
  it("names the domain in the title and the body, at the 640 table width", () => {
    mount();
    expect(screen.getByTestId("set-dom-confirm-title")).toHaveTextContent("Remove bellacucina.com?");
    expect(screen.getByTestId("set-dom-confirm-body")).toHaveTextContent(
      "bellacucina.com stops pointing at this site. Visitors following that address get nothing until you reconnect it or change your DNS; the site keeps serving on its buildrick.app address.",
    );
    expect(screen.getByTestId("set-dom-confirm")).toHaveClass("tw:w-[var(--bk-size-dialog-lg)]");
    expect(screen.getByTestId("set-dom-confirm")).toHaveAttribute("aria-label", "Remove bellacucina.com? · Bella Cucina");
  });

  it("Cancel is the secondary and takes focus; Remove domain is the danger action", () => {
    const props = mount();
    const cancel = screen.getByTestId("set-dom-confirm-cancel");
    const remove = screen.getByTestId("set-dom-confirm-remove");
    expect(cancel).toHaveTextContent("Cancel");
    expect(remove).toHaveTextContent("Remove domain");
    expect(document.activeElement).toBe(cancel);
    expect(cancel).toHaveClass("tw:h-8");
    expect(remove).toHaveClass("tw:h-8");
    expect(remove).toHaveClass("tw:bg-[var(--bk-error)]");

    fireEvent.click(cancel);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onRemove).not.toHaveBeenCalled();
    fireEvent.click(remove);
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it("Escape and the scrim cancel rather than remove", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(props.onRemove).not.toHaveBeenCalled();
  });

  it("while the remove runs, both buttons and every door out wait", () => {
    const props = mount({ busy: true });
    expect(screen.getByTestId("set-dom-confirm-cancel")).toBeDisabled();
    expect(screen.getByTestId("set-dom-confirm-remove")).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("names the dialog without a site when none is known", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-dom-confirm")).toHaveAttribute("aria-label", "Remove bellacucina.com?");
  });

  it("renders nothing without a domain to remove", () => {
    mount({ domain: null });
    expect(screen.queryByTestId("set-dom-confirm")).toBeNull();
  });
});
