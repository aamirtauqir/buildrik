/**
 * Atoms — contract tests.
 *
 * These assert the API surface (props -> classes, a11y wiring), not pixels.
 * Pixel truth lives in Figma and reaches the DOM through generated tokens, so
 * asserting colours here would only re-test the generator.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, Input, Select, Checkbox, Radio, Toggle, Badge, StatusDot, Avatar } from "../index";

describe("Button", () => {
  it("defaults to a primary md button that does not submit forms", () => {
    render(<Button>Publish</Button>);
    const btn = screen.getByRole("button", { name: "Publish" });
    expect(btn.className).toContain("bk-btn--primary");
    expect(btn.className).toContain("bk-btn--md");
    expect(btn.getAttribute("type")).toBe("button");
  });

  it("loading disables the button and announces busy", () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button", { name: "Saving" });
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it.each(["primary", "secondary", "ghost", "destructive"] as const)("renders the %s kind", (kind) => {
    render(<Button kind={kind}>x</Button>);
    expect(screen.getByRole("button").className).toContain(`bk-btn--${kind}`);
  });
});

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
