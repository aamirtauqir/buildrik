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
import { render, screen } from "@testing-library/react";
import { Avatar, Checkbox, Radio, Select, TextInput, ToggleSwitch } from "flowbite-react";
import { avatarInitials, AVATAR_TONE_THEME, type AvatarTone } from "../avatarTone";
import { BK_SELECT_BASE_THEME } from "../selectTheme";
import { BK_TEXT_INPUT_THEME } from "../textInputTheme";

describe("TextInput", () => {
  it("puts `className` on the OUTER wrapper div, never on the <input> itself — the theme prop is the only way to restyle the field", () => {
    // Same structural gap as Select (see the "Select" describe block below):
    // flowbite's TextInput.js destructures `className` and applies it only
    // to `theme.base`'s wrapping <div>; the <input> only ever receives
    // classes resolved from `theme.field.input.*`. Every real consumer that
    // needs the input's own border/background/focus-ring corrected uses the
    // `theme` prop (textInputTheme.ts) instead of `className`.
    const { container } = render(
      <TextInput className="probe-outer" theme={BK_TEXT_INPUT_THEME} aria-label="Domain" />,
    );
    expect(container.querySelector("input")?.className).not.toMatch(/probe-outer/);
    expect(container.querySelector(".probe-outer")?.tagName).toBe("DIV");
    expect(container.querySelector("input")?.className).toMatch(/tw:bg-white/);
  });

  it("marks the error state for assistive tech via the built-in aria-invalid variant", () => {
    render(<TextInput theme={BK_TEXT_INPUT_THEME} aria-invalid aria-label="Domain" defaultValue="bellacucina.com" />);
    const input = screen.getByLabelText("Domain");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toMatch(/aria-invalid:border-\[var\(--bk-error\)\]/);
  });

  it("has no aria-invalid when healthy", () => {
    render(<TextInput theme={BK_TEXT_INPUT_THEME} aria-label="Domain" />);
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

  it("puts `className` on the OUTER wrapper div, never on the <select> itself — the theme prop is the only way to restyle the field", () => {
    // Structural gap vs the deleted ui/Select.tsx (a bare <select
    // className="bk-select">): flowbite's Select.js destructures
    // `className` and applies it only to `theme.base`'s wrapping <div>;
    // the <select> only ever receives theme.field.select.* classes. Every
    // real consumer that needs the select's own border/background/focus
    // ring corrected uses the `theme` prop (selectTheme.ts) instead of
    // `className` for exactly this reason.
    const { container } = render(
      <Select className="probe-outer" theme={BK_SELECT_BASE_THEME} aria-label="x">
        <option value="a">a</option>
      </Select>,
    );
    expect(container.querySelector("select")?.className).not.toMatch(/probe-outer/);
    expect(container.querySelector(".probe-outer")?.tagName).toBe("DIV");
    expect(container.querySelector("select")?.className).toMatch(/tw:bg-white/);
  });
});

describe("Checkbox", () => {
  it("indeterminate is CSS-only in flowbite — it does not set the native DOM property", () => {
    // Structural gap vs the deleted ui/Checkbox.tsx (which set
    // ref.current.indeterminate via a useEffect): flowbite's Checkbox only
    // uses `indeterminate` to switch a dash-icon CSS class in
    // (Checkbox/theme.js) — it never touches the DOM property, so
    // `:indeterminate` CSS matching and native tri-state a11y semantics
    // don't fire. Confirmed via a full-repo sweep that no consumer passes
    // `indeterminate` today, so this is documented rather than adapted —
    // a future consumer needing the real DOM property will need a small
    // ref-based fix at that time.
    render(<Checkbox indeterminate aria-label="Select all" />);
    expect((screen.getByLabelText("Select all") as HTMLInputElement).indeterminate).toBe(false);
  });
});

describe("Toggle (flowbite ToggleSwitch)", () => {
  it("is a switch so screen readers announce on/off — aria-label survives the internal dangling aria-labelledby", () => {
    // ToggleSwitch is a controlled-only <button role="switch"> (plus a
    // hidden sr-only checkbox for form semantics) — no defaultChecked/
    // uncontrolled mode, unlike the deleted ui/Toggle.tsx. It always sets
    // aria-labelledby pointing at its own internal label span, but that
    // span only renders when a `label` prop is passed — with none here,
    // aria-labelledby dangles. Verified empirically (not just read from
    // spec) that testing-library's accessible-name computation still
    // falls back to aria-label in that case.
    render(<ToggleSwitch checked aria-label="Force HTTPS" onChange={() => {}} />);
    const el = screen.getByRole("switch", { name: "Force HTTPS" });
    expect(el.getAttribute("aria-checked")).toBe("true");
  });
});

describe("Radio", () => {
  it("renders as a radio input", () => {
    render(<Radio name="g" aria-label="Static HTML" />);
    expect(screen.getByRole("radio", { name: "Static HTML" })).toBeTruthy();
  });
});

describe("Avatar (flowbite-react + avatarTone helper)", () => {
  it("avatarInitials derives up to 2 initials from a name", () => {
    expect(avatarInitials("Sara Ahmed")).toBe("SA");
    expect(avatarInitials("Cher")).toBe("C");
  });

  it("falls back to initials when there is no image", () => {
    render(<Avatar rounded placeholderInitials={avatarInitials("Sara Ahmed")} />);
    expect(screen.getByText("SA")).toBeTruthy();
  });

  it("renders the image with an empty alt, since the title carries the name", () => {
    const { container } = render(<Avatar rounded alt="" img="/a.png" title="Imran Q." />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("");
  });

  it("AVATAR_TONE_THEME covers every AvatarTone with a recolored initials background", () => {
    const tones: AvatarTone[] = ["neutral", "blue", "green", "purple", "amber"];
    for (const tone of tones) {
      expect(AVATAR_TONE_THEME[tone].root?.img?.off).toMatch(/^tw:bg-/);
    }
  });
});

