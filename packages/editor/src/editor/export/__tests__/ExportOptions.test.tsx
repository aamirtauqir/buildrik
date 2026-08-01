/**
 * ExportOptions tests — FormatGrid card selector (including the Vue/Next.js
 * coming-soon stubs) and the OptionsPanel toggles/callbacks.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DEFAULT_EXPORT_CONFIG } from "../../../shared/types/export";
import { FormatGrid, OptionsPanel } from "../ExportOptions";

afterEach(cleanup);

describe("FormatGrid", () => {
  // The picker is a radiogroup of chrome-ui FormatRows, not a row of buttons:
  // picking an export format is one exclusive choice, so the control that
  // carries the choice is a radio. Queries below use that role.
  it("renders the three available formats as selectable radios in one group", () => {
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: "Export format" })).toBeInTheDocument();
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

  it("pins the Vue/Next.js stubs: non-interactive rows with a Soon badge", () => {
    // KNOWN pin — Vue and Next.js exports are unimplemented stubs. They must
    // stay unpickable. Asserted on what actually makes them unpickable now:
    // no radio at all (so neither a click nor an arrow key can reach them) and
    // aria-disabled on the row. A disabled radio would still be a radio.
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);

    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getAllByText("Soon")).toHaveLength(2);
    expect(screen.queryByRole("radio", { name: /Vue/ })).toBeNull();
    expect(screen.queryByRole("radio", { name: /Next\.js/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Vue/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Next\.js/ })).toBeNull();

    const vueRow = screen.getByText("Vue").closest("label");
    expect(vueRow).not.toBeNull();
    expect(vueRow).toHaveAttribute("aria-disabled", "true");
    expect(vueRow?.querySelector("input")).toBeNull();
    // pointer-events:none is what stops the click; it now arrives as the
    // aria-disabled: variant rather than an inline style.
    expect(vueRow?.className).toMatch(/aria-disabled:pointer-events-none/);
  });

  it("does not render a JSON card even though the format type includes it", () => {
    // Pin: "json" exists in ExportFormat but is neither available nor
    // advertised as coming soon.
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);
    expect(screen.queryByText("JSON")).toBeNull();
  });
});

describe("OptionsPanel", () => {
  it("edits the page title through onChange", () => {
    const onChange = vi.fn();
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={onChange} />);
    const input = screen.getByDisplayValue("Buildrick Export");
    fireEvent.change(input, { target: { value: "My Site" } });
    expect(onChange).toHaveBeenCalledWith({ pageTitle: "My Site" });
  });

  it("switches CSS style through onChange", () => {
    const onChange = vi.fn();
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "external" }));
    expect(onChange).toHaveBeenCalledWith({ cssStyle: "external" });
    fireEvent.click(screen.getByRole("button", { name: "inline" }));
    expect(onChange).toHaveBeenCalledWith({ cssStyle: "inline" });
  });

  it("renders the four toggles reflecting the config state", () => {
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Minify output")).not.toBeChecked();
    expect(screen.getByLabelText("Include reset CSS")).toBeChecked();
    expect(screen.getByLabelText("Include meta tags")).toBeChecked();
    expect(screen.getByLabelText("Include viewport meta")).toBeChecked();
  });

  it("fires onChange with the flipped value for each toggle", () => {
    const onChange = vi.fn();
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Minify output"));
    expect(onChange).toHaveBeenLastCalledWith({ minify: true });

    fireEvent.click(screen.getByLabelText("Include reset CSS"));
    expect(onChange).toHaveBeenLastCalledWith({ includeResetCSS: false });

    fireEvent.click(screen.getByLabelText("Include meta tags"));
    expect(onChange).toHaveBeenLastCalledWith({ includeMeta: false });

    fireEvent.click(screen.getByLabelText("Include viewport meta"));
    expect(onChange).toHaveBeenLastCalledWith({ includeViewport: false });
  });

  it("hides the CMS section by default", () => {
    render(<OptionsPanel config={DEFAULT_EXPORT_CONFIG} onChange={vi.fn()} />);
    expect(screen.queryByText("CMS Content")).toBeNull();
  });

  it("shows CMS mode buttons when the project has CMS bindings", () => {
    const onCMSChange = vi.fn();
    render(
      <OptionsPanel
        config={DEFAULT_EXPORT_CONFIG}
        onChange={vi.fn()}
        hasCMSBindings
        onCMSChange={onCMSChange}
      />
    );
    expect(screen.getByText("CMS Content")).toBeInTheDocument();
    expect(screen.getByText("CMS bindings will not be resolved in export.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Template" }));
    expect(onCMSChange).toHaveBeenCalledWith({ mode: "template" });
    fireEvent.click(screen.getByRole("button", { name: "Embed Data" }));
    expect(onCMSChange).toHaveBeenCalledWith({ mode: "static" });
  });

  it("shows template syntax options only in template mode", () => {
    const onCMSChange = vi.fn();
    render(
      <OptionsPanel
        config={DEFAULT_EXPORT_CONFIG}
        onChange={vi.fn()}
        hasCMSBindings
        onCMSChange={onCMSChange}
        cmsSettings={{ mode: "template", syntax: "handlebars" }}
      />
    );
    expect(screen.getByText("Template Syntax")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "liquid" }));
    expect(onCMSChange).toHaveBeenCalledWith({ syntax: "liquid" });
  });
});
