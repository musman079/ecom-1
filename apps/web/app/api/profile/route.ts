import { NextResponse } from "next/server";

import { requireSession } from "../../../src/lib/auth-session";
import { findUserById, updateUserProfile } from "../../../src/lib/ecommerce-db";

type UpdateProfilePayload = {
  fullName?: string;
  phone?: string;
};

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const user = await findUserById(session.userId);

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user._id.toHexString(),
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
    const updated = await updateUserProfile(session.userId, {
      fullName: payload.fullName,
      phone: payload.phone,
    });

    if (!updated || !updated.isActive) {
      return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
    }

    return NextResponse.json({
      profile: {
        id: updated._id.toHexString(),
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
