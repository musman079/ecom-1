import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../src/lib/admin-auth";
import { ProductValidationError, createAdminProduct } from "../../../src/lib/admin-products";
import { AuthError } from "../../../src/lib/auth-session";
import { listProductsWithMeta } from "../../../src/lib/ecommerce-db";

type CreateProductPayload = {
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

export async function GET(request: Request) {
  const url = new URL(request.url);

  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const sortParam = url.searchParams.get("sort");
  const sortByParam = url.searchParams.get("sortBy");
  const orderParam = url.searchParams.get("order");

  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const limit = url.searchParams.get("limit");
  const page = url.searchParams.get("page");

  const sortBy =
    sortByParam === "price" || sortByParam === "title" || sortByParam === "createdAt"
      ? sortByParam
      : sortParam === "price" || sortParam === "title" || sortParam === "createdAt"
        ? sortParam
      : undefined;
  const order = orderParam === "asc" || orderParam === "desc" ? orderParam : undefined;

  const result = await listProductsWithMeta({
    publishedOnly: true,
    category,
    search,
    sortBy,
    order,
    minPrice: minPrice !== null ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== null ? Number(maxPrice) : undefined,
    limit: limit !== null ? Number(limit) : undefined,
    page: page !== null ? Number(page) : undefined,
  });

  return NextResponse.json({
    products: result.products,
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  let payload: CreateProductPayload;
  try {
    payload = (await request.json()) as CreateProductPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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
    const product = await createAdminProduct({
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

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
