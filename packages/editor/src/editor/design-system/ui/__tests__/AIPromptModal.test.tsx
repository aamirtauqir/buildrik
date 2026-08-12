import { render, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { AIPromptModal } from "../AIPromptModal";
import { AIAssistService, type ComponentSchema } from "../../../../engine/designSystem/services/AIAssistService";
import { EventEmitter } from "../../../../engine/EventEmitter";

const validSchema: ComponentSchema = {
  componentTypeId: "PricingCard",
  variants: [{ name: "default", bindings: { primary: "color-primary" } }],
  bindings: { primary: "color-primary" },
};

function makeService(client: { generate: (input: { prompt: string; signal?: AbortSignal }) => Promise<string> }) {
  const events = new EventEmitter();
  return new AIAssistService(events, client);
}

describe("AIPromptModal", () => {
  it("renders idle state with a textarea + Generate button when open", () => {
    const service = makeService({ generate: vi.fn() });
    const { getByLabelText, getByText } = render(
      <AIPromptModal open service={service} onOpenChange={() => {}} onAccept={() => {}} />
    );
    expect(getByLabelText("Component description")).toBeTruthy();
    expect(getByText("Generate")).toBeTruthy();
  });

  it("shows an error when Generate is clicked with empty prompt", () => {
    const service = makeService({ generate: vi.fn() });
    const { getByText, getByRole } = render(
      <AIPromptModal open service={service} onOpenChange={() => {}} onAccept={() => {}} />
    );
    fireEvent.click(getByText("Generate"));
    expect(getByRole("alert").textContent).toMatch(/describe the component/i);
  });

  it("on success: shows schema preview + Accept button, Accept fires onAccept and closes modal", async () => {
    const service = makeService({
      generate: vi.fn(async () => JSON.stringify(validSchema)),
    });
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();

    const { getByLabelText, getByText, findByTestId } = render(
      <AIPromptModal open service={service} onOpenChange={onOpenChange} onAccept={onAccept} />
    );

    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "a pricing card" },
    });
    fireEvent.click(getByText("Generate"));

    const preview = await findByTestId("ai-prompt-schema-preview");
    expect(preview.textContent).toContain("PricingCard");

    fireEvent.click(getByText("Accept"));
    expect(onAccept).toHaveBeenCalledWith(validSchema);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("on AI failure: surfaces the error message + offers Retry", async () => {
    const service = makeService({
      generate: vi.fn(async () => "not-valid-json"),
    });
    const { getByLabelText, getByText, findByRole } = render(
      <AIPromptModal open service={service} onOpenChange={() => {}} onAccept={() => {}} />
    );
    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "a card" },
    });
    fireEvent.click(getByText("Generate"));

    const alert = await findByRole("alert");
    expect(alert.textContent).toMatch(/not valid JSON/i);
    expect(getByText("Retry")).toBeTruthy();
  });

  it("falls into error state when service is null", () => {
    const { getByLabelText, getByText, getByRole } = render(
      <AIPromptModal open service={null} onOpenChange={() => {}} onAccept={() => {}} />
    );
    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "anything" },
    });
    fireEvent.click(getByText("Generate"));
    expect(getByRole("alert").textContent).toMatch(/AI service not configured/i);
  });

  it("Discard returns to idle state without closing modal", async () => {
    const service = makeService({
      generate: vi.fn(async () => JSON.stringify(validSchema)),
    });
    const onOpenChange = vi.fn();
    const { getByLabelText, getByText, findByText, queryByTestId } = render(
      <AIPromptModal open service={service} onOpenChange={onOpenChange} onAccept={() => {}} />
    );

    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "a card" },
    });
    fireEvent.click(getByText("Generate"));

    await findByText("Accept");
    fireEvent.click(getByText("Discard"));

    // Idle state restored — Generate is shown again, schema preview gone.
    expect(getByText("Generate")).toBeTruthy();
    expect(queryByTestId("ai-prompt-schema-preview")).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("Cancel button on idle state closes the modal", () => {
    const onOpenChange = vi.fn();
    const service = makeService({ generate: vi.fn() });
    const { getByText } = render(
      <AIPromptModal open service={service} onOpenChange={onOpenChange} onAccept={() => {}} />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Cancel-generation aborts the in-flight request and returns to idle", async () => {
    let abortFn: AbortSignal | undefined;
    const generate = vi.fn(
      (input: { prompt: string; signal?: AbortSignal }) =>
        new Promise<string>((resolve, reject) => {
          abortFn = input.signal;
          input.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const service = makeService({ generate });
    const { getByLabelText, getByText, findByText } = render(
      <AIPromptModal open service={service} onOpenChange={() => {}} onAccept={() => {}} />
    );

    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "a card" },
    });
    fireEvent.click(getByText("Generate"));

    // Wait for the generating state to render (status role appears).
    await findByText("Generating schema…");
    expect(abortFn).toBeDefined();

    fireEvent.click(getByText("Cancel generation"));
    // Idle state restored.
    expect(getByText("Generate")).toBeTruthy();
    expect(abortFn?.aborted).toBe(true);
  });
});

describe("AIPromptModal → Accept (Gap B — onAccept receives schema)", () => {
  it("calls onAccept with the generated schema when user fills prompt, generates, then Accepts", async () => {
    const sentinelSchema: ComponentSchema = {
      componentTypeId: "GapBSentinelCard",
      variants: [{ name: "default", bindings: { primary: "color-primary" } }],
      bindings: { primary: "color-primary" },
    };
    const service = makeService({
      generate: vi.fn(async () => JSON.stringify(sentinelSchema)),
    });
    const onAccept = vi.fn();

    const { getByLabelText, getByText, findByTestId } = render(
      <AIPromptModal open service={service} onOpenChange={() => {}} onAccept={onAccept} />,
    );

    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "a sentinel card" },
    });
    fireEvent.click(getByText("Generate"));

    const preview = await findByTestId("ai-prompt-schema-preview");
    expect(preview.textContent).toContain("GapBSentinelCard");

    fireEvent.click(getByText("Accept"));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(sentinelSchema);
  });

  /* The only consumer passed an empty onAccept, so Accept closed the modal and
     dropped the schema after the user had waited for a generation — the same
     outcome as Discard. onAccept is optional now and the button follows it. */
  it("renders no Accept when there is nowhere for the schema to go", async () => {
    const service = makeService({
      generate: vi.fn(async () => JSON.stringify(validSchema)),
    });
    const { getByLabelText, getByText, queryByText, findByTestId } = render(
      <AIPromptModal open service={service} onOpenChange={vi.fn()} />
    );

    fireEvent.change(getByLabelText("Component description"), {
      target: { value: "a pricing card" },
    });
    fireEvent.click(getByText("Generate"));
    await findByTestId("ai-prompt-schema-preview");

    expect(queryByText("Accept")).toBeNull();
    // Discard and Retry still stand — the generation is readable, just not takeable.
    expect(getByText("Discard")).toBeTruthy();
    expect(getByText("Retry")).toBeTruthy();
  });
});
