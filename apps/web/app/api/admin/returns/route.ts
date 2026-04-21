import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";
import { listReturnRequestsForAdmin } from "../../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const statusParam = url.searchParams.get("status");

    const limit = limitParam ? Number(limitParam) : undefined;
    const status =
      statusParam === "requested" ||
      statusParam === "approved" ||
      statusParam === "in_transit" ||
      statusParam === "refunded" ||
      statusParam === "rejected"
        ? statusParam
        : undefined;

    const returns = await listReturnRequestsForAdmin({
      limit: Number.isFinite(limit) ? limit : 80,
      status,
    });

    return NextResponse.json({ returns });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to load return requests." }, { status: 500 });
  }
}
