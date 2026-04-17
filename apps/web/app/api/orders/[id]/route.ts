import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { getOrderByIdForUser } from "../../../../src/lib/ecommerce-db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { id } = await context.params;

    const order = await getOrderByIdForUser(session.userId, id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch order." }, { status: 500 });
  }
}
