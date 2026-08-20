/**
 * The in-shell preview carries interactions.
 *
 * `Composer.exportHTML` is what Quick preview, the preview modal, the client
 * view and "copy page HTML" render. Interactions are stored on
 * `element.data.interactions` and only the LIVE element's `getAttributes()`
 * folded them into an attribute, so the ElementData serialization the preview
 * uses emitted neither the attribute nor the runtime that reads it: a click
 * animation configured in the inspector did nothing in Preview while working
 * on the published page. Measured live before the fix — engine held the
 * interaction, `exportHTML().combined` had no `data-buildrick-interactions`.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { elementDataToHTML } from "@/shared/utils/html";
import type { ElementData } from "@/shared/types";

const withInteraction = (interactions: unknown[]): ElementData =>
  ({
    id: "el-1",
    type: "button",
    tagName: "button",
    attributes: {},
    classes: [],
    styles: {},
    children: [],
    content: "Click me",
    data: { interactions },
  }) as unknown as ElementData;

describe("ElementData → HTML carries interactions", () => {
  it("emits the attribute the runtime looks for", () => {
    const html = elementDataToHTML(withInteraction([{ id: "i1", trigger: "click", animation: { preset: "fadeIn" } }]));
    expect(html).toContain("data-buildrick-interactions");
    expect(html).toContain("fadeIn");
  });

  it("emits nothing for an element with no interactions", () => {
    expect(elementDataToHTML(withInteraction([]))).not.toContain("data-buildrick-interactions");
    const bare = { ...withInteraction([]), data: undefined } as unknown as ElementData;
    expect(elementDataToHTML(bare)).not.toContain("data-buildrick-interactions");
  });

  it("escapes the JSON so it cannot break out of the attribute", () => {
    const html = elementDataToHTML(
      withInteraction([{ id: 'i"1', trigger: "click", animation: { preset: "fadeIn" } }]),
    );
    expect(html).not.toContain('id":"i"1');
    expect(html).toContain("&quot;");
  });
});
