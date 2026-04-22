/**
 * @deprecated Use PATCH /api/cart instead.
 * This route is kept for backwards compatibility only.
 */
import { NextResponse } from "next/server";

import { PATCH as canonicalCartPatch } from "../route";

export async function POST(request: Request) {
  const body = await request.text();
  const canonicalRequest = new Request(request.url, {
    method: "PATCH",
    headers: request.headers,
    body,
  });

  const response = await canonicalCartPatch(canonicalRequest);
  response.headers.set("X-Deprecated", "Use PATCH /api/cart instead");
  return response;
}
