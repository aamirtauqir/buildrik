/**
 * SelectedTextLink — 2L9 TX07: names the link around the selection while the
 * element's text is being edited inline, and nothing otherwise.
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { SelectedTextLink } from "../SelectedTextLink";

afterEach(() => document.querySelectorAll("[data-buildrick-id]").forEach((n) => n.remove()));

function canvasText(editing: boolean) {
  const node = document.createElement("h1");
  node.setAttribute("data-buildrick-id", "h");
  node.contentEditable = editing ? "true" : "false";
  node.innerHTML = 'Thoughtful <a href="https://fieldwork.studio/work" target="_blank">design</a>.';
  document.body.appendChild(node);
  return node.querySelector("a")!;
}

const selectIn = (el: Node) =>
  act(() => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = document.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });

describe("SelectedTextLink (2L9 TX07)", () => {
  it("while editing, a selection in a link shows its href, its new-tab target and the transaction note", () => {
    const a = canvasText(true);
    render(<SelectedTextLink elementId="h" />);
    selectIn(a.firstChild!);
    expect(screen.getByText("Selected text link")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-selected-text-link-href")).toHaveTextContent("https://fieldwork.studio/work · opens in a new tab");
    expect(screen.getByTestId("inspector-selected-text-link")).toHaveTextContent(
      "The link is part of the current text edit. Done or Escape commits this text transaction.",
    );
  });

  it("nothing outside a link, or when the text is not being edited", () => {
    const a = canvasText(false);
    render(<SelectedTextLink elementId="h" />);
    selectIn(a.firstChild!);
    expect(screen.queryByTestId("inspector-selected-text-link")).toBeNull();
  });
});
