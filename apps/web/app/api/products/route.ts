import { NextResponse } from "next/server";

import { listProducts } from "../../../src/lib/ecommerce-db";

export async function GET() {
  const products = await listProducts({ publishedOnly: true });
  return NextResponse.json({ products });
}
