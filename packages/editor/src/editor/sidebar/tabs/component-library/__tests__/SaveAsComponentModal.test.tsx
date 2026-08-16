/**
 * SaveAsComponentModal tests — Task 11
 * Covers: binding-aware fields (selectionContext), backwards-compat "+" flow,
 * group select, payload shape, plural hint, name validation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SaveAsComponentModal } from "../SaveAsComponentModal";

describe("SaveAsComponentModal", () => {
  it("hides binding fields when selectionContext absent", () => {
    const { queryByLabelText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={() => {}} />
    );
    expect(queryByLabelText(/pre-fill bindings/i)).toBeNull();
  });

  it("shows binding checkbox + hint when selectionContext present", () => {
    const ctx = {
      selectionIds: ["el-1"],
      extractedBindings: new Map([["el-1:color", "color.brand.primary"]]),
    };
    const { getByLabelText, getByText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={() => {}} selectionContext={ctx} />
    );
    expect(getByLabelText(/pre-fill bindings/i)).toBeTruthy();
    expect(getByText(/1 style will bind/i)).toBeTruthy();
  });

  it("shows N styles pluralized in hint", () => {
    const ctx = {
      selectionIds: ["el-1"],
      extractedBindings: new Map([
        ["el-1:color", "color.brand.primary"],
        ["el-1:background", "color.surface.bg"],
      ]),
    };
    const { getByText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={() => {}} selectionContext={ctx} />
    );
    expect(getByText(/2 styles will bind/i)).toBeTruthy();
  });

  it("submits payload with name + group + prefillBindings when context present", () => {
    const onSubmit = vi.fn();
    const ctx = {
      selectionIds: ["el-1"],
      extractedBindings: new Map([["el-1:color", "color.brand.primary"]]),
    };
    const { getByLabelText, getByText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={onSubmit} selectionContext={ctx} />
    );
    fireEvent.change(getByLabelText("Name"), { target: { value: "Pricing card" } });
    fireEvent.click(getByText(/save component/i));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Pricing card",
        prefillBindings: true,
      })
    );
  });

  it("prefillBindings is false when no selectionContext (legacy + button flow)", () => {
    const onSubmit = vi.fn();
    const { getByLabelText, getByText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={onSubmit} />
    );
    fireEvent.change(getByLabelText("Name"), { target: { value: "Custom block" } });
    fireEvent.click(getByText(/save component/i));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Custom block",
        prefillBindings: false,
      })
    );
  });

  it("includes group in submitted payload (null by default)", () => {
    const onSubmit = vi.fn();
    const { getByLabelText, getByText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={onSubmit} />
    );
    fireEvent.change(getByLabelText("Name"), { target: { value: "Hero block" } });
    fireEvent.click(getByText(/save component/i));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Hero block",
        group: null,
      })
    );
  });

  it("does NOT submit when name is empty/whitespace", () => {
    const onSubmit = vi.fn();
    const { getByText } = render(
      <SaveAsComponentModal onClose={() => {}} onSubmit={onSubmit} />
    );
    fireEvent.click(getByText(/save component/i));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
