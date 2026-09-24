/**
 * Board 4418:142410: the delete confirm names the component and says what
 * happens to its instances, with the real count.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { componentDeleteCopy } from "../ComponentDetailScreen";

describe("componentDeleteCopy", () => {
  it("names the component and counts its instances", () => {
    expect(componentDeleteCopy("Menu card", 18)).toEqual({
      title: "Delete “Menu card”?",
      message:
        "18 instances on this site will become independent elements and keep their content. The saved Menu card component will be permanently deleted.",
    });
  });

  it("uses the singular for one instance and says so plainly for none", () => {
    expect(componentDeleteCopy("CTA", 1).message).toMatch(/^1 instance on this site will become an independent element/);
    expect(componentDeleteCopy("CTA", 0).message).toBe("No instances on this site use it. The saved CTA component will be permanently deleted.");
  });
});
