/**
 * A caller's `className` must beat flowbite's own theme classes.
 *
 * The whole inline-style drain rests on this: hundreds of converted call sites
 * pass `<Button className="tw:h-[22px] tw:px-1 tw:rounded-[3px] …">` and assume
 * the utility wins over flowbite's `rounded-lg px-5 text-sm`. That only holds
 * because flowbite-react runs the merge through twMerge configured with the
 * SAME prefix as our build (`tw`, set in flowbiteStore.ts). Break that pairing —
 * change the prefix in one place and not the other — and twMerge stops
 * recognising either side as a Tailwind class, keeps both, and the winner
 * becomes whichever the compiled stylesheet happens to order last. Every
 * converted control would then be silently mis-sized while every test stayed
 * green, because jsdom computes nothing from these classes.
 *
 * So this asserts the merge directly, on the class attribute: ours present,
 * the conflicting flowbite ones GONE. The second half is the load-bearing one —
 * a test that only checked "my class is in the list" passes even when both are.
 *
 * @license BSD-3-Clause
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "../index";

const classesOf = (el: Element | null) => (el?.className ?? "").split(/\s+/).filter(Boolean);

/**
 * Utility name with prefix and variants stripped: `tw:hover:bg-gray-100` →
 * `bg-gray-100`. Deliberately prefix-AGNOSTIC — checking for the literal
 * `tw:rounded-lg` would pass trivially the moment the prefixes stopped
 * matching, which is the exact failure this file exists to catch (verified by
 * setting the store prefix to something else and watching both cases fail).
 */
const utilities = (classes: string[]) => classes.map((c) => c.split(":").pop() ?? c);

describe("caller className vs flowbite theme", () => {
  it("keeps the caller's geometry and drops flowbite's conflicting utilities", () => {
    const { container } = render(
      <Button size="xs" className="tw:h-[22px] tw:px-1 tw:rounded-[3px] tw:text-[11px]">
        vis
      </Button>,
    );
    const utils = utilities(classesOf(container.querySelector("button")));

    for (const kept of ["h-[22px]", "px-1", "rounded-[3px]", "text-[11px]"]) {
      expect(utils, `caller class ${kept} was dropped by the merge`).toContain(kept);
    }
    // flowbite's own radius/size utilities must not survive alongside the
    // caller's — that is what "the caller wins" means.
    for (const gone of ["rounded-lg", "text-sm", "px-3", "px-5"]) {
      expect(utils, `flowbite class ${gone} survived next to the caller's`).not.toContain(gone);
    }
  });

  it("leaves flowbite's own classes alone where the caller says nothing", () => {
    // The merge is a conflict resolver, not a replacement: untouched flowbite
    // behaviour (focus ring, flex layout) has to come through.
    const { container } = render(<Button className="tw:text-[11px]">vis</Button>);
    const classes = classesOf(container.querySelector("button"));
    expect(classes).toContain("tw:relative");
    expect(classes.some((c) => c.startsWith("tw:focus:ring"))).toBe(true);
    // Prefix pairing, asserted directly: flowbite must emit OUR prefix, not
    // its own default, or none of the utilities above resolve at runtime.
    expect(classes.every((c) => c.startsWith("tw:"))).toBe(true);
  });
});

/* IconButton is chrome-ui's own element, not a flowbite one, so nothing merged
   for it: `size="sm"` appended `tw:h-6` after the base `tw:h-8` and a caller's
   `tw:bg-[var(--bk-bg-card)]` sat beside the base `tw:bg-transparent`. Both
   compiled, the stylesheet's order decided, and the library's card `···`
   measured 32px and transparent live (2026-09-13). Same contract as above. */
import { IconButton } from "../index";

describe("caller className vs IconButton's own classes", () => {
  it("size='sm' is 24 and a caller's background beats the transparent base", () => {
    const { container } = render(
      <IconButton label="More" size="sm" className="tw:bg-[var(--bk-bg-card)]">
        ···
      </IconButton>,
    );
    const utils = utilities(classesOf(container.firstElementChild));
    expect(utils).toContain("h-6");
    expect(utils).not.toContain("h-8");
    expect(utils).toContain("bg-[var(--bk-bg-card)]");
    expect(utils).not.toContain("bg-transparent");
  });
});
