import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../../src/lib/auth-session";
import { removeFromCart } from "../../../../../src/lib/ecommerce-db";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { productId } = await context.params;

    const cart = await removeFromCart(session.userId, productId);
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
