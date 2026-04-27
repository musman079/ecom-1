import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../src/lib/admin-auth";
import { ProductValidationError, createAdminProduct } from "../../../src/lib/admin-products";
import { AuthError } from "../../../src/lib/auth-session";
import { listPublicProducts, type PublicSort } from "../../../src/lib/products";

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
  images?: string[];
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  const q = url.searchParams.get("q") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;

  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const minPriceParam = url.searchParams.get("minPrice");
  const maxPriceParam = url.searchParams.get("maxPrice");
  const sortParam = (url.searchParams.get("sort") ?? "newest") as PublicSort;

  const page = pageParam === null ? 1 : Number(pageParam);
  const limit = limitParam === null ? 12 : Number(limitParam);
  const minPrice = minPriceParam === null ? undefined : Number(minPriceParam);
  const maxPrice = maxPriceParam === null ? undefined : Number(maxPriceParam);

  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "page must be an integer greater than or equal to 1." }, { status: 400 });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ error: "limit must be an integer between 1 and 50." }, { status: 400 });
  }

  if (minPriceParam !== null && (!Number.isFinite(minPrice) || (minPrice ?? 0) < 0)) {
    return NextResponse.json({ error: "minPrice must be a non-negative number." }, { status: 400 });
  }

  if (maxPriceParam !== null && (!Number.isFinite(maxPrice) || (maxPrice ?? 0) < 0)) {
    return NextResponse.json({ error: "maxPrice must be a non-negative number." }, { status: 400 });
  }

  if (typeof minPrice === "number" && typeof maxPrice === "number" && minPrice > maxPrice) {
    return NextResponse.json({ error: "minPrice must be less than or equal to maxPrice." }, { status: 400 });
  }

  try {
    const result = await listPublicProducts({
      q,
      category,
      minPrice,
      maxPrice,
      sort: sortParam,
      page,
      limit,
    });

    return NextResponse.json({
      products: result.products,
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPages: result.meta.totalPages,
      hasNextPage: result.meta.hasNextPage,
      hasPrevPage: result.meta.hasPrevPage,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
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
      images: Array.isArray(payload.images) ? payload.images : [],
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
