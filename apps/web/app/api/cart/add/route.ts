/**
 * @deprecated Use POST /api/cart instead.
 * This route is kept for backwards compatibility only.
 */
import { NextResponse } from "next/server";

import { POST as canonicalCartPost } from "../route";

export async function POST(request: Request) {
  const response = await canonicalCartPost(request);
  response.headers.set("X-Deprecated", "Use POST /api/cart instead");
  return response;
}
