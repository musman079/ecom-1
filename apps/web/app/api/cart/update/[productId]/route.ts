import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../../src/lib/auth-session";
import { updateCartItemQuantity } from "../../../../../src/lib/ecommerce-db";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

type UpdatePayload = {
  quantity?: number;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { productId } = await context.params;
    const payload = (await request.json()) as UpdatePayload;

    const quantity = Number(payload.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: "quantity must be zero or a positive number." }, { status: 400 });
    }

    const cart = await updateCartItemQuantity(session.userId, productId, Math.floor(quantity));
    if (!cart) {
      return NextResponse.json({ error: "Unable to update cart item." }, { status: 404 });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}
