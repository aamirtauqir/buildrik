/**
 * AddLocaleDialog — Clone 3737:44855 "Add locale" (640): the dialog the
 * Localization header's `Add locale` opens. One `it` per prototype fact a
 * DOM assertion can prove; the visual half is the live walk's shot pair.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { AddLocaleDialog } from "../AddLocaleDialog";
import { SITE_LOCALES } from "../../constants";

function mount(over: Partial<React.ComponentProps<typeof AddLocaleDialog>> = {}) {
  const props = {
    open: true,
    siteName: "Bella Cucina",
    enabledLocales: ["en", "fr"],
    onClose: vi.fn(),
    onCreate: vi.fn(() => Promise.resolve()),
    ...over,
  };
  const utils = render(<AddLocaleDialog {...props} />);
  return { props, ...utils };
}

const language = () => screen.getByTestId("set-loc-language") as HTMLSelectElement;
const code = () => screen.getByTestId("set-loc-code") as HTMLInputElement;
const toggle = () => screen.getByTestId("set-loc-set-default");

describe("Clone 3737:44855 · Add locale", () => {
  it("carries the frame's title, the site-scoped line, the draft note and the two buttons, at 640", () => {
    mount();
    expect(screen.getByTestId("set-loc-dialog")).toHaveClass("tw:w-[var(--bk-size-dialog-lg)]");
    expect(screen.getByTestId("set-loc-dialog-title")).toHaveTextContent("Add locale");
    expect(screen.getByTestId("set-loc-dialog-scope")).toHaveTextContent("Bella Cucina · Localization");
    expect(screen.getByTestId("set-loc-draft-note")).toHaveTextContent(
      "Starts as a draft. Translate every required page before this locale can be published.",
    );
    const foot = screen.getByTestId("set-loc-dialog-foot");
    expect(foot.querySelectorAll("button")).toHaveLength(2);
    expect(screen.getByTestId("set-loc-cancel")).toHaveTextContent("Cancel");
    expect(screen.getByTestId("set-loc-create")).toHaveTextContent("Create locale");
    expect(screen.getByTestId("set-loc-create")).toHaveClass("tw:h-8");
  });

  it("Language lists `<Language> — <Native> · <code>` for every locale not yet enabled, bare codes", () => {
    mount();
    expect(screen.getByLabelText("Language")).toBe(language());
    const options = Array.from(language().options);
    expect(options.map((o) => o.value)).toEqual(SITE_LOCALES.map((l) => l.code).filter((c) => c !== "en" && c !== "fr"));
    expect(options[0].text).toBe("Spanish — Español · es");
    expect(options.find((o) => o.value === "ar")?.text).toBe("Arabic — العربية · ar");
    expect(options.find((o) => o.value === "ur")?.text).toBe("Urdu — اردو · ur");
  });

  it("Locale code is read-only and follows the pick, with `URL prefix /<code>` at its right", () => {
    mount();
    expect(screen.getByLabelText("Locale code")).toBe(code());
    expect(code()).toHaveAttribute("readonly");
    expect(code().value).toBe("es");
    expect(screen.getByTestId("set-loc-prefix")).toHaveTextContent("URL prefix /es");
    fireEvent.change(language(), { target: { value: "de" } });
    expect(code().value).toBe("de");
    expect(screen.getByTestId("set-loc-prefix")).toHaveTextContent("URL prefix /de");
  });

  it("Set as default locale is a labelled switch, off to start, with the frame's line under it", () => {
    mount();
    expect(screen.getByRole("switch", { name: "Set as default locale" })).toBe(toggle());
    expect(toggle()).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Visitors without a matching language land here.")).toBeInTheDocument();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-checked", "true");
  });

  it("Create locale hands the caller the code and the default choice", async () => {
    const { props } = mount();
    fireEvent.change(language(), { target: { value: "de" } });
    fireEvent.click(toggle());
    fireEvent.click(screen.getByTestId("set-loc-create"));
    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith({ code: "de", setAsDefault: true }));
  });

  it("a refused Create shows its message inline and re-enables the buttons; nothing closes", async () => {
    const onCreate = vi.fn(() => Promise.reject(new Error("The default locale must be in the enabled locales list.")));
    const { props } = mount({ onCreate });
    fireEvent.click(screen.getByTestId("set-loc-create"));
    const error = await screen.findByTestId("set-loc-error");
    expect(error).toHaveTextContent("The default locale must be in the enabled locales list.");
    expect(error).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("set-loc-create")).toBeEnabled();
    expect(screen.getByTestId("set-loc-cancel")).toBeEnabled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("a refusal without a message falls back to a line of its own", async () => {
    mount({ onCreate: vi.fn(() => Promise.reject(new Error(""))) });
    fireEvent.click(screen.getByTestId("set-loc-create"));
    expect(await screen.findByTestId("set-loc-error")).toHaveTextContent("The locale was not created. Try again.");
  });

  it("holds the buttons and Escape while the write is in flight", async () => {
    let resolve!: () => void;
    const onCreate = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const { props } = mount({ onCreate });
    fireEvent.click(screen.getByTestId("set-loc-create"));
    await waitFor(() => expect(screen.getByTestId("set-loc-create")).toBeDisabled());
    expect(screen.getByTestId("set-loc-cancel")).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).not.toHaveBeenCalled();
    resolve();
  });

  it("Cancel, Escape and the scrim are the same door", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("set-loc-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(2);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onClose).toHaveBeenCalledTimes(3);
  });

  it("reopens clean — the first addable locale, the toggle off, no stale error", async () => {
    const onCreate = vi.fn(() => Promise.reject(new Error("nope")));
    const { rerender, props } = mount({ onCreate });
    fireEvent.change(language(), { target: { value: "de" } });
    fireEvent.click(toggle());
    fireEvent.click(screen.getByTestId("set-loc-create"));
    await screen.findByTestId("set-loc-error");
    rerender(<AddLocaleDialog {...props} open={false} />);
    rerender(<AddLocaleDialog {...props} open />);
    expect(language().value).toBe("es");
    expect(toggle()).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByTestId("set-loc-error")).toBeNull();
  });

  it("with every locale enabled, the select is empty and Create is disabled", () => {
    mount({ enabledLocales: SITE_LOCALES.map((l) => l.code) });
    expect(language().options).toHaveLength(0);
    expect(language()).toBeDisabled();
    expect(screen.getByTestId("set-loc-create")).toBeDisabled();
  });

  it("drops the site prefix when no site name is known, and renders nothing while closed", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-loc-dialog-scope")).toHaveTextContent(/^Localization$/);
    mount({ open: false });
    expect(screen.getAllByTestId("set-loc-dialog")).toHaveLength(1);
  });
});
