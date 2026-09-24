/**
 * Sources / Variables row ⋯ (6930:80567 — Rename · Re-sync · Delete…).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { DataSource } from "@/shared/types/data";
import { SourcesView, VariablesView, type SourceRowActions } from "../ContentViews";

afterEach(() => cleanup());

const SRC: DataSource = { id: "products", name: "products", type: "array", data: [{ name: "Tea" }] };

function sources(refreshed: boolean) {
  const actions: SourceRowActions = {
    rename: vi.fn(),
    refresh: vi.fn(() => Promise.resolve(refreshed)),
    replaceData: vi.fn(),
    remove: vi.fn(),
  };
  render(<SourcesView sources={[SRC]} onBack={() => {}} onImportJson={() => null} actions={actions} />);
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Actions for products" }));
  return { actions, open };
}

describe("Sources ⋯", () => {
  it("renames through the dialog", () => {
    const { actions, open } = sources(false);
    open();
    fireEvent.click(screen.getByTestId("content-source-rename-products"));
    fireEvent.change(screen.getByTestId("content-source-rename-input"), { target: { value: "Products" } });
    fireEvent.click(screen.getByTestId("content-source-rename-save"));
    expect(actions.rename).toHaveBeenCalledWith("products", "Products");
  });

  it("re-syncs a provider-backed source in place", async () => {
    const { actions, open } = sources(true);
    open();
    fireEvent.click(screen.getByTestId("content-source-resync-products"));
    await waitFor(() => expect(actions.refresh).toHaveBeenCalledWith("products"));
    expect(screen.queryByTestId("content-source-resync")).toBeNull();
  });

  it("asks imported JSON for its current data, opening on what the site holds", async () => {
    const { actions, open } = sources(false);
    open();
    fireEvent.click(screen.getByTestId("content-source-resync-products"));
    const box = await screen.findByTestId("content-source-resync-json");
    expect(JSON.parse((box as HTMLTextAreaElement).value)).toEqual([{ name: "Tea" }]);
    fireEvent.change(box, { target: { value: "{bad" } });
    fireEvent.click(screen.getByTestId("content-source-resync-save"));
    expect(screen.getByTestId("content-source-resync-error")).toHaveTextContent("Not valid JSON");
    fireEvent.change(box, { target: { value: '[{"name":"Coffee"}]' } });
    fireEvent.click(screen.getByTestId("content-source-resync-save"));
    expect(actions.replaceData).toHaveBeenCalledWith("products", [{ name: "Coffee" }]);
  });

  it("deletes only after the confirm", () => {
    const { actions, open } = sources(false);
    open();
    fireEvent.click(screen.getByTestId("content-source-delete-products"));
    expect(actions.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete source" }));
    expect(actions.remove).toHaveBeenCalledWith("products");
  });
});

describe("Variables ⋯", () => {
  const VARS = [
    { key: "phone", value: "555" },
    { key: "email", value: "a@b.c" },
  ];
  function mount() {
    const onChange = vi.fn();
    render(<VariablesView variables={VARS} onBack={() => {}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for phone" }));
    return onChange;
  }

  it("renames the key, refusing one that is taken", () => {
    const onChange = mount();
    fireEvent.click(screen.getByTestId("content-var-rename-phone"));
    fireEvent.change(screen.getByTestId("content-var-rename-input"), { target: { value: "email" } });
    expect(screen.getByTestId("content-var-rename-error")).toHaveTextContent("already exists");
    expect(screen.getByTestId("content-var-rename-save")).toBeDisabled();
    fireEvent.change(screen.getByTestId("content-var-rename-input"), { target: { value: "tel" } });
    fireEvent.click(screen.getByTestId("content-var-rename-save"));
    expect(onChange).toHaveBeenCalledWith([{ key: "tel", value: "555" }, VARS[1]]);
  });

  it("keeps Edit value, and deletes only after the confirm", () => {
    const onChange = mount();
    expect(screen.getByTestId("content-var-edit-phone")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("content-var-delete-phone"));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete variable" }));
    expect(onChange).toHaveBeenCalledWith([VARS[1]]);
  });
});
