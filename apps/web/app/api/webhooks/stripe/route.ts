import { NextResponse } from "next/server";

import { updateOrderByAdmin } from "../../../../src/lib/ecommerce-db";

type StripeWebhookObject = {
  metadata?: {
    orderId?: string;
  };
};

/**
 * Stripe webhook receiver — verifies signature and updates order payment status.
 */
export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature") || "";
  const rawBody = await request.text();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  try {
    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default || StripeModule;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2022-11-15" });

    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // Handle relevant events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as StripeWebhookObject;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await updateOrderByAdmin({ orderId, paymentStatus: "paid" });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as StripeWebhookObject;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await updateOrderByAdmin({ orderId, paymentStatus: "paid" });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as StripeWebhookObject;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await updateOrderByAdmin({ orderId, paymentStatus: "failed" });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Stripe webhook error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
