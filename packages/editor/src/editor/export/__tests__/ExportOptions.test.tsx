/**
 * ExportOptions tests — the Format row (three radios) and the OptionsPanel
 * toggles/callbacks.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DEFAULT_EXPORT_CONFIG } from "@/shared/types/export";
import { FormatGrid, OptionsPanel } from "../ExportOptions";

afterEach(cleanup);

describe("FormatGrid", () => {
  // The picker is a radiogroup of chrome-ui FormatRows, not a row of buttons:
  // picking an export format is one exclusive choice, so the control that
  // carries the choice is a radio. Queries below use that role.
  it("renders the three available formats as selectable radios in one group", () => {
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: "Format" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /HTML/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /ZIP/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /React/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /HTML/ })).toBeChecked();
  });

  it("fires onFormatChange with the clicked format", () => {
    const onFormatChange = vi.fn();
    render(<FormatGrid selectedFormat="html" onFormatChange={onFormatChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /React/ }));
    expect(onFormatChange).toHaveBeenCalledWith("react");
    fireEvent.click(screen.getByRole("radio", { name: /ZIP/ }));
    expect(onFormatChange).toHaveBeenCalledWith("zip");
  });

  it("offers the board's three formats only — no Vue / Next.js stubs (2L9 B8-EX01)", () => {
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.queryByText("Vue")).toBeNull();
    expect(screen.queryByText("Soon")).toBeNull();
  });

  it("does not render a JSON card even though the format type includes it", () => {
    // Pin: "json" exists in ExportFormat but is neither available nor
    // advertised as coming soon.
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);
    expect(screen.queryByText("JSON")).toBeNull();
  });
});

describe("OptionsPanel (2L9 B8-EX03 label / value rows)", () => {
  it("draws the board's rows and keeps every option", () => {
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={vi.fn()} />);
    for (const label of ["Page title", "CSS", "Minify", "CSS reset", "Meta and viewport"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("CSS")).toHaveValue("embedded");
    expect(screen.getByLabelText("Minify")).toHaveValue("off");
    expect(screen.getByLabelText("CSS reset")).toHaveValue("include");
    expect(screen.getByLabelText("Meta and viewport")).toHaveValue("both");
  });

  it("each row writes its own flags", () => {
    const onChange = vi.fn();
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("CSS"), { target: { value: "external" } });
    expect(onChange).toHaveBeenLastCalledWith({ cssStyle: "external" });
    fireEvent.change(screen.getByLabelText("Minify"), { target: { value: "on" } });
    expect(onChange).toHaveBeenLastCalledWith({ minify: true });
    fireEvent.change(screen.getByLabelText("CSS reset"), { target: { value: "leave-out" } });
    expect(onChange).toHaveBeenLastCalledWith({ includeResetCSS: false });
    fireEvent.change(screen.getByLabelText("Meta and viewport"), { target: { value: "viewport" } });
    expect(onChange).toHaveBeenLastCalledWith({ includeMeta: false, includeViewport: true });
    fireEvent.change(screen.getByLabelText("Page title"), { target: { value: "Fieldwork" } });
    expect(onChange).toHaveBeenLastCalledWith({ pageTitle: "Fieldwork" });
  });

  it("CMS content appears only with bindings; Template adds its syntax row", () => {
    const onCMSChange = vi.fn();
    const { rerender } = render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={vi.fn()} />);
    expect(screen.queryByLabelText("CMS content")).toBeNull();
    rerender(
      <OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={vi.fn()} hasCMSBindings onCMSChange={onCMSChange} cmsSettings={{ mode: "template", syntax: "liquid" }} />,
    );
    fireEvent.change(screen.getByLabelText("CMS content"), { target: { value: "static" } });
    expect(onCMSChange).toHaveBeenLastCalledWith({ mode: "static" });
    expect(screen.getByLabelText("Template syntax")).toHaveValue("liquid");
  });
});
