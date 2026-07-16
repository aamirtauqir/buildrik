// @vitest-environment jsdom
/**
 * CreateComponentModal.test.tsx — the save-as-component form machine: name
 * validation gate, payload shaping (trim, comma-split tags, variant presets,
 * prefill flag), success/failure/throw toasts, and reset-on-close.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { CreateComponentModal } from "../CreateComponentModal";

const { addToastMock } = vi.hoisted(() => ({ addToastMock: vi.fn() }));

vi.mock("@/editor/shared/vibcoder", async (importActual) => {
  const actual = await importActual<typeof import("@/editor/shared/vibcoder")>();
  return { ...actual, useToast: () => ({ addToast: addToastMock }) };
});

function makeComposer(createComponent = vi.fn().mockResolvedValue({ id: "c1" })) {
  return { components: { createComponent } } as never;
}

function renderModal(over: Partial<Parameters<typeof CreateComponentModal>[0]> = {}) {
  const onClose = vi.fn();
  const composer = over.composer ?? makeComposer();
  const utils = render(
    <CreateComponentModal
      isOpen
      onClose={onClose}
      composer={composer}
      elementId="el-1"
      {...over}
    />,
  );
  return { onClose, composer, ...utils };
}

const nameInput = () => screen.getByPlaceholderText("e.g., Hero Section");
const createBtn = () => screen.getByRole("button", { name: /Create Component/i });

beforeEach(() => {
  cleanup();
  addToastMock.mockClear();
});

describe("CreateComponentModal — name gate", () => {
  it("disables Create until a non-blank name is entered", () => {
    renderModal();
    expect(createBtn()).toBeDisabled();
    fireEvent.change(nameInput(), { target: { value: "Hero" } });
    expect(createBtn()).toBeEnabled();
    // Whitespace-only stays disabled.
    fireEvent.change(nameInput(), { target: { value: "   " } });
    expect(createBtn()).toBeDisabled();
  });
});

describe("CreateComponentModal — submit payload", () => {
  it("creates with trimmed name, comma-split tags, and prefill on by default", async () => {
    const createComponent = vi.fn().mockResolvedValue({ id: "c1" });
    const { onClose } = renderModal({ composer: makeComposer(createComponent) });

    fireEvent.change(nameInput(), { target: { value: "  Hero  " } });
    fireEvent.change(screen.getByPlaceholderText(/Optional description/i), {
      target: { value: " a card " },
    });
    fireEvent.change(screen.getByPlaceholderText(/Headers, Footers, Cards/i), {
      target: { value: "Headers" },
    });
    fireEvent.change(screen.getByPlaceholderText(/comma-separated/i), {
      target: { value: "responsive, dark-mode ,hero" },
    });

    fireEvent.click(createBtn());

    await waitFor(() =>
      expect(createComponent).toHaveBeenCalledWith("Hero", "el-1", {
        description: "a card",
        category: "Headers",
        tags: ["responsive", "dark-mode", "hero"],
        variantProperties: undefined,
        prefillFromDs: true,
      }),
    );
    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ tone: "success" })),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("omits empty optional fields (description/category/tags → undefined)", async () => {
    const createComponent = vi.fn().mockResolvedValue({ id: "c1" });
    renderModal({ composer: makeComposer(createComponent) });

    fireEvent.change(nameInput(), { target: { value: "Bare" } });
    fireEvent.click(createBtn());

    await waitFor(() =>
      expect(createComponent).toHaveBeenCalledWith(
        "Bare",
        "el-1",
        expect.objectContaining({
          description: undefined,
          category: undefined,
          tags: undefined,
        }),
      ),
    );
  });

  it("passes prefillFromDs=false when the toggle is unchecked", async () => {
    const createComponent = vi.fn().mockResolvedValue({ id: "c1" });
    renderModal({ composer: makeComposer(createComponent) });

    fireEvent.change(nameInput(), { target: { value: "NoPrefill" } });
    // Checkbox [1] is the "Pre-fill from DS styles" toggle (default checked).
    const prefill = screen.getAllByRole("checkbox")[1];
    fireEvent.click(prefill);
    fireEvent.click(createBtn());

    await waitFor(() =>
      expect(createComponent).toHaveBeenCalledWith(
        "NoPrefill",
        "el-1",
        expect.objectContaining({ prefillFromDs: false }),
      ),
    );
  });
});

describe("CreateComponentModal — variant set", () => {
  it("reveals preset chips and includes the selected variant properties", async () => {
    const createComponent = vi.fn().mockResolvedValue({ id: "c1" });
    renderModal({ composer: makeComposer(createComponent) });

    fireEvent.change(nameInput(), { target: { value: "VariantCard" } });
    // Chips hidden until the variant-set checkbox is on.
    expect(screen.queryByRole("button", { name: /Size/ })).toBeNull();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    fireEvent.click(screen.getByRole("button", { name: /Size/ }));
    fireEvent.click(screen.getByRole("button", { name: /Theme/ }));
    fireEvent.click(createBtn());

    await waitFor(() => expect(createComponent).toHaveBeenCalled());
    const opts = createComponent.mock.calls[0][2];
    expect(opts.variantProperties).toEqual([
      { name: "Size", values: ["S", "M", "L"], defaultValue: "M" },
      { name: "Theme", values: ["Light", "Dark"], defaultValue: "Light" },
    ]);
  });
});

describe("CreateComponentModal — failure paths", () => {
  it("toasts an error and stays open when createComponent returns null", async () => {
    const createComponent = vi.fn().mockResolvedValue(null);
    const { onClose } = renderModal({ composer: makeComposer(createComponent) });

    fireEvent.change(nameInput(), { target: { value: "Fails" } });
    fireEvent.click(createBtn());

    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Failed to create component", tone: "error" }),
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("toasts the error message when createComponent throws", async () => {
    const createComponent = vi.fn().mockRejectedValue(new Error("boom"));
    renderModal({ composer: makeComposer(createComponent) });

    fireEvent.change(nameInput(), { target: { value: "Throws" } });
    fireEvent.click(createBtn());

    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Error: boom", tone: "error" }),
      ),
    );
  });
});

describe("CreateComponentModal — reset on close", () => {
  it("clears the form when the modal is closed and reopened", () => {
    const composer = makeComposer();
    const { rerender } = render(
      <CreateComponentModal isOpen onClose={vi.fn()} composer={composer} elementId="el-1" />,
    );
    fireEvent.change(nameInput(), { target: { value: "Draft name" } });
    expect((nameInput() as HTMLInputElement).value).toBe("Draft name");

    rerender(
      <CreateComponentModal isOpen={false} onClose={vi.fn()} composer={composer} elementId="el-1" />,
    );
    rerender(
      <CreateComponentModal isOpen onClose={vi.fn()} composer={composer} elementId="el-1" />,
    );
    expect((nameInput() as HTMLInputElement).value).toBe("");
  });
});
