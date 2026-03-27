import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  handleChargeFailed,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
} from "@/server/services/stripe-webhook.service";

function verifyStripeSignature(body: string, sig: string, secret: string): boolean {
  // Stripe signature format: t=<timestamp>,v1=<hmac>
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=")));
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;

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

  let event: { type: string; data: { object: any } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
