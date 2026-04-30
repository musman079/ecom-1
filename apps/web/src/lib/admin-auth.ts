import { AuthError, SessionUser, requireSession } from "./auth-session";
import { getAdminEmails } from "./auth";

export { AuthError };

const ADMIN_ROLE = "ADMIN";
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export function isAdminSessionUser(user: SessionUser) {
  if (user.roles.includes(ADMIN_ROLE) || user.roles.includes("SUPER_ADMIN")) {
    return true;
  }

  const adminEmails = getAdminEmails();
  return adminEmails.includes(user.email.trim().toLowerCase());
}

export function isSuperAdminSessionUser(user: SessionUser) {
  return user.roles.includes(SUPER_ADMIN_ROLE);
}

export function mapUserRoles(email: string, roles?: string[]) {
  const baseRoles = Array.isArray(roles) ? [...roles] : [];
  const hasAdminEmail = getAdminEmails().includes(email.trim().toLowerCase());

  if (hasAdminEmail && !baseRoles.includes(ADMIN_ROLE)) {
    baseRoles.push(ADMIN_ROLE);
  }

  if (baseRoles.length === 0) {
    baseRoles.push("CUSTOMER");
  }

  return baseRoles;
}

export async function requireAdminSession(request: Request) {
  const session = await requireSession(request);
  if (!isAdminSessionUser(session)) {
    throw new AuthError("Forbidden");
  }

  return session;
}

export async function requireSuperAdminSession(request: Request) {
  const session = await requireSession(request);
  if (!isSuperAdminSessionUser(session)) {
    throw new AuthError("Forbidden");
  }

  return session;
}
