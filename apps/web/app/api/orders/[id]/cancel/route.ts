import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../../src/lib/auth-session";
import { cancelOrderForUser, getOrderByIdForUser } from "../../../../../src/lib/ecommerce-db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { id } = await context.params;

    const result = await cancelOrderForUser(session.userId, id);

    if (!result) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const order = await getOrderByIdForUser(session.userId, id);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to cancel order." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}
