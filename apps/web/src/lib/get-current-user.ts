import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";

import { prisma } from "./prisma";
import { authOptions } from "./next-auth";
import { AUTH_COOKIE_NAME, getAdminEmails, readAuthTokenFromCookieHeader, readAuthTokenFromRequest, verifyAuthToken, type AuthRole } from "./auth";

export type SanitizedAuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: AuthRole;
  roles: string[];
};

function highestRole(roles: string[]): AuthRole {
  if (roles.includes("SUPER_ADMIN")) {
    return "SUPER_ADMIN";
  }

  if (roles.includes("ADMIN")) {
    return "ADMIN";
  }

  return "CUSTOMER";
}

function normalizeUserRoles(email: string, roles: string[], fallbackRole: AuthRole) {
  const normalizedRoles = roles.filter((role) => role === "CUSTOMER" || role === "ADMIN" || role === "SUPER_ADMIN");

  if (normalizedRoles.length === 0) {
    normalizedRoles.push(fallbackRole);
  }

  if (getAdminEmails().includes(email.trim().toLowerCase()) && !normalizedRoles.includes("ADMIN")) {
    normalizedRoles.push("ADMIN");
  }

  return Array.from(new Set(normalizedRoles));
}

export function sanitizeAuthUser(input: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: AuthRole;
  roles?: string[];
}): SanitizedAuthUser {
  const normalizedRoles = normalizeUserRoles(input.email, Array.isArray(input.roles) ? input.roles : [input.role], input.role);

  return {
    id: input.id,
    email: input.email,
    fullName: input.fullName,
    phone: input.phone ?? "",
    role: highestRole(normalizedRoles),
    roles: normalizedRoles,
  };
}

async function resolveUserByToken(token: string): Promise<SanitizedAuthUser | null> {
  const decoded = await verifyAuthToken(token);
  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: decoded.sub }, { email: decoded.email }],
      isActive: true,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const roleNames = user.roles.map((entry: typeof user.roles[number]) => entry.role.name);

  return sanitizeAuthUser({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: highestRole(roleNames.length > 0 ? roleNames : [decoded.role]),
    roles: roleNames.length > 0 ? roleNames : [decoded.role],
  });
}

async function resolveUserByIdentity(identity: { id?: string | null; email?: string | null }): Promise<SanitizedAuthUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(identity.id ? [{ id: identity.id }] : []),
        ...(identity.email ? [{ email: identity.email.toLowerCase() }] : []),
      ],
      isActive: true,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const roleNames = user.roles.map((entry: typeof user.roles[number]) => entry.role.name);
  const fallbackRole: AuthRole = "CUSTOMER";

  return sanitizeAuthUser({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: highestRole(roleNames.length > 0 ? roleNames : [fallbackRole]),
    roles: roleNames.length > 0 ? roleNames : [fallbackRole],
  });
}

function parseCookieString(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  for (const chunk of cookieHeader.split(";")) {
    const eqIdx = chunk.indexOf("=");
    if (eqIdx === -1) continue;
    const name = chunk.slice(0, eqIdx).trim();
    const raw = chunk.slice(eqIdx + 1).trim();
    try {
      result[name] = decodeURIComponent(raw);
    } catch {
      result[name] = raw;
    }
  }
  return result;
}

export async function getCurrentUserFromRequest(request: Request): Promise<SanitizedAuthUser | null> {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const parsedCookies = parseCookieString(cookieHeader);

    // Try NextAuth JWT token first
    const nextAuthToken = await getToken({
      req: {
        headers: { cookie: cookieHeader },
        cookies: parsedCookies,
      } as never,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET ?? "",
    });

    if (nextAuthToken?.sub || nextAuthToken?.email) {
      const nextAuthUser = await resolveUserByIdentity({
        id: typeof nextAuthToken.sub === "string" ? nextAuthToken.sub : null,
        email: typeof nextAuthToken.email === "string" ? nextAuthToken.email : null,
      });

      if (nextAuthUser) {
        return nextAuthUser;
      }
    }

    // Fallback: custom JWT cookie (for users who logged in via /api/auth/login)
    const token = readAuthTokenFromRequest(request);
    if (!token) {
      return null;
    }

    return resolveUserByToken(token);
  } catch (error) {
    console.error("[getCurrentUserFromRequest] Auth resolution failed:", error instanceof Error ? error.message : "unknown");
    return null;
  }
}

export async function getCurrentUser(): Promise<SanitizedAuthUser | null> {
  const session = (await getServerSession(authOptions)) as
    | {
      user?: {
        id?: string;
        email?: string | null;
      };
    }
    | null;

  if (session?.user?.id || session?.user?.email) {
    const sessionUser = await resolveUserByIdentity({
      id: session.user?.id ?? null,
      email: session.user?.email ?? null,
    });

    if (sessionUser) {
      return sessionUser;
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;

  if (!token) {
    return null;
  }

  return resolveUserByToken(token);
}
