import { createHmac, timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import {
  handleChargeFailed,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
} from "@server/services/stripe-webhook.service";

// Reject signatures whose timestamp is more than this far from now — without
// it, a captured-but-valid signed body could be replayed indefinitely.
const SIGNATURE_TOLERANCE_SEC = 5 * 60;

function verifyStripeSignature(body: string, sig: string, secret: string): boolean {
  // Stripe signature format: t=<timestamp>,v1=<hmac>
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=")));
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

  // Replay window check on the signed timestamp.
  const tsSec = Number(timestamp);
  if (!Number.isFinite(tsSec)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsSec) > SIGNATURE_TOLERANCE_SEC) return false;

  const signed = `${timestamp}.${body}`;
  const expected = createHmac("sha256", secret).update(signed, "utf8").digest("hex");

  try {
    return timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyStripeSignature(body, sig, endpointSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { id?: string; type: string; data: { object: any } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Idempotency: record the event id before handling. Stripe redelivers until
  // it gets a 2xx, so without this a retried charge.failed would re-flip the
  // subscription to PAST_DUE and spam a fresh payment-failed notification +
  // email every attempt. A duplicate insert (P2002) means already handled.
  if (event.id) {
    try {
      await prisma.processedWebhookEvent.create({
        data: { eventId: event.id, type: event.type },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw e;
    }
  }

  try {
    switch (event.type) {
      case "charge.failed": {
        const subscriptionId = event.data.object.subscription;
        if (subscriptionId) await handleChargeFailed(subscriptionId);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await handleSubscriptionUpdated(sub.id, sub);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object.id);
        break;
      }
      case "invoice.paid": {
        await handleInvoicePaid(event.data.object);
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Release the idempotency claim so Stripe's redelivery can re-attempt —
    // otherwise a transient handler failure would be permanently skipped as
    // a "duplicate" on retry.
    if (event.id) {
      await prisma.processedWebhookEvent
        .delete({ where: { eventId: event.id } })
        .catch(() => {});
    }
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
