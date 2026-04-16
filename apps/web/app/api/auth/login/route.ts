import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSessionCookie } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";
import { ensureAdminSeeded } from "../../../../src/lib/seed-admin";

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

  await ensureAdminSeeded();

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const roles = user.roles.map((entry) => entry.role.name);

  await createSessionCookie({
    sub: user.id,
    email: user.email,
    roles,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
    },
  });
}
