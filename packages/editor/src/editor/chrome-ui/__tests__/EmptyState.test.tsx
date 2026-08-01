/**
 * EmptyState — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, EmptyState relocated to chrome-ui/EmptyState.tsx).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../index";
import { Button } from "flowbite-react";

describe("EmptyState", () => {
  it("carries an action, because an empty state without one is a dead end", () => {
    render(<EmptyState title="No pages yet" body="Add your first page." action={<Button>Add page</Button>} />);
    expect(screen.getByRole("button", { name: "Add page" })).toBeTruthy();
  });
});
