/**
 * A definitive tRPC answer is not retried.
 *
 * The retry predicate stopped only for UNAUTHORIZED, so a page whose query
 * comes back FORBIDDEN or NOT_FOUND sat behind its loading skeleton through
 * three retries first. Measured on /dashboard/sites/<another-user's-id>: the
 * skeleton was still up at t+4s and the site-not-found message only appeared
 * at t+6s — six seconds of "loading" for an answer the server gave at once.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { isFinalAnswer } from "../trpc/client";

describe("isFinalAnswer", () => {
  it("covers the codes a retry cannot change", () => {
    for (const code of [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "BAD_REQUEST",
      "CONFLICT",
      "PRECONDITION_FAILED",
    ]) {
      expect(isFinalAnswer(code), code).toBe(true);
    }
  });

  it("keeps retrying the ones that might succeed next time", () => {
    for (const code of ["INTERNAL_SERVER_ERROR", "TIMEOUT", "TOO_MANY_REQUESTS", undefined, null]) {
      expect(isFinalAnswer(code), String(code)).toBe(false);
    }
  });
});
