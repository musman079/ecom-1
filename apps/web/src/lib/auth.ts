import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "kinetic_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  email: string;
  roles: string[];
};

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is required.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ email: payload.email, roles: payload.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    return {
      userId: String(payload.sub),
      email: String(payload.email),
      roles: Array.isArray(payload.roles) ? payload.roles.map((role) => String(role)) : [],
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser() {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const roleNames = user.roles.map((entry) => entry.role.name);

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: roleNames,
  };
}

export function isAdminRole(roles: string[]) {
  return roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
}
