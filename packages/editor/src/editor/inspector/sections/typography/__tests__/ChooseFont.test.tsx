/**
 * Choose font — the one font picker (2L9 R02, 247:31047): the tab's body,
 * opened from the Font row. Rows are the families the font list really has —
 * uploaded (file · weight), system, catalogue — a catalogue family sharing
 * an uploaded font's name says so; Inherit, Manage site fonts, Cancel; the
 * search and scroll survive a trip to Site fonts.
 *
 * @license BSD-3-Clause
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ChooseFont } from "../ChooseFont";
import { FontPicker } from "../FontPicker";
import { InspectorFieldContext } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { openSubview, useSubview } from "@/editor/inspector/tabs/subviewStore";
import type { Composer } from "@/engine";

afterEach(() => {
  cleanup();
  openSubview(null);
});

/* Each test its own element: what is kept while open is kept per element. */
let n = 0;
beforeEach(() => {
  n += 1;
});

function composerWithFonts(families: string[]) {
  const fonts = {
    getAllFonts: vi.fn(() =>
      families.map((family) => ({
        id: `library-${family.toLowerCase()}`,
        family,
        source: "custom",
        variants: [{ weight: 400, style: "normal", url: `https://blob.example/fonts/${family.toLowerCase().replace(/ /g, "-")}-regular.woff2` }],
        loaded: true,
      })),
    ),
    on: vi.fn(),
    off: vi.fn(),
  };
  const emit = vi.fn();
  const composer = { fonts, emit, elements: { getElement: () => undefined } } as unknown as Composer;
  return { composer, emit };
}

function open(composer: Composer, props: Partial<React.ComponentProps<typeof ChooseFont>> = {}) {
  const onChange = vi.fn();
  const onClose = vi.fn();
  const utils = render(<ChooseFont composer={composer} elementId={`el-${n}`} value="" onChange={onChange} onClose={onClose} {...props} />);
  return { onChange, onClose, ...utils };
}

const rows = () => screen.getAllByTestId("inspector-choose-font-row");

describe("Choose font — the rows (R02)", () => {
  it("an uploaded family names its source, file and weight; the catalogue twin says it is a different source", () => {
    const { composer } = composerWithFonts(["Inter"]);
    open(composer);
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "Inter" } });
    const [uploaded, catalogue] = rows();
    expect(uploaded).toHaveTextContent("Inter · Uploaded");
    expect(uploaded.parentElement).toHaveTextContent("inter-regular.woff2 · Regular");
    expect(catalogue).toHaveTextContent("Inter · Catalogue");
    expect(catalogue.parentElement).toHaveTextContent("Same family label · different source identity");
  });

  it("system stacks are rows too; nothing uploaded, no Uploaded row", () => {
    const { composer } = composerWithFonts([]);
    open(composer);
    expect(screen.queryByText(/· Uploaded$/)).toBeNull();
    expect(screen.getByRole("button", { name: "Georgia · System" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Inherit · / })).toBeNull();
  });

  it("the current family reads as pressed — an uploaded pick on its Uploaded row, not the catalogue twin", () => {
    const { composer } = composerWithFonts(["Inter"]);
    open(composer, { value: "'Inter', sans-serif" });
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "Inter" } });
    expect(screen.getByRole("button", { name: "Inter · Uploaded" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Inter · Catalogue" })).toHaveAttribute("aria-pressed", "false");
  });

  it("a search with no match says so; Inherit, Manage site fonts and Cancel stay", () => {
    const { composer } = composerWithFonts(["Inter"]);
    open(composer);
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "zzzz-no-match" } });
    expect(screen.queryAllByTestId("inspector-choose-font-row")).toHaveLength(0);
    expect(screen.getByText("Nothing matches “zzzz-no-match”.")).toBeInTheDocument();
    for (const name of ["Inherit", "Manage site fonts", "Cancel"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });
});

describe("Choose font — actions", () => {
  it("a row writes its stack and closes; Inherit writes inherit", () => {
    const { composer } = composerWithFonts([]);
    const { onChange, onClose } = open(composer);
    fireEvent.click(screen.getByRole("button", { name: "Georgia · System" }));
    expect(onChange).toHaveBeenCalledWith("Georgia, serif");
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Inherit" }));
    expect(onChange).toHaveBeenLastCalledWith("inherit");
  });

  it("Cancel closes without writing", () => {
    const { composer } = composerWithFonts([]);
    const { onChange, onClose } = open(composer);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Manage site fonts opens Site fonts and the search is still there on return — as the last line says", () => {
    const { composer, emit } = composerWithFonts([]);
    const first = open(composer);
    fireEvent.change(screen.getByLabelText("Search fonts"), { target: { value: "Geo" } });
    fireEvent.click(screen.getByRole("button", { name: "Manage site fonts" }));
    expect(emit).toHaveBeenCalledWith("ui:site-fonts", {});
    first.unmount();
    open(composer);
    expect(screen.getByLabelText("Search fonts")).toHaveValue("Geo");
    expect(screen.getByTestId("inspector-choose-font-kept")).toHaveTextContent("Search, scroll and This element → Font are retained.");
  });

  it("read-only refuses every pick", () => {
    const { composer } = composerWithFonts([]);
    const onChange = vi.fn();
    render(
      <InspectorFieldContext.Provider
        value={{ readOnly: true, readOnlyReason: "locked", mixedKeys: new Set(), overrides: new Map(), overrideLabels: {}, resetOverride: () => undefined }}
      >
        <ChooseFont composer={composer} elementId="ro" value="" onChange={onChange} onClose={vi.fn()} />
      </InspectorFieldContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Georgia · System" }));
    fireEvent.click(screen.getByRole("button", { name: "Inherit" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("The Font row — the door to Choose font", () => {
  function Row({ composer, value }: { composer: Composer; value: string }) {
    const sub = useSubview();
    return (
      <>
        <FontPicker value={value} composer={composer} elementId="el" />
        <span data-testid="open-subview">{sub?.kind ?? "none"}</span>
      </>
    );
  }

  it("opens Choose font for its element; an uploaded value reads back as uploaded", () => {
    const { composer } = composerWithFonts(["Inter Var"]);
    render(<Row composer={composer} value="'Inter Var', sans-serif" />);
    const trigger = screen.getByRole("button", { name: "Font family" });
    expect(trigger).toHaveAttribute("data-font-source", "uploaded");
    expect(within(trigger).getByTestId("font-source")).toHaveTextContent("Uploaded");
    fireEvent.click(trigger);
    expect(screen.getByTestId("open-subview")).toHaveTextContent("font-picker");
  });

  it("read-only: legible and focusable, but does not open", () => {
    const { composer } = composerWithFonts([]);
    render(
      <InspectorFieldContext.Provider
        value={{ readOnly: true, readOnlyReason: "locked", mixedKeys: new Set(), overrides: new Map(), overrideLabels: {}, resetOverride: () => undefined }}
      >
        <Row composer={composer} value="'Inter', sans-serif" />
      </InspectorFieldContext.Provider>,
    );
    const trigger = screen.getByRole("button", { name: "Font family" });
    expect(trigger).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(trigger);
    expect(screen.getByTestId("open-subview")).toHaveTextContent("none");
  });
});
