import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";
import { getAdminDashboardMetrics } from "../../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const dashboard = await getAdminDashboardMetrics();
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
