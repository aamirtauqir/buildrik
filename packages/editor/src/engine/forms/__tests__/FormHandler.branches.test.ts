/**
 * FormHandler — remaining branches not covered by FormHandler.test.ts:
 * the mailing-list subscribe path, the element-tree helpers
 * (findFormElement / findFormFields), and no-op state paths.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FormHandler, type FormConfig } from "../FormHandler";
import { emailMarketingService } from "../../integrations";
import type { Composer } from "../../Composer";
import type { Element } from "../../elements/Element";

function config(partial: Partial<FormConfig> = {}): FormConfig {
  return { formId: "contact", action: "store", ...partial };
}

/** Mock Element exposing just what FormHandler touches. */
function makeEl(opts: {
  custom?: Record<string, unknown>;
  children?: unknown[];
  tag?: string;
}): Element {
  const el = {
    getCustomData: (k: string) => opts.custom?.[k],
    getChildren: () => opts.children ?? [],
    getTagName: () => opts.tag,
  };
  return el as unknown as Element;
}

describe("submitForm — mailing-list subscription branch", () => {
  let composer: { emit: ReturnType<typeof vi.fn> };
  let handler: FormHandler;

  beforeEach(() => {
    composer = { emit: vi.fn() };
    handler = new FormHandler(composer as unknown as Composer);
    // stub the submission service to always succeed
    (handler as unknown as { submissionService: { submit: () => Promise<unknown> } }).submissionService =
      { submit: vi.fn(async () => ({ success: true, submissionId: "s1" })) };
  });

  afterEach(() => vi.restoreAllMocks());

  it("subscribes when action=email, subscribeToList, configured, and email present", async () => {
    const isConfigured = vi.spyOn(emailMarketingService, "isConfigured").mockReturnValue(true);
    const subscribe = vi
      .spyOn(emailMarketingService, "subscribe")
      .mockResolvedValue(undefined as never);

    handler.registerForm(
      config({ action: "email", emailOptions: { subscribeToList: true } as never })
    );
    handler.setFieldValue("contact", "email", "a@b.co");
    handler.setFieldValue("contact", "name", "Ada");

    await handler.submitForm("contact");

    expect(isConfigured).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith({ email: "a@b.co", name: "Ada" });
  });

  it("does not subscribe when the marketing service is not configured", async () => {
    vi.spyOn(emailMarketingService, "isConfigured").mockReturnValue(false);
    const subscribe = vi.spyOn(emailMarketingService, "subscribe");

    handler.registerForm(
      config({ action: "email", emailOptions: { subscribeToList: true } as never })
    );
    handler.setFieldValue("contact", "email", "a@b.co");

    await handler.submitForm("contact");
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("does not subscribe when no email field is present", async () => {
    vi.spyOn(emailMarketingService, "isConfigured").mockReturnValue(true);
    const subscribe = vi.spyOn(emailMarketingService, "subscribe");

    handler.registerForm(
      config({ action: "email", emailOptions: { subscribeToList: true } as never })
    );
    // no email value set

    await handler.submitForm("contact");
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("does not subscribe for non-email actions", async () => {
    vi.spyOn(emailMarketingService, "isConfigured").mockReturnValue(true);
    const subscribe = vi.spyOn(emailMarketingService, "subscribe");

    handler.registerForm(config({ action: "store" }));
    handler.setFieldValue("contact", "email", "a@b.co");

    await handler.submitForm("contact");
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe("state no-op paths", () => {
  let handler: FormHandler;
  beforeEach(() => {
    handler = new FormHandler({ emit: vi.fn() } as unknown as Composer);
  });

  it("setFieldValue on an unknown form does nothing", () => {
    handler.setFieldValue("ghost", "x", 1);
    expect(handler.getFieldValue("ghost", "x")).toBeUndefined();
  });

  it("getFieldValue on an unknown form is undefined", () => {
    expect(handler.getFieldValue("ghost", "x")).toBeUndefined();
  });
});

describe("findFormElement", () => {
  function handlerWith(elements: unknown): FormHandler {
    return new FormHandler({ emit: vi.fn(), elements } as unknown as Composer);
  }

  it("returns null when there is no active page", () => {
    const h = handlerWith({ getActivePage: () => null, getElement: () => null });
    expect(h.findFormElement("contact")).toBeNull();
  });

  it("returns null when the root element can't be resolved", () => {
    const h = handlerWith({
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: () => null,
    });
    expect(h.findFormElement("contact")).toBeNull();
  });

  it("returns null when no element carries the matching formId", () => {
    const root = makeEl({ children: [makeEl({ custom: { formId: "other" } })] });
    const h = handlerWith({
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: () => root,
    });
    expect(h.findFormElement("contact")).toBeNull();
  });

  it("finds the element whose custom formId matches (depth-first)", () => {
    const match = makeEl({ custom: { formId: "contact" } });
    const root = makeEl({
      custom: { formId: "root-form" },
      children: [makeEl({ children: [match] })],
    });
    const h = handlerWith({
      getActivePage: () => ({ root: { id: "root" } }),
      getElement: () => root,
    });
    expect(h.findFormElement("contact")).toBe(match);
  });
});

describe("findFormFields", () => {
  it("collects input/textarea/select descendants, skipping others", () => {
    const handler = new FormHandler({ emit: vi.fn() } as unknown as Composer);
    const tree = makeEl({
      tag: "form",
      children: [
        makeEl({ tag: "input" }),
        makeEl({
          tag: "div",
          children: [makeEl({ tag: "textarea" }), makeEl({ tag: "span" })],
        }),
        makeEl({ tag: "SELECT" }), // case-insensitive
      ],
    });

    const fields = handler.findFormFields(tree);
    expect(fields.map((f) => f.getTagName()?.toLowerCase())).toEqual([
      "input",
      "textarea",
      "select",
    ]);
  });
});
