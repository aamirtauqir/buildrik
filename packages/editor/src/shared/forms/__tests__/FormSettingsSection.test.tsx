/**
 * FormSettingsSection tests — inspector section states (non-form hint,
 * enable CTA, configured fields), persistence via element.setData, and
 * FormHandler registration through the composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { FormSettingsSection } from "../FormSettingsSection";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";
import type { FormConfig } from "../../../engine/forms/FormHandler";

afterEach(cleanup);

function createMockElement(tagName: string, data: Record<string, unknown> = {}) {
  const store: Record<string, unknown> = { ...data };
  return {
    store,
    getCustomData: vi.fn((key: string) => store[key]),
    setData: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    getTagName: vi.fn(() => tagName),
  };
}

function createMockComposer() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    forms: {
      registerForm: vi.fn(),
      unregisterForm: vi.fn(),
      getFormConfig: vi.fn((): FormConfig | undefined => undefined),
      getFormState: vi.fn(() => undefined),
      submitForm: vi.fn().mockResolvedValue(undefined),
      setFieldValue: vi.fn(),
      resetForm: vi.fn(),
    },
  };
}

type MockElement = ReturnType<typeof createMockElement>;
const asElement = (m: MockElement) => m as unknown as Element;
const asComposer = (m: ReturnType<typeof createMockComposer>) => m as unknown as Composer;

const baseConfig: FormConfig = {
  formId: "form-1",
  action: "submit",
  successMessage: "Thanks!",
  errorMessage: "Oops.",
};

describe("FormSettingsSection — element states", () => {
  it("shows a hint for non-form elements", () => {
    const element = createMockElement("div");
    render(<FormSettingsSection element={asElement(element)} />);
    expect(
      screen.getByText("Select a form element to configure submission settings.")
    ).toBeInTheDocument();
  });

  it("shows the enable CTA for a form without a formId", () => {
    const element = createMockElement("form");
    render(<FormSettingsSection element={asElement(element)} />);
    expect(screen.getByRole("button", { name: "Enable Form Handling" })).toBeInTheDocument();
  });

  it("enabling creates a formId + default config, persists, and registers", () => {
    const element = createMockElement("form");
    const composer = createMockComposer();
    const onConfigChange = vi.fn();
    render(
      <FormSettingsSection
        element={asElement(element)}
        composer={asComposer(composer)}
        onConfigChange={onConfigChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Enable Form Handling" }));

    expect(element.setData).toHaveBeenCalledWith("formId", expect.stringMatching(/^form-\d+$/));
    expect(element.setData).toHaveBeenCalledWith(
      "formConfig",
      expect.objectContaining({ action: "submit" })
    );
    expect(composer.forms.registerForm).toHaveBeenCalledWith(
      expect.objectContaining({ action: "submit" })
    );
    expect(onConfigChange).toHaveBeenCalledTimes(1);

    // UI switched to the configured view.
    expect(screen.getByText("Form ID")).toBeInTheDocument();
  });
});

describe("FormSettingsSection — configured form", () => {
  function renderConfigured(config: FormConfig = baseConfig) {
    const element = createMockElement("form", {
      formId: config.formId,
      formConfig: config,
    });
    const composer = createMockComposer();
    const onConfigChange = vi.fn();
    render(
      <FormSettingsSection
        element={asElement(element)}
        composer={asComposer(composer)}
        onConfigChange={onConfigChange}
      />
    );
    return { element, composer, onConfigChange };
  }

  it("renders the stored config values", () => {
    renderConfigured();
    expect(screen.getByText("form-1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Thanks!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Oops.")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("submit");
  });

  it("prefers the FormHandler's config over the element-stored copy", () => {
    const element = createMockElement("form", {
      formId: "form-1",
      formConfig: baseConfig,
    });
    const composer = createMockComposer();
    composer.forms.getFormConfig.mockReturnValue({
      ...baseConfig,
      successMessage: "From handler",
    });

    render(
      <FormSettingsSection element={asElement(element)} composer={asComposer(composer)} />
    );
    expect(screen.getByDisplayValue("From handler")).toBeInTheDocument();
  });

  it("switching action to webhook reveals the URL field and persists", () => {
    const { element, composer, onConfigChange } = renderConfigured();

    expect(screen.queryByPlaceholderText("https://...")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "webhook" } });

    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
    expect(element.setData).toHaveBeenCalledWith(
      "formConfig",
      expect.objectContaining({ action: "webhook" })
    );
    expect(composer.forms.registerForm).toHaveBeenCalledWith(
      expect.objectContaining({ action: "webhook" })
    );
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ action: "webhook" }));
  });

  it("editing the success message persists the merged config", () => {
    const { element } = renderConfigured();

    fireEvent.change(screen.getByDisplayValue("Thanks!"), {
      target: { value: "Submission received" },
    });

    expect(element.setData).toHaveBeenCalledWith(
      "formConfig",
      expect.objectContaining({ successMessage: "Submission received", action: "submit" })
    );
  });

  it("works without a composer (persists to the element only)", () => {
    const element = createMockElement("form", {
      formId: "form-1",
      formConfig: baseConfig,
    });
    render(<FormSettingsSection element={asElement(element)} />);

    fireEvent.change(screen.getByDisplayValue("Oops."), { target: { value: "Try later" } });
    expect(element.setData).toHaveBeenCalledWith(
      "formConfig",
      expect.objectContaining({ errorMessage: "Try later" })
    );
  });
});
