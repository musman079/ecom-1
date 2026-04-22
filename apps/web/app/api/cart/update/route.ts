/**
 * @deprecated Use PATCH /api/cart instead.
 * This route is kept for backwards compatibility only.
 */
import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { updateCartItemQuantity } from "../../../../src/lib/ecommerce-db";

type UpdatePayload = {
  productId?: string;
  quantity?: number;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as UpdatePayload;

    if (!payload.productId || payload.quantity === undefined) {
      return NextResponse.json({ error: "productId and quantity are required." }, { status: 400 });
    }

    const quantity = Number(payload.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: "quantity must be zero or a positive number." }, { status: 400 });
    }

    const cart = await updateCartItemQuantity(session.userId, payload.productId, Math.floor(quantity));
    if (!cart) {
      return NextResponse.json({ error: "Unable to update cart item." }, { status: 404 });
    }

    const response = NextResponse.json({ cart });
    response.headers.set("X-Deprecated", "Use PATCH /api/cart instead");
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}
