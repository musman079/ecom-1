import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { applySessionCookie } from "../../../../src/lib/auth-session";
import { findUserByEmail } from "../../../../src/lib/ecommerce-db";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.email || !payload.password) {
    return NextResponse.json({ error: "email and password are required." }, { status: 400 });
  }

  const user = await findUserByEmail(payload.email);
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const passwordValid = await compare(payload.password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user._id.toHexString(),
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
    },
  });

  await applySessionCookie(response, {
    userId: user._id.toHexString(),
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
  });

  return response;
}
