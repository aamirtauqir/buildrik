import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * What the model is actually told.
 *
 * `generatePage` builds a system prompt per section. Everything the wizard asks
 * the user has to survive into that string or it may as well not have been
 * asked. Nothing checked the string itself, which is how `tone` went missing for
 * so long: it had a field on the job, it looked delivered, and the worker
 * collapsed it onto a three-value `style` on the way past. professional, casual,
 * creative and playful all arrived as "modern".
 *
 * These capture the prompt the provider is handed and read it.
 */

const create = vi.fn();

vi.mock("@server/services/openai.client", () => ({
  openAIProvider: {
    name: "openai",
    chat: (...args: unknown[]) => create(...args),
  },
  getOpenAI: () => ({ chat: { completions: { create } } }),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create } };
  },
}));

/** The provider returns one section's HTML, whatever it was asked for. */
function respondWithSection() {
  create.mockResolvedValue({
    choices: [{ message: { content: "<section><h1>Hi</h1></section>" } }],
    usage: { total_tokens: 10 },
  });
}

/** Every system prompt handed to the provider across the call. */
function systemPrompts(): string[] {
  return create.mock.calls
    .flatMap((call) => {
      const arg = call[0] as { messages?: Array<{ role: string; content: string }> } | undefined;
      return arg?.messages ?? [];
    })
    .filter((m) => m.role === "system")
    .map((m) => m.content);
}

describe("generatePage — what reaches the prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "k";
    respondWithSection();
  });

  it("puts the requested style in every section prompt", async () => {
    const { generatePage } = await import("@server/services/ai.service");
    await generatePage({ pageType: "landing", description: "A bakery", style: "minimal" });

    const prompts = systemPrompts();
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.every((p) => p.includes("Style: minimal."))).toBe(true);
  });

  /**
   * The regression. Tone is a separate axis from style — widening `style` to
   * accept tone words would have made one field mean two things — so it has its
   * own field, and this proves it actually lands in the prompt rather than being
   * accepted and dropped.
   */
  it("puts the tone in the prompt, distinct from style", async () => {
    const { generatePage } = await import("@server/services/ai.service");
    await generatePage({
      pageType: "landing",
      description: "A bakery",
      style: "modern",
      tone: "playful",
    });

    const prompts = systemPrompts();
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.every((p) => p.includes("Tone: playful."))).toBe(true);
    expect(prompts.every((p) => p.includes("Style: modern."))).toBe(true);
  });

  it("omits the tone line entirely when no tone was chosen", async () => {
    const { generatePage } = await import("@server/services/ai.service");
    await generatePage({ pageType: "landing", description: "A bakery", style: "bold" });

    const prompts = systemPrompts();
    // Guard the vacuous pass: .some() on an empty array is false for the wrong
    // reason. If the mock ever stops intercepting, this fails instead of lying.
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.some((p) => p.includes("Tone:"))).toBe(false);
  });

  it("carries the description into the user message", async () => {
    const { generatePage } = await import("@server/services/ai.service");
    await generatePage({
      pageType: "landing",
      description: "A bakery. Goal: get leads. Colors: deep green and cream.",
      style: "modern",
    });

    const userMessages = create.mock.calls
      .flatMap((call) => {
        const arg = call[0] as { messages?: Array<{ role: string; content: string }> } | undefined;
        return arg?.messages ?? [];
      })
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    expect(userMessages.some((m) => m.includes("Colors: deep green and cream."))).toBe(true);
  });
});
