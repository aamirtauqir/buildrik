/**
 * The cron bearer check, and the way it used to fail open.
 *
 * Every cron route inlined `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``.
 * With the secret unset that template is the literal "Bearer undefined", so a
 * request carrying that exact header passed the check on an unconfigured
 * deployment. The first case below is that request.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkCronAuth, checkWorkerAuth } from "../cron-auth";

const req = (authorization: string | null) => ({
  headers: { get: (n: string) => (n.toLowerCase() === "authorization" ? authorization : null) },
});

const original = process.env.CRON_SECRET;
afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;
});

describe("checkCronAuth", () => {
  it("refuses 'Bearer undefined' when the secret is unset, and says why", async () => {
    delete process.env.CRON_SECRET;
    const res = checkCronAuth(req("Bearer undefined"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(500);
    await expect(res!.text()).resolves.toMatch(/not configured/i);
  });

  it("refuses every request when the secret is unset, not just that one", () => {
    delete process.env.CRON_SECRET;
    expect(checkCronAuth(req("Bearer anything"))?.status).toBe(500);
    expect(checkCronAuth(req(null))?.status).toBe(500);
  });

  it("lets the correct bearer through", () => {
    process.env.CRON_SECRET = "s3cr3t-value";
    expect(checkCronAuth(req("Bearer s3cr3t-value"))).toBeNull();
  });

  it("rejects a wrong secret, a missing header, and a same-length near miss", () => {
    process.env.CRON_SECRET = "s3cr3t-value";
    expect(checkCronAuth(req("Bearer s3cr3t-valuF"))?.status).toBe(401);
    expect(checkCronAuth(req("Bearer wrong"))?.status).toBe(401);
    expect(checkCronAuth(req(null))?.status).toBe(401);
    expect(checkCronAuth(req("s3cr3t-value"))?.status).toBe(401);
  });
});

describe("checkWorkerAuth", () => {
  const wreq = (secret: string | null) => ({
    headers: { get: (n: string) => (n === "x-worker-secret" ? secret : null) },
  });

  it("says 'not configured' rather than 401 when the secret is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = checkWorkerAuth(wreq("anything"));
    expect(res?.status).toBe(500);
    await expect(res!.text()).resolves.toMatch(/not configured/i);
  });

  it("lets the worker through with the raw secret, no Bearer prefix", () => {
    process.env.CRON_SECRET = "s3cr3t-value";
    expect(checkWorkerAuth(wreq("s3cr3t-value"))).toBeNull();
    expect(checkWorkerAuth(wreq("Bearer s3cr3t-value"))?.status).toBe(401);
  });

  it("rejects a wrong secret and a missing header", () => {
    process.env.CRON_SECRET = "s3cr3t-value";
    expect(checkWorkerAuth(wreq("nope"))?.status).toBe(401);
    expect(checkWorkerAuth(wreq(null))?.status).toBe(401);
  });
});
