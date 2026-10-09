/**
 * L3-026 — a published form is plain HTML, so a visitor whose submission
 * fails lands on whatever the endpoint answers. That was a raw JSON body
 * (`{"error":"Form not found"}`). A browser form post now gets a short page in
 * words, with the same status; a scripted JSON caller still gets JSON.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const { submitForm, FormError } = vi.hoisted(() => ({
  submitForm: vi.fn(),
  FormError: class FormError extends Error {},
}));
const checkRateLimit = vi.hoisted(() => vi.fn());
vi.mock("@server/services/form-submission.service", () => ({ submitForm, FormError }));
vi.mock("@server/services/rate-limiter", () => ({ checkRateLimit }));

import { POST } from "@/app/api/public/forms/[siteId]/[formBlockId]/route";

const params = { params: Promise.resolve({ siteId: "s1", formBlockId: "f1" }) };
const formPost = (body = "email=a%40b.co") =>
  new Request("http://localhost/api/public/forms/s1/f1", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  }) as NextRequest;

beforeEach(() => {
  checkRateLimit.mockReset().mockResolvedValue({ allowed: true, resetAt: Date.now() });
  submitForm.mockReset();
});

describe("POST /api/public/forms — a browser form post that fails", () => {
  it("answers an unknown form with a page, not JSON", async () => {
    submitForm.mockRejectedValue(new FormError("FORM_NOT_FOUND"));
    const res = await POST(formPost(), params);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("accepting submissions.");
    expect(html).not.toContain("{");
  });

  it("answers the monthly limit with a page", async () => {
    submitForm.mockRejectedValue(new FormError("FORM_SUBMISSION_LIMIT"));
    const res = await POST(formPost(), params);
    expect(res.status).toBe(402);
    expect(await res.text()).toContain("take more messages right now.");
  });

  it("answers the rate limit with a page", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, resetAt: Date.now() + 30_000 });
    const res = await POST(formPost(), params);
    expect(res.status).toBe(429);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(await res.text()).toContain("Too many messages from you just now.");
  });

  it("answers a server fault with a page", async () => {
    submitForm.mockRejectedValue(new Error("db down"));
    const res = await POST(formPost(), params);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("Something went wrong sending your message.");
  });

  it("keeps JSON for a scripted JSON caller", async () => {
    submitForm.mockRejectedValue(new FormError("FORM_NOT_FOUND"));
    const res = await POST(
      new Request("http://localhost/api/public/forms/s1/f1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: { email: "a@b.co" } }),
      }) as NextRequest,
      params,
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Form not found" });
  });
});
