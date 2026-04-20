import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { mapUserRoles } from "../../../../src/lib/admin-auth";
import { applySessionCookie } from "../../../../src/lib/auth-session";
import { createUser } from "../../../../src/lib/ecommerce-db";

type RegisterPayload = {
  email?: string;
  password?: string;
  fullName?: string;
  name?: string;
  phone?: string;
};

export async function POST(request: Request) {
  let payload: RegisterPayload;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalizedName = payload.fullName ?? payload.name;

  if (!payload.email || !payload.password || !normalizedName) {
    return NextResponse.json({ error: "email, password and fullName are required." }, { status: 400 });
  }

  if (payload.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const passwordHash = await hash(payload.password, 10);
  const user = await createUser({
    email: payload.email,
    passwordHash,
    fullName: normalizedName,
    phone: payload.phone,
  });

  if (!user) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const roles = mapUserRoles(user.email, user.roles);

  const response = NextResponse.json(
    {
      token: null,
      user: {
        id: user._id.toHexString(),
        email: user.email,
        fullName: user.fullName,
        roles,
      },
    },
    { status: 201 },
  );

  await applySessionCookie(response, {
    userId: user._id.toHexString(),
    email: user.email,
    fullName: user.fullName,
    roles,
  });

  return response;
}
