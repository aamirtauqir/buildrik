/**
 * MyTemplates (CRUD interactions) + SaveTemplate (save modal contract).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MyTemplates } from "../MyTemplates";
import { SaveTemplate } from "../SaveTemplate";
import type { Template } from "../TemplateLibrary";

afterEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

const templates: Template[] = [
  { id: "a", name: "Alpha", category: "Custom", thumbnail: "", html: "<div>a</div>", description: "First" },
  { id: "b", name: "Beta", category: "Custom", thumbnail: "", html: "<div>b</div>" },
];

function renderMyTemplates(overrides: Partial<React.ComponentProps<typeof MyTemplates>> = {}) {
  const handlers = {
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
  };
  const utils = render(<MyTemplates templates={templates} {...handlers} {...overrides} />);
  return { ...handlers, ...utils };
}

describe("MyTemplates", () => {
  it("shows the empty state when there are no templates", () => {
    render(
      <MyTemplates templates={[]} onSelect={vi.fn()} onDelete={vi.fn()} onRename={vi.fn()} />
    );
    expect(screen.getByText("No saved templates")).toBeInTheDocument();
    expect(
      screen.getByText("Save your designs as templates to reuse them later.")
    ).toBeInTheDocument();
  });

  it("renders the count badge and list items with description-or-category subtitle", () => {
    renderMyTemplates();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("saved templates")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument(); // description wins
    expect(screen.getByText("Custom")).toBeInTheDocument(); // category fallback
  });

  it("search filters the list by name", () => {
    renderMyTemplates();
    fireEvent.change(screen.getByPlaceholderText("Search my templates..."), {
      target: { value: "alp" },
    });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("'Use' calls onSelect with the template", () => {
    const { onSelect } = renderMyTemplates();
    fireEvent.click(screen.getAllByText("Use")[1]);
    expect(onSelect).toHaveBeenCalledWith(templates[1]);
  });

  it("delete is two-step: first click arms + toasts, second click calls onDelete", () => {
    const { onDelete } = renderMyTemplates();
    const del = screen.getAllByTitle("Delete")[0];

    fireEvent.click(del);
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Click delete again to confirm")).toBeInTheDocument();

    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalledWith("a");
  });

  it("rename: Enter commits the trimmed new name via onRename", () => {
    const { onRename } = renderMyTemplates();
    fireEvent.click(screen.getAllByTitle("Rename")[0]);
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "  Alpha 2  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("a", "Alpha 2");
  });

  it("rename: Escape cancels without calling onRename", () => {
    const { onRename } = renderMyTemplates();
    fireEvent.click(screen.getAllByTitle("Rename")[0]);
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "Nope" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("preview button renders only when onPreview is provided, and calls it", () => {
    const { rerender } = renderMyTemplates();
    expect(screen.queryAllByTitle("Preview")).toHaveLength(0);

    const onPreview = vi.fn();
    rerender(
      <MyTemplates
        templates={templates}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onPreview={onPreview}
      />
    );
    fireEvent.click(screen.getAllByTitle("Preview")[0]);
    expect(onPreview).toHaveBeenCalledWith(templates[0]);
  });
});

describe("SaveTemplate", () => {
  function renderSave() {
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(<SaveTemplate isOpen onClose={onClose} onSave={onSave} />);
    return { onClose, onSave };
  }

  it("disables Save until a name is entered", () => {
    renderSave();
    const save = screen.getByRole("button", { name: "Save Template" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("My Template"), {
      target: { value: "Landing v2" },
    });
    expect(save).not.toBeDisabled();
  });

  it("saves name + default category + description, then closes and resets", async () => {
    const { onSave, onClose } = renderSave();
    fireEvent.change(screen.getByPlaceholderText("My Template"), {
      target: { value: "Landing v2" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe your template..."), {
      target: { value: "Hero + pricing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Template" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      name: "Landing v2",
      category: "Custom",
      description: "Hero + pricing",
    });
  });

  it("Cancel closes without saving", () => {
    const { onSave, onClose } = renderSave();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
