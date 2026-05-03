import { getServerSession } from "next-auth";

import { authOptions } from "./next-auth";

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

type RawServerSession = {
  user?: {
    id?: string;
    email?: string | null;
    role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
    roles?: Array<"CUSTOMER" | "ADMIN" | "SUPER_ADMIN">;
  };
};

function toSessionUser(session: RawServerSession | null) {
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const fallbackRole = session.user.role ?? "CUSTOMER";
  const roles = Array.isArray(session.user.roles) ? session.user.roles : [fallbackRole];

  return {
    userId: session.user.id,
    email: session.user.email,
    roles,
  } satisfies SessionUser;
}

export async function getSessionFromRequest(request: Request) {
  void request;
  const session = (await getServerSession(authOptions)) as RawServerSession | null;
  return toSessionUser(session);
}

export async function requireSession(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new AuthError();
  }

  return session;
}
