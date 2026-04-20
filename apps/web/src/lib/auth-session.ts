import { NextResponse } from "next/server";

import {
  clearAuthCookie,
  readAuthTokenFromRequest,
  signAuthToken,
  type AuthRole,
  setAuthCookie,
  verifyAuthToken,
} from "./auth";

export type SessionUser = {
  userId: string;
  email: string;
  roles: string[];
};

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

function primaryRoleFromRoles(roles: string[]): AuthRole {
  if (roles.includes("SUPER_ADMIN")) {
    return "SUPER_ADMIN";
  }

  if (roles.includes("ADMIN")) {
    return "ADMIN";
  }

  return "CUSTOMER";
}

export async function createSessionToken(payload: SessionUser) {
  return signAuthToken({
    sub: payload.userId,
    email: payload.email,
    role: primaryRoleFromRoles(payload.roles),
  });
}

export async function getSessionFromRequest(request: Request) {
  const token = readAuthTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
    roles: [payload.role],
  } satisfies SessionUser;
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
  return setAuthCookie(response, token);
}

export function clearSessionCookie(response: NextResponse) {
  return clearAuthCookie(response);
}
