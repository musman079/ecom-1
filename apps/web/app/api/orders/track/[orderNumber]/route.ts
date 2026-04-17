import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../../src/lib/auth-session";
import { trackOrderForUser } from "../../../../../src/lib/ecommerce-db";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { orderNumber } = await context.params;

    const tracking = await trackOrderForUser(session.userId, orderNumber);
    if (!tracking) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ tracking });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to track order." }, { status: 500 });
  }
}
