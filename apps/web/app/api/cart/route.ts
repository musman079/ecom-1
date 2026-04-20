import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import {
  addToCart,
  getCartWithProducts,
  removeFromCart,
  updateCartItemQuantity,
} from "../../../src/lib/ecommerce-db";

type CartMutationPayload = {
  productId?: string;
  quantity?: number;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const cart = await getCartWithProducts(session.userId);
    return NextResponse.json({
      cart,
      items: cart.items,
      totalPrice: cart.subtotal,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch cart." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as CartMutationPayload;

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

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as CartMutationPayload;

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

    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(request);

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId query parameter is required." }, { status: 400 });
    }

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
