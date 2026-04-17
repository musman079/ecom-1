import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

export type SessionUser = {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
};

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

const SESSION_COOKIE_NAME = "ecom_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const sessionSecret = process.env.JWT_SECRET;
if (!sessionSecret) {
  throw new Error("JWT_SECRET is not set. Add it in apps/web/.env.");
}

const secretKey = new TextEncoder().encode(sessionSecret);

function parseCookieHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.trim().split("=");
    if (rawKey !== name) {
      continue;
    }

    const rawValue = rawValueParts.join("=");
    return decodeURIComponent(rawValue);
  }

  return null;
}

export async function createSessionToken(payload: SessionUser) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function getSessionFromRequest(request: Request) {
  const token = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secretKey);
    const payload = verified.payload as Partial<SessionUser>;

    if (!payload.userId || !payload.email || !payload.fullName || !Array.isArray(payload.roles)) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      fullName: payload.fullName,
      roles: payload.roles,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export async function requireSession(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new AuthError();
  }

  return session;
}

export async function applySessionCookie(response: NextResponse, user: SessionUser) {
  const token = await createSessionToken(user);

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
