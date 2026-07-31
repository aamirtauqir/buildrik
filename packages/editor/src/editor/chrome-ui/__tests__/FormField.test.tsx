/**
 * Field primitives — contract tests.
 *
 * Popover/Menu moved to `chrome-ui/__tests__/Popover.test.tsx` (Task 6,
 * flowbite big-bang) when Popover ported to chrome-ui.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "../index";
import { Label, HelperText } from "flowbite-react";
import { BK_LABEL_CLASS, BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS } from "../labelTheme";

describe("FormField", () => {
  it("wires label, hint and control together", () => {
    render(
      <FormField label="Domain" hint="No protocol, no trailing slash">
        {(p) => <input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Domain");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("No protocol, no trailing slash")).toBeTruthy();
  });

  it("an error replaces the hint, is announced, and marks the control invalid", () => {
    render(
      <FormField label="Slug" hint="Lowercase" error="That slug is taken">
        {(p) => <input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Slug");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("That slug is taken");
    expect(screen.queryByText("Lowercase")).toBeNull();
  });

  it("marks required fields", () => {
    const { container } = render(<FormField label="Name" required>{(p) => <input {...p} />}</FormField>);
    expect(container.querySelector('label [aria-hidden="true"]')?.textContent).toBe("*");
  });
});

describe("Label / HelperText overrides (labelTheme.ts)", () => {
  // Positive assertions on the resolved className — flowbite's own Label/
  // HelperText no longer need a contract test here (that's testing the
  // library, not our code); this only verifies OUR override strings survive
  // flowbite's twMerge and land on the real element.
  it("BK_LABEL_CLASS lands on the real <label>", () => {
    render(<Label htmlFor="x" className={BK_LABEL_CLASS}>Title</Label>);
    const label = screen.getByText("Title");
    expect(label.className).toMatch(/tw:text-gray-600/);
    expect(label.className).not.toMatch(/\btext-gray-900\b/);
  });

  it("BK_HELPER_CLASS neutralizes flowbite's default top margin", () => {
    render(<HelperText className={BK_HELPER_CLASS}>hint</HelperText>);
    const helper = screen.getByText("hint");
    expect(helper.className).toMatch(/tw:mt-0/);
    expect(helper.className).not.toMatch(/\bmt-2\b/);
  });

  it("BK_HELPER_ERROR_CLASS evicts flowbite's default red for the exact --bk-error-text match", () => {
    render(
      <HelperText color="failure" className={BK_HELPER_ERROR_CLASS}>
        bad
      </HelperText>,
    );
    const helper = screen.getByText("bad");
    expect(helper.className).toMatch(/tw:text-\[var\(--bk-error-text\)\]/);
    expect(helper.className).not.toMatch(/\btext-red-600\b/);
  });
});
