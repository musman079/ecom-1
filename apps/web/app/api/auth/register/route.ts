import { NextResponse } from "next/server";

import {
  getPasswordStrengthError,
  hashPassword,
  isAdminEmail,
  normalizeEmail,
  validateEmailFormat,
  validatePasswordStrength,
} from "../../../../src/lib/auth";
import { sanitizeAuthUser } from "../../../../src/lib/get-current-user";
import { prisma } from "../../../../src/lib/prisma";
import { getClientIp, rateLimitResponse, registerRateLimiter } from "../../../../src/lib/rate-limit";

export const dynamic = "force-dynamic";

type RegisterPayload = {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
};

type RoleName = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

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
  // Rate limit: 3 registrations per hour per IP
  const ip = getClientIp(request);
  const rl = registerRateLimiter.check(ip);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetAt);
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
    const passwordError = getPasswordStrengthError(password);
    return errorResponse(passwordError ?? "Password does not meet strength requirements.", 400);
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

    const roleNames: RoleName[] = isAdminEmail(email) ? ["CUSTOMER", "ADMIN"] : ["CUSTOMER"];

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

    const userRoleNames = userWithRoles.roles.map((entry: typeof userWithRoles.roles[number]) => entry.role.name);
    const role = userRoleNames.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : userRoleNames.includes("ADMIN")
        ? "ADMIN"
        : "CUSTOMER";

    return NextResponse.json(
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
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return errorResponse("An account with this email already exists.", 409);
    }

    console.error("Register API failed", error);
    return errorResponse("Failed to register user.", 500);
  }
}
