import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { getNotificationPreferencesByUserId, updateNotificationPreferencesByUserId } from "../../../../src/lib/ecommerce-db";

type PreferencePayload = {
  orderUpdates?: boolean;
  returnUpdates?: boolean;
  emailEnabled?: boolean;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const preferences = await getNotificationPreferencesByUserId(session.userId);

    if (!preferences) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to load preferences." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession(request);

    let payload: PreferencePayload;
    try {
      payload = (await request.json()) as PreferencePayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const updated = await updateNotificationPreferencesByUserId(session.userId, {
      orderUpdates: typeof payload.orderUpdates === "boolean" ? payload.orderUpdates : undefined,
      returnUpdates: typeof payload.returnUpdates === "boolean" ? payload.returnUpdates : undefined,
      emailEnabled: typeof payload.emailEnabled === "boolean" ? payload.emailEnabled : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to save preferences." }, { status: 500 });
  }
}
