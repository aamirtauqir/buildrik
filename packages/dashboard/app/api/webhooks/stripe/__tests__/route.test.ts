/**
 * The Stripe webhook ROUTE — signature, replay window, idempotency, retry.
 *
 * Every existing webhook test calls the service handlers directly, so the route
 * itself had none: not the HMAC check, not the 5-minute replay window, not the
 * idempotency claim, and not the release-on-failure that lets Stripe's
 * redelivery work. That is the piece the money path's last link depends on, and
 * the piece root CLAUDE.md records as having shipped broken twice because the
 * tests hand-build payloads.
 *
 * These are offline on purpose. They sign real bodies with a real HMAC and
 * assert what the route does with them; nothing here calls Stripe, creates a
 * customer, or moves money — the handlers are stubbed, because what is under
 * test is the gate in front of them.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

const eventCreate = vi.fn();
const eventDelete = vi.fn();
const handleCheckoutCompleted = vi.fn();

vi.mock("@lib/prisma", () => ({
  prisma: {
    processedWebhookEvent: {
      create: (...a: unknown[]) => eventCreate(...a),
      delete: (...a: unknown[]) => eventDelete(...a),
    },
  },
}));
/* Declared inside the factory: vi.mock is hoisted, so a class defined at the
   top level of the file is not initialised when the factory runs. */
vi.mock("@prisma/client", () => {
  class PrismaClientKnownRequestError extends Error {
    code = "P2002";
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});
vi.mock("@server/services/stripe-webhook.service", () => ({
  handleCheckoutCompleted: (...a: unknown[]) => handleCheckoutCompleted(...a),
  handleInvoicePaymentFailed: vi.fn(),
  handleSubscriptionUpdated: vi.fn(),
  handleSubscriptionDeleted: vi.fn(),
  handleInvoicePaid: vi.fn(),
}));

import { POST } from "../route";

const SECRET = "whsec_test_secret_for_route_tests";

function sign(body: string, secret = SECRET, tsSec = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${tsSec}.${body}`, "utf8").digest("hex");
  return `t=${tsSec},v1=${v1}`;
}

const EVENT = {
  id: "evt_route_1",
  type: "checkout.session.completed",
  data: { object: { client_reference_id: "ws_1", subscription: "sub_1" } },
};

function post(body: string, sig: string | null) {
  const headers = new Headers();
  if (sig) headers.set("stripe-signature", sig);
  return POST({ text: async () => body, headers } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  eventCreate.mockResolvedValue({});
  eventDelete.mockResolvedValue({});
  handleCheckoutCompleted.mockResolvedValue(undefined);
});
afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

describe("stripe webhook route", () => {
  it("accepts a correctly signed event and runs its handler", async () => {
    const body = JSON.stringify(EVENT);
    const res = await post(body, sign(body));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
    expect(handleCheckoutCompleted).toHaveBeenCalledWith(EVENT.data.object);
  });

  it("refuses a body signed with a different secret", async () => {
    const body = JSON.stringify(EVENT);
    const res = await post(body, sign(body, "whsec_someone_elses_secret"));
    expect(res.status).toBe(400);
    expect(handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it("refuses a body that changed after it was signed", async () => {
    const sig = sign(JSON.stringify(EVENT));
    const tampered = JSON.stringify({ ...EVENT, data: { object: { client_reference_id: "ws_ATTACKER", subscription: "sub_1" } } });
    const res = await post(tampered, sig);
    expect(res.status).toBe(400);
    expect(handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it("refuses a replay outside the five-minute window, however valid the HMAC", async () => {
    const body = JSON.stringify(EVENT);
    const stale = Math.floor(Date.now() / 1000) - 6 * 60;
    const res = await post(body, sign(body, SECRET, stale));
    expect(res.status).toBe(400);
    expect(handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it("accepts one just inside the window", async () => {
    const body = JSON.stringify(EVENT);
    const fresh = Math.floor(Date.now() / 1000) - 4 * 60;
    expect((await post(body, sign(body, SECRET, fresh))).status).toBe(200);
  });

  it("refuses a missing or malformed signature header", async () => {
    const body = JSON.stringify(EVENT);
    expect((await post(body, null)).status).toBe(400);
    expect((await post(body, "garbage")).status).toBe(400);
    expect((await post(body, "t=123")).status).toBe(400);
    expect(handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it("answers 500, not 400, when the endpoint secret is unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const body = JSON.stringify(EVENT);
    const res = await post(body, sign(body));
    expect(res.status).toBe(500);
  });

  it("treats a redelivered event id as a duplicate and does not re-run the handler", async () => {
    const { Prisma } = await import("@prisma/client");
    eventCreate.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("duplicate"));
    const body = JSON.stringify(EVENT);
    const res = await post(body, sign(body));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true, duplicate: true });
    expect(handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it("releases the idempotency claim when the handler throws, so a retry can work", async () => {
    handleCheckoutCompleted.mockRejectedValueOnce(new Error("transient"));
    const body = JSON.stringify(EVENT);
    const res = await post(body, sign(body));
    expect(res.status).toBe(500);
    expect(eventDelete).toHaveBeenCalledWith({ where: { eventId: "evt_route_1" } });
  });

  it("ignores an event type it does not handle, rather than failing the delivery", async () => {
    const body = JSON.stringify({ ...EVENT, id: "evt_other", type: "customer.created" });
    const res = await post(body, sign(body));
    expect(res.status).toBe(200);
    expect(handleCheckoutCompleted).not.toHaveBeenCalled();
  });
});
