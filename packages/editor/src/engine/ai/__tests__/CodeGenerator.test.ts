/**
 * CodeGenerator Tests
 * Prompt decoration, presets, snippet store, CSS-apply — the AI client
 * boundary (shared/utils/openai generateCode/generateLayout) is mocked.
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodeGenerator, CODE_PRESETS } from "../CodeGenerator";
import { generateCode, generateLayout } from "../../../shared/utils/openai";
import { EVENTS } from "../../../shared/constants/events";
import type { Composer } from "../../Composer";

vi.mock("../../../shared/utils/openai", () => ({
  generateCode: vi.fn(),
  generateLayout: vi.fn(),
}));

const mockGenerateCode = vi.mocked(generateCode);
const mockGenerateLayout = vi.mocked(generateLayout);

interface MockElement {
  setStyle: ReturnType<typeof vi.fn>;
}

function makeComposer(element?: MockElement) {
  const composer = {
    emit: vi.fn(),
    elements: { getElement: vi.fn().mockReturnValue(element) },
  };
  return composer as unknown as Composer & typeof composer;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateCode.mockResolvedValue("const x = 1;");
  mockGenerateLayout.mockResolvedValue("<div>component</div>");
});

describe("CodeGenerator.generate — prompt decoration", () => {
  it("appends comment + TypeScript hints with the default config", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generate({ prompt: "Make a thing" });

    expect(mockGenerateCode).toHaveBeenCalledWith(
      "Make a thing" +
        "\nInclude helpful comments explaining the code." +
        "\nUse TypeScript with proper type annotations.",
      "typescript",
      "documented"
    );
  });

  it("wraps the prompt with the category template and skips the TS hint for css", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generate({ prompt: "card glow", category: "css-effect", language: "css" });

    const [prompt, language] = mockGenerateCode.mock.calls[0];
    expect(prompt).toContain("Create a CSS effect for: card glow.");
    expect(prompt).toContain("Include helpful comments explaining the code.");
    expect(prompt).not.toContain("TypeScript");
    expect(language).toBe("css");
  });

  it("leaves the prompt bare when comments and TypeScript are disabled", async () => {
    const gen = new CodeGenerator(makeComposer(), {
      includeComments: false,
      useTypeScript: false,
    });

    await gen.generate({ prompt: "Make a thing" });

    expect(mockGenerateCode).toHaveBeenCalledWith("Make a thing", "typescript", "documented");
  });

  it("returns the generated code with metadata and emits AI_CODE_GENERATED", async () => {
    const composer = makeComposer();
    const gen = new CodeGenerator(composer);

    const result = await gen.generate({ prompt: "smooth scroll", category: "js-interaction" });

    expect(result.code).toBe("const x = 1;");
    expect(result.language).toBe("typescript");
    expect(result.category).toBe("js-interaction");
    expect(result.suggestedFileName).toBe("smooth-scroll.ts");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CODE_GENERATED, result);
  });

  it("kebab-cases and truncates the suggested file name to 30 chars with the language extension", async () => {
    const gen = new CodeGenerator(makeComposer());

    const result = await gen.generate({
      prompt: "Create a Fancy Modal Dialog With Focus Trap!!",
      language: "react",
    });

    expect(result.suggestedFileName).toBe("create-a-fancy-modal-dialog-wi.tsx");
  });
});

describe("CodeGenerator.generate — dependency detection", () => {
  it("detects react, gsap, and lodash from the generated code", async () => {
    mockGenerateCode.mockResolvedValue(
      "import React from 'react';\nimport gsap from 'gsap';\nconst y = _.map([]);"
    );
    const gen = new CodeGenerator(makeComposer());

    const result = await gen.generate({ prompt: "p" });

    expect(result.dependencies).toContain("react");
    expect(result.dependencies).toContain("gsap");
    expect(result.dependencies).toContain("lodash");
  });

  it("flags react from the target language even without imports", async () => {
    mockGenerateCode.mockResolvedValue("export const A = () => null;");
    const gen = new CodeGenerator(makeComposer());

    const result = await gen.generate({ prompt: "p", language: "react" });

    expect(result.dependencies).toEqual(["react"]);
  });

  it.todo(
    "BUG: detectDependencies flags any `create(` call as a zustand dependency — e.g. a plain factory `create({ count: 0 })` reports zustand even with no zustand import"
  );

  it("pins current behavior: a bare create() call reports zustand", async () => {
    mockGenerateCode.mockResolvedValue("const store = create({ count: 0 });");
    const gen = new CodeGenerator(makeComposer());

    const result = await gen.generate({ prompt: "p" });

    expect(result.dependencies).toContain("zustand");
  });
});

describe("CodeGenerator.generate — CSS apply to element", () => {
  it("parses generated CSS declarations into camelCase styles on the element", async () => {
    mockGenerateCode.mockResolvedValue("background-color: red; border-radius: 8px;");
    const element: MockElement = { setStyle: vi.fn() };
    const composer = makeComposer(element);
    const gen = new CodeGenerator(composer);

    await gen.generate({ prompt: "glow", category: "css-effect", elementId: "el-1" });

    expect(composer.elements.getElement).toHaveBeenCalledWith("el-1");
    expect(element.setStyle).toHaveBeenCalledWith("backgroundColor", "red");
    expect(element.setStyle).toHaveBeenCalledWith("borderRadius", "8px");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_UPDATED);
  });

  it("does not apply CSS for non-css categories", async () => {
    const element: MockElement = { setStyle: vi.fn() };
    const composer = makeComposer(element);
    const gen = new CodeGenerator(composer);

    await gen.generate({ prompt: "p", category: "js-interaction", elementId: "el-1" });

    expect(element.setStyle).not.toHaveBeenCalled();
  });

  it("does not throw when the target element no longer exists", async () => {
    const gen = new CodeGenerator(makeComposer());

    await expect(
      gen.generate({ prompt: "glow", category: "css-effect", elementId: "gone" })
    ).resolves.toBeDefined();
  });

  it.todo(
    "BUG: parseCSS treats selectors/pseudo-classes as declarations — `.btn:hover { color: blue; }` applies setStyle('btn', 'hover { color: blue') instead of parsing the rule body"
  );

  it("pins current behavior: selector-wrapped CSS produces a garbage style key", async () => {
    mockGenerateCode.mockResolvedValue(".btn:hover { color: blue; }");
    const element: MockElement = { setStyle: vi.fn() };
    const gen = new CodeGenerator(makeComposer(element));

    await gen.generate({ prompt: "glow", category: "css-effect", elementId: "el-1" });

    expect(element.setStyle).toHaveBeenCalledWith("btn", "hover { color: blue");
    expect(element.setStyle).not.toHaveBeenCalledWith("color", "blue");
  });
});

describe("CodeGenerator.generateFromPreset", () => {
  it("rejects unknown preset ids", async () => {
    const gen = new CodeGenerator(makeComposer());
    await expect(gen.generateFromPreset("nope")).rejects.toThrow("Unknown preset: nope");
  });

  it("forces css language for css-category presets and uses the preset prompt", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generateFromPreset("glassmorphism");

    const [prompt, language] = mockGenerateCode.mock.calls[0];
    expect(prompt).toContain("glassmorphism card effect");
    expect(language).toBe("css");
  });

  it("appends customization as additional requirements", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generateFromPreset("glassmorphism", "use a blue tint");

    expect(mockGenerateCode.mock.calls[0][0]).toContain("Additional requirements: use a blue tint");
  });

  it("uses the default language for non-css presets", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generateFromPreset("modal");

    expect(mockGenerateCode.mock.calls[0][1]).toBe("typescript");
  });
});

describe("CodeGenerator convenience generators", () => {
  it("generateComponent delegates to generateLayout", async () => {
    const gen = new CodeGenerator(makeComposer());

    const html = await gen.generateComponent("a pricing card");

    expect(mockGenerateLayout).toHaveBeenCalledWith("a pricing card");
    expect(html).toBe("<div>component</div>");
  });

  it("generateCSS wraps the description and requests css output", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generateCSS("sparkle border");

    const [prompt, language, style] = mockGenerateCode.mock.calls[0];
    expect(prompt).toContain("Create CSS for: sparkle border");
    expect(language).toBe("css");
    expect(style).toBe("documented");
  });

  it("generateInteraction picks typescript or javascript from config", async () => {
    await new CodeGenerator(makeComposer()).generateInteraction("scroll spy");
    expect(mockGenerateCode.mock.calls[0][1]).toBe("typescript");

    mockGenerateCode.mockClear();
    await new CodeGenerator(makeComposer(), { useTypeScript: false }).generateInteraction("scroll spy");
    expect(mockGenerateCode.mock.calls[0][1]).toBe("javascript");
  });
});

describe("CodeGenerator snippets, presets, and config", () => {
  it("saves a snippet only when a category is provided", async () => {
    const gen = new CodeGenerator(makeComposer());

    await gen.generate({ prompt: "no category" });
    expect(gen.getSnippets()).toHaveLength(0);

    await gen.generate({ prompt: "with category", category: "js-utility" });
    const snippets = gen.getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].name).toBe("with category");
    expect(snippets[0].category).toBe("js-utility");
    expect(snippets[0].code).toBe("const x = 1;");
  });

  it("filters snippets by category and clears them", async () => {
    const gen = new CodeGenerator(makeComposer());
    await gen.generate({ prompt: "a", category: "js-utility" });
    await gen.generate({ prompt: "b", category: "css-effect" });

    expect(gen.getSnippetsByCategory("css-effect")).toHaveLength(1);
    expect(gen.getSnippetsByCategory("js-utility")).toHaveLength(1);
    expect(gen.getSnippetsByCategory("react-component")).toHaveLength(0);

    gen.clearSnippets();
    expect(gen.getSnippets()).toHaveLength(0);
  });

  it("caps stored snippets at 50, dropping the oldest", async () => {
    const gen = new CodeGenerator(makeComposer());

    for (let i = 0; i < 51; i++) {
      await gen.generate({ prompt: `p${i}`, category: "js-utility" });
    }

    const snippets = gen.getSnippets();
    expect(snippets).toHaveLength(50);
    expect(snippets[0].name).toBe("p50");
    expect(snippets.some((s) => s.name === "p0")).toBe(false);
  });

  it("getSnippets returns a defensive copy", async () => {
    const gen = new CodeGenerator(makeComposer());
    await gen.generate({ prompt: "a", category: "js-utility" });

    const copy = gen.getSnippets();
    copy.pop();
    expect(gen.getSnippets()).toHaveLength(1);
  });

  it("exposes presets and filters them by category without the category key", () => {
    const gen = new CodeGenerator(makeComposer());

    expect(gen.getPresets()).toBe(CODE_PRESETS);

    const animations = gen.getPresetsByCategory("css-animation");
    expect(Object.keys(animations).sort()).toEqual(["fade-in", "pulse", "shake", "typewriter"]);
    expect(animations["pulse"]).toEqual({
      name: CODE_PRESETS["pulse"].name,
      prompt: CODE_PRESETS["pulse"].prompt,
    });
  });

  it("setConfig merges partial updates; getConfig returns a copy", () => {
    const gen = new CodeGenerator(makeComposer());

    gen.setConfig({ defaultLanguage: "python" });
    const config = gen.getConfig();
    expect(config.defaultLanguage).toBe("python");
    expect(config.includeComments).toBe(true);

    config.includeComments = false;
    expect(gen.getConfig().includeComments).toBe(true);
  });
});
