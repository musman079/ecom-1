import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { removeFromCart } from "../../../../src/lib/ecommerce-db";

type RemovePayload = {
  productId?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as RemovePayload;

    if (!payload.productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const cart = await removeFromCart(session.userId, payload.productId);
    if (!cart) {
      return NextResponse.json({ error: "Unable to remove item from cart." }, { status: 404 });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}
