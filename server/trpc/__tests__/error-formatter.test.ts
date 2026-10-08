/**
 * errorFormatter — which `cause` fields reach the client (audit F-02).
 *
 * Structured payloads (AuthError data, the rate limiter's resetAt, review
 * reasons) are passed as a PLAIN OBJECT `cause`, which tRPC turns into its
 * internal UnknownCauseError; the formatter lifts those fields into
 * `data.cause` on purpose. But any raw Error thrown from a procedure also
 * becomes the `cause` of the INTERNAL_SERVER_ERROR tRPC wraps it in — and an
 * OpenAI APIError carries `headers`, `request_id`, `error`, `status`. Those
 * must never be lifted.
 */
import { describe, it, expect, vi } from "vitest";
import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));

import { router } from "@/server/trpc/trpc";

type Formatted = { data: { cause?: Record<string, unknown> } };

function format(error: TRPCError): Formatted {
  const config = router({})._def._config;
  return config.errorFormatter({
    error,
    type: "mutation",
    path: "x",
    input: undefined,
    ctx: undefined,
    shape: {
      message: error.message,
      code: -32603,
      data: { code: error.code, httpStatus: 500, path: "x" },
    },
  }) as Formatted;
}

describe("errorFormatter cause lifting", () => {
  it("lifts a plain-object cause (structured payloads keep working)", () => {
    const out = format(
      new TRPCError({ code: "TOO_MANY_REQUESTS", message: "slow down", cause: { resetAt: "2026-10-08T00:00:00.000Z" } }),
    );
    expect(out.data.cause).toEqual({ resetAt: "2026-10-08T00:00:00.000Z" });
  });

  it("does not lift the fields of a raw Error thrown from a procedure", () => {
    const providerError = Object.assign(new Error("401 Incorrect API key provided: sk-...abcd"), {
      status: 401,
      headers: { "x-request-id": "req_123", authorization: "Bearer sk-x" },
      request_id: "req_123",
      error: { message: "Incorrect API key provided" },
    });
    const out = format(getTRPCErrorFromUnknown(providerError));
    expect(out.data.cause).toBeUndefined();
  });
});
