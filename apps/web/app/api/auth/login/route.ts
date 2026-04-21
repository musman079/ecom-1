import { NextResponse } from "next/server";

import {
  assertAuthEnvironment,
  AuthConfigError,
  normalizeEmail,
  setAuthCookie,
  signAuthToken,
  verifyPassword,
} from "../../../../src/lib/auth";
import { ensureMongoCustomerUser } from "../../../../src/lib/auth-user-sync";
import { sanitizeAuthUser } from "../../../../src/lib/get-current-user";
import { prisma } from "../../../../src/lib/prisma";

type LoginPayload = {
  email?: string;
  password?: string;
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

  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const email = normalizeEmail(payload.email ?? "");
  const password = payload.password ?? "";

  if (!email || !password) {
    return errorResponse("email and password are required.", 400);
  }

  try {
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
      return errorResponse("Invalid credentials.", 401);
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return errorResponse("Invalid credentials.", 401);
    }

    const roleNames = user.roles.map((entry) => entry.role.name);
    const role = roleNames.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : roleNames.includes("ADMIN")
        ? "ADMIN"
        : "CUSTOMER";

    const mongoUser = await ensureMongoCustomerUser({
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    });

    const token = await signAuthToken({
      sub: mongoUser.mongoUserId,
      email: user.email,
      role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: sanitizeAuthUser({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role,
      }),
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login API failed", error);
    return errorResponse("Failed to login.", 500);
  }
}
