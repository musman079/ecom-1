import { NextResponse } from "next/server";

import { listProductsWithMeta } from "../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const sortByParam = url.searchParams.get("sortBy");
  const orderParam = url.searchParams.get("order");

  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const limit = url.searchParams.get("limit");
  const page = url.searchParams.get("page");

  const sortBy =
    sortByParam === "price" || sortByParam === "title" || sortByParam === "createdAt"
      ? sortByParam
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

  return NextResponse.json(result);
}
