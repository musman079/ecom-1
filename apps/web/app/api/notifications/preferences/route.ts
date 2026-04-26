import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { prisma } from "../../../../src/lib/prisma";

type PreferencePayload = {
  orderUpdates?: boolean;
  returnUpdates?: boolean;
  emailEnabled?: boolean;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        isActive: true,
        notificationOrderUpdates: true,
        notificationReturnUpdates: true,
        notificationEmailEnabled: true,
      },
    });

    const preferences =
      user && user.isActive
        ? {
            orderUpdates: user.notificationOrderUpdates,
            returnUpdates: user.notificationReturnUpdates,
            emailEnabled: user.notificationEmailEnabled,
          }
        : null;

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

    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        isActive: true,
        notificationOrderUpdates: true,
        notificationReturnUpdates: true,
        notificationEmailEnabled: true,
      },
    });

    if (!current || !current.isActive) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const data: {
      notificationOrderUpdates?: boolean;
      notificationReturnUpdates?: boolean;
      notificationEmailEnabled?: boolean;
    } = {};

    if (typeof payload.orderUpdates === "boolean") {
      data.notificationOrderUpdates = payload.orderUpdates;
    }

    if (typeof payload.returnUpdates === "boolean") {
      data.notificationReturnUpdates = payload.returnUpdates;
    }

    if (typeof payload.emailEnabled === "boolean") {
      data.notificationEmailEnabled = payload.emailEnabled;
    }

    const updated =
      Object.keys(data).length > 0
        ? await prisma.user.update({
            where: { id: session.userId },
            data,
            select: {
              notificationOrderUpdates: true,
              notificationReturnUpdates: true,
              notificationEmailEnabled: true,
            },
          })
        : {
            notificationOrderUpdates: current.notificationOrderUpdates,
            notificationReturnUpdates: current.notificationReturnUpdates,
            notificationEmailEnabled: current.notificationEmailEnabled,
          };

    return NextResponse.json({
      preferences: {
        orderUpdates: updated.notificationOrderUpdates,
        returnUpdates: updated.notificationReturnUpdates,
        emailEnabled: updated.notificationEmailEnabled,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to save preferences." }, { status: 500 });
  }
}
