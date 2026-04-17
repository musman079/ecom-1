import { NextResponse } from "next/server";

import { findProductById } from "../../../../src/lib/ecommerce-db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await findProductById(id);

  if (!product || product.status !== "published") {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
