import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";
import { listRecentOrdersForAdmin } from "../../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const statusParam = url.searchParams.get("status");

    const limit = limitParam ? Number(limitParam) : undefined;
    const status =
      statusParam === "pending" ||
      statusParam === "confirmed" ||
      statusParam === "processing" ||
      statusParam === "shipped" ||
      statusParam === "delivered" ||
      statusParam === "cancelled"
        ? statusParam
        : undefined;

    const orders = await listRecentOrdersForAdmin({
      limit: Number.isFinite(limit) ? limit : 50,
      status,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
