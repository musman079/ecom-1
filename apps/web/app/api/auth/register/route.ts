import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSessionCookie } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

type RegisterPayload = {
  email?: string;
  password?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  let payload: RegisterPayload;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const fullName = payload.fullName?.trim();

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Email, password, and full name are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Account already exists for this email." }, { status: 409 });
  }

  const customerRole = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: {},
    create: { name: "CUSTOMER" },
  });

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: await hash(password, 12),
      roles: {
        create: {
          roleId: customerRole.id,
        },
      },
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

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
