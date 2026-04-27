/**
 * Phase 4 contract tests — verify Tag adapter shim → vibcoder Tag.
 *
 * Tag is a NEW shim file (no legacy primitive existed). The shim is a
 * thin re-export, so these tests verify the re-export resolves and that
 * the vibcoder class composition is preserved through the alias.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Tag } from "../Tag";

describe("Tag adapter shim (vibcoder Tag re-export)", () => {
  it("renders a span with bd-tag class", () => {
    const { container } = render(<Tag>hello</Tag>);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.className.split(" ")).toContain("bd-tag");
  });

  it("omits modifier class for default variant=neutral + size=md", () => {
    const { container } = render(<Tag>x</Tag>);
    const span = container.querySelector("span") as HTMLSpanElement;
    expect(span.className).not.toContain("bd-tag--neutral");
    expect(span.className).not.toContain("bd-tag--md");
  });

  it("emits bd-tag--accent when variant=accent", () => {
    const { container } = render(<Tag variant="accent">x</Tag>);
    expect(container.querySelector("span")?.className).toContain("bd-tag--accent");
  });

  it("emits bd-tag--sm when size=sm", () => {
    const { container } = render(<Tag size="sm">x</Tag>);
    expect(container.querySelector("span")?.className).toContain("bd-tag--sm");
  });

  it("emits bd-tag--selectable when selectable=true", () => {
    const { container } = render(<Tag selectable>x</Tag>);
    expect(container.querySelector("span")?.className).toContain("bd-tag--selectable");
  });
});
