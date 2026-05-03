import { NextResponse } from "next/server";

import {
  addWishlistItemForUser,
  isWishlistProductForUser,
  listWishlistForUser,
  removeWishlistItemForUser,
} from "../../../src/lib/ecommerce-db";
import { AuthError, requireSession } from "../../../src/lib/auth-session";

type WishlistPayload = {
  productId?: string;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const items = await listWishlistForUser(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to load wishlist." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as WishlistPayload;
    const productId = payload.productId?.trim();

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const result = await addWishlistItemForUser(session.userId, productId);
    if (!result || "error" in result) {
      return NextResponse.json({ error: result?.error ?? "Failed to save wishlist item." }, { status: 400 });
    }

    return NextResponse.json({ saved: true, item: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to save wishlist item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const result = await removeWishlistItemForUser(session.userId, productId);
    if (!result || "error" in result) {
      return NextResponse.json({ error: result?.error ?? "Failed to remove wishlist item." }, { status: 400 });
    }

    return NextResponse.json({ removed: true, isWishlisted: await isWishlistProductForUser(session.userId, productId) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to remove wishlist item." }, { status: 500 });
  }
}