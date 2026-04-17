import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { applySessionCookie } from "../../../../src/lib/auth-session";
import { createUser } from "../../../../src/lib/ecommerce-db";

type RegisterPayload = {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
};

export async function POST(request: Request) {
  let payload: RegisterPayload;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.email || !payload.password || !payload.fullName) {
    return NextResponse.json({ error: "email, password and fullName are required." }, { status: 400 });
  }

  if (payload.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const passwordHash = await hash(payload.password, 10);
  const user = await createUser({
    email: payload.email,
    passwordHash,
    fullName: payload.fullName,
    phone: payload.phone,
  });

  if (!user) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const response = NextResponse.json(
    {
      user: {
        id: user._id.toHexString(),
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
    },
    { status: 201 },
  );

  await applySessionCookie(response, {
    userId: user._id.toHexString(),
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
  });

  return response;
}
