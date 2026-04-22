/**
 * GET /api/orders - List recent orders for the authenticated user.
 * POST orders → use POST /api/checkout instead.
 */
import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { listRecentOrdersByUser } from "../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const orders = await listRecentOrdersByUser(session.userId, { limit: 20 });

    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
