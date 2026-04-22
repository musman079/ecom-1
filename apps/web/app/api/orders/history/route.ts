/**
 * @deprecated Use GET /api/orders instead.
 * This route is kept for backwards compatibility only.
 */
import { NextResponse } from "next/server";

import { GET as canonicalOrdersGet } from "../route";

export async function GET(request: Request) {
  const response = await canonicalOrdersGet(request);
  response.headers.set("X-Deprecated", "Use GET /api/orders instead");
  return response;
}
