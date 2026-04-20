import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";
import { getAdminAnalytics } from "../../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    const url = new URL(request.url);
    const monthsParam = url.searchParams.get("months");
    const topProductsLimitParam = url.searchParams.get("topProductsLimit");

    const months = monthsParam ? Number(monthsParam) : undefined;
    const topProductsLimit = topProductsLimitParam ? Number(topProductsLimitParam) : undefined;

    const analytics = await getAdminAnalytics({
      months: Number.isFinite(months) ? months : undefined,
      topProductsLimit: Number.isFinite(topProductsLimit) ? topProductsLimit : undefined,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to load analytics." }, { status: 500 });
  }
}
