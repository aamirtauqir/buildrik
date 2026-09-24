// @vitest-environment jsdom
/**
 * Save a version — board 4418:165661.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SaveVersionModal } from "../SaveVersionModal";

afterEach(cleanup);

describe("SaveVersionModal — board 4418:165661", () => {
  it("names the draft and says saving does not publish", () => {
    render(<SaveVersionModal open siteName="Bella Cucina" onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText("Save a version")).toBeTruthy();
    expect(screen.getByText(/Bella Cucina · current draft/)).toBeTruthy();
    expect(screen.getByText(/Saving does not publish anything\./)).toBeTruthy();
  });

  it("a suggestion chip fills the name; Clear name empties it", () => {
    render(<SaveVersionModal open siteName="S" onClose={vi.fn()} onSave={vi.fn()} />);
    const input = screen.getByLabelText("Version name") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Before template replacement" }));
    expect(input.value).toBe("Before template replacement");
    fireEvent.click(screen.getByRole("button", { name: "Clear name" }));
    expect(input.value).toBe("");
  });

  it("saves the trimmed name and closes; a failure keeps it open", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(undefined);
    render(<SaveVersionModal open siteName="S" onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Version name"), { target: { value: "  Launch  " } });
    fireEvent.click(screen.getByTestId("save-version-submit"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Launch"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("save-version-submit"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
