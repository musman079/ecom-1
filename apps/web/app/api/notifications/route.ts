import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { listNotificationsByUser, markNotificationsReadByUser } from "../../../src/lib/ecommerce-db";

type MarkPayload = {
  ids?: string[];
  markAll?: boolean;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);

    const limitParam = url.searchParams.get("limit");
    const unreadOnlyParam = url.searchParams.get("unreadOnly");
    const kindParam = url.searchParams.get("kind");
    const audienceParam = url.searchParams.get("audience");
    const limit = limitParam ? Number(limitParam) : undefined;

    const kind =
      kindParam === "order_created" ||
      kindParam === "order_status_updated" ||
      kindParam === "return_requested" ||
      kindParam === "return_status_updated" ||
      kindParam === "admin_return_requested"
        ? kindParam
        : undefined;

    const audience = audienceParam === "customer" || audienceParam === "admin" ? audienceParam : undefined;

    const data = await listNotificationsByUser(session.userId, {
      limit: Number.isFinite(limit) ? limit : 25,
      unreadOnly: unreadOnlyParam === "1" || unreadOnlyParam === "true",
      kind,
      audience,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);

    let payload: MarkPayload;
    try {
      payload = (await request.json()) as MarkPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await markNotificationsReadByUser(session.userId, {
      ids: Array.isArray(payload.ids) ? payload.ids : [],
      markAll: payload.markAll === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update notifications." }, { status: 500 });
  }
}
