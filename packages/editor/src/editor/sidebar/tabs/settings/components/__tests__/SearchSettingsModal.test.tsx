/**
 * SearchSettingsModal — Clone 3737:46109 "Search settings" (640). One `it`
 * per prototype fact a DOM assertion can prove; the ranking itself is
 * `searchIndex.test.ts`'s, this file proves what the dialog does with it.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { SearchSettingsModal } from "../SearchSettingsModal";
import { SETTINGS_SEARCH_INDEX } from "../../searchIndex";

function mount(over: Partial<React.ComponentProps<typeof SearchSettingsModal>> = {}) {
  const props = { open: true, siteName: "Bella Cucina", onClose: vi.fn(), onOpen: vi.fn(), ...over };
  const view = render(<SearchSettingsModal {...props} />);
  return { ...props, view };
}

const type = (value: string) => fireEvent.change(screen.getByTestId("set-search-input"), { target: { value } });
const rowTitles = () =>
  screen
    .getAllByTestId(/^set-search-row-\d+$/)
    .map((row) => row.querySelector("span > span")?.textContent ?? "");

const SECTION_COUNT = SETTINGS_SEARCH_INDEX.filter((e) => e.fieldId === undefined).length;

describe("Clone 3737:46109 · Search settings", () => {
  it("opens on the section list with the field focused, at the 640 table width", () => {
    mount();
    expect(screen.getByTestId("set-search-title")).toHaveTextContent("Search settings");
    expect(screen.getByTestId("set-search")).toHaveClass("tw:w-[640px]");
    expect(screen.getByTestId("set-search-scope")).toHaveTextContent("Bella Cucina · all sections");
    expect(document.activeElement).toBe(screen.getByTestId("set-search-input"));
    expect(screen.getByLabelText("Search")).toBe(screen.getByTestId("set-search-input"));
    expect(rowTitles()).toHaveLength(SECTION_COUNT);
    expect(rowTitles().slice(0, 3)).toEqual(["General", "Fonts & colours", "Localization"]);
    expect(screen.getByTestId("set-search-count")).toHaveTextContent(`${SECTION_COUNT} sections`);
    /* Nothing to clear yet: no ✕ in the field, the foot's Clear search inert. */
    expect(screen.queryByTestId("set-search-clear-x")).toBeNull();
    expect(screen.getByTestId("set-search-clear")).toBeDisabled();
  });

  it("draws each row as title / description / GROUP, 32 high", () => {
    mount();
    const row = screen.getByTestId("set-search-row-0");
    expect(row).toHaveClass("tw:h-8");
    const [title, description] = Array.from(row.querySelectorAll("span > span"));
    expect(title).toHaveTextContent("General");
    expect(description).toHaveTextContent("Manage your site identity, language and social profiles.");
    const group = row.lastElementChild;
    expect(group).toHaveTextContent("Site setup");
    expect(group).toHaveClass("tw:uppercase");
  });

  it("narrows as you type: the frame's `domain` lists Domains, then its fields, with the count in both places", () => {
    mount();
    type("domain");
    expect(screen.getByTestId("set-search-scope")).toHaveTextContent('Bella Cucina · 4 results for "domain"');
    expect(rowTitles()).toEqual(["Domains", "Domain", "Force HTTPS", "DNS records"]);
    expect(screen.getByTestId("set-search-count")).toHaveTextContent("4 results");
    const https = screen.getByTestId("set-search-row-2");
    expect(https).toHaveTextContent("Custom domain");
    expect(https.lastElementChild).toHaveTextContent("Domains");
    expect(screen.getByTestId("set-search-clear-x")).toBeInTheDocument();
    expect(screen.getByTestId("set-search-clear")).toBeEnabled();
  });

  it("a section row opens its screen; a field row names the field too; either closes the dialog", () => {
    const props = mount();
    type("domain");
    fireEvent.click(screen.getByTestId("set-search-row-0"));
    expect(props.onOpen).toHaveBeenLastCalledWith("domains", undefined);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("set-search-row-3"));
    expect(props.onOpen).toHaveBeenLastCalledWith("domains", "dom-dns-records");
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it("singular for one hit", () => {
    mount();
    type("favicon");
    expect(screen.getByTestId("set-search-scope")).toHaveTextContent('1 result for "favicon"');
    expect(screen.getByTestId("set-search-count")).toHaveTextContent("1 result");
    expect(rowTitles()).toEqual(["Favicon URL"]);
  });

  it("says so when nothing matches, and the field keeps the query", () => {
    mount();
    type("zzz");
    expect(screen.getByTestId("set-search-scope")).toHaveTextContent('0 results for "zzz"');
    expect(screen.queryByTestId("set-search-list")).toBeNull();
    expect(screen.getByTestId("set-search-empty")).toHaveTextContent('No settings match "zzz".');
    expect(screen.getByTestId("set-search-count")).toHaveTextContent("0 results");
    expect(screen.getByTestId("set-search-input")).toHaveValue("zzz");
  });

  it("Clear search — the foot's and the field's ✕ — returns to the section list with the field focused", () => {
    mount();
    type("domain");
    fireEvent.click(screen.getByTestId("set-search-clear"));
    expect(screen.getByTestId("set-search-input")).toHaveValue("");
    expect(screen.getByTestId("set-search-scope")).toHaveTextContent("all sections");
    expect(rowTitles()).toHaveLength(SECTION_COUNT);
    expect(document.activeElement).toBe(screen.getByTestId("set-search-input"));

    type("seo");
    fireEvent.click(screen.getByTestId("set-search-clear-x"));
    expect(screen.getByTestId("set-search-input")).toHaveValue("");
    expect(rowTitles()).toHaveLength(SECTION_COUNT);
  });

  it("Cancel, Escape and the scrim close without opening anything", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("set-search-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(2);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onClose).toHaveBeenCalledTimes(3);
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  it("reopens clean", () => {
    const { view, ...props } = mount();
    type("domain");
    view.rerender(<SearchSettingsModal {...props} open={false} />);
    expect(screen.queryByTestId("set-search")).toBeNull();
    view.rerender(<SearchSettingsModal {...props} open />);
    expect(screen.getByTestId("set-search-input")).toHaveValue("");
    expect(within(screen.getByTestId("set-search-scope")).getByText(/all sections/)).toBeInTheDocument();
  });

  it("reads without a site prefix when no name is known", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-search-scope")).toHaveTextContent(/^all sections$/);
  });
});
