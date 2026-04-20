import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  assertAuthEnvironment,
  AuthConfigError,
  hashPassword,
  normalizeEmail,
  signAuthToken,
  setAuthCookie,
  validateEmailFormat,
  validatePasswordStrength,
} from "../../../../src/lib/auth";
import { sanitizeAuthUser } from "../../../../src/lib/get-current-user";
import { prisma } from "../../../../src/lib/prisma";

type RegisterPayload = {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    assertAuthEnvironment();
  } catch (error) {
    const message = error instanceof AuthConfigError ? error.message : "Authentication environment is not configured.";
    return errorResponse(message, 500);
  }

  let payload: RegisterPayload;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const fullName = payload.fullName?.trim() ?? "";
  const email = normalizeEmail(payload.email ?? "");
  const password = payload.password ?? "";
  const phone = payload.phone?.trim() || null;

  if (!fullName || !email || !password) {
    return errorResponse("fullName, email and password are required.", 400);
  }

  if (!validateEmailFormat(email)) {
    return errorResponse("A valid email address is required.", 400);
  }

  if (!validatePasswordStrength(password)) {
    return errorResponse("Password must be at least 8 characters.", 400);
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return errorResponse("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(password);

    await prisma.role.upsert({
      where: { name: "CUSTOMER" },
      update: {},
      create: { name: "CUSTOMER" },
    });

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        phone,
        isActive: true,
        roles: {
          create: [
            {
              role: {
                connect: { name: "CUSTOMER" },
              },
            },
          ],
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

    const roleNames = user.roles.map((entry) => entry.role.name);
    const role = roleNames.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : roleNames.includes("ADMIN")
        ? "ADMIN"
        : "CUSTOMER";

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        user: sanitizeAuthUser({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role,
        }),
      },
      { status: 201 },
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("An account with this email already exists.", 409);
    }

    console.error("Register API failed", error);
    return errorResponse("Failed to register user.", 500);
  }
}
