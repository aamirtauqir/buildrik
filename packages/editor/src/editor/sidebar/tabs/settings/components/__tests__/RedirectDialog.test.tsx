/**
 * RedirectDialog — Clone 4254:75736 `Add redirect` / 4254:75747 `Edit
 * redirect` (640): the form that feeds `redirects.create` / `update` /
 * `delete`. The fields, the segmented type, the boxed toggle, 3397:33620's
 * validation copy, the two doors out and the danger door — each a DOM fact;
 * the visual half is the live walk's shot pair.
 *
 * @license BSD-3-Clause
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { FROM_PATH_ERROR, RedirectDialog, TO_URL_ERROR, isValidToUrl, type RedirectDraft } from "../RedirectDialog";

const menuOld: RedirectDraft = {
  fromPath: "/menu-old",
  toUrl: "/menu",
  type: "301",
  matchQuery: true,
  notes: "Old menu page retired in March — keep printed QR links working.",
};

function mount(over: Partial<React.ComponentProps<typeof RedirectDialog>> = {}) {
  const props = {
    open: true,
    mode: "add" as const,
    siteName: "Bella Cucina",
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...over,
  };
  const utils = render(<RedirectDialog {...props} />);
  return { props, ...utils };
}

const from = () => screen.getByTestId("set-rd-from") as HTMLInputElement;
const to = () => screen.getByTestId("set-rd-to") as HTMLInputElement;
const notes = () => screen.getByTestId("set-rd-notes") as HTMLInputElement;
const submit = () => screen.getByTestId("set-rd-submit");
const type = (el: HTMLInputElement, value: string) => fireEvent.change(el, { target: { value } });

afterEach(() => cleanup());

describe("Clone 4254:75736 · Add redirect — the frame's shape", () => {
  it("carries the title, the scope line and every field at the 640 table width, with Add redirect waiting for both paths", () => {
    mount();
    const dialog = screen.getByTestId("set-rd-dialog");
    expect(dialog).toHaveClass("tw:w-[var(--bk-size-dialog-lg)]");
    expect(dialog).toHaveAttribute("aria-label", "Add redirect · Bella Cucina");
    expect(dialog).toHaveAttribute("data-mode", "add");
    expect(screen.getByTestId("set-rd-dialog-title")).toHaveTextContent("Add redirect");
    expect(screen.getByTestId("set-rd-dialog-scope")).toHaveTextContent("Bella Cucina · Redirects");

    expect(screen.getByLabelText("From path")).toBe(from());
    expect(from()).toHaveAttribute("placeholder", "/old-url");
    expect(document.activeElement).toBe(from());
    expect(screen.getByLabelText("To URL")).toBe(to());
    expect(to()).toHaveAttribute("placeholder", "/new-url");
    /* the two path fields are mono, as the frame draws them; Notes is not */
    expect(from()).toHaveClass("tw:[font-family:var(--bk-font-mono)]");
    expect(to()).toHaveClass("tw:[font-family:var(--bk-font-mono)]");
    expect(notes()).not.toHaveClass("tw:[font-family:var(--bk-font-mono)]");

    const types = within(screen.getByRole("group", { name: "Redirect type" })).getAllByRole("button");
    expect(types.map((b) => b.textContent)).toEqual(["301 Permanent", "302 Temporary"]);
    expect(screen.getByTestId("set-rd-type-301")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-rd-type-302")).toHaveAttribute("aria-pressed", "false");

    expect(screen.getByRole("switch", { name: "Match query strings" })).toBe(screen.getByTestId("set-rd-match-query"));
    expect(screen.getByTestId("set-rd-match-query")).toHaveAttribute("aria-checked", "false");
    expect(dialog).toHaveTextContent("Forward ?utm_source and other parameters to the destination.");

    expect(screen.getByLabelText("Notes")).toBe(notes());
    expect(notes()).toHaveAttribute("placeholder", "Optional — why this redirect exists.");
    expect(dialog).toHaveTextContent(
      "Paths must start with /. A 301 is cached by browsers — use it for permanent moves; a 302 stays uncached while you test.",
    );

    expect(screen.queryByTestId("set-rd-delete")).toBeNull();
    expect(screen.getByTestId("set-rd-cancel")).toHaveTextContent("Cancel");
    expect(submit()).toHaveTextContent("Add redirect");
    expect(submit()).toBeDisabled();
    expect(submit()).toHaveClass("tw:h-8");
    expect(screen.queryByTestId("set-rd-error")).toBeNull();
  });

  it("the segmented type is one-of-two with aria-pressed", () => {
    mount();
    fireEvent.click(screen.getByTestId("set-rd-type-302"));
    expect(screen.getByTestId("set-rd-type-302")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-rd-type-301")).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByTestId("set-rd-type-301"));
    expect(screen.getByTestId("set-rd-type-301")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("3397:33620's validation copy — the paths", () => {
  it("a From path without a leading / is refused with the frame's line, and Add redirect stays off", () => {
    mount();
    type(from(), "old-page");
    type(to(), "/new");
    expect(screen.getByTestId("set-rd-from-error")).toHaveTextContent(FROM_PATH_ERROR);
    expect(from()).toHaveAttribute("aria-invalid", "true");
    expect(submit()).toBeDisabled();
    type(from(), "/old-page");
    expect(screen.queryByTestId("set-rd-from-error")).toBeNull();
    expect(submit()).toBeEnabled();
  });

  it("a To URL must start with / or http(s):// — junk, javascript: and //host are refused", () => {
    mount();
    type(from(), "/old");
    for (const bad of ["not a url", "javascript:alert(1)", "//evil.example/x", "example.com/new"]) {
      type(to(), bad);
      expect(screen.getByTestId("set-rd-to-error")).toHaveTextContent(TO_URL_ERROR);
      expect(to()).toHaveAttribute("aria-invalid", "true");
      expect(submit()).toBeDisabled();
    }
    type(to(), "https://example.com/new");
    expect(screen.queryByTestId("set-rd-to-error")).toBeNull();
    expect(submit()).toBeEnabled();
  });

  it("isValidToUrl is the one rule: a path, or an absolute http(s) URL", () => {
    expect(isValidToUrl("/menu")).toBe(true);
    expect(isValidToUrl("https://bellacucina.com/offers")).toBe(true);
    expect(isValidToUrl("http://example.com")).toBe(true);
    expect(isValidToUrl("//evil.example")).toBe(false);
    expect(isValidToUrl("ftp://example.com")).toBe(false);
    expect(isValidToUrl("menu")).toBe(false);
  });

  it("nothing is shown while a field is still empty", () => {
    mount();
    expect(screen.queryByTestId("set-rd-from-error")).toBeNull();
    expect(screen.queryByTestId("set-rd-to-error")).toBeNull();
  });
});

describe("Add redirect → redirects.create", () => {
  it("submits the trimmed paths, the chosen type, the toggle and trimmed notes (empty → null)", async () => {
    const { props } = mount();
    type(from(), "  /promo-eid ");
    type(to(), " https://bellacucina.com/offers ");
    fireEvent.click(screen.getByTestId("set-rd-type-302"));
    fireEvent.click(screen.getByTestId("set-rd-match-query"));
    type(notes(), "  Eid promo  ");
    fireEvent.click(submit());
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        fromPath: "/promo-eid",
        toUrl: "https://bellacucina.com/offers",
        type: "302",
        matchQuery: true,
        notes: "Eid promo",
      }),
    );
  });

  it("empty notes go up as null", async () => {
    const { props } = mount();
    type(from(), "/a");
    type(to(), "/b");
    fireEvent.click(submit());
    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ notes: null, matchQuery: false, type: "301" })));
  });

  it("the server's refusal stays inline under the form and the dialog stays open with the values", async () => {
    const { props } = mount({ onSubmit: vi.fn().mockRejectedValue(new Error("A redirect from /menu-old already exists.")) });
    type(from(), "/menu-old");
    type(to(), "/menu");
    fireEvent.click(submit());
    expect(await screen.findByTestId("set-rd-error")).toHaveTextContent("A redirect from /menu-old already exists.");
    expect(screen.getByTestId("set-rd-dialog")).toBeInTheDocument();
    expect(from().value).toBe("/menu-old");
    expect(submit()).toBeEnabled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("while the create runs, every control waits and the scrim does not dismiss", async () => {
    let release!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((r) => (release = r)));
    const { props } = mount({ onSubmit });
    type(from(), "/a");
    type(to(), "/b");
    fireEvent.click(submit());
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submit()).toBeDisabled();
    expect(screen.getByTestId("set-rd-cancel")).toBeDisabled();
    expect(from()).toBeDisabled();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(props.onCancel).not.toHaveBeenCalled();
    release();
  });
});

describe("Clone 4254:75747 · Edit redirect", () => {
  it("prefills every field from the row, reads Save redirect, and carries Delete redirect at the footer's left", () => {
    mount({ mode: "edit", initial: menuOld, onDelete: vi.fn().mockResolvedValue(undefined) });
    const dialog = screen.getByTestId("set-rd-dialog");
    expect(dialog).toHaveAttribute("aria-label", "Edit redirect · Bella Cucina");
    expect(dialog).toHaveAttribute("data-mode", "edit");
    expect(screen.getByTestId("set-rd-dialog-title")).toHaveTextContent("Edit redirect");
    expect(from().value).toBe("/menu-old");
    expect(to().value).toBe("/menu");
    expect(screen.getByTestId("set-rd-type-301")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("set-rd-match-query")).toHaveAttribute("aria-checked", "true");
    expect(notes().value).toBe("Old menu page retired in March — keep printed QR links working.");

    const foot = screen.getByTestId("set-rd-dialog-foot");
    const buttons = within(foot).getAllByRole("button").map((b) => b.textContent);
    expect(buttons).toEqual(["Delete redirect", "Cancel", "Save redirect"]);
    const del = screen.getByTestId("set-rd-delete");
    expect(del).toHaveClass("tw:mr-auto");
    expect(del).toHaveClass("tw:text-[var(--bk-error)]");
    expect(submit()).toHaveTextContent("Save redirect");
    expect(submit()).toBeEnabled();
  });

  it("Save redirect submits the edited draft", async () => {
    const { props } = mount({ mode: "edit", initial: menuOld, onDelete: vi.fn() });
    type(to(), "/menu-2026");
    fireEvent.click(screen.getByTestId("set-rd-match-query"));
    fireEvent.click(submit());
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        fromPath: "/menu-old",
        toUrl: "/menu-2026",
        type: "301",
        matchQuery: false,
        notes: "Old menu page retired in March — keep printed QR links working.",
      }),
    );
  });

  it("Delete redirect deletes at once — no confirm is drawn", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    mount({ mode: "edit", initial: menuOld, onDelete });
    fireEvent.click(screen.getByTestId("set-rd-delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/are you sure/i)).toBeNull();
  });

  it("a refused delete stays inline and the row's values are untouched", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("Only an editor can delete a redirect."));
    mount({ mode: "edit", initial: menuOld, onDelete });
    fireEvent.click(screen.getByTestId("set-rd-delete"));
    expect(await screen.findByTestId("set-rd-error")).toHaveTextContent("Only an editor can delete a redirect.");
    expect(from().value).toBe("/menu-old");
    expect(screen.getByTestId("set-rd-delete")).toBeEnabled();
  });
});

describe("the doors out", () => {
  it("Cancel and Escape call onCancel and never submit", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("set-rd-cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("a reopened dialog starts clean — the last attempt's values and reason are gone", async () => {
    const { rerender } = mount({ onSubmit: vi.fn().mockRejectedValue(new Error("nope")) });
    type(from(), "/x");
    type(to(), "/y");
    fireEvent.click(submit());
    await screen.findByTestId("set-rd-error");
    rerender(<RedirectDialog open={false} mode="add" siteName="Bella Cucina" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    rerender(<RedirectDialog open mode="add" siteName="Bella Cucina" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(from().value).toBe("");
    expect(to().value).toBe("");
    expect(screen.queryByTestId("set-rd-error")).toBeNull();
    expect(submit()).toBeDisabled();
  });
});
