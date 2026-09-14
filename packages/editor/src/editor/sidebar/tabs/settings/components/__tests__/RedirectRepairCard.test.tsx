/**
 * RedirectRepairCard — Clone 3519:19920 URL repair draft → 3519:20096 saved:
 * the inline offer the Pages door opens above the Redirects card. The
 * copy, the prefilled editable paths, 3397:33620's validation, Save →
 * `onSave(from, to)` → the saved card with `Back to <Page> SEO`, and Cancel
 * — each a DOM fact; the visual half is the live walk's shot pair.
 *
 * @license BSD-3-Clause
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { FROM_PATH_ERROR, TO_URL_ERROR } from "../RedirectDialog";
import { RedirectRepairCard } from "../RedirectRepairCard";

function mount(over: Partial<React.ComponentProps<typeof RedirectRepairCard>> = {}) {
  const props = {
    pageName: "About",
    siteName: "Bella Cucina",
    from: "/about",
    to: "/about-us",
    saved: null,
    onSave: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    onBack: vi.fn(),
    ...over,
  };
  const utils = render(<RedirectRepairCard {...props} />);
  return { props, ...utils };
}

const from = () => screen.getByTestId("set-rd-repair-from") as HTMLInputElement;
const to = () => screen.getByTestId("set-rd-repair-to") as HTMLInputElement;
const save = () => screen.getByTestId("set-rd-repair-save");
const type = (el: HTMLInputElement, value: string) => fireEvent.change(el, { target: { value } });

afterEach(() => cleanup());

describe("Clone 3519:19920 · Redirect for <Page> — the draft", () => {
  it("carries the page, the site + URL change line, both paths prefilled and editable, the 301 line, the two buttons and the unsaved note", () => {
    mount();
    const card = screen.getByTestId("set-rd-repair");
    expect(screen.getByRole("heading", { name: "Redirect for About" })).toBeInTheDocument();
    expect(screen.getByTestId("set-rd-repair-line")).toHaveTextContent("Bella Cucina · URL change /about → /about-us");

    expect(screen.getByLabelText("From path")).toBe(from());
    expect(from().value).toBe("/about");
    expect(screen.getByLabelText("To path")).toBe(to());
    expect(to().value).toBe("/about-us");
    expect(from()).toHaveClass("tw:[font-family:var(--bk-font-mono)]");
    expect(from()).not.toBeDisabled();
    expect(to()).not.toBeDisabled();

    expect(card).toHaveTextContent("301 · Permanent redirect");
    expect(save()).toHaveTextContent("Save redirect");
    expect(save()).toBeEnabled();
    expect(save()).toHaveClass("tw:h-8");
    expect(screen.getByTestId("set-rd-repair-cancel")).toHaveTextContent("Cancel");
    expect(screen.getByTestId("set-rd-repair-note")).toHaveTextContent("Unsaved redirect · Save this rule for Bella Cucina.");
    expect(screen.queryByTestId("set-rd-repair-saved")).toBeNull();
  });

  it("the paths are editable, and 3397:33620's copy refuses a From path without / or a junk To path", () => {
    mount();
    type(from(), "about");
    expect(screen.getByTestId("set-rd-repair-from-error")).toHaveTextContent(FROM_PATH_ERROR);
    expect(from()).toHaveAttribute("aria-invalid", "true");
    expect(save()).toBeDisabled();
    type(from(), "/about");
    expect(screen.queryByTestId("set-rd-repair-from-error")).toBeNull();

    type(to(), "javascript:alert(1)");
    expect(screen.getByTestId("set-rd-repair-to-error")).toHaveTextContent(TO_URL_ERROR);
    expect(save()).toBeDisabled();
    type(to(), "/about-us-2026");
    expect(save()).toBeEnabled();
  });

  it("Save redirect hands the trimmed edited paths to onSave", async () => {
    const { props } = mount();
    type(from(), " /about ");
    type(to(), "/about-us-2026 ");
    fireEvent.click(save());
    await waitFor(() => expect(props.onSave).toHaveBeenCalledWith("/about", "/about-us-2026"));
  });

  it("a refused create stays inline under the fields with the draft intact", async () => {
    mount({ onSave: vi.fn().mockRejectedValue(new Error("A redirect from /about already exists.")) });
    fireEvent.click(save());
    expect(await screen.findByTestId("set-rd-repair-error")).toHaveTextContent("A redirect from /about already exists.");
    expect(from().value).toBe("/about");
    expect(save()).toBeEnabled();
    expect(screen.getByTestId("set-rd-repair")).toBeInTheDocument();
  });

  it("Cancel drops the draft and never saves", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("set-rd-repair-cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("a new slug change replaces the draft's paths", () => {
    const { rerender, props } = mount();
    type(from(), "/edited");
    rerender(<RedirectRepairCard {...props} pageName="Our story" from="/our-story" to="/story" />);
    expect(screen.getByRole("heading", { name: "Redirect for Our story" })).toBeInTheDocument();
    expect(from().value).toBe("/our-story");
    expect(to().value).toBe("/story");
  });
});

describe("Clone 3519:20096 · Redirect saved", () => {
  it("draws the rule and Back to <Page> SEO, and the draft is gone", () => {
    const { props } = mount({ saved: { fromPath: "/about", toUrl: "/about-us" } });
    expect(screen.getByTestId("set-rd-repair-saved")).toBeInTheDocument();
    expect(screen.queryByTestId("set-rd-repair")).toBeNull();
    expect(screen.getByRole("heading", { name: "Redirect saved" })).toBeInTheDocument();
    expect(screen.getByTestId("set-rd-repair-saved-line")).toHaveTextContent("/about → /about-us · 301");
    const back = screen.getByTestId("set-rd-repair-back");
    expect(back).toHaveTextContent("Back to About SEO");
    expect(back).toHaveClass("tw:h-8");
    fireEvent.click(back);
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});
