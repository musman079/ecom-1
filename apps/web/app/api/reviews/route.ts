import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { createReview, listReviewsByProduct } from "../../../src/lib/ecommerce-db";
import { prisma } from "../../../src/lib/prisma";

export const dynamic = "force-dynamic";

type ReviewPayload = {
  productId?: string;
  rating?: number;
  comment?: string;
};

/**
 * Check if a user has purchased (and received/shipped) the given product.
 * Looks up orders in MongoDB for legacy orders, and Prisma for Prisma-backed orders.
 */
async function hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  // Check Prisma orders — look for delivered or shipped orders containing this product
  const prismaOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ["DELIVERED", "SHIPPED"] },
      items: {
        some: {
          // variantId links back to the product via ProductVariant
          variant: {
            productId,
          },
        },
      },
    },
    select: { id: true },
  });

  if (prismaOrder) return true;

  // Fallback: check MongoDB orders (legacy orders stored directly in Mongo)
  try {
    const { getMongoDb } = await import("../../../src/lib/mongodb");
    const { ObjectId } = await import("mongodb");
    const db = await getMongoDb();
    const orders = db.collection("orders");

    const userFilter =
      /^[a-fA-F0-9]{24}$/.test(userId)
        ? { userId: { $in: [userId, new ObjectId(userId)] } }
        : { userId };

    const mongoOrder = await orders.findOne({
      ...userFilter,
      status: { $in: ["delivered", "shipped"] },
      "items.productId": { $in: [productId, ...(ObjectId.isValid(productId) ? [new ObjectId(productId)] : [])] },
    });

    if (mongoOrder) return true;
  } catch {
    // If MongoDB check fails, don't block review — log and proceed
    console.error("[reviews/route] MongoDB purchase check failed, allowing review");
  }

  return false;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const limitParam = url.searchParams.get("limit");

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const limit = limitParam ? Number(limitParam) : undefined;
  const reviews = await listReviewsByProduct(productId, {
    approvedOnly: true,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as ReviewPayload;

    if (!payload.productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const rating = Number(payload.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5." }, { status: 400 });
    }

    const comment = payload.comment?.trim() ?? "";
    if (!comment) {
      return NextResponse.json({ error: "comment is required." }, { status: 400 });
    }

    if (comment.length > 2000) {
      return NextResponse.json({ error: "comment must be 2000 characters or less." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify the user has actually purchased and received this product
    const hasPurchased = await hasUserPurchasedProduct(session.userId, payload.productId);
    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received." },
        { status: 403 },
      );
    }

    const review = await createReview({
      productId: payload.productId,
      userId: session.userId,
      userName: user.fullName,
      rating,
      comment,
    });

    if (!review) {
      return NextResponse.json({ error: "Product not found or unavailable." }, { status: 404 });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to create review." }, { status: 500 });
  }
}
