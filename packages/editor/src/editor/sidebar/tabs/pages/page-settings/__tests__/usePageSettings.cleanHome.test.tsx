// @vitest-environment jsdom
/**
 * A page whose persisted fields all equal the form's starting values — a Home
 * with an empty slug and no SEO — opens clean. It used to open dirty: applying
 * it changed no state, so nothing re-rendered against the new snapshot.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToastProvider } from "@/editor/chrome-ui";
import { PageSettingsDrawer } from "../PageSettingsDrawer";
import type { PageItem } from "@/editor/sidebar/tabs/pages/types";

describe("page settings — a Home with an empty slug", () => {
  it("opens clean: Editing, not Unsaved, and Save disabled", () => {
    const home: PageItem = { id: "h", name: "Home", slug: "", isHome: true, isActive: true };
    const composer = { elements: { updatePage: vi.fn() }, emit: vi.fn(), getProjectMetadata: () => ({}) } as never;
    render(
      <ToastProvider>
        <PageSettingsDrawer page={home} allPages={[home]} composer={composer} onClose={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByTestId("pg-drawer-subtitle")).toHaveTextContent("Editing Home");
    expect(screen.getByTestId("pg-drawer-done")).toBeDisabled();
  });
});
