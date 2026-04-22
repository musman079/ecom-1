import { Prisma, RoleType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  assertAuthEnvironment,
  AuthConfigError,
  hashPassword,
  isAdminEmail,
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
  const derivedName = email.includes("@") ? (email.split("@")[0] ?? "Customer") : "Customer";
  const resolvedFullName = fullName || derivedName;

  if (!email || !password) {
    return errorResponse("email and password are required.", 400);
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

    const roleNames: RoleType[] = isAdminEmail(email) ? ["CUSTOMER", "ADMIN"] : ["CUSTOMER"];

    await Promise.all(
      roleNames.map((name) =>
        prisma.role.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    const user = await prisma.user.create({
      data: {
        fullName: resolvedFullName,
        email,
        passwordHash,
        phone,
        isActive: true,
        roles: {
          create: roleNames.map((name) => ({
            role: {
              connect: { name },
            },
          })),
        },
      },
    });

    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      return errorResponse("Failed to load created user.", 500);
    }

    const userRoleNames = userWithRoles.roles.map((entry) => entry.role.name);
    const role = userRoleNames.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : userRoleNames.includes("ADMIN")
        ? "ADMIN"
        : "CUSTOMER";

    const token = await signAuthToken({
      sub: user.id,
      email: userWithRoles.email,
      role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        user: sanitizeAuthUser({
          id: user.id,
          email: userWithRoles.email,
          fullName: userWithRoles.fullName,
          phone: userWithRoles.phone,
          role,
          roles: userRoleNames,
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
