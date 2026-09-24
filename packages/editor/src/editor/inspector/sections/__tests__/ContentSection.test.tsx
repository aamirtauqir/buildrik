/**
 * ContentSection — board 4428:141642 CONTENT: Source ● Static ○ From CMS.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const seen: Array<Record<string, unknown>> = [];
vi.mock("../../components/BindingPopover", () => ({
  BindingPopover: (props: { renderTrigger: (t: { open: boolean; isBound: boolean; toggle: () => void }) => React.ReactNode } & Record<string, unknown>) => {
    seen.push(props);
    return <>{props.renderTrigger({ open: false, isBound: false, toggle: vi.fn() })}</>;
  },
}));

import { ContentSection } from "../ContentSection";

describe("ContentSection", () => {
  it("draws Source with Static checked when unbound, and hands the popover its create-collection door", () => {
    const create = vi.fn();
    render(<ContentSection elementId="e1" composer={null} onOpenCreateCollection={create} isOpen />);
    expect(screen.getByRole("radio", { name: /Static/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /From CMS/ })).toHaveAttribute("aria-checked", "false");
    expect(seen[0].onOpenCreateCollection).toBe(create);
    expect(seen[0].elementId).toBe("e1");
  });
});
