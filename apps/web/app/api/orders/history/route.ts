/**
 * @deprecated Use GET /api/orders instead.
 * This route is kept for backwards compatibility only.
 */
import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { listRecentOrdersByUser } from "../../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);

    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const orders = await listRecentOrdersByUser(session.userId, {
      limit: Number.isFinite(limit) ? limit : 20,
    });

    const response = NextResponse.json({ orders });
    response.headers.set("X-Deprecated", "Use GET /api/orders instead");
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
