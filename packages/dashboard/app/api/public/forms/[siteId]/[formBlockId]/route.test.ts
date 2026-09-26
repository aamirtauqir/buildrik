/**
 * Public form-submit route — the "show message" fallback.
 * `submitForm` is the only thing allowed to decide what's a
 * safe redirect target (`returnUrl`/`refererUrl`, both validated against the
 * site's own known origins); the route must never fall back to the raw
 * `Referer` header itself, and must land on the site's own origin root when
 * neither validated field is available.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const submitFormMock = vi.fn();

vi.mock("@server/services/form-submission.service", () => ({
  submitForm: (...args: unknown[]) => submitFormMock(...args),
  FormError: class FormError extends Error {
    constructor(message: string) {
      super(message);
    }
  },
}));
vi.mock("@server/services/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock("@lib/request-ip", () => ({ clientIp: () => "1.2.3.4" }));

import { POST } from "./route";

const ctx = (siteId: string, formBlockId: string) => ({ params: Promise.resolve({ siteId, formBlockId }) });

function formPost(body: string, referer?: string) {
  return new Request("http://localhost/api/public/forms/s1/f1", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(referer ? { referer } : {}),
    },
    body,
  }) as never;
}

describe("POST /api/public/forms/[siteId]/[formBlockId] — Referer fallback", () => {
  beforeEach(() => {
    submitFormMock.mockReset();
  });

  it("passes the raw Referer header through to submitForm for validation, not trusting it directly", async () => {
    submitFormMock.mockResolvedValue({
      id: "sub1", successAction: "MESSAGE", redirectUrl: null, successMessage: null,
      returnUrl: null, refererUrl: null, siteOrigin: "https://mysite.example.com",
    });
    await POST(formPost("name=A", "https://evil.example.com/phish"), ctx("s1", "f1"));
    expect(submitFormMock).toHaveBeenCalledWith(
      "s1", "f1", expect.anything(), "1.2.3.4", "https://evil.example.com/phish",
    );
  });

  it("an attacker Referer that the service rejected is NEVER redirected to — falls to the site's own origin root", async () => {
    submitFormMock.mockResolvedValue({
      id: "sub1", successAction: "MESSAGE", redirectUrl: null, successMessage: null,
      returnUrl: null, refererUrl: null, siteOrigin: "https://mysite.example.com",
    });
    const res = await POST(formPost("name=A", "https://evil.example.com/phish"), ctx("s1", "f1"));
    expect(res.status).toBe(303);
    const location = res.headers.get("location")!;
    expect(location).not.toContain("evil.example.com");
    expect(location.startsWith("https://mysite.example.com")).toBe(true);
  });

  it("a Referer the service validated (same-origin) IS used", async () => {
    submitFormMock.mockResolvedValue({
      id: "sub1", successAction: "MESSAGE", redirectUrl: null, successMessage: null,
      returnUrl: null, refererUrl: "https://mysite.example.com/contact",
      siteOrigin: "https://mysite.example.com",
    });
    const res = await POST(formPost("name=A", "https://mysite.example.com/contact"), ctx("s1", "f1"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("mysite.example.com/contact");
  });

  it("no returnUrl, no valid Referer, no siteOrigin — falls to the inline message page, not a redirect", async () => {
    submitFormMock.mockResolvedValue({
      id: "sub1", successAction: "MESSAGE", redirectUrl: null, successMessage: "Thanks!",
      returnUrl: null, refererUrl: null, siteOrigin: null,
    });
    const res = await POST(formPost("name=A"), ctx("s1", "f1"));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Thanks!");
  });
});
