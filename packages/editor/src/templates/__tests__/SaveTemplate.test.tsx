/**
 * SaveTemplate (save modal contract). MyTemplates was retired with the old
 * TemplateManager path (G2-103): saved templates are listed, previewed and
 * applied in the full-canvas Templates view.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { SaveTemplate } from "../SaveTemplate";

afterEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("SaveTemplate", () => {
  function renderSave() {
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(<SaveTemplate isOpen onClose={onClose} onSave={onSave} />);
    return { onClose, onSave };
  }

  it("prints the board's token note — true only because the save path snapshots them", () => {
    renderSave();
    expect(document.body.textContent).toMatch(
      /Tokens are snapshotted — applying it later re-maps them to that site.s brand\./,
    );
  });

  it("offers no Category control — nothing ever read the choice", () => {
    renderSave();
    expect(screen.queryByLabelText(/Category/i)).toBeNull();
  });

  it("disables Save until a name is entered", () => {
    renderSave();
    const save = screen.getByRole("button", { name: "Save template" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("My Template"), {
      target: { value: "Landing v2" },
    });
    expect(save).not.toBeDisabled();
  });

  /* Category is no longer a control — board 1169:4753 draws one field, and the
     value was never read back (`getUserTemplates` hardcodes
     `category: "my-templates"`). The payload still carries the default so the
     stored row shape is unchanged for anyone reading old entries. */
  it("saves name + default category + description, then closes and resets", async () => {
    const { onSave, onClose } = renderSave();
    fireEvent.change(screen.getByPlaceholderText("My Template"), {
      target: { value: "Landing v2" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe your template..."), {
      target: { value: "Hero + pricing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));

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
