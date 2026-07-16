/**
 * ContentWriter Tests
 * High-level content generation orchestration — the AI client boundary
 * (shared/utils/openai generators) is mocked; config/history/event logic is real.
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentWriter } from "../ContentWriter";
import {
  generateContent,
  generateContentVariations,
  improveContent,
  translateContent,
  summarizeContent,
  streamContent,
  type StreamCallbacks,
} from "../../../shared/utils/openai";
import { EVENTS } from "../../../shared/constants/events";
import type { Composer } from "../../Composer";

vi.mock("../../../shared/utils/openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../shared/utils/openai")>();
  return {
    ...actual,
    generateContent: vi.fn(),
    generateContentVariations: vi.fn(),
    improveContent: vi.fn(),
    translateContent: vi.fn(),
    summarizeContent: vi.fn(),
    streamContent: vi.fn(),
  };
});

const mockGenerateContent = vi.mocked(generateContent);
const mockGenerateVariations = vi.mocked(generateContentVariations);
const mockImproveContent = vi.mocked(improveContent);
const mockTranslateContent = vi.mocked(translateContent);
const mockSummarizeContent = vi.mocked(summarizeContent);
const mockStreamContent = vi.mocked(streamContent);

interface MockElement {
  getType: () => string;
  getContent: () => string;
  setContent: ReturnType<typeof vi.fn>;
}

function makeElement(type = "heading", content = ""): MockElement {
  return { getType: () => type, getContent: () => content, setContent: vi.fn() };
}

function makeComposer(opts: { element?: MockElement; selectedIds?: string[] } = {}) {
  const composer = {
    emit: vi.fn(),
    elements: {
      getElement: vi.fn().mockReturnValue(opts.element),
    },
    selection: opts.selectedIds ? { getSelectedIds: () => opts.selectedIds } : undefined,
  };
  return composer as unknown as Composer & typeof composer;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateContent.mockResolvedValue("generated text");
});

describe("ContentWriter.generate — standard path", () => {
  it("uses config defaults, returns the generated content, and emits AI_CONTENT_GENERATED", async () => {
    const composer = makeComposer();
    const writer = new ContentWriter(composer);

    const result = await writer.generate({ prompt: "Write about rugs" });

    expect(mockGenerateContent).toHaveBeenCalledWith("Write about rugs", "paragraph", "professional");
    expect(result.content).toBe("generated text");
    expect(result.contentType).toBe("paragraph");
    expect(result.tone).toBe("professional");
    expect(result.variations).toBeUndefined();
    expect(typeof result.duration).toBe("number");
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CONTENT_GENERATED, result);
  });

  it("constructor config overrides the built-in defaults", async () => {
    const writer = new ContentWriter(makeComposer(), {
      defaultTone: "witty",
      defaultContentType: "headline",
    });

    await writer.generate({ prompt: "p" });

    expect(mockGenerateContent).toHaveBeenCalledWith("p", "headline", "witty");
  });

  it("request-level contentType/tone override the config", async () => {
    const writer = new ContentWriter(makeComposer(), { defaultTone: "witty" });

    await writer.generate({ prompt: "p", contentType: "cta", tone: "urgent" });

    expect(mockGenerateContent).toHaveBeenCalledWith("p", "cta", "urgent");
  });

  it("records the generation in history (newest first)", async () => {
    const writer = new ContentWriter(makeComposer());

    await writer.generate({ prompt: "first" });
    mockGenerateContent.mockResolvedValue("second text");
    await writer.generate({ prompt: "second" });

    const history = writer.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].prompt).toBe("second");
    expect(history[0].content).toBe("second text");
    expect(history[1].prompt).toBe("first");
  });

  it("applies the content to the target element and emits ELEMENT_UPDATED", async () => {
    const element = makeElement();
    const composer = makeComposer({ element });
    const writer = new ContentWriter(composer);

    await writer.generate({ prompt: "p", elementId: "el-1" });

    expect(composer.elements.getElement).toHaveBeenCalledWith("el-1");
    expect(element.setContent).toHaveBeenCalledWith("generated text");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_UPDATED);
  });

  it("does not throw when the target element no longer exists", async () => {
    const composer = makeComposer(); // getElement -> undefined
    const writer = new ContentWriter(composer);

    await expect(writer.generate({ prompt: "p", elementId: "gone" })).resolves.toBeDefined();
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.ELEMENT_UPDATED);
  });
});

describe("ContentWriter.generate — variations path", () => {
  it("returns all variations with the first as primary content", async () => {
    mockGenerateVariations.mockResolvedValue(["a", "b", "c"]);
    const writer = new ContentWriter(makeComposer());

    const result = await writer.generate({ prompt: "p", generateVariations: true });

    expect(mockGenerateVariations).toHaveBeenCalledWith("p", "paragraph", "professional", 3);
    expect(result.content).toBe("a");
    expect(result.variations).toEqual(["a", "b", "c"]);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("honors a custom variationCount from config", async () => {
    mockGenerateVariations.mockResolvedValue(["x"]);
    const writer = new ContentWriter(makeComposer(), { variationCount: 5 });

    await writer.generate({ prompt: "p", generateVariations: true });

    expect(mockGenerateVariations).toHaveBeenCalledWith("p", "paragraph", "professional", 5);
  });

  it("variations win over streaming when both flags are set", async () => {
    mockGenerateVariations.mockResolvedValue(["only"]);
    const writer = new ContentWriter(makeComposer());

    const result = await writer.generate({
      prompt: "p",
      generateVariations: true,
      streaming: true,
    });

    expect(result.content).toBe("only");
    expect(mockStreamContent).not.toHaveBeenCalled();
  });
});

describe("ContentWriter.generate — streaming path", () => {
  it("accumulates chunks, emits AI_CONTENT_STREAM_CHUNK per chunk, resolves with onComplete value", async () => {
    mockStreamContent.mockImplementation(
      (_prompt: string, _ct: unknown, _tone: unknown, callbacks: StreamCallbacks) => {
        callbacks.onChunk?.("Hel");
        callbacks.onChunk?.("lo");
        callbacks.onComplete?.("Hello");
        return Promise.resolve();
      }
    );
    const composer = makeComposer();
    const writer = new ContentWriter(composer);

    const result = await writer.generate({ prompt: "p", streaming: true });

    expect(result.content).toBe("Hello");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CONTENT_STREAM_CHUNK, {
      chunk: "Hel",
      fullContent: "Hel",
    });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CONTENT_STREAM_CHUNK, {
      chunk: "lo",
      fullContent: "Hello",
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("rejects when the stream reports an error", async () => {
    mockStreamContent.mockImplementation(
      (_prompt: string, _ct: unknown, _tone: unknown, callbacks: StreamCallbacks) => {
        callbacks.onError?.(new Error("stream broke") as never);
        return Promise.resolve();
      }
    );
    const writer = new ContentWriter(makeComposer());

    await expect(writer.generate({ prompt: "p", streaming: true })).rejects.toThrow("stream broke");
  });
});

describe("ContentWriter.improve", () => {
  beforeEach(() => {
    mockImproveContent.mockResolvedValue("improved!");
  });

  it("maps built-in improvement types to their canned instruction", async () => {
    const composer = makeComposer();
    const writer = new ContentWriter(composer);

    const improved = await writer.improve("long text", { type: "shorten" });

    expect(improved).toBe("improved!");
    const [content, instruction] = mockImproveContent.mock.calls[0];
    expect(content).toBe("long text");
    expect(instruction).toContain("more concise");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CONTENT_IMPROVED, {
      original: "long text",
      improved: "improved!",
      improvement: { type: "shorten" },
    });
  });

  it("passes a custom instruction through for type: custom", async () => {
    const writer = new ContentWriter(makeComposer());

    await writer.improve("t", { type: "custom", instruction: "Make it rhyme" });

    expect(mockImproveContent).toHaveBeenCalledWith("t", "Make it rhyme");
  });

  it("falls back to a generic instruction when custom has no instruction", async () => {
    const writer = new ContentWriter(makeComposer());

    await writer.improve("t", { type: "custom" });

    expect(mockImproveContent).toHaveBeenCalledWith("t", "Improve this content");
  });

  it("applies the improved content to a target element", async () => {
    const element = makeElement();
    const composer = makeComposer({ element });
    const writer = new ContentWriter(composer);

    await writer.improve("t", { type: "casual" }, "el-1");

    expect(element.setContent).toHaveBeenCalledWith("improved!");
  });
});

describe("ContentWriter.translate / summarize", () => {
  it("translate delegates and emits AI_CONTENT_TRANSLATED with the target language", async () => {
    mockTranslateContent.mockResolvedValue("hola");
    const composer = makeComposer();
    const writer = new ContentWriter(composer);

    const translated = await writer.translate("hello", "Spanish");

    expect(translated).toBe("hola");
    expect(mockTranslateContent).toHaveBeenCalledWith("hello", "Spanish");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CONTENT_TRANSLATED, {
      original: "hello",
      translated: "hola",
      targetLanguage: "Spanish",
    });
  });

  it("summarize forwards maxLength and emits AI_CONTENT_SUMMARIZED", async () => {
    mockSummarizeContent.mockResolvedValue("tl;dr");
    const composer = makeComposer();
    const writer = new ContentWriter(composer);

    const summary = await writer.summarize("a very long story", 100);

    expect(summary).toBe("tl;dr");
    expect(mockSummarizeContent).toHaveBeenCalledWith("a very long story", 100);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.AI_CONTENT_SUMMARIZED, {
      original: "a very long story",
      summary: "tl;dr",
    });
  });
});

describe("ContentWriter.generateForSelectedElement", () => {
  it("returns null when nothing is selected", async () => {
    const writer = new ContentWriter(makeComposer());
    expect(await writer.generateForSelectedElement()).toBeNull();
  });

  it("returns null when multiple elements are selected", async () => {
    const writer = new ContentWriter(makeComposer({ selectedIds: ["a", "b"] }));
    expect(await writer.generateForSelectedElement()).toBeNull();
  });

  it("returns null when the selected element cannot be resolved", async () => {
    const writer = new ContentWriter(makeComposer({ selectedIds: ["ghost"] }));
    expect(await writer.generateForSelectedElement()).toBeNull();
  });

  it("rewrites existing heading text with contentType headline", async () => {
    const element = makeElement("heading", "Old title");
    const writer = new ContentWriter(makeComposer({ element, selectedIds: ["el-1"] }));

    const result = await writer.generateForSelectedElement();

    expect(result?.contentType).toBe("headline");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      "Rewrite and improve this content: Old title",
      "headline",
      "professional"
    );
    expect(element.setContent).toHaveBeenCalledWith("generated text");
  });

  it("generates fresh CTA copy for an empty button", async () => {
    const element = makeElement("button", "");
    const writer = new ContentWriter(makeComposer({ element, selectedIds: ["el-1"] }));

    const result = await writer.generateForSelectedElement();

    expect(result?.contentType).toBe("cta");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      "Generate call to action content",
      "cta",
      "professional"
    );
  });

  it("falls back to paragraph for unmapped element types", async () => {
    const element = makeElement("video", "");
    const writer = new ContentWriter(makeComposer({ element, selectedIds: ["el-1"] }));

    const result = await writer.generateForSelectedElement();

    expect(result?.contentType).toBe("paragraph");
  });
});

describe("ContentWriter history & config", () => {
  it("caps history at 50 entries, dropping the oldest", async () => {
    const writer = new ContentWriter(makeComposer());

    for (let i = 0; i < 51; i++) {
      await writer.generate({ prompt: `p${i}` });
    }

    const history = writer.getHistory();
    expect(history).toHaveLength(50);
    expect(history[0].prompt).toBe("p50");
    expect(history.some((h) => h.prompt === "p0")).toBe(false);
  });

  it("getHistory returns a defensive copy; clearHistory empties it", async () => {
    const writer = new ContentWriter(makeComposer());
    await writer.generate({ prompt: "p" });

    const copy = writer.getHistory();
    copy.pop();
    expect(writer.getHistory()).toHaveLength(1);

    writer.clearHistory();
    expect(writer.getHistory()).toEqual([]);
  });

  it("setConfig merges partial updates; getConfig returns a copy", () => {
    const writer = new ContentWriter(makeComposer());

    writer.setConfig({ variationCount: 7 });
    const config = writer.getConfig();
    expect(config.variationCount).toBe(7);
    expect(config.defaultTone).toBe("professional"); // untouched default

    config.variationCount = 99;
    expect(writer.getConfig().variationCount).toBe(7);
  });

  it("exposes the shared content type and tone catalogs", () => {
    const writer = new ContentWriter(makeComposer());
    expect(writer.getContentTypes().headline.label).toBe("Headline");
    expect(writer.getTones().professional.label).toBe("Professional");
  });
});
