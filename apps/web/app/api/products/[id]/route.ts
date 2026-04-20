import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import {
  ProductValidationError,
  deleteAdminProduct,
  updateAdminProduct,
} from "../../../../src/lib/admin-products";
import { AuthError } from "../../../../src/lib/auth-session";
import { getPublicProductByIdOrSlug } from "../../../../src/lib/products";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateProductPayload = {
  name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  stockQuantity?: number | string;
  sku?: string;
  category?: string;
  collection?: string;
  taxCategory?: string;
  status?: "draft" | "published";
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getPublicProductByIdOrSlug(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  let payload: UpdateProductPayload;
  try {
    payload = (await request.json()) as UpdateProductPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id } = await context.params;
  const title = (payload.title ?? payload.name ?? "").trim();
  const price = Number(payload.price);
  const stockQuantity = Number(payload.stockQuantity ?? payload.stock ?? 0);

  if (!title || !payload.description || !payload.sku || !Number.isFinite(price)) {
    return NextResponse.json({ error: "name/title, description, price and sku are required." }, { status: 400 });
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return NextResponse.json({ error: "stock must be a non-negative integer." }, { status: 400 });
  }

  try {
    const product = await updateAdminProduct(id, {
      title,
      description: payload.description,
      price,
      taxCategory: payload.taxCategory ?? "Standard Goods (20%)",
      collection: payload.collection ?? payload.category ?? "General",
      sku: payload.sku,
      stockQuantity,
      lowStockAlert: stockQuantity <= 5,
      status: payload.status ?? "published",
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  const { id } = await context.params;
  const deleted = await deleteAdminProduct(id);

  if (!deleted) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
