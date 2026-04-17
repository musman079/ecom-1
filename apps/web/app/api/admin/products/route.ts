import { NextResponse } from "next/server";

import { ProductValidationError, createAdminProduct, listAdminProducts } from "../../../../src/lib/admin-products";

type RequestPayload = {
  title?: string;
  description?: string;
  price?: string | number;
  taxCategory?: string;
  collection?: string;
  sku?: string;
  stockQuantity?: string | number;
  lowStockAlert?: boolean;
  status?: "draft" | "published";
};

export async function GET() {
  const products = await listAdminProducts();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  let payload: RequestPayload;

  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.title || !payload.description || payload.price === undefined || !payload.sku) {
    return NextResponse.json({ error: "Missing required product fields." }, { status: 400 });
  }

  const price = Number(payload.price);
  const stockQuantity = Number(payload.stockQuantity ?? 0);

  if (!Number.isFinite(price) || !Number.isFinite(stockQuantity)) {
    return NextResponse.json({ error: "Price and stock quantity must be valid numbers." }, { status: 400 });
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return NextResponse.json({ error: "Stock quantity must be a non-negative integer." }, { status: 400 });
  }

  if (price < 0) {
    return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
  }

  if (payload.status && payload.status !== "draft" && payload.status !== "published") {
    return NextResponse.json({ error: "Invalid product status." }, { status: 400 });
  }

  try {
    const product = await createAdminProduct({
      title: payload.title,
      description: payload.description,
      price,
      taxCategory: payload.taxCategory ?? "Standard Goods (20%)",
      collection: payload.collection ?? "FW24 Editorial",
      sku: payload.sku,
      stockQuantity,
      lowStockAlert: payload.lowStockAlert ?? false,
      status: payload.status ?? "draft",
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
