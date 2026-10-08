/**
 * L3-024 — a browser form posts repeated keys for checkbox groups
 * (`checkbox=one&checkbox=two`); `Object.fromEntries` kept only the last, so
 * the visitor's other choices were silently lost. Repeated values are kept,
 * joined in the order they were sent.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const submitForm = vi.hoisted(() => vi.fn());
vi.mock("@server/services/form-submission.service", () => ({
  submitForm,
  FormError: class FormError extends Error {},
}));
vi.mock("@server/services/rate-limiter", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, resetAt: Date.now() })),
}));

import { POST } from "@/app/api/public/forms/[siteId]/[formBlockId]/route";

beforeEach(() => {
  submitForm.mockReset().mockResolvedValue({ id: "sub-1", successAction: "MESSAGE" });
});

describe("POST /api/public/forms — urlencoded repeated fields", () => {
  it("keeps every value of a repeated field", async () => {
    const req = new Request("http://localhost/api/public/forms/s1/f1", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "checkbox=one&checkbox=two&email=a%40b.co",
    }) as NextRequest;
    await POST(req, { params: Promise.resolve({ siteId: "s1", formBlockId: "f1" }) });
    expect(submitForm).toHaveBeenCalledTimes(1);
    expect(submitForm.mock.calls[0][2].data).toEqual({ checkbox: "one, two", email: "a@b.co" });
  });
});

describe("POST /api/public/forms — a field named like an Object builtin", () => {
  it("is stored as sent, not merged with the builtin", async () => {
    const req = new Request("http://localhost/api/public/forms/s1/f1", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "constructor=x",
    }) as NextRequest;
    await POST(req, { params: Promise.resolve({ siteId: "s1", formBlockId: "f1" }) });
    expect(submitForm.mock.calls[0][2].data).toEqual({ constructor: "x" });
  });
});
