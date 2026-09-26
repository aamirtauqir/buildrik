/**
 * B-6: the Modal's key-handling effect was keyed on `[open, onClose]`. A parent
 * that keeps local state (e.g. a text field) and passes an inline
 * `onClose={handleClose}` re-creates a new `onClose` identity every render,
 * which re-ran the effect, tore down the focus trap and pulled focus back to
 * `panelRef` on every keystroke — the input never accumulated more than one
 * character. The fix reads `onClose` through a ref updated every render and
 * keys the effect on `[open]` only, so the effect (and its focus handling)
 * doesn't re-run on every parent re-render.
 */
import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../modal";

function TypingParent() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  return (
    <>
      {/* The focusable trigger that opened the modal — Modal captures this as
          `previouslyFocused` on mount and, with the pre-fix `[open, onClose]`
          deps, re-focuses it on every keystroke because `onClose` is a fresh
          inline closure every render. */}
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Rename">
        <input
          aria-label="Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Modal>
    </>
  );
}

describe("Modal onClose identity churn", () => {
  it("keeps typed text and focus when the parent re-renders with a new onClose", async () => {
    const user = userEvent.setup();
    render(<TypingParent />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByLabelText("Name");
    await user.click(input);
    await user.type(input, "Homepage");

    expect(input).toHaveValue("Homepage");
    expect(document.activeElement).toBe(input);
  });
});
