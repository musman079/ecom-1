import { NextResponse } from "next/server";

import { getOrderByIdForAdmin, updateOrderByAdmin } from "../../../../src/lib/ecommerce-db";

export const dynamic = "force-dynamic";

type StripeWebhookObject = {
  metadata?: {
    orderId?: string;
  };
};

/**
 * In-memory set of processed Stripe event IDs.
 * Prevents duplicate processing when Stripe retries events.
 * Resets on server restart — for production, use Redis or DB storage.
 */
const processedEventIds = new Set<string>();
const MAX_PROCESSED_IDS = 10_000;

function markEventProcessed(eventId: string) {
  if (processedEventIds.size >= MAX_PROCESSED_IDS) {
    // Remove oldest entry (Set preserves insertion order)
    const first = processedEventIds.values().next().value;
    if (first) processedEventIds.delete(first);
  }
  processedEventIds.add(eventId);
}

/**
 * Stripe webhook receiver — verifies signature and updates order payment status.
 * Idempotent: skips already-processed events and already-paid orders.
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

    // Idempotency check: skip if we already processed this Stripe event
    if (processedEventIds.has(event.id)) {
      return NextResponse.json({ received: true, skipped: "duplicate_event" }, { status: 200 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as StripeWebhookObject;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        // Check current payment status before updating (prevents double-pay)
        const existing = await getOrderByIdForAdmin(orderId);
        if (existing && existing.paymentStatus !== "paid") {
          await updateOrderByAdmin({ orderId, paymentStatus: "paid" });
        }
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as StripeWebhookObject;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        const existing = await getOrderByIdForAdmin(orderId);
        if (existing && existing.paymentStatus !== "paid") {
          await updateOrderByAdmin({ orderId, paymentStatus: "paid" });
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as StripeWebhookObject;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        const existing = await getOrderByIdForAdmin(orderId);
        if (existing && existing.paymentStatus !== "failed") {
          await updateOrderByAdmin({ orderId, paymentStatus: "failed" });
        }
      }
    }

    // Mark event as processed after successful handling
    markEventProcessed(event.id);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Stripe webhook error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
