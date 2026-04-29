import { NextResponse } from "next/server";

import {
  assertAuthEnvironment,
  AuthConfigError,
  isAdminEmail,
  normalizeAuthRoles,
  normalizeEmail,
  setAuthCookie,
  signAuthToken,
  verifyPassword,
} from "../../../../src/lib/auth";
import { sanitizeAuthUser } from "../../../../src/lib/get-current-user";
import { prisma } from "../../../../src/lib/prisma";

type LoginPayload = {
  email?: string;
  password?: string;
};

async function ensureUserRole(userId: string, roleName: "CUSTOMER" | "ADMIN") {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });
}

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

    if (!user.passwordHash) {
      return errorResponse("Invalid credentials.", 401);
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return errorResponse("Invalid credentials.", 401);
    }

    const roleNames = user.roles.map((entry) => entry.role.name);

    if (isAdminEmail(user.email) && !roleNames.includes("ADMIN")) {
      await ensureUserRole(user.id, "ADMIN");

      roleNames.push("ADMIN");
    }

    if (roleNames.length === 0) {
      await ensureUserRole(user.id, "CUSTOMER");

      roleNames.push("CUSTOMER");
    }

    const role = roleNames.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : roleNames.includes("ADMIN")
        ? "ADMIN"
        : "CUSTOMER";

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role,
      roles: normalizeAuthRoles(roleNames, role),
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
        roles: roleNames,
      }),
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login API failed", error);
    return errorResponse("Failed to login.", 500);
  }
}
