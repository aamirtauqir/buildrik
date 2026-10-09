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

/* L3-008: a raw error's message is not a user message. A Prisma error's text
   names server file paths ("Invalid `tx.page.upsert()` invocation in
   /Users/…/server_services_….js:8716") and reached the editor as the save
   error. Deliberate TRPCErrors keep their words. */
describe("errorFormatter message for unexpected server errors", () => {
  type WithMessage = { message: string };
  const prismaError = () =>
    Object.assign(new Error("\nInvalid `tx.page.upsert()` invocation in\n/Users/x/.next/server/chunks/server_services_a.js:8716:20\n\nUnique constraint failed"), {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
    });

  it("never ships a Prisma error's text", () => {
    const out = format(getTRPCErrorFromUnknown(prismaError())) as unknown as WithMessage;
    expect(out.message).toBe("Something went wrong on our side. Please try again.");
  });

  it("replaces any raw error's text in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      const out = format(getTRPCErrorFromUnknown(new Error("ECONNREFUSED 10.0.0.4:5432"))) as unknown as WithMessage;
      expect(out.message).toBe("Something went wrong on our side. Please try again.");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("keeps a deliberate TRPCError's message, even an INTERNAL one", () => {
    const out = format(
      new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The save took too long and was not applied. It will be tried again." }),
    ) as unknown as WithMessage;
    expect(out.message).toBe("The save took too long and was not applied. It will be tried again.");
  });
});
