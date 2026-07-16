/**
 * FormHandler — form/field registration, state management, submission
 * (success / validation failure / thrown error), reset, and the form:*
 * event contract on the Composer.
 *
 * Uses the real FormSubmissionService (pure in-memory when no webhook /
 * email options are configured); the throw path swaps in a rejecting stub.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormHandler, type FormConfig } from "../FormHandler";
import { EVENTS } from "@/shared/constants";
import type { Composer } from "../../Composer";

let composer: { emit: ReturnType<typeof vi.fn> };
let handler: FormHandler;

function config(partial: Partial<FormConfig> = {}): FormConfig {
  return { formId: "contact", action: "store", ...partial };
}

function emitted(event: string): unknown[][] {
  return composer.emit.mock.calls.filter(([e]) => e === event);
}

beforeEach(() => {
  composer = { emit: vi.fn() };
  handler = new FormHandler(composer as unknown as Composer);
});

describe("form registration", () => {
  it("registerForm stores config, seeds initial state, and emits form:registered", () => {
    const c = config();
    handler.registerForm(c);

    expect(handler.getFormConfig("contact")).toBe(c);
    expect(handler.getFormState("contact")).toEqual({
      values: {},
      errors: {},
      isSubmitting: false,
      isSubmitted: false,
    });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.FORM_REGISTERED, {
      formId: "contact",
      config: c,
    });
  });

  it("unregisterForm drops config/state/fields and emits form:unregistered", () => {
    handler.registerForm(config());
    handler.registerField("contact", { elementId: "e1", name: "email", type: "email" });

    handler.unregisterForm("contact");

    expect(handler.getFormConfig("contact")).toBeUndefined();
    expect(handler.getFormState("contact")).toBeUndefined();
    expect(handler.getFormFields("contact")).toEqual([]);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.FORM_UNREGISTERED, { formId: "contact" });
  });

  it("updateFormConfig merges updates and emits form:updated; unknown id is a no-op", () => {
    handler.registerForm(config());

    handler.updateFormConfig("contact", { successMessage: "Thanks!" });

    expect(handler.getFormConfig("contact")).toMatchObject({
      action: "store",
      successMessage: "Thanks!",
    });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.FORM_UPDATED, {
      formId: "contact",
      updates: { successMessage: "Thanks!" },
    });

    composer.emit.mockClear();
    handler.updateFormConfig("ghost", { successMessage: "x" });
    expect(composer.emit).not.toHaveBeenCalled();
  });
});

describe("field management", () => {
  it("registerField appends new fields and replaces same-name fields in place", () => {
    handler.registerForm(config());
    handler.registerField("contact", { elementId: "e1", name: "email", type: "email" });
    handler.registerField("contact", { elementId: "e2", name: "name", type: "text" });
    handler.registerField("contact", {
      elementId: "e1b",
      name: "email",
      type: "email",
      required: true,
    });

    const fields = handler.getFormFields("contact");
    expect(fields).toHaveLength(2);
    expect(fields.find((f) => f.name === "email")).toMatchObject({
      elementId: "e1b",
      required: true,
    });
  });

  it("unregisterField removes by name", () => {
    handler.registerForm(config());
    handler.registerField("contact", { elementId: "e1", name: "email", type: "email" });
    handler.registerField("contact", { elementId: "e2", name: "name", type: "text" });

    handler.unregisterField("contact", "email");

    expect(handler.getFormFields("contact").map((f) => f.name)).toEqual(["name"]);
  });
});

describe("state management", () => {
  it("setFieldValue stores the value and clears any prior error for that field", async () => {
    handler.registerForm(
      config({ validation: { email: { required: true, type: "email" } } }),
    );
    await handler.submitForm("contact"); // required email missing → error recorded
    expect(handler.getFormState("contact")?.errors.email).toBeDefined();

    handler.setFieldValue("contact", "email", "a@b.co");

    expect(handler.getFieldValue("contact", "email")).toBe("a@b.co");
    expect(handler.getFormState("contact")?.errors.email).toBeUndefined();
  });

  it("resetForm restores the initial state and emits form:reset", async () => {
    handler.registerForm(config());
    handler.setFieldValue("contact", "name", "Ada");
    await handler.submitForm("contact");

    handler.resetForm("contact");

    expect(handler.getFormState("contact")).toEqual({
      values: {},
      errors: {},
      isSubmitting: false,
      isSubmitted: false,
    });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.FORM_RESET, { formId: "contact" });
  });
});

describe("submitForm", () => {
  it("returns a form-not-found error for unregistered ids", async () => {
    const result = await handler.submitForm("ghost");
    expect(result.success).toBe(false);
    expect(result.errors).toEqual([{ field: "_form", message: "Form not found" }]);
  });

  it("successful submit emits form:submitting then form:submitted and updates state", async () => {
    handler.registerForm(config());
    handler.setFieldValue("contact", "name", "Ada");

    const result = await handler.submitForm("contact");

    expect(result.success).toBe(true);
    expect(result.submissionId).toBeDefined();

    expect(emitted(EVENTS.FORM_SUBMITTING)).toEqual([
      [EVENTS.FORM_SUBMITTING, { formId: "contact", data: { name: "Ada" } }],
    ]);
    expect(emitted(EVENTS.FORM_SUBMITTED)).toEqual([
      [EVENTS.FORM_SUBMITTED, { formId: "contact", result }],
    ]);
    expect(emitted(EVENTS.FORM_ERROR)).toEqual([]);

    const state = handler.getFormState("contact");
    expect(state).toMatchObject({ isSubmitting: false, isSubmitted: true, errors: {} });
    expect(state?.result).toBe(result);
  });

  it("stores the submission so getSubmissions returns it", async () => {
    handler.registerForm(config());
    handler.setFieldValue("contact", "email", "a@b.co");
    await handler.submitForm("contact");

    const submissions = await handler.getSubmissions("contact");

    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toMatchObject({ formId: "contact", data: { email: "a@b.co" } });
  });

  it("validation failure emits form:error with a field→message map and keeps isSubmitted false", async () => {
    handler.registerForm(
      config({
        validation: {
          email: { required: true, type: "email" },
          name: { required: true },
        },
      }),
    );
    handler.setFieldValue("contact", "email", "not-an-email");

    const result = await handler.submitForm("contact");

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual({ field: "email", message: "Invalid email format" });
    expect(result.errors).toContainEqual({ field: "name", message: "name is required" });

    const errorEvents = emitted(EVENTS.FORM_ERROR);
    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0][1]).toEqual({
      formId: "contact",
      errors: {
        email: "Invalid email format",
        name: "name is required",
      },
    });

    expect(handler.getFormState("contact")).toMatchObject({
      isSubmitting: false,
      isSubmitted: false,
      errors: { email: "Invalid email format", name: "name is required" },
    });
    expect(emitted(EVENTS.FORM_SUBMITTED)).toEqual([]);
  });

  it("enforces minLength/maxLength rules from the shared validation config", async () => {
    handler.registerForm(
      config({ validation: { code: { minLength: 4, maxLength: 6 } } }),
    );
    handler.setFieldValue("contact", "code", "abc");

    const short = await handler.submitForm("contact");
    expect(short.success).toBe(false);
    expect(short.errors?.[0].message).toMatch(/Minimum length is 4/);

    handler.setFieldValue("contact", "code", "abcdefg");
    const long = await handler.submitForm("contact");
    expect(long.errors?.[0].message).toMatch(/Maximum length is 6/);

    handler.setFieldValue("contact", "code", "abcd");
    const ok = await handler.submitForm("contact");
    expect(ok.success).toBe(true);
  });

  it("a thrown service error lands in errors._form and emits form:error", async () => {
    handler.registerForm(config());
    (handler as unknown as { submissionService: { submit: () => Promise<never> } }).submissionService = {
      submit: vi.fn(async () => {
        throw new Error("network down");
      }),
    } as never;

    const result = await handler.submitForm("contact");

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([{ field: "_form", message: "network down" }]);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.FORM_ERROR, {
      formId: "contact",
      errors: { _form: "network down" },
    });
    expect(handler.getFormState("contact")).toMatchObject({
      isSubmitting: false,
      errors: { _form: "network down" },
    });
  });
});

describe("destroy", () => {
  it("clears all forms, states, and fields", () => {
    handler.registerForm(config());
    handler.registerField("contact", { elementId: "e1", name: "email", type: "email" });

    handler.destroy();

    expect(handler.getFormConfig("contact")).toBeUndefined();
    expect(handler.getFormState("contact")).toBeUndefined();
    expect(handler.getFormFields("contact")).toEqual([]);
  });
});
