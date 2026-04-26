import { NextResponse } from "next/server";

import { requireSession } from "../../../src/lib/auth-session";
import { prisma } from "../../../src/lib/prisma";

type UpdateProfilePayload = {
  fullName?: string;
  phone?: string;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  let payload: UpdateProfilePayload;

  try {
    payload = (await request.json()) as UpdateProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.fullName || !payload.fullName.trim()) {
    return NextResponse.json({ error: "fullName is required." }, { status: 400 });
  }

  try {
    const session = await requireSession(request);
    const updated = await prisma.user.updateMany({
      where: {
        id: session.userId,
        isActive: true,
      },
      data: {
        fullName: payload.fullName.trim(),
        phone: payload.phone?.trim() || null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
