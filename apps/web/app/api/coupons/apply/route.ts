import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { applyCouponCode } from "../../../../src/lib/ecommerce-db";

type ApplyCouponPayload = {
  code?: string;
  subtotal?: number;
};

export async function POST(request: Request) {
  try {
    await requireSession(request);
    const payload = (await request.json()) as ApplyCouponPayload;

    if (!payload.code || payload.subtotal === undefined) {
      return NextResponse.json({ error: "code and subtotal are required." }, { status: 400 });
    }

    const subtotal = Number(payload.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "subtotal must be a valid non-negative number." }, { status: 400 });
    }

    const result = await applyCouponCode({ code: payload.code, subtotal });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ coupon: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to apply coupon." }, { status: 500 });
  }
}
