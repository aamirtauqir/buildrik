import { NextRequest, NextResponse } from "next/server";
import {
  handleChargeFailed,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
} from "@/server/services/stripe-webhook.service";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: verify signature with stripe.webhooks.constructEvent(body, sig, endpointSecret) once Stripe SDK is installed
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
