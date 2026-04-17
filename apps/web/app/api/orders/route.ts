import { NextResponse } from "next/server";

import { requireSession } from "../../../src/lib/auth-session";
import { listRecentOrdersByUser } from "../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const orders = await listRecentOrdersByUser(session.userId, { limit: 20 });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
