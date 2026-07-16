/**
 * FormSubmissionService tests — field validation rules, webhook POST payload,
 * email-notification wiring, and in-memory storage (it.todo encodes the
 * persistence gap).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Factory only closes over these (TDZ-safe lazy deref).
const emailMocks = {
  isConfigured: vi.fn(() => false),
  sendFormEmails: vi.fn(() => Promise.resolve({})),
};

vi.mock("../EmailService", () => ({
  emailService: {
    isConfigured: () => emailMocks.isConfigured(),
    sendFormEmails: (...args: unknown[]) => emailMocks.sendFormEmails(...(args as [])),
  },
}));

import { FormSubmissionService, type ValidationError } from "../FormSubmissionService";

let service: FormSubmissionService;

beforeEach(() => {
  service = new FormSubmissionService();
  emailMocks.isConfigured.mockReset();
  emailMocks.isConfigured.mockReturnValue(false);
  emailMocks.sendFormEmails.mockReset();
  emailMocks.sendFormEmails.mockResolvedValue({});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const fieldErrors = (errors: ValidationError[] | undefined, field: string) =>
  (errors ?? []).filter((e) => e.field === field).map((e) => e.message);

describe("FormSubmissionService validation", () => {
  it("required: missing, empty string, and NaN fail; 0 and false pass", async () => {
    const validation = { name: { required: true } };

    for (const data of [{}, { name: "" }, { name: NaN }]) {
      const res = await service.submit({ formId: "f", data, validation });
      expect(res.success).toBe(false);
      expect(fieldErrors(res.errors, "name")).toEqual(["name is required"]);
    }

    const zero = await service.submit({
      formId: "f",
      data: { name: 0 },
      validation,
    });
    expect(zero.success).toBe(true);
    const falsy = await service.submit({
      formId: "f",
      data: { name: false },
      validation,
    });
    expect(falsy.success).toBe(true);
  });

  it("email: rejects malformed, accepts valid", async () => {
    const validation = { email: { type: "email" as const } };

    const bad = await service.submit({
      formId: "f",
      data: { email: "not-an-email" },
      validation,
    });
    expect(fieldErrors(bad.errors, "email")).toEqual(["Invalid email format"]);

    const good = await service.submit({
      formId: "f",
      data: { email: "user@example.com" },
      validation,
    });
    expect(good.success).toBe(true);
  });

  it("phone: needs 7+ chars of digits/space/dash/parens/plus", async () => {
    const validation = { phone: { type: "phone" as const } };

    const bad = await service.submit({ formId: "f", data: { phone: "12ab34" }, validation });
    expect(fieldErrors(bad.errors, "phone")).toEqual(["Invalid phone format"]);

    const short = await service.submit({ formId: "f", data: { phone: "123" }, validation });
    expect(short.success).toBe(false);

    const good = await service.submit({
      formId: "f",
      data: { phone: "+1 (555) 123-4567" },
      validation,
    });
    expect(good.success).toBe(true);
  });

  it("number: rejects non-numeric strings", async () => {
    const validation = { age: { type: "number" as const } };

    const bad = await service.submit({ formId: "f", data: { age: "abc" }, validation });
    expect(fieldErrors(bad.errors, "age")).toEqual(["Must be a valid number"]);

    const good = await service.submit({ formId: "f", data: { age: "42" }, validation });
    expect(good.success).toBe(true);
  });

  it("minLength / maxLength bound string length", async () => {
    const tooShort = await service.submit({
      formId: "f",
      data: { msg: "hi" },
      validation: { msg: { minLength: 5 } },
    });
    expect(fieldErrors(tooShort.errors, "msg")).toEqual(["Minimum length is 5 characters"]);

    const tooLong = await service.submit({
      formId: "f",
      data: { msg: "hello" },
      validation: { msg: { maxLength: 3 } },
    });
    expect(fieldErrors(tooLong.errors, "msg")).toEqual(["Maximum length is 3 characters"]);
  });

  it("pattern: custom regex gates the value", async () => {
    const validation = { code: { pattern: "^[A-Z]{3}$" } };

    const bad = await service.submit({ formId: "f", data: { code: "abc" }, validation });
    expect(fieldErrors(bad.errors, "code")).toEqual(["Invalid format"]);

    const good = await service.submit({ formId: "f", data: { code: "ABC" }, validation });
    expect(good.success).toBe(true);
  });

  it("accumulates errors across fields and does not store the failed submission", async () => {
    const res = await service.submit({
      formId: "form-1",
      data: { name: "", email: "nope" },
      validation: {
        name: { required: true },
        email: { type: "email" },
      },
    });

    expect(res.success).toBe(false);
    expect(res.errors).toHaveLength(2);
    expect(res.submissionId).toBeUndefined();
    await expect(service.getSubmissions("form-1")).resolves.toEqual([]);
  });

  it("no validation rules = everything passes", async () => {
    const res = await service.submit({ formId: "f", data: { anything: "<x>" } });
    expect(res.success).toBe(true);
  });
});

describe("FormSubmissionService storage", () => {
  it("stores successful submissions per formId and returns them in order", async () => {
    const r1 = await service.submit({ formId: "contact", data: { name: "A" } });
    const r2 = await service.submit({ formId: "contact", data: { name: "B" } });
    await service.submit({ formId: "other", data: { name: "C" } });

    const stored = await service.getSubmissions("contact");
    expect(stored).toHaveLength(2);
    expect(stored[0]).toMatchObject({
      id: r1.submissionId,
      formId: "contact",
      data: { name: "A" },
    });
    expect(stored[0].submittedAt).toBeTypeOf("number");
    expect(stored[1].id).toBe(r2.submissionId);
    expect(r1.submissionId).toMatch(/^sub-/);
    expect(r1.submissionId).not.toBe(r2.submissionId);

    await expect(service.getSubmissions("unknown")).resolves.toEqual([]);
  });

  it.todo(
    "BUG: submissions live in an in-memory Map only — every submission is lost on page reload; needs a server-side persistence path"
  );
});

describe("FormSubmissionService webhook", () => {
  it("POSTs the full submission record as JSON to the webhook URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const res = await service.submit({
      formId: "contact",
      data: { name: "Ada" },
      webhookUrl: "https://hooks.example/incoming",
    });

    expect(res.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example/incoming");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      id: res.submissionId,
      formId: "contact",
      data: { name: "Ada" },
    });
    expect(body.submittedAt).toBeTypeOf("number");
  });

  it("a webhook failure does not fail the submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const res = await service.submit({
      formId: "contact",
      data: { name: "Ada" },
      webhookUrl: "https://hooks.example/dead",
    });

    expect(res.success).toBe(true);
    await expect(service.getSubmissions("contact")).resolves.toHaveLength(1);
  });

  it("does not call fetch when no webhookUrl is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await service.submit({ formId: "contact", data: { name: "Ada" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("FormSubmissionService email notifications", () => {
  const emailOptions = {
    sendConfirmation: true,
    sendNotification: true,
    notificationRecipients: ["owner@site.com"],
  };

  it("forwards to emailService.sendFormEmails with the submitter email extracted by field name", async () => {
    emailMocks.isConfigured.mockReturnValue(true);

    await service.submit({
      formId: "contact",
      data: { email: "visitor@example.com", name: "Ada" },
      emailOptions,
      submitterEmailField: "email",
    });

    expect(emailMocks.sendFormEmails).toHaveBeenCalledExactlyOnceWith(
      "contact",
      { email: "visitor@example.com", name: "Ada" },
      "visitor@example.com",
      emailOptions
    );
  });

  it("passes undefined submitter email when no submitterEmailField is given", async () => {
    emailMocks.isConfigured.mockReturnValue(true);

    await service.submit({
      formId: "contact",
      data: { name: "Ada" },
      emailOptions,
    });

    expect((emailMocks.sendFormEmails.mock.calls[0] as unknown[])[2]).toBeUndefined();
  });

  it("skips email entirely when the email service is not configured", async () => {
    emailMocks.isConfigured.mockReturnValue(false);

    const res = await service.submit({
      formId: "contact",
      data: { name: "Ada" },
      emailOptions,
    });

    expect(res.success).toBe(true);
    expect(emailMocks.sendFormEmails).not.toHaveBeenCalled();
  });

  it("skips email when no emailOptions are provided", async () => {
    emailMocks.isConfigured.mockReturnValue(true);

    await service.submit({ formId: "contact", data: { name: "Ada" } });
    expect(emailMocks.sendFormEmails).not.toHaveBeenCalled();
  });
});
