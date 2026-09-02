// @vitest-environment jsdom
/**
 * PageSettingsDrawer — ESC closes through the unsaved guard.
 *
 * The drawer's docblock promised "ESC / X closes with guard" and the file had
 * neither exit: only the scrim and ⌘S. ESC now runs the SAME handler as the
 * scrim, so a dirty drawer stops at the discard modal instead of throwing the
 * edits away.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { PageSettingsDrawer } from "../PageSettingsDrawer";
import type { PageItem } from "../../types";

const page: PageItem = { id: "p1", name: "Home", slug: "home", isHome: true };

function mount() {
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <PageSettingsDrawer page={page} allPages={[page]} composer={null} onClose={onClose} />
    </ToastProvider>,
  );
  return onClose;
}

const escape = () =>
  fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

describe("PageSettingsDrawer — ESC", () => {
  it("closes a clean drawer", () => {
    const onClose = mount();
    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stops a dirty drawer at the discard modal instead of closing", () => {
    const onClose = mount();
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Edited title" },
    });
    escape();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Discard unsaved SEO changes?")).toBeInTheDocument();
  });
});
