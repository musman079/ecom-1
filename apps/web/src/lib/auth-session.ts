import { getCurrentUserFromRequest } from "./get-current-user";

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

export async function getSessionFromRequest(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    roles: user.roles,
  } satisfies SessionUser;
}

export async function requireSession(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new AuthError();
  }

  return session;
}
