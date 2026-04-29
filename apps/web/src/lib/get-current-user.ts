import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";

import { prisma } from "./prisma";
import { authOptions } from "./next-auth";
import { readAuthTokenFromCookieHeader, readAuthTokenFromRequest, verifyAuthToken, type AuthRole } from "./auth";

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

export function sanitizeAuthUser(input: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: AuthRole;
  roles?: string[];
}): SanitizedAuthUser {
  const normalizedRoles = Array.isArray(input.roles) ? input.roles : [input.role];

  return {
    id: input.id,
    email: input.email,
    fullName: input.fullName,
    phone: input.phone ?? "",
    role: input.role,
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

  const roleNames = user.roles.map((entry) => entry.role.name);

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

  const roleNames = user.roles.map((entry) => entry.role.name);
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

export async function getCurrentUserFromRequest(request: Request): Promise<SanitizedAuthUser | null> {
  const nextAuthToken = await getToken({
    req: {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    } as never,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });

  if (nextAuthToken) {
    const nextAuthUser = await resolveUserByIdentity({
      id: typeof nextAuthToken.sub === "string" ? nextAuthToken.sub : null,
      email: typeof nextAuthToken.email === "string" ? nextAuthToken.email : null,
    });

    if (nextAuthUser) {
      return nextAuthUser;
    }
  }

  const token = readAuthTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return resolveUserByToken(token);
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
  const token = readAuthTokenFromCookieHeader(cookieStore.toString());

  if (!token) {
    return null;
  }

  return resolveUserByToken(token);
}
