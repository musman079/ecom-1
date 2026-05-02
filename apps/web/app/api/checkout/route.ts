import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { checkoutFromPrismaCart } from "../../../src/lib/ecommerce-db";

function dollarsToCents(value: number) {
  return Math.round(Number(value) * 100);
}

/** Line items whose amounts sum exactly to `result.total` (matches cart / order totals). */
function stripeLineItemsFromOrderResult(result: {
  orderNumber: string;
  subtotal: number;
  discountAmount?: number | null;
  couponCode?: string | null;
  shippingCost: number;
  taxAmount: number;
  total: number;
}) {
  const totalCentsTarget = dollarsToCents(Number(result.total));
  const discountedMerch = Number(
    Math.max(0, result.subtotal - (result.discountAmount ?? 0)).toFixed(2),
  );
  let merchandiseCents = dollarsToCents(discountedMerch);
  const shippingCents = dollarsToCents(Number(result.shippingCost));
  const taxCents = dollarsToCents(Number(result.taxAmount));
  merchandiseCents += totalCentsTarget - merchandiseCents - shippingCents - taxCents;

  if (totalCentsTarget <= 0) {
    return [];
  }

  if (merchandiseCents < 0) {
    return [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Order ${result.orderNumber}` },
          unit_amount: totalCentsTarget,
        },
        quantity: 1,
      },
    ];
  }

  const discountApplied = Number(result.discountAmount ?? 0) > 0;
  const couponBit =
    discountApplied && result.couponCode
      ? ` — code ${result.couponCode}`
      : discountApplied
        ? " — discount applied"
        : "";

  const lines = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: `Merchandise${couponBit}`,
        },
        unit_amount: merchandiseCents,
      },
      quantity: 1,
    },
  ];

  if (shippingCents > 0) {
    lines.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping" },
        unit_amount: shippingCents,
      },
      quantity: 1,
    });
  }

  if (taxCents > 0) {
    lines.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Estimated tax" },
        unit_amount: taxCents,
      },
      quantity: 1,
    });
  }

  return lines;
}

type CheckoutPayload = {
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  paymentMethod?: "card" | "cod";
  notes?: string;
  couponCode?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as CheckoutPayload;

    const address = payload.shippingAddress;
    if (
      !address ||
      !address.fullName ||
      !address.phone ||
      !address.line1 ||
      !address.city ||
      !address.postalCode ||
      !address.country
    ) {
      return NextResponse.json({ error: "Complete shippingAddress is required." }, { status: 400 });
    }

    const paymentMethod = payload.paymentMethod === "card" || payload.paymentMethod === "cod" ? payload.paymentMethod : "cod";

    const result = await checkoutFromPrismaCart(session.userId, {
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      },
      paymentMethod,
      notes: payload.notes,
      couponCode: payload.couponCode,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If card payments are requested and Stripe is configured, create a Checkout Session
    try {
      const wantsCard = paymentMethod === "card";
      const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);

      if (wantsCard && hasStripe) {
        const StripeModule = await import("stripe");
        const Stripe = StripeModule.default || StripeModule;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2022-11-15" });

        const line_items = stripeLineItemsFromOrderResult(result);

        if (line_items.length === 0) {
          console.warn("Stripe: order total is zero; skipping Checkout Session.", result.orderNumber);
          return NextResponse.json({ order: result }, { status: 201 });
        }

        const successUrlBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
        const success_url = `${successUrlBase}/order_tracking?orderNumber=${encodeURIComponent(result.orderNumber)}`;
        const cancel_url = `${successUrlBase}/cart_checkout`;

        const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items,
          metadata: {
            orderId: result.orderId,
            orderNumber: result.orderNumber,
          },
          success_url,
          cancel_url,
        });

        return NextResponse.json({ order: result, checkoutUrl: checkoutSession.url }, { status: 201 });
      }
    } catch (err) {
      // If Stripe creation fails, return the order but include error info for logs
      // Do not block the user from a COD flow or manual handling.
      console.error("Stripe checkout creation failed:", err);
    }

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}
