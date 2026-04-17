import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { createReview, findUserById, listReviewsByProduct } from "../../../src/lib/ecommerce-db";

type ReviewPayload = {
  productId?: string;
  rating?: number;
  comment?: string;
};

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

    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
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
