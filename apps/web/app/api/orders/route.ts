/**
 * GET /api/orders - List recent orders for the authenticated user.
 * POST /api/orders - Place an order using client cart items.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { listRecentOrdersByUser, placeOrderFromItems } from "../../../src/lib/ecommerce-db";

const placeOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
    }),
  ).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    line1: z.string().min(3),
    city: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
  paymentMethod: z.enum(["card", "cod"]).default("cod"),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const orders = await listRecentOrdersByUser(session.userId, { limit: 20 });

    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const json = (await request.json()) as unknown;
    const parsed = placeOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({
        error: "Invalid order payload.",
        details: parsed.error.flatten(),
      }, { status: 400 });
    }

    const result = await placeOrderFromItems(session.userId, parsed.data);

    if (!result) {
      return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}
