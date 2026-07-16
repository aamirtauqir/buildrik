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
  it("renders the three available formats as selectable buttons", () => {
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /HTML/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ZIP/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /React/ })).toBeInTheDocument();
  });

  it("fires onFormatChange with the clicked format", () => {
    const onFormatChange = vi.fn();
    render(<FormatGrid selectedFormat="html" onFormatChange={onFormatChange} />);
    fireEvent.click(screen.getByRole("button", { name: /React/ }));
    expect(onFormatChange).toHaveBeenCalledWith("react");
    fireEvent.click(screen.getByRole("button", { name: /ZIP/ }));
    expect(onFormatChange).toHaveBeenCalledWith("zip");
  });

  it("pins the Vue/Next.js stubs: non-interactive cards with a Soon badge", () => {
    // KNOWN pin — Vue and Next.js exports are unimplemented stubs. They must
    // render as disabled "coming soon" cards, NOT as buttons.
    render(<FormatGrid selectedFormat="html" onFormatChange={vi.fn()} />);

    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getAllByText("Soon")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Vue/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Next\.js/ })).toBeNull();

    const vueCard = screen.getByText("Vue").closest('[title="Coming soon"]');
    expect(vueCard).not.toBeNull();
    expect((vueCard as HTMLElement).style.pointerEvents).toBe("none");
    expect((vueCard as HTMLElement).style.opacity).toBe("0.5");
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
    const input = screen.getByDisplayValue("Aquibra Export");
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
