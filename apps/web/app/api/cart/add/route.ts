import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { addToCart } from "../../../../src/lib/ecommerce-db";

type AddPayload = {
  productId?: string;
  quantity?: number;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as AddPayload;

    if (!payload.productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const quantity = Number(payload.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "quantity must be a positive number." }, { status: 400 });
    }

    const cart = await addToCart(session.userId, payload.productId, Math.floor(quantity));
    if (!cart) {
      return NextResponse.json({ error: "Product not found or unavailable." }, { status: 404 });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to add to cart." }, { status: 500 });
  }
}
