/**
 * Inspector ⋯ Delete runs the shared `delete` command straight away — no
 * dialog of its own (decision #17: one element deletes at once, with the Undo
 * toast useHistoryFeedback raises; the command's own confirm covers N > 1).
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InspectorElementMenu } from "../components/InspectorElementMenu";
import { ToastProvider } from "@/editor/chrome-ui";
import { makeMenuComposer } from "./DeleteButton.test";

describe("Inspector ⋯ Delete — instant, no confirm for one element", () => {
  it("runs the delete command from the menu item, without a dialog", () => {
    const composer = makeMenuComposer();
    render(
      <ToastProvider>
        <InspectorElementMenu composer={composer as never} selectedElementId="abc12345678" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /^delete/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(composer.commands.run).toHaveBeenCalledWith("delete");
  });
});
