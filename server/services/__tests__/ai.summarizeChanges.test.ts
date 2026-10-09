/**
 * L5-021: the History AI summary read "there are no recorded changes … the
 * element 'el-…' is now empty". Element adds/removes counted as `other`, which
 * the prompt's count line skipped ("no recorded changes" beside a real diff),
 * and nothing told the model which way the diff runs.
 */
import { describe, it, expect, vi } from "vitest";

const create = vi.hoisted(() => vi.fn(async () => ({ choices: [{ message: { content: "Removed the intro text." } }] })));
vi.mock("@/server/services/openai.client", () => ({
  getOpenAI: () => ({ chat: { completions: { create } } }),
  openAIProvider: {},
}));

import { summarizeChanges } from "@/server/services/ai.service";

const counts = { style: 0, text: 0, layout: 0, content: 0, other: 0 };

describe("summarizeChanges prompt", () => {
  it("counts every change kind and says which way the diff runs", async () => {
    await summarizeChanges("v1", {
      elementName: "Version Comparison (Current draft → v1)",
      summary: { ...counts, other: 1, content: 1 },
      changes: [
        { type: "content", property: "Text", before: "“Lorem ipsum”", after: "" },
        { type: "other", property: "Hero · traits", before: "[]", after: "[1]" },
      ],
    });
    const user = (create.mock.calls[0] as unknown as [{ messages: Array<{ role: string; content: string }> }])[0].messages.find(
      (m) => m.role === "user",
    )?.content;
    expect(user).not.toContain("no recorded changes");
    expect(user).toContain("1 content change");
    expect(user).toContain("1 other change");
    expect(user).toContain("Current draft → v1");
    expect(user).toContain("Text: “Lorem ipsum” → (empty)");
  });
});
