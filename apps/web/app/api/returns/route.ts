import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { createReturnRequestForUser, listReturnRequestsByUser } from "../../../src/lib/ecommerce-db";

type ReturnCreatePayload = {
  orderId?: string;
  reason?: string;
  notes?: string;
  resolution?: "refund" | "exchange";
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);

    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const returns = await listReturnRequestsByUser(session.userId, {
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json({ returns });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch return requests." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as ReturnCreatePayload;

    const reason = payload.reason?.trim() ?? "";
    const notes = payload.notes?.trim();

    if (!payload.orderId || !reason || (payload.resolution !== "refund" && payload.resolution !== "exchange")) {
      return NextResponse.json({ error: "orderId, reason and valid resolution are required." }, { status: 400 });
    }

    if (reason.length < 8) {
      return NextResponse.json({ error: "Reason must be at least 8 characters." }, { status: 400 });
    }

    if (reason.length > 300) {
      return NextResponse.json({ error: "Reason must be 300 characters or less." }, { status: 400 });
    }

    if (notes && notes.length > 500) {
      return NextResponse.json({ error: "Notes must be 500 characters or less." }, { status: 400 });
    }

    const created = await createReturnRequestForUser(session.userId, {
      orderId: payload.orderId,
      reason,
      notes,
      resolution: payload.resolution,
    });

    if (!created) {
      return NextResponse.json({ error: "Failed to create return request." }, { status: 500 });
    }

    if ("error" in created) {
      return NextResponse.json({ error: created.error }, { status: 400 });
    }

    return NextResponse.json({ returnRequest: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to create return request." }, { status: 500 });
  }
}
