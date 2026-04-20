import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../../src/lib/admin-auth";
import { AuthError } from "../../../../../src/lib/auth-session";
import { updateOrderByAdmin } from "../../../../../src/lib/ecommerce-db";

type RequestPayload = {
  status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  paymentStatus?: "pending" | "paid" | "failed";
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id } = await context.params;
  const order = await updateOrderByAdmin({
    orderId: id,
    status: payload.status,
    trackingNumber: payload.trackingNumber,
    paymentStatus: payload.paymentStatus,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
