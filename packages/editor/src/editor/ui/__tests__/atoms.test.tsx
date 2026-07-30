/**
 * Atoms — contract tests.
 *
 * These assert the API surface (props -> classes, a11y wiring), not pixels.
 * Pixel truth lives in Figma and reaches the DOM through generated tokens, so
 * asserting colours here would only re-test the generator.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input, Select, Checkbox, Radio, Toggle, Slider, Badge, StatusDot, Avatar } from "../index";

describe("Input", () => {
  it("marks the error state for assistive tech, not just visually", () => {
    render(<Input error aria-label="Domain" defaultValue="bellacucina.com" />);
    expect(screen.getByLabelText("Domain").getAttribute("aria-invalid")).toBe("true");
  });

  it("has no aria-invalid when healthy", () => {
    render(<Input aria-label="Domain" />);
    expect(screen.getByLabelText("Domain").getAttribute("aria-invalid")).toBeNull();
  });
});

describe("Select", () => {
  it("renders its options", () => {
    render(
      <Select aria-label="Locale" defaultValue="en">
        <option value="en">English</option>
        <option value="fr">French</option>
      </Select>,
    );
    expect((screen.getByLabelText("Locale") as HTMLSelectElement).value).toBe("en");
  });
});

describe("Checkbox", () => {
  it("applies indeterminate as a DOM property", () => {
    render(<Checkbox indeterminate aria-label="Select all" />);
    expect((screen.getByLabelText("Select all") as HTMLInputElement).indeterminate).toBe(true);
  });
});

describe("Toggle", () => {
  it("is a switch so screen readers announce on/off", () => {
    render(<Toggle aria-label="Force HTTPS" defaultChecked />);
    const el = screen.getByRole("switch", { name: "Force HTTPS" });
    expect((el as HTMLInputElement).checked).toBe(true);
  });
});

describe("Radio", () => {
  it("renders as a radio input", () => {
    render(<Radio name="g" aria-label="Static HTML" />);
    expect(screen.getByRole("radio", { name: "Static HTML" })).toBeTruthy();
  });
});

describe("Badge", () => {
  it.each(["neutral", "success", "warning", "danger", "pro"] as const)("renders the %s kind", (kind) => {
    render(<Badge kind={kind}>LIVE</Badge>);
    expect(screen.getByText("LIVE").className).toContain(`bk-badge--${kind}`);
  });
});

describe("StatusDot", () => {
  it("never leans on colour alone", () => {
    render(<StatusDot state="failed" />);
    expect(screen.getByRole("img", { name: "Failed" })).toBeTruthy();
  });

  it("accepts a caller label", () => {
    render(<StatusDot state="live" label="Published 2m ago" />);
    expect(screen.getByRole("img", { name: "Published 2m ago" })).toBeTruthy();
  });
});

describe("Avatar", () => {
  it("falls back to initials when there is no image", () => {
    render(<Avatar name="Sara Ahmed" />);
    expect(screen.getByText("SA")).toBeTruthy();
  });

  it("renders the image with an empty alt, since the title carries the name", () => {
    const { container } = render(<Avatar name="Imran Q." src="/a.png" />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("");
  });
});

describe("Slider (92:30)", () => {
  it("renders a range input with the accessible name and value", () => {
    const onChange = vi.fn();
    render(<Slider label="Opacity" value={62} min={0} max={100} onChange={onChange} />);
    const range = screen.getByRole("slider", { name: "Opacity" });
    expect(range).toHaveValue("62");
    fireEvent.change(range, { target: { value: "70" } });
    expect(onChange).toHaveBeenCalledWith(70);
  });

  it("numeric field mirrors the value, clamps to max, and hides via withField", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Slider label="Opacity" value={62} min={0} max={100} onChange={onChange} unit="%" />);
    const num = screen.getByRole("spinbutton", { name: "Opacity value" });
    expect(num).toHaveValue(62);
    fireEvent.change(num, { target: { value: "250" } });
    expect(onChange).toHaveBeenCalledWith(100);
    rerender(<Slider label="Opacity" value={62} onChange={onChange} withField={false} />);
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("disabled disables both inputs", () => {
    render(<Slider label="Opacity" value={10} onChange={() => {}} disabled />);
    expect(screen.getByRole("slider", { name: "Opacity" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "Opacity value" })).toBeDisabled();
  });
});
